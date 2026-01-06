const express = require('express');
const router = express.Router();
const { authenticateToken, isAdminOrManager } = require('../middleware/auth');
const {
    validateBody,
    createProjectSchema,
    updateProjectSchema,
    createTaskSchema,
    updateTaskStatusSchema,
    updateTaskSchema,
    createProjectFieldSchema,
    updateProjectFieldSchema,
    createProjectWithMetadataSchema,
    updateProjectWithMetadataSchema
} = require('../middleware/validation');
const { getPool, isUsingDatabase, getInMemoryData } = require('../config/database');

/**
 * Helper function to handle custom fields for projects
 * @param {string|number} projectId - Project ID
 * @param {object} customData - Custom data object
 * @param {Pool} pool - Database pool
 */
async function handleCustomFields(projectId, customData, pool) {
    try {
        // Get field definitions
        const fieldDefsResult = await pool.query(
            'SELECT id, name FROM project_field_definitions WHERE active = true'
        );
        
        // Insert/update custom field values
        for (const [fieldName, value] of Object.entries(customData)) {
            const fieldDef = fieldDefsResult.rows.find(f => f.name === fieldName);
            if (fieldDef) {
                // Delete existing value
                await pool.query(
                    'DELETE FROM project_custom_field_values WHERE definition_id = $1 AND project_id = $2',
                    [fieldDef.id, projectId]
                );
                
                // Insert new value
                await pool.query(
                    'INSERT INTO project_custom_field_values (definition_id, project_id, value) VALUES ($1, $2, $3)',
                    [fieldDef.id, projectId, value]
                );
            }
        }
    } catch (error) {
        console.error('Error handling custom fields:', error);
        throw error;
    }
}

/**
 * GET /api/projects
 * Get all active projects with client information and tasks
 * BUG-032 FIX: Added LEFT JOIN with project_tasks to include tasks in response
 */
router.get('/', authenticateToken, async (req, res) => {
    console.log('=== [BUG-032] GET /api/projects called ==='); // DEBUG
    try {
        const isDB = isUsingDatabase();
        console.log('[BUG-032] isUsingDatabase:', isDB);
        
        if (isDB) {
            const pool = getPool();
            // BUG-032 FIX: Added LEFT JOIN project_tasks and json_agg to include tasks
            const query = `
                SELECT p.*, c.name as client_name, u.username as responsible_name,
                       COALESCE(json_agg(t.*) FILTER (WHERE t.id IS NOT NULL), '[]') as tasks
                FROM projects p
                JOIN clients c ON p.client_id = c.id
                LEFT JOIN users u ON p.responsible_id = u.id
                LEFT JOIN project_tasks t ON p.id = t.project_id
                WHERE p.deleted_at IS NULL
                GROUP BY p.id, c.name, u.username
                ORDER BY p.created_at DESC
            `;
            const result = await pool.query(query);
            console.log('[BUG-032] DB mode, result rows:', result.rows.length); // DEBUG
            res.json(result.rows);
        } else {
            const { projects, projectTasks, clients, users } = getInMemoryData();

            console.log('[BUG-032] InMemory mode, projects:', projects.length, 'tasks:', projectTasks.length); // DEBUG

            const projectsWithClients = projects
                .filter(p => !p.deleted_at)
                .map(p => {
                    const client = clients.find(c => c.id === p.client_id);
                    const responsible = users.find(u => u.id === p.responsible_id);
                    // BUG-032 FIX: Include tasks in project object for in-memory mode
                    const tasks = projectTasks.filter(t => t.project_id === p.id);
                    console.log('[BUG-032] Project', p.id, 'has', tasks.length, 'tasks'); // DEBUG
                    return {
                        ...p,
                        client_name: client ? client.name : 'N/A',
                        responsible_name: responsible ? responsible.username : 'N/A',
                        tasks: tasks
                    };
                })
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

            console.log('[BUG-032] Sending response with', projectsWithClients.length, 'projects'); // DEBUG
            res.json(projectsWithClients);
        }
    } catch (err) {
        console.error('Error fetching projects:', err);
        res.status(500).json({ message: 'Error al obtener proyectos' });
    }
});

/**
 * GET /api/projects/:id
 * Get project details including tasks
 */
router.get('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;

    try {
        if (isUsingDatabase()) {
            const pool = getPool();

            // Get Project
            const pResult = await pool.query('SELECT * FROM projects WHERE id = $1', [id]);
            if (pResult.rows.length === 0) {
                return res.status(404).json({ message: 'Proyecto no encontrado' });
            }

            // Get Tasks with user names
            const tResult = await pool.query(`
                SELECT pt.*, u_assigned.username as assigned_name, u_created.username as created_by_name, u_approved.username as approved_by_name
                FROM project_tasks pt
                LEFT JOIN users u_assigned ON pt.assigned_to = u_assigned.id
                LEFT JOIN users u_created ON pt.created_by = u_created.id
                LEFT JOIN users u_approved ON pt.approved_by = u_approved.id
                WHERE pt.project_id = $1 
                ORDER BY pt.created_at ASC
            `, [id]);

            // Get Custom Fields Values
            const cfResult = await pool.query(`
                SELECT pcfv.*, pfd.name, pfd.label, pfd.type
                FROM project_custom_field_values pcfv
                JOIN project_field_definitions pfd ON pcfv.definition_id = pfd.id
                WHERE pcfv.project_id = $1 AND pfd.active = true
            `, [id]);

            const project = pResult.rows[0];
            project.tasks = tResult.rows;
            
            // Build custom_data object from field values
            project.custom_data = {};
            cfResult.rows.forEach(field => {
                project.custom_data[field.name] = field.value;
            });

            res.json(project);
        } else {
            const { projects, projectTasks, users } = getInMemoryData();
            const project = projects.find(p => p.id === id);

            if (!project) {
                return res.status(404).json({ message: 'Proyecto no encontrado' });
            }

            const tasks = projectTasks.filter(t => t.project_id === id);
            
            // Build custom_data object from project
            const custom_data = project.custom_data || {};
            
            res.json({ 
                ...project, 
                tasks,
                custom_data,
                responsible_name: users.find(u => u.id === project.responsible_id)?.username || 'N/A'
            });
        }
    } catch (err) {
        console.error('Error fetching project details:', err);
        res.status(500).json({ message: 'Error al obtener detalles del proyecto' });
    }
});

/**
 * POST /api/projects
 * Create new project with metadata (Admin/Manager only)
 * BUG #025 FIX: Updated to handle new metadata fields
 */
router.post('/', authenticateToken, isAdminOrManager, validateBody(createProjectWithMetadataSchema), async (req, res) => {
    const { 
        client_id, name, description, status, start_date, end_date, responsible_id, 
        // BUG #025: New metadata fields
        budget, priority, progress_percentage,
        //
        custom_data 
    } = req.body;

    try {
        if (isUsingDatabase()) {
            const pool = getPool();
            const query = `
                INSERT INTO projects (
                    client_id, name, description, status, start_date, end_date, responsible_id,
                    budget, priority, progress_percentage, custom_data
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                RETURNING id
            `;
            const values = [
                client_id,
                name,
                description,
                status || 'prospectado',
                start_date,
                end_date,
                responsible_id,
                budget,
                priority || 'medium',
                progress_percentage || 0,
                custom_data || {}
            ];
            const result = await pool.query(query, values);
            
            // Handle custom fields if provided
            if (custom_data && Object.keys(custom_data).length > 0) {
                await handleCustomFields(result.rows[0].id, custom_data, pool);
            }
            
            res.status(201).json({ message: 'Proyecto creado exitosamente', id: result.rows[0].id });
        } else {
            const inMemory = getInMemoryData();
            const newProject = {
                id: String(inMemory.nextProjectId++),
                client_id,
                name,
                description,
                status: status || 'prospectado',
                start_date,
                end_date,
                responsible_id,
                // BUG #025: New metadata fields
                budget: budget || null,
                priority: priority || 'medium',
                progress_percentage: progress_percentage || 0,
                //
                custom_data: custom_data || {},
                created_at: new Date().toISOString(),
                deleted_at: null
            };
            inMemory.projects.push(newProject);
            res.status(201).json({ message: 'Proyecto creado exitosamente (In-Memory)', id: newProject.id });
        }
    } catch (err) {
        console.error('Error creating project:', err);
        res.status(500).json({ message: 'Error al crear proyecto' });
    }
});

/**
 * PUT /api/projects/:id
 * Update project with metadata (Admin/Manager only)
 * BUG #025 FIX: Updated to handle new metadata fields
 */
router.put('/:id', authenticateToken, isAdminOrManager, validateBody(updateProjectWithMetadataSchema), async (req, res) => {
    const { id } = req.params;
    const { 
        client_id, name, description, status, start_date, end_date, responsible_id,
        // BUG #025: New metadata fields
        budget, priority, progress_percentage,
        //
        custom_data 
    } = req.body;

    try {
        if (isUsingDatabase()) {
            const pool = getPool();
            const query = `
                UPDATE projects
                SET client_id=$1, name=$2, description=$3, status=$4, start_date=$5, end_date=$6,
                    responsible_id=$7, budget=$8, priority=$9, progress_percentage=$10,
                    custom_data=$11, updated_at=CURRENT_TIMESTAMP
                WHERE id=$12
            `;
            const values = [
                client_id, name, description, status, start_date, end_date, responsible_id,
                budget, priority, progress_percentage, custom_data || {}, id
            ];
            await pool.query(query, values);
            
            // Handle custom fields if provided
            if (custom_data && Object.keys(custom_data).length > 0) {
                await handleCustomFields(id, custom_data, pool);
            }
            
            res.json({ message: 'Proyecto actualizado exitosamente' });
        } else {
            const { projects } = getInMemoryData();
            const idx = projects.findIndex(p => p.id === id);

            if (idx === -1) {
                return res.status(404).json({ message: 'Proyecto no encontrado' });
            }

            projects[idx] = {
                ...projects[idx],
                client_id,
                name,
                description,
                status,
                start_date,
                end_date,
                responsible_id,
                // BUG #025: New metadata fields
                budget: budget !== undefined ? budget : projects[idx].budget,
                priority: priority || projects[idx].priority,
                progress_percentage: progress_percentage !== undefined ? progress_percentage : projects[idx].progress_percentage,
                //
                custom_data: custom_data || projects[idx].custom_data,
                updated_at: new Date().toISOString()
            };
            res.json({ message: 'Proyecto actualizado exitosamente (In-Memory)' });
        }
    } catch (err) {
        console.error('Error updating project:', err);
        res.status(500).json({ message: 'Error al actualizar proyecto' });
    }
});

/**
 * POST /api/projects/:id/tasks
 * Create task for project (all authenticated users)
 */
router.post('/:id/tasks', authenticateToken, validateBody(createTaskSchema), async (req, res) => {
    const { id } = req.params; // Project ID
    const { description, status, assigned_to } = req.body;
    const created_by = req.user.id; // From JWT Token

    try {
        if (isUsingDatabase()) {
            const pool = getPool();
            const query = `
                INSERT INTO project_tasks (project_id, description, status, assigned_to, created_by)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING id
            `;
            const values = [id, description, status || 'pendiente', assigned_to, created_by];
            const result = await pool.query(query, values);
            res.status(201).json({ message: 'Tarea creada exitosamente', id: result.rows[0].id });
        } else {
            const inMemory = getInMemoryData();
            const newTask = {
                id: String(inMemory.nextTaskId++),
                project_id: id,
                description,
                status: status || 'pendiente',
                assigned_to,
                created_by,
                created_at: new Date().toISOString()
            };
            inMemory.projectTasks.push(newTask);
            res.status(201).json({ message: 'Tarea creada exitosamente (In-Memory)', id: newTask.id });
        }
    } catch (err) {
        console.error('Error creating task:', err);
        res.status(500).json({ message: 'Error al crear tarea' });
    }
});

/**
 * PUT /api/projects/tasks/:taskId/status
 * Update task status
 * Only Admin/Manager can approve tasks
 */
router.put('/tasks/:taskId/status', authenticateToken, validateBody(updateTaskStatusSchema), async (req, res) => {
    const { taskId } = req.params;
    const { status } = req.body;

    // Validation: Only admin/manager can set 'aprobada'
    if (status === 'aprobada') {
        if (req.user.role !== 'admin' && req.user.role !== 'manager') {
            return res.status(403).json({ message: 'Solo Admin/Manager puede aprobar tareas' });
        }
    }

    try {
        if (isUsingDatabase()) {
            const pool = getPool();
            let query = 'UPDATE project_tasks SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2';
            let values = [status, taskId];

            if (status === 'aprobada') {
                query = 'UPDATE project_tasks SET status = $1, approved_by = $2, approved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $3';
                values = [status, req.user.id, taskId];
            }

            await pool.query(query, values);
            res.json({ message: 'Estado de tarea actualizado exitosamente' });
        } else {
            const { projectTasks } = getInMemoryData();
            const task = projectTasks.find(t => t.id === taskId);

            if (!task) {
                return res.status(404).json({ message: 'Tarea no encontrada' });
            }

            task.status = status;
            task.updated_at = new Date().toISOString();

            if (status === 'aprobada') {
                task.approved_by = req.user.id;
                task.approved_at = new Date().toISOString();
            }

            res.json({ message: 'Estado de tarea actualizado exitosamente (In-Memory)' });
        }
    } catch (err) {
        console.error('Error updating task status:', err);
        res.status(500).json({ message: 'Error al actualizar estado de tarea' });
    }
});

/**
 * PUT /api/projects/tasks/:taskId
 * Update task (Admin/Manager only)
 * BUG-XXX: Nuevo endpoint para edición de tareas
 */
router.put('/tasks/:taskId', authenticateToken, isAdminOrManager, validateBody(updateTaskSchema), async (req, res) => {
    const { taskId } = req.params;
    const { description, assigned_to } = req.body;

    try {
        if (isUsingDatabase()) {
            const pool = getPool();

            // First check if task exists
            const taskCheck = await pool.query('SELECT id, description, assigned_to FROM project_tasks WHERE id = $1', [taskId]);
            if (taskCheck.rows.length === 0) {
                return res.status(404).json({ message: 'Tarea no encontrada' });
            }

            // Build dynamic update query
            const updates = [];
            const values = [];
            let paramIndex = 1;

            if (description !== undefined) {
                updates.push(`description = $${paramIndex++}`);
                values.push(description);
            }

            if (assigned_to !== undefined) {
                updates.push(`assigned_to = $${paramIndex++}`);
                values.push(assigned_to);
            }

            // Always update updated_at
            updates.push(`updated_at = CURRENT_TIMESTAMP`);
            values.push(taskId);

            const query = `UPDATE project_tasks SET ${updates.join(', ')} WHERE id = $${paramIndex}`;
            await pool.query(query, values);

            // Fetch updated task with user info
            const updatedTask = await pool.query(`
                SELECT pt.*, u.username as assigned_name
                FROM project_tasks pt
                LEFT JOIN users u ON pt.assigned_to = u.id
                WHERE pt.id = $1
            `, [taskId]);

            res.json({
                message: 'Tarea actualizada exitosamente',
                task: updatedTask.rows[0]
            });
        } else {
            const { projectTasks, users } = getInMemoryData();
            const taskIndex = projectTasks.findIndex(t => t.id === taskId);

            if (taskIndex === -1) {
                return res.status(404).json({ message: 'Tarea no encontrada' });
            }

            // Update only provided fields
            if (description !== undefined) {
                projectTasks[taskIndex].description = description;
            }
            if (assigned_to !== undefined) {
                projectTasks[taskIndex].assigned_to = assigned_to;
            }
            projectTasks[taskIndex].updated_at = new Date().toISOString();

            // Get assigned user name
            const assignedUser = users.find(u => u.id === projectTasks[taskIndex].assigned_to);
            const taskWithAssignedName = {
                ...projectTasks[taskIndex],
                assigned_name: assignedUser ? assignedUser.username : null
            };

            res.json({
                message: 'Tarea actualizada exitosamente (In-Memory)',
                task: taskWithAssignedName
            });
        }
    } catch (err) {
        console.error('Error updating task:', err);
        res.status(500).json({ message: 'Error al actualizar tarea' });
    }
});

/**
 * GET /api/projects/meta/fields
 * Get active project custom field definitions
 * BUG #026 FIX: This endpoint was missing
 */
router.get('/meta/fields', authenticateToken, async (req, res) => {
    try {
        if (isUsingDatabase()) {
            const pool = getPool();
            const result = await pool.query(
                'SELECT * FROM project_field_definitions WHERE active = true ORDER BY category, label'
            );
            res.json(result.rows);
        } else {
            const { projectFieldDefinitions } = getInMemoryData();
            res.json(projectFieldDefinitions.filter(f => f.active));
        }
    } catch (err) {
        console.error('Error fetching project fields:', err);
        res.status(500).json({ message: 'Error al obtener campos de proyecto' });
    }
});

/**
 * POST /api/projects/meta/fields
 * Create new project custom field definition (Admin only)
 * BUG #026 FIX: Enhanced with better validation and error handling
 */
router.post('/meta/fields', authenticateToken, isAdminOrManager, validateBody(createProjectFieldSchema), async (req, res) => {
    const { name, label, type, category, is_required, sort_order, options } = req.body;

    try {
        const internalName = name.toLowerCase().replace(/\s+/g, '_');

        if (isUsingDatabase()) {
            const pool = getPool();
            await pool.query(
                'INSERT INTO project_field_definitions (name, label, type, category, is_required, sort_order, options) VALUES ($1, $2, $3, $4, $5, $6, $7)',
                [internalName, label, type, category || 'General', is_required || false, sort_order || 0, options || null]
            );
            res.status(201).json({ message: 'Campo de proyecto creado exitosamente' });
        } else {
            const { projectFieldDefinitions } = getInMemoryData();

            if (projectFieldDefinitions.some(f => f.name === internalName)) {
                return res.status(400).json({ message: 'El campo ya existe' });
            }

            const inMemory = getInMemoryData();
            projectFieldDefinitions.push({
                id: String(inMemory.nextProjectFieldId++),
                name: internalName,
                label,
                type,
                category: category || 'General',
                is_required: is_required || false,
                sort_order: sort_order || 0,
                options: options || null,
                active: true
            });
            res.status(201).json({ message: 'Campo de proyecto creado exitosamente (In-Memory)' });
        }
    } catch (err) {
        console.error('Error creating project field:', err);

        // Handle duplicate field name
        if (err.code === '23505') {
            return res.status(400).json({ message: 'El campo ya existe' });
        }

        res.status(500).json({ message: 'Error al crear campo de proyecto' });
    }
});

/**
 * GET /api/projects/meta/fields/all
 * Get ALL project custom field definitions (including inactive)
 * BUG #026 FIX: New endpoint for admin management
 */
router.get('/meta/fields/all', authenticateToken, isAdminOrManager, async (req, res) => {
    try {
        if (isUsingDatabase()) {
            const pool = getPool();
            const result = await pool.query(
                'SELECT * FROM project_field_definitions ORDER BY sort_order, label'
            );
            res.json(result.rows);
        } else {
            const { projectFieldDefinitions } = getInMemoryData();
            res.json(projectFieldDefinitions);
        }
    } catch (err) {
        console.error('Error fetching all project fields:', err);
        res.status(500).json({ message: 'Error al obtener campos de proyecto' });
    }
});

/**
 * PUT /api/projects/meta/fields/:id
 * Update project custom field definition (Admin only)
 * BUG #026 FIX: New endpoint for editing fields
 */
router.put('/meta/fields/:id', authenticateToken, isAdminOrManager, validateBody(updateProjectFieldSchema), async (req, res) => {
    const { id } = req.params;
    const { label, type, category, is_required, sort_order, options, active } = req.body;

    try {
        if (isUsingDatabase()) {
            const pool = getPool();
            const query = `
                UPDATE project_field_definitions
                SET label = COALESCE($1, label),
                    type = COALESCE($2, type),
                    category = COALESCE($3, category),
                    is_required = COALESCE($4, is_required),
                    sort_order = COALESCE($5, sort_order),
                    options = COALESCE($6, options),
                    active = COALESCE($7, active)
                WHERE id = $8
            `;
            await pool.query(query, [label, type, category, is_required, sort_order, options, active, id]);
            res.json({ message: 'Campo de proyecto actualizado exitosamente' });
        } else {
            const { projectFieldDefinitions } = getInMemoryData();
            const idx = projectFieldDefinitions.findIndex(f => f.id === id);

            if (idx === -1) {
                return res.status(404).json({ message: 'Campo no encontrado' });
            }

            projectFieldDefinitions[idx] = {
                ...projectFieldDefinitions[idx],
                label: label || projectFieldDefinitions[idx].label,
                type: type || projectFieldDefinitions[idx].type,
                category: category || projectFieldDefinitions[idx].category,
                is_required: is_required !== undefined ? is_required : projectFieldDefinitions[idx].is_required,
                sort_order: sort_order || projectFieldDefinitions[idx].sort_order,
                options: options || projectFieldDefinitions[idx].options,
                active: active !== undefined ? active : projectFieldDefinitions[idx].active
            };
            res.json({ message: 'Campo de proyecto actualizado exitosamente (In-Memory)' });
        }
    } catch (err) {
        console.error('Error updating project field:', err);
        res.status(500).json({ message: 'Error al actualizar campo de proyecto' });
    }
});

/**
 * DELETE /api/projects/meta/fields/:id
 * Soft delete (deactivate) project custom field definition (Admin only)
 * BUG #026 FIX: New endpoint for deactivating fields
 */
router.delete('/meta/fields/:id', authenticateToken, isAdminOrManager, async (req, res) => {
    const { id } = req.params;

    try {
        if (isUsingDatabase()) {
            const pool = getPool();
            await pool.query(
                'UPDATE project_field_definitions SET active = false WHERE id = $1',
                [id]
            );
            res.json({ message: 'Campo de proyecto desactivado exitosamente' });
        } else {
            const { projectFieldDefinitions } = getInMemoryData();
            const idx = projectFieldDefinitions.findIndex(f => f.id === id);

            if (idx === -1) {
                return res.status(404).json({ message: 'Campo no encontrado' });
            }

            projectFieldDefinitions[idx].active = false;
            res.json({ message: 'Campo de proyecto desactivado exitosamente (In-Memory)' });
        }
    } catch (err) {
        console.error('Error deleting project field:', err);
        res.status(500).json({ message: 'Error al desactivar campo de proyecto' });
    }
});

module.exports = router;

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// ============================================
// HYBRID DATABASE MODE
// ============================================
let useDatabase = false;
let pool = null;

// In-memory storage (fallback)
let users = [
    { id: '1', username: 'admin', email: 'admin@nexa-sys.com', password_hash: '$2a$10$mockhashedpassword', role: 'admin', active: true },
    { id: '2', username: 'manager', email: 'manager@nexa-sys.com', password_hash: '$2a$10$mockhashedpassword', role: 'manager', active: true },
    { id: '3', username: 'user', email: 'user@nexa-sys.com', password_hash: '$2a$10$mockhashedpassword', role: 'user', active: true }
];
let nextUserId = 4;

// In-memory Clients
let clients = [
    {
        id: '1',
        name: 'Innovatech S.A.',
        contact_name: 'Carlos Mendez',
        industry: 'tech',
        email: 'c.mendez@innovatech.com',
        phone: '+52 55 1234 5678',
        projects: ['Migración Cloud', 'App Móvil'],
        active: true,
        custom_data: { rfc: 'INN123456789' }
    },
    {
        id: '1', // Note: There might be an ID conflict here in original code, I'll keep it as 2 for safety if I were creating new, but keeping original structure
        id: '2',
        name: 'Grupo Retail MX',
        contact_name: 'Sofia Ramirez',
        industry: 'retail',
        email: 'sramirez@gruporetail.mx',
        phone: '+52 81 8888 9999',
        projects: ['eCommerce'],
        active: false,
        custom_data: {}
    }
];
let nextClientId = 3;

// In-memory Custom Fields
let customFields = [
    { id: '1', name: 'rfc', label: 'RFC', type: 'text', category: 'Datos Fiscales', active: true },
    { id: '2', name: 'anniversary_date', label: 'Fecha Aniversario', type: 'date', category: 'General', active: true }
];
let nextFieldId = 3;

// In-memory Projects
let projects = [
    {
        id: '1',
        client_id: '1',
        name: 'Migración Cloud Innovatech',
        description: 'Migración de servidores legacy a Azure',
        status: 'en_progreso',
        start_date: '2023-10-01',
        end_date: '2024-03-31',
        responsible_id: '1',
        custom_data: {},
        created_at: new Date().toISOString(),
        deleted_at: null
    }
];
let nextProjectId = 2;

// In-memory Tasks
let projectTasks = [
    {
        id: '1',
        project_id: '1',
        description: 'Análisis de arquitectura actual',
        status: 'completada',
        assigned_to: '2',
        created_by: '1',
        created_at: new Date().toISOString()
    },
    {
        id: '2',
        project_id: '1',
        description: 'Configuración de Tenant Azure',
        status: 'en_progreso',
        assigned_to: '1',
        created_by: '1',
        created_at: new Date().toISOString()
    }
];
let nextTaskId = 3;

// In-memory Project Field Definitions
let projectFieldDefinitions = [
    { id: '1', name: 'priority', label: 'Prioridad', type: 'text', category: 'Gestión', active: true }
];
let nextProjectFieldId = 2;

// Try to connect to PostgreSQL
if (process.env.DATABASE_URL) {
    pool = new Pool({
        connectionString: process.env.DATABASE_URL,
    });

    pool.query('SELECT NOW()')
        .then(() => {
            useDatabase = true;
            console.log('✅ PostgreSQL connected successfully');
        })
        .catch((err) => {
            console.warn('⚠️  PostgreSQL connection failed:', err.message);
            console.warn('🔄 Falling back to IN-MEMORY mode');
            useDatabase = false;
        });
} else {
    console.log('ℹ️  DATABASE_URL not found - using IN-MEMORY mode');
}

// Auth Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, process.env.JWT_SECRET || 'supersecret', (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied: Requires Admin role' });
    }
    next();
};

const isAdminOrManager = (req, res, next) => {
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
        return res.status(403).json({ message: 'Access denied: Requires Admin or Manager role' });
    }
    next();
};

// Helper function to check if user can manage a target user based on RBAC
const canManageUser = (currentUserRole, targetUserRole) => {
    // Admin can manage everyone
    if (currentUserRole === 'admin') return true;

    // Manager can only manage regular users
    if (currentUserRole === 'manager' && targetUserRole === 'user') return true;

    // Otherwise, no permission
    return false;
};

// ============================================
// ROUTES
// ============================================

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
    const { user, pass } = req.body;
    try {
        let foundUser = null;
        if (useDatabase) {
            const result = await pool.query('SELECT * FROM users WHERE username = $1', [user]);
            if (result.rows.length > 0) foundUser = result.rows[0];
        } else {
            foundUser = users.find(u => u.username === user);
        }

        if (!foundUser || !foundUser.active) return res.status(401).json({ message: 'Usuario no encontrado o inactivo' });

        // Simple password check for mock/dev
        const validPass = useDatabase ? await bcrypt.compare(pass, foundUser.password_hash) : (pass === 'admin123');

        if (!validPass) return res.status(401).json({ message: 'Credenciales inválidas' });

        const token = jwt.sign(
            { id: foundUser.id, username: foundUser.username, role: foundUser.role },
            process.env.JWT_SECRET || 'supersecret',
            { expiresIn: '8h' }
        );

        res.json({
            token,
            user_info: {
                id: foundUser.id,
                username: foundUser.username,
                email: foundUser.email,
                role: foundUser.role
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
});

// ==========================================
// USER MANAGEMENT ENDPOINTS
// ==========================================

// GET /api/users (Admin or Manager)
app.get('/api/users', authenticateToken, isAdminOrManager, async (req, res) => {
    try {
        let query = 'SELECT id, username, email, role, active FROM users ORDER BY created_at DESC';
        let queryParams = [];

        // Filter: Managers can only see role='user'
        if (req.user.role === 'manager') {
            if (useDatabase) {
                query = 'SELECT id, username, email, role, active FROM users WHERE role = $1 ORDER BY created_at DESC';
                queryParams = ['user'];
            } else {
                return res.json(users.filter(u => u.role === 'user'));
            }
        }

        if (useDatabase) {
            const result = await pool.query(query, queryParams);
            res.json(result.rows);
        } else {
            res.json(users);
        }
    } catch (err) {
        res.status(500).json({ message: 'Error fetching users' });
    }
});

// POST /api/users (Admin Only)
app.post('/api/users', authenticateToken, isAdmin, async (req, res) => {
    const { username, email, password, role } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        if (useDatabase) {
            const result = await pool.query(
                'INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id',
                [username, email, hashedPassword, role]
            );
            res.status(201).json({ message: 'Usuario creado', id: result.rows[0].id });
        } else {
            const newUser = {
                id: String(nextUserId++),
                username,
                email,
                password_hash: hashedPassword,
                role,
                active: true
            };
            users.push(newUser);
            res.status(201).json({ message: 'Usuario creado (In-Memory)', id: newUser.id });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error creando usuario' });
    }
});

// PATCH /api/users/:id/status (Admin Only)
app.patch('/api/users/:id/status', authenticateToken, isAdmin, async (req, res) => {
    const { id } = req.params;
    const { active } = req.body;
    try {
        if (useDatabase) {
            await pool.query('UPDATE users SET active = $1 WHERE id = $2', [active, id]);
        } else {
            const u = users.find(u => u.id === id);
            if (u) u.active = active;
        }
        res.json({ message: 'Estado de usuario actualizado' });
    } catch (err) {
        res.status(500).json({ message: 'Error actualizando estado' });
    }
});

// ==========================================
// CLIENT MANAGEMENT ENDPOINTS
// ==========================================

// GET /api/clients (All roles)
app.get('/api/clients', authenticateToken, async (req, res) => {
    try {
        let clientsResponse = [];
        if (useDatabase) {
            const result = await pool.query('SELECT * FROM clients ORDER BY created_at DESC');
            clientsResponse = result.rows;
        } else {
            clientsResponse = [...clients];
        }

        // Filter for regular users
        if (req.user.role === 'user') {
            clientsResponse = clientsResponse.filter(c => c.active);
        }

        res.json(clientsResponse);
    } catch (err) {
        console.error('Error fetching clients:', err);
        res.status(500).json({ message: 'Error fetching clients' });
    }
});

// POST /api/clients (All roles)
app.post('/api/clients', authenticateToken, async (req, res) => {
    const { name, contact_name, industry, email, phone, notes, projects, custom_data } = req.body;

    if (!name || !email) {
        return res.status(400).json({ message: 'Nombre y Email son requeridos' });
    }

    try {
        if (useDatabase) {
            const query = `
                INSERT INTO clients (name, contact_name, industry, email, phone, notes, projects, custom_data)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING id
            `;
            const values = [name, contact_name, industry, email, phone, notes, projects || [], custom_data || {}];
            const result = await pool.query(query, values);
            res.status(201).json({ id: result.rows[0].id, message: 'Cliente creado correctamente' });
        } else {
            const newClient = {
                id: String(nextClientId++),
                name,
                contact_name,
                industry,
                email,
                phone,
                notes,
                projects: projects || [],
                active: true,
                custom_data: custom_data || {}
            };
            clients.push(newClient);
            res.status(201).json({ id: newClient.id, message: 'Cliente creado correctamente (In-Memory)' });
        }
    } catch (err) {
        console.error('Error creating client:', err);
        res.status(500).json({ message: 'Error creando cliente' });
    }
});

// GET /api/clients/fields
app.get('/api/clients/fields', authenticateToken, async (req, res) => {
    try {
        if (useDatabase) {
            const result = await pool.query('SELECT * FROM client_field_definitions ORDER BY category, label');
            res.json(result.rows);
        } else {
            res.json(customFields);
        }
    } catch (err) {
        res.status(500).json({ message: 'Error fetching fields' });
    }
});

// POST /api/clients/fields (Admin Only)
app.post('/api/clients/fields', authenticateToken, isAdmin, async (req, res) => {
    const { name, label, type, category } = req.body;

    if (!name || !label || !type) return res.status(400).json({ message: 'Todos los campos son requeridos' });

    try {
        const internalName = name.toLowerCase().replace(/\s+/g, '_');
        const fieldCategory = category || 'General';

        if (useDatabase) {
            await pool.query(
                'INSERT INTO client_field_definitions (name, label, type, category) VALUES ($1, $2, $3, $4)',
                [internalName, label, type, fieldCategory]
            );
        } else {
            if (customFields.some(f => f.name === internalName)) {
                return res.status(400).json({ message: 'El campo ya existe' });
            }
            customFields.push({
                id: String(nextFieldId++),
                name: internalName,
                label,
                type,
                category: fieldCategory,
                active: true
            });
        }
        res.status(201).json({ message: 'Campo agregado correctamente' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error creating field' });
    }
});

// PUT /api/clients/fields/:id (Admin Only - Edit/Soft Delete)
app.put('/api/clients/fields/:id', authenticateToken, isAdmin, async (req, res) => {
    const { id } = req.params;
    const { label, category, active } = req.body;

    try {
        if (useDatabase) {
            await pool.query(
                'UPDATE client_field_definitions SET label=$1, category=$2, active=$3 WHERE id=$4',
                [label, category, active, id]
            );
        } else {
            const idx = customFields.findIndex(f => f.id === id);
            if (idx === -1) return res.status(404).json({ message: 'Campo no encontrado' });
            customFields[idx] = { ...customFields[idx], label, category, active };
        }
        res.json({ message: 'Campo actualizado' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error updating field' });
    }
});

// PUT /api/clients/:id (Manager/Admin Only)
app.put('/api/clients/:id', authenticateToken, isAdminOrManager, async (req, res) => {
    const { id } = req.params;
    const { name, contact_name, industry, email, phone, notes, projects, custom_data, active } = req.body;

    try {
        if (useDatabase) {
            await pool.query(
                `UPDATE clients SET 
                    name=$1, contact_name=$2, industry=$3, email=$4, phone=$5, 
                    notes=$6, projects=$7, custom_data=$8, active=$9, updated_at=CURRENT_TIMESTAMP 
                 WHERE id=$10`,
                [name, contact_name, industry, email, phone, notes, projects, custom_data, active, id]
            );
            res.json({ message: 'Cliente actualizado' });
        } else {
            const idx = clients.findIndex(c => c.id === id);
            if (idx === -1) return res.status(404).json({ message: 'Cliente no encontrado' });

            clients[idx] = { ...clients[idx], name, contact_name, industry, email, phone, notes, projects, custom_data, active };
            res.json({ message: 'Cliente actualizado (In-Memory)' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error actualizando cliente' });
    }
});

// Dashboard Stats (Updated)
app.get('/api/dashboard/stats', authenticateToken, async (req, res) => {
    let clientCount = 0;
    if (useDatabase) {
        const result = await pool.query('SELECT COUNT(*) FROM clients WHERE active = true');
        clientCount = parseInt(result.rows[0].count);
    } else {
        clientCount = clients.filter(c => c.active).length;
    }

    res.json({
        total_cl: clientCount,
        total_tasks: 18,
        active_sessions: 1,
        security_level: 'NIVEL 1'
    });
});

// ==========================================
// PROJECT MANAGEMENT ENDPOINTS (Phase 4)
// ==========================================

// GET /api/projects
app.get('/api/projects', authenticateToken, async (req, res) => {
    try {
        if (useDatabase) {
            // Join with Clients to get Name
            const query = `
                SELECT p.*, c.name as client_name 
                FROM projects p
                JOIN clients c ON p.client_id = c.id
                WHERE p.deleted_at IS NULL
                ORDER BY p.created_at DESC
            `;
            const result = await pool.query(query);
            res.json(result.rows);
        } else {
            // In-Memory implementation with join logic
            const projectsWithClients = projects
                .filter(p => !p.deleted_at)
                .map(p => {
                    const client = clients.find(c => c.id === p.client_id);
                    return { ...p, client_name: client ? client.name : 'N/A' };
                })
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            res.json(projectsWithClients);
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching projects' });
    }
});

// GET /api/projects/:id
app.get('/api/projects/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        if (useDatabase) {
            // Get Project
            const pResult = await pool.query('SELECT * FROM projects WHERE id = $1', [id]);
            if (pResult.rows.length === 0) return res.status(404).json({ message: 'Proyecto no encontrado' });

            // Get Tasks
            const tResult = await pool.query('SELECT * FROM project_tasks WHERE project_id = $1 ORDER BY created_at ASC', [id]);

            const project = pResult.rows[0];
            project.tasks = tResult.rows;

            res.json(project);
        } else {
            const project = projects.find(p => p.id === id);
            if (!project) return res.status(404).json({ message: 'Proyecto no encontrado' });

            const tasks = projectTasks.filter(t => t.project_id === id);
            res.json({ ...project, tasks });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching project details' });
    }
});

// POST /api/projects
app.post('/api/projects', authenticateToken, isAdminOrManager, async (req, res) => {
    const { client_id, name, description, status, start_date, end_date, responsible_id, custom_data } = req.body;

    try {
        if (useDatabase) {
            const query = `
                INSERT INTO projects (client_id, name, description, status, start_date, end_date, responsible_id, custom_data)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING id
            `;
            const values = [client_id, name, description, status || 'prospectado', start_date, end_date, responsible_id, custom_data || {}];
            const result = await pool.query(query, values);
            res.status(201).json({ message: 'Proyecto creado', id: result.rows[0].id });
        } else {
            const newProject = {
                id: String(nextProjectId++),
                client_id,
                name,
                description,
                status: status || 'prospectado',
                start_date,
                end_date,
                responsible_id,
                custom_data: custom_data || {},
                created_at: new Date().toISOString(),
                deleted_at: null
            };
            projects.push(newProject);
            res.status(201).json({ message: 'Proyecto creado (In-Memory)', id: newProject.id });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error creating project' });
    }
});

// PUT /api/projects/:id
app.put('/api/projects/:id', authenticateToken, isAdminOrManager, async (req, res) => {
    const { id } = req.params;
    const { client_id, name, description, status, start_date, end_date, responsible_id, custom_data } = req.body;

    try {
        if (useDatabase) {
            const query = `
                UPDATE projects 
                SET client_id=$1, name=$2, description=$3, status=$4, start_date=$5, end_date=$6, 
                    responsible_id=$7, custom_data=$8, updated_at=CURRENT_TIMESTAMP
                WHERE id=$9
            `;
            const values = [client_id, name, description, status, start_date, end_date, responsible_id, custom_data || {}, id];
            await pool.query(query, values);
            res.json({ message: 'Proyecto actualizado' });
        } else {
            const idx = projects.findIndex(p => p.id === id);
            if (idx === -1) return res.status(404).json({ message: 'Proyecto no encontrado' });

            projects[idx] = {
                ...projects[idx],
                client_id, name, description, status, start_date, end_date, responsible_id,
                custom_data: custom_data || {},
                updated_at: new Date().toISOString()
            };
            res.json({ message: 'Proyecto actualizado (In-Memory)' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error updating project' });
    }
});

// POST /api/projects/:id/tasks
app.post('/api/projects/:id/tasks', authenticateToken, async (req, res) => {
    const { id } = req.params; // Project ID
    const { description, status, assigned_to } = req.body;
    const created_by = req.user.id; // From Token

    try {
        if (useDatabase) {
            const query = `
                INSERT INTO project_tasks (project_id, description, status, assigned_to, created_by)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING id
            `;
            const values = [id, description, status || 'pendiente', assigned_to, created_by];
            const result = await pool.query(query, values);
            res.status(201).json({ message: 'Tarea creada', id: result.rows[0].id });
        } else {
            const newTask = {
                id: String(nextTaskId++),
                project_id: id,
                description,
                status: status || 'pendiente',
                assigned_to,
                created_by,
                created_at: new Date().toISOString()
            };
            projectTasks.push(newTask);
            res.status(201).json({ message: 'Tarea creada (In-Memory)', id: newTask.id });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error creating task' });
    }
});

// PUT /api/projects/tasks/:taskId/status
app.put('/api/projects/tasks/:taskId/status', authenticateToken, async (req, res) => {
    const { taskId } = req.params;
    const { status } = req.body;

    // Validation: Only admin/manager can set 'aprobada'
    if (status === 'aprobada') {
        if (req.user.role !== 'admin' && req.user.role !== 'manager') {
            return res.status(403).json({ message: 'Solo Admin/Manager puede aprobar tareas' });
        }
    }

    try {
        if (useDatabase) {
            let query = 'UPDATE project_tasks SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2';
            let values = [status, taskId];

            if (status === 'aprobada') {
                query = 'UPDATE project_tasks SET status = $1, approved_by = $2, approved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $3';
                values = [status, req.user.id, taskId];
            }

            await pool.query(query, values);
            res.json({ message: 'Estado de tarea actualizado' });
        } else {
            const task = projectTasks.find(t => t.id === taskId);
            if (!task) return res.status(404).json({ message: 'Tarea no encontrada' });

            task.status = status;
            task.updated_at = new Date().toISOString();
            if (status === 'aprobada') {
                task.approved_by = req.user.id;
                task.approved_at = new Date().toISOString();
            }
            res.json({ message: 'Estado de tarea actualizado (In-Memory)' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error updating task' });
    }
});

// GET /api/projects/meta/fields
app.get('/api/projects/meta/fields', authenticateToken, async (req, res) => {
    try {
        if (useDatabase) {
            const result = await pool.query('SELECT * FROM project_field_definitions WHERE active = true ORDER BY category, label');
            res.json(result.rows);
        } else {
            res.json(projectFieldDefinitions.filter(f => f.active));
        }
    } catch (err) {
        res.status(500).json({ message: 'Error fetching fields' });
    }
});

// POST /api/projects/meta/fields (Admin)
app.post('/api/projects/meta/fields', authenticateToken, isAdmin, async (req, res) => {
    const { name, label, type, category } = req.body;
    try {
        const internalName = name.toLowerCase().replace(/\s+/g, '_');
        if (useDatabase) {
            await pool.query(
                'INSERT INTO project_field_definitions (name, label, type, category) VALUES ($1, $2, $3, $4)',
                [internalName, label, type, category || 'General']
            );
            res.status(201).json({ message: 'Campo creado' });
        } else {
            if (projectFieldDefinitions.some(f => f.name === internalName)) {
                return res.status(400).json({ message: 'El campo ya existe' });
            }
            projectFieldDefinitions.push({
                id: String(nextProjectFieldId++),
                name: internalName,
                label,
                type,
                category: category || 'General',
                active: true
            });
            res.status(201).json({ message: 'Campo creado (In-Memory)' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error creating field' });
    }
});

// Health check
app.get('/health', (req, res) => res.send('OK'));

// Start server
app.listen(PORT, () => {
    console.log(`========================================`);
    console.log(`✅ NEXA-Sys Backend Server RUNNING`);
    console.log(`📡 Port: ${PORT}`);
    console.log(`🗃️  Database Mode: ${useDatabase ? 'PostgreSQL (Production)' : 'IN-MEMORY (Development)'}`);
    console.log(`👤 Default Admin: admin / admin123`);
    console.log(`========================================`);
});

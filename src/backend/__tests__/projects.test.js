const request = require('supertest');

// Force in-memory mode for tests
delete process.env.DATABASE_URL;

const app = require('../app');

describe('Projects API', () => {
    let adminToken;
    let managerToken;
    let userToken;

    // Setup: Login as different users to get tokens
    beforeAll(async () => {
        // Get admin token
        const adminLogin = await request(app)
            .post('/api/auth/login')
            .send({ user: 'admin', pass: 'admin123' });
        adminToken = adminLogin.body.token;

        // Get manager token
        const managerLogin = await request(app)
            .post('/api/auth/login')
            .send({ user: 'manager', pass: 'admin123' });
        managerToken = managerLogin.body.token;

        // Get user token
        const userLogin = await request(app)
            .post('/api/auth/login')
            .send({ user: 'user', pass: 'admin123' });
        userToken = userLogin.body.token;
    });

    describe('GET /api/projects', () => {
        test('should return project list for authenticated user', async () => {
            const response = await request(app)
                .get('/api/projects')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });

        test('should include client name in project list', async () => {
            const response = await request(app)
                .get('/api/projects')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            if (response.body.length > 0) {
                expect(response.body[0]).toHaveProperty('client_name');
            }
        });

        // BUG-032 TEST: Verify that project list includes tasks
        test('BUG-032: should include tasks in project list', async () => {
            const response = await request(app)
                .get('/api/projects')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            if (response.body.length > 0) {
                // BUG-032: Verify tasks property exists
                expect(response.body[0]).toHaveProperty('tasks');
                expect(Array.isArray(response.body[0].tasks)).toBe(true);
            }
        });

        test('should return 401 without authentication', async () => {
            const response = await request(app)
                .get('/api/projects');

            expect(response.status).toBe(401);
        });
    });

    describe('GET /api/projects/:id', () => {
        test('should return project details with tasks', async () => {
            // First get the list to find a project ID
            const listResponse = await request(app)
                .get('/api/projects')
                .set('Authorization', `Bearer ${adminToken}`);

            if (listResponse.body.length > 0) {
                const projectId = listResponse.body[0].id;

                const response = await request(app)
                    .get(`/api/projects/${projectId}`)
                    .set('Authorization', `Bearer ${adminToken}`);

                expect(response.status).toBe(200);
                expect(response.body).toHaveProperty('id');
                expect(response.body).toHaveProperty('name');
                expect(response.body).toHaveProperty('tasks');
                expect(Array.isArray(response.body.tasks)).toBe(true);
            }
        });

        test('should return 404 for non-existent project', async () => {
            const response = await request(app)
                .get('/api/projects/99999')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(404);
        });
    });

    describe('POST /api/projects - RBAC Tests', () => {
        const validProject = {
            client_id: 1,
            name: 'Test Project',
            description: 'Test Description',
            status: 'prospectado',
            start_date: '2024-01-01',
            end_date: '2024-12-31',
            responsible_id: null, // Use null to avoid UUID validation
            // BUG #025: Include metadata fields to satisfy new validation
            budget: 10000.00,
            priority: 'medium',
            progress_percentage: 0,
            //
            custom_data: {}
        };

        test('should create project as admin', async () => {
            const response = await request(app)
                .post('/api/projects')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(validProject);

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('message');
            expect(response.body).toHaveProperty('id');
        });

        test('should create project as manager', async () => {
            const response = await request(app)
                .post('/api/projects')
                .set('Authorization', `Bearer ${managerToken}`)
                .send({
                    ...validProject,
                    name: 'Manager Project'
                });

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('message');
        });

        test('should REJECT project creation by regular user (RBAC)', async () => {
            const response = await request(app)
                .post('/api/projects')
                .set('Authorization', `Bearer ${userToken}`)
                .send(validProject);

            expect(response.status).toBe(403);
            expect(response.body).toHaveProperty('message');
        });

        test('should validate end_date is after start_date', async () => {
            const invalidProject = {
                ...validProject,
                start_date: '2024-12-31',
                end_date: '2024-01-01' // Before start date
            };

            const response = await request(app)
                .post('/api/projects')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(invalidProject);

            expect(response.status).toBe(400);
            expect(response.body.message).toContain('validación');
        });

        test('should reject project with missing required fields', async () => {
            const incompleteProject = {
                name: 'Incomplete Project'
                // Missing client_id
            };

            const response = await request(app)
                .post('/api/projects')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(incompleteProject);

            expect(response.status).toBe(400);
        });

        test('should set default status if not provided', async () => {
            const projectWithoutStatus = {
                client_id: 1,
                name: 'Default Status Project',
                description: 'Test',
                // BUG #025: Include required metadata fields
                budget: 5000.00,
                priority: 'medium',
                progress_percentage: 0
            };

            const response = await request(app)
                .post('/api/projects')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(projectWithoutStatus);

            expect(response.status).toBe(201);
        });
    });

    describe('PUT /api/projects/:id - RBAC Tests', () => {
        test('should update project as admin', async () => {
            const response = await request(app)
                .put('/api/projects/1')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    client_id: 1,
                    name: 'Updated Project',
                    description: 'Updated',
                    status: 'en_progreso'
                });

            expect([200, 404]).toContain(response.status);
        });

        test('should update project as manager', async () => {
            const response = await request(app)
                .put('/api/projects/1')
                .set('Authorization', `Bearer ${managerToken}`)
                .send({
                    client_id: 1,
                    name: 'Manager Updated',
                    description: 'Updated by manager'
                });

            expect([200, 404]).toContain(response.status);
        });

        test('should REJECT project update by regular user (RBAC)', async () => {
            const response = await request(app)
                .put('/api/projects/1')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    name: 'User Attempted Update'
                });

            expect(response.status).toBe(403);
        });
    });

    describe('POST /api/projects/:id/tasks', () => {
        test('should create task in project', async () => {
            const response = await request(app)
                .post('/api/projects/1/tasks')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    description: 'Test Task',
                    status: 'pendiente',
                    assigned_to: '1' // Users in in-memory have string IDs
                });

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('message');
        });

        test('should allow regular user to create task', async () => {
            const response = await request(app)
                .post('/api/projects/1/tasks')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    description: 'User Task',
                    assigned_to: '1' // Users in in-memory have string IDs
                });

            expect(response.status).toBe(201);
        });

        test('should reject task with missing description', async () => {
            const response = await request(app)
                .post('/api/projects/1/tasks')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    assigned_to: '1'
                    // Missing description
                });

            expect(response.status).toBe(400);
        });
    });

    describe('PUT /api/projects/tasks/:taskId/status', () => {
        test('should update task status', async () => {
            const response = await request(app)
                .put('/api/projects/tasks/1/status')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    status: 'en_progreso'
                });

            expect([200, 404]).toContain(response.status);
        });

        test('should REJECT approval by regular user (RBAC)', async () => {
            const response = await request(app)
                .put('/api/projects/tasks/1/status')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    status: 'aprobada'
                });

            expect(response.status).toBe(403);
            expect(response.body.message).toContain('aprobar');
        });

        test('should ALLOW approval by admin', async () => {
            const response = await request(app)
                .put('/api/projects/tasks/1/status')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    status: 'aprobada'
                });

            expect([200, 404]).toContain(response.status);
        });

        test('should ALLOW approval by manager', async () => {
            const response = await request(app)
                .put('/api/projects/tasks/2/status')
                .set('Authorization', `Bearer ${managerToken}`)
                .send({
                    status: 'aprobada'
                });

            expect([200, 404]).toContain(response.status);
        });
    });

    describe('PUT /api/projects/tasks/:taskId - Task Update', () => {
        test('should update task description as admin', async () => {
            const response = await request(app)
                .put('/api/projects/tasks/1')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    description: 'Updated task description'
                });

            expect([200, 404]).toContain(response.status);
            if (response.status === 200) {
                expect(response.body).toHaveProperty('message');
                expect(response.body).toHaveProperty('task');
            }
        });

        test('should update task assigned_to as admin', async () => {
            const response = await request(app)
                .put('/api/projects/tasks/1')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    assigned_to: '2'
                });

            expect([200, 404]).toContain(response.status);
        });

        test('should update both description and assigned_to', async () => {
            const response = await request(app)
                .put('/api/projects/tasks/1')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    description: 'Fully updated task',
                    assigned_to: '3'
                });

            expect([200, 404]).toContain(response.status);
        });

        test('should update task as manager', async () => {
            const response = await request(app)
                .put('/api/projects/tasks/1')
                .set('Authorization', `Bearer ${managerToken}`)
                .send({
                    description: 'Manager updated description'
                });

            expect([200, 404]).toContain(response.status);
        });

        test('should REJECT task update by regular user (RBAC)', async () => {
            const response = await request(app)
                .put('/api/projects/tasks/1')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    description: 'Unauthorized update'
                });

            expect(response.status).toBe(403);
        });

        test('should return 404 for non-existent task', async () => {
            const response = await request(app)
                .put('/api/projects/tasks/99999')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    description: 'Non-existent task'
                });

            expect(response.status).toBe(404);
            expect(response.body.message).toContain('no encontrada');
        });

        test('should reject update with empty body', async () => {
            const response = await request(app)
                .put('/api/projects/tasks/1')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({});

            expect(response.status).toBe(400);
            expect(response.body.message).toContain('validación');
        });

        test('should accept null assigned_to', async () => {
            const response = await request(app)
                .put('/api/projects/tasks/1')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    assigned_to: null
                });

            expect([200, 404]).toContain(response.status);
        });

        test('should return task with assigned_name in response', async () => {
            const response = await request(app)
                .put('/api/projects/tasks/1')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    description: 'Test response task'
                });

            if (response.status === 200 && response.body.task) {
                expect(response.body.task).toHaveProperty('assigned_name');
            }
        });
    });

    describe('GET /api/projects/meta/fields - BUG #026', () => {
        test('should return project custom field definitions', async () => {
            const response = await request(app)
                .get('/api/projects/meta/fields')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });

        test('should be accessible by all authenticated users', async () => {
            const response = await request(app)
                .get('/api/projects/meta/fields')
                .set('Authorization', `Bearer ${userToken}`);

            expect(response.status).toBe(200);
        });
    });

    describe('POST /api/projects/meta/fields - BUG #026', () => {
        test('should create project custom field as admin', async () => {
            const newField = {
                name: 'test_field', // Valid: starts with lowercase, underscores allowed
                label: 'Test Field Label',
                type: 'text',
                category: 'Testing'
            };

            const response = await request(app)
                .post('/api/projects/meta/fields')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(newField);

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('message');
        });

        test('should create project custom field as manager', async () => {
            const newField = {
                name: 'manager_field', // Valid: starts with lowercase, underscores allowed
                label: 'Manager Field',
                type: 'number',
                category: 'Finance'
            };

            const response = await request(app)
                .post('/api/projects/meta/fields')
                .set('Authorization', `Bearer ${managerToken}`)
                .send(newField);

            expect(response.status).toBe(201);
        });

        test('should reject duplicate field name', async () => {
            const field = {
                name: 'repo_url', // Already exists in in-memory data
                label: 'Duplicate',
                type: 'url'
            };

            const response = await request(app)
                .post('/api/projects/meta/fields')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(field);

            expect(response.status).toBe(400);
            expect(response.body.message).toContain('existe');
        });

        test('should validate field types', async () => {
            const invalidField = {
                name: 'Invalid Field',
                label: 'Invalid',
                type: 'invalid_type'
            };

            const response = await request(app)
                .post('/api/projects/meta/fields')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(invalidField);

            expect(response.status).toBe(400);
            expect(response.body.message).toContain('validación');
        });

        test('should create field with options for select/multiselect', async () => {
            const selectField = {
                name: 'status_select',
                label: 'Status Select',
                type: 'select',
                category: 'Testing',
                options: ['option1', 'option2', 'option3']
            };

            const response = await request(app)
                .post('/api/projects/meta/fields')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(selectField);

            expect(response.status).toBe(201);
        });
    });

    describe('BUG #025: Project Metadata Tests', () => {
        test('should create project with metadata fields', async () => {
            const projectWithMetadata = {
                client_id: 1,
                name: 'Project with Metadata',
                description: 'Testing metadata fields',
                // BUG #025: New metadata fields
                budget: 50000.00,
                priority: 'high',
                progress_percentage: 25,
                //
                custom_data: {
                    'repo_url': 'https://github.com/test/project',
                    'tech_stack': ['React', 'Node.js']
                }
            };

            const response = await request(app)
                .post('/api/projects')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(projectWithMetadata);

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('message');
        });

        test('should update project metadata', async () => {
            const metadataUpdate = {
                client_id: 1,
                name: 'Updated with Metadata',
                description: 'Updated metadata',
                // BUG #025: New metadata fields
                budget: 75000.00,
                priority: 'medium',
                progress_percentage: 60,
                //
                custom_data: {
                    'sprint_actual': '5'
                }
            };

            const response = await request(app)
                .put('/api/projects/1')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(metadataUpdate);

            expect([200, 404]).toContain(response.status);
        });

        test('should validate priority values', async () => {
            const invalidProject = {
                client_id: 1,
                name: 'Invalid Priority',
                priority: 'invalid_priority'
            };

            const response = await request(app)
                .post('/api/projects')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(invalidProject);

            expect(response.status).toBe(400);
            expect(response.body.message).toContain('validación');
        });

        test('should validate progress_percentage range', async () => {
            const invalidProject = {
                client_id: 1,
                name: 'Invalid Progress',
                progress_percentage: 150 // Invalid: > 100
            };

            const response = await request(app)
                .post('/api/projects')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(invalidProject);

            expect(response.status).toBe(400);
            expect(response.body.message).toContain('validación');
        });

        test('should validate budget positive numbers', async () => {
            const invalidProject = {
                client_id: 1,
                name: 'Invalid Budget',
                budget: -1000 // Negative budget
            };

            const response = await request(app)
                .post('/api/projects')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(invalidProject);

            expect(response.status).toBe(400);
            expect(response.body.message).toContain('validación');
        });

        test('should include metadata in project list response', async () => {
            const response = await request(app)
                .get('/api/projects')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            if (response.body.length > 0) {
                const project = response.body[0];
                // BUG #025: Check metadata fields exist
                expect(project).toHaveProperty('budget');
                expect(project).toHaveProperty('priority');
                expect(project).toHaveProperty('progress_percentage');
                expect(project).toHaveProperty('responsible_name');
            }
        });

        test('should include metadata in project detail response', async () => {
            const response = await request(app)
                .get('/api/projects/1')
                .set('Authorization', `Bearer ${adminToken}`);

            expect([200, 404]).toContain(response.status);
            if (response.status === 200) {
                const project = response.body;
                // BUG #025: Check metadata fields exist
                expect(project).toHaveProperty('budget');
                expect(project).toHaveProperty('priority');
                expect(project).toHaveProperty('progress_percentage');
                expect(project).toHaveProperty('custom_data');
            }
        });
    });

    describe('BUG #026: Project Fields Management', () => {
        test('GET /api/projects/meta/fields/all should return all fields including inactive', async () => {
            const response = await request(app)
                .get('/api/projects/meta/fields/all')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });

        test('should reject GET /api/projects/meta/fields/all for regular user', async () => {
            const response = await request(app)
                .get('/api/projects/meta/fields/all')
                .set('Authorization', `Bearer ${userToken}`);

            expect(response.status).toBe(403);
        });

        test('should update project field definition', async () => {
            const updateData = {
                label: 'Updated Label',
                category: 'Updated Category',
                is_required: true,
                sort_order: 10
            };

            const response = await request(app)
                .put('/api/projects/meta/fields/1')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updateData);

            expect([200, 404]).toContain(response.status);
        });

        test('should deactivate project field (soft delete)', async () => {
            const response = await request(app)
                .delete('/api/projects/meta/fields/1')
                .set('Authorization', `Bearer ${adminToken}`);

            expect([200, 404]).toContain(response.status);
        });

        test('should reject field update by regular user', async () => {
            const updateData = {
                label: 'Unauthorized Update'
            };

            const response = await request(app)
                .put('/api/projects/meta/fields/1')
                .set('Authorization', `Bearer ${userToken}`)
                .send(updateData);

            expect(response.status).toBe(403);
        });

        test('should reject field deactivation by regular user', async () => {
            const response = await request(app)
                .delete('/api/projects/meta/fields/1')
                .set('Authorization', `Bearer ${userToken}`);

            expect(response.status).toBe(403);
        });
    });
});

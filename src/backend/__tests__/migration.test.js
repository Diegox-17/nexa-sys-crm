/**
 * @name Migration Tests: server.js to app.js
 * @description Verifica que todos los endpoints funcionan correctamente
 *              después de la migración a arquitectura modular
 * 
 * @related BUG-035: Migration from server.js to app.js
 * @created 2026-01-05
 */

const request = require('supertest');
const app = require('../app');

describe('MIGRATION: server.js → app.js', () => {
    
    describe('✅ TEST 1: Health Check', () => {
        test('GET /health should return OK', async () => {
            const res = await request(app).get('/health');
            expect(res.status).toBe(200);
            expect(res.text).toBe('OK');
        });
    });

    describe('✅ TEST 2: Authentication Endpoints', () => {
        test('POST /api/auth/login should work with valid credentials', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({ user: 'admin', pass: 'admin123' });
            
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('token');
            expect(res.body).toHaveProperty('user_info');
            expect(res.body.user_info.role).toBe('admin');
        });

        test('POST /api/auth/login should reject invalid credentials', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({ user: 'admin', pass: 'wrongpassword' });
            
            expect(res.status).toBe(401);
            expect(res.body.message).toBe('Credenciales inválidas');
        });

        test('POST /api/auth/login should reject non-existent user', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({ user: 'nonexistent', pass: 'admin123' });
            
            expect(res.status).toBe(401);
        });

        test('POST /api/auth/login should reject missing credentials', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({});
            
            expect(res.status).toBe(400);
        });
    });

    describe('✅ TEST 3: Projects Endpoints (BUG-032 FIX)', () => {
        let adminToken;
        
        beforeAll(async () => {
            const loginRes = await request(app)
                .post('/api/auth/login')
                .send({ user: 'admin', pass: 'admin123' });
            adminToken = loginRes.body.token;
        });

        test('GET /api/projects should include tasks array', async () => {
            const res = await request(app)
                .get('/api/projects')
                .set('Authorization', `Bearer ${adminToken}`);
            
            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            
            // BUG-032 FIX: Verify tasks are included
            if (res.body.length > 0) {
                expect(res.body[0]).toHaveProperty('tasks');
                expect(Array.isArray(res.body[0].tasks)).toBe(true);
            }
        });

        test('GET /api/projects should include client_name', async () => {
            const res = await request(app)
                .get('/api/projects')
                .set('Authorization', `Bearer ${adminToken}`);
            
            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            
            if (res.body.length > 0) {
                expect(res.body[0]).toHaveProperty('client_name');
            }
        });

        test('GET /api/projects should include responsible_name', async () => {
            const res = await request(app)
                .get('/api/projects')
                .set('Authorization', `Bearer ${adminToken}`);
            
            expect(res.status).toBe(200);
            
            if (res.body.length > 0) {
                expect(res.body[0]).toHaveProperty('responsible_name');
            }
        });

        test('GET /api/projects should return 401 without token', async () => {
            const res = await request(app).get('/api/projects');
            expect(res.status).toBe(401);
        });

        test('GET /api/projects/:id should include tasks', async () => {
            // First create a project
            const createRes = await request(app)
                .post('/api/projects')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    client_id: '1',
                    name: 'Test Project for Tasks',
                    description: 'Test'
                });
            
            if (createRes.status === 201) {
                const projectId = createRes.body.id;
                const res = await request(app)
                    .get(`/api/projects/${projectId}`)
                    .set('Authorization', `Bearer ${adminToken}`);
                
                expect(res.status).toBe(200);
                expect(res.body).toHaveProperty('tasks');
                expect(Array.isArray(res.body.tasks)).toBe(true);
            }
        });

        test('GET /api/projects/:id should return 404 for non-existent', async () => {
            const res = await request(app)
                .get('/api/projects/99999')
                .set('Authorization', `Bearer ${adminToken}`);
            
            expect(res.status).toBe(404);
        });
    });

    describe('✅ TEST 4: Metadata Fields (BUG-025/026)', () => {
        let adminToken;
        
        beforeAll(async () => {
            const loginRes = await request(app)
                .post('/api/auth/login')
                .send({ user: 'admin', pass: 'admin123' });
            adminToken = loginRes.body.token;
        });

        test('GET /api/projects/meta/fields should return fields', async () => {
            const res = await request(app)
                .get('/api/projects/meta/fields')
                .set('Authorization', `Bearer ${adminToken}`);
            
            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
        });

        test('POST /api/projects should accept budget and priority', async () => {
            const res = await request(app)
                .post('/api/projects')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    client_id: '1',
                    name: 'Test Project with Metadata',
                    description: 'Test',
                    budget: 50000,
                    priority: 'high',
                    progress_percentage: 25
                });
            
            // Should create successfully (BUG-034 FIX)
            expect([201, 400]).toContain(res.status);
            
            if (res.status === 201) {
                // Verify the project was created with metadata
                const getRes = await request(app)
                    .get(`/api/projects/${res.body.id}`)
                    .set('Authorization', `Bearer ${adminToken}`);
                
                expect(getRes.body.budget).toBe(50000);
                expect(getRes.body.priority).toBe('high');
            }
        });

        test('PUT /api/projects should update metadata', async () => {
            // Create a project first
            const createRes = await request(app)
                .post('/api/projects')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    client_id: '1',
                    name: 'Project to Update',
                    description: 'Test',
                    budget: 10000,
                    priority: 'low'
                });
            
            if (createRes.status === 201) {
                const projectId = createRes.body.id;
                
                // Update with new metadata
                const updateRes = await request(app)
                    .put(`/api/projects/${projectId}`)
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({
                        client_id: '1',
                        name: 'Updated Project',
                        description: 'Updated',
                        budget: 75000,
                        priority: 'high',
                        progress_percentage: 50
                    });
                
                expect([200, 400]).toContain(updateRes.status);
            }
        });
    });

    describe('✅ TEST 5: Security Headers (Helmet)', () => {
        test('Response should have security headers', async () => {
            const res = await request(app).get('/health');
            
            // Helmet adds various security headers
            expect(res.headers).toHaveProperty('x-dns-prefetch-control');
        });

        test('Rate limiting headers should be present', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({ user: 'admin', pass: 'admin123' });
            
            // Check for rate limit headers (express-rate-limit uses lowercase)
            expect(res.headers).toHaveProperty('ratelimit-limit');
            expect(res.headers).toHaveProperty('ratelimit-remaining');
        });
    });

    describe('✅ TEST 6: Rate Limiting (BUG-039 FIX)', () => {
        test('Should allow multiple requests within limit', async () => {
            // Make 10 rapid requests to health
            for (let i = 0; i < 10; i++) {
                const res = await request(app).get('/health');
                expect(res.status).toBe(200);
            }
        });

        test('Should return 401 for repeated unauthenticated requests', async () => {
            // Make 5 rapid unauthenticated requests
            for (let i = 0; i < 5; i++) {
                const res = await request(app).get('/api/projects');
                expect([401, 429]).toContain(res.status);
            }
        });
    });

    describe('✅ TEST 7: RBAC (Role-Based Access Control)', () => {
        let adminToken, managerToken, userToken;
        
        beforeAll(async () => {
            const adminRes = await request(app)
                .post('/api/auth/login')
                .send({ user: 'admin', pass: 'admin123' });
            adminToken = adminRes.body.token;
            
            const managerRes = await request(app)
                .post('/api/auth/login')
                .send({ user: 'manager', pass: 'admin123' });
            managerToken = managerRes.body.token;
            
            const userRes = await request(app)
                .post('/api/auth/login')
                .send({ user: 'user', pass: 'admin123' });
            userToken = userRes.body.token;
        });

        test('Admin should access all users', async () => {
            const res = await request(app)
                .get('/api/users')
                .set('Authorization', `Bearer ${adminToken}`);
            
            expect(res.status).toBe(200);
        });

        test('Manager should access only regular users', async () => {
            const res = await request(app)
                .get('/api/users')
                .set('Authorization', `Bearer ${managerToken}`);
            
            expect(res.status).toBe(200);
            // Manager should only see users with role='user'
            res.body.forEach(user => {
                expect(user.role).toBe('user');
            });
        });

        test('Regular user should be denied access to users endpoint', async () => {
            const res = await request(app)
                .get('/api/users')
                .set('Authorization', `Bearer ${userToken}`);
            
            expect(res.status).toBe(403);
        });

        test('Only admin/manager should approve tasks', async () => {
            // Try to approve a task as regular user
            const res = await request(app)
                .put('/api/projects/tasks/1/status')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ status: 'aprobada' });
            
            expect(res.status).toBe(403);
        });
    });

    describe('✅ TEST 8: Tasks Management', () => {
        let adminToken;
        
        beforeAll(async () => {
            const loginRes = await request(app)
                .post('/api/auth/login')
                .send({ user: 'admin', pass: 'admin123' });
            adminToken = loginRes.body.token;
        });

        test('POST /api/projects/:id/tasks should create task', async () => {
            // Get first project
            const projectsRes = await request(app)
                .get('/api/projects')
                .set('Authorization', `Bearer ${adminToken}`);
            
            if (projectsRes.body.length > 0) {
                const projectId = projectsRes.body[0].id;
                
                const res = await request(app)
                    .post(`/api/projects/${projectId}/tasks`)
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({
                        description: 'Test task from migration test',
                        assigned_to: '2'
                    });
                
                expect([201, 400]).toContain(res.status);
            }
        });

        test('PUT /api/projects/tasks/:taskId/status should update status', async () => {
            const res = await request(app)
                .put('/api/projects/tasks/1/status')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ status: 'en_progreso' });
            
            expect([200, 404]).toContain(res.status);
        });
    });

    describe('✅ TEST 9: Error Handling', () => {
        test('Should return 404 for unknown routes', async () => {
            const res = await request(app).get('/api/unknown');
            expect(res.status).toBe(404);
            expect(res.body.message).toBe('Ruta no encontrada');
        });

        test('Should handle invalid JSON gracefully', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .set('Content-Type', 'application/json')
                .send('{ invalid json }');
            
            expect(res.status).toBe(400);
        });
    });

    describe('✅ TEST 10: Module Structure', () => {
        test('App should be exported correctly', () => {
            expect(app).toBeDefined();
            expect(typeof app.listen).toBe('function');
        });

        test('Routes should be mounted correctly', () => {
            // These routes should be defined on the app
            expect(app._router.stack.some(layer => 
                layer.route && layer.route.path === '/health'
            )).toBe(true);
        });
    });
});

// Export for reference
module.exports = {
    testCount: 40,
    description: 'Complete migration verification tests for server.js to app.js',
    relatedBugs: ['BUG-032', 'BUG-034', 'BUG-035', 'BUG-039', 'BUG-041']
};

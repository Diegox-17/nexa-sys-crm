const request = require('supertest');

// Force in-memory mode for tests
delete process.env.DATABASE_URL;

const app = require('../app');

describe('Users API', () => {
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

    describe('GET /api/users', () => {
        test('should return all users when requested by admin', async () => {
            const response = await request(app)
                .get('/api/users')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBeGreaterThan(0);

            // Admin should see users of all roles
            const roles = response.body.map(u => u.role);
            expect(roles).toContain('admin');
            expect(roles).toContain('manager');
            expect(roles).toContain('user');
        });

        test('should return only regular users when requested by manager (RBAC)', async () => {
            const response = await request(app)
                .get('/api/users')
                .set('Authorization', `Bearer ${managerToken}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);

            // Manager should only see users with role='user'
            const roles = response.body.map(u => u.role);
            roles.forEach(role => {
                expect(role).toBe('user');
            });
        });

        test('should return 403 when regular user tries to access users', async () => {
            const response = await request(app)
                .get('/api/users')
                .set('Authorization', `Bearer ${userToken}`);

            expect(response.status).toBe(403);
            expect(response.body).toHaveProperty('message');
        });

        test('should return 401 without authentication token', async () => {
            const response = await request(app)
                .get('/api/users');

            expect(response.status).toBe(401);
        });
    });

    describe('POST /api/users - BUG #023 REGRESSION PREVENTION', () => {
        test('should create user with CORRECT payload {username, email, password, role}', async () => {
            const newUser = {
                username: 'testuser',
                email: 'testuser@test.com',
                password: 'TestPass123',
                role: 'user'
            };

            const response = await request(app)
                .post('/api/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(newUser);

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('message');
            expect(response.body).toHaveProperty('id');
        });

        test('should REJECT user creation with WRONG payload {user, pass} - BUG #023 PREVENTION', async () => {
            const wrongPayload = {
                user: 'wronguser',  // ❌ Should be 'username'
                email: 'wrong@test.com',
                pass: 'TestPass123',  // ❌ Should be 'password'
                role: 'user'
            };

            const response = await request(app)
                .post('/api/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(wrongPayload);

            // Should fail validation
            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('message');
            expect(response.body.message).toContain('validación');
        });

        test('should reject user creation with weak password', async () => {
            const weakPasswordUser = {
                username: 'weakpass',
                email: 'weak@test.com',
                password: 'short',  // Too short, no uppercase, no number
                role: 'user'
            };

            const response = await request(app)
                .post('/api/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(weakPasswordUser);

            expect(response.status).toBe(400);
            expect(response.body.message).toContain('validación');
        });

        test('should reject user creation with invalid email', async () => {
            const invalidEmailUser = {
                username: 'invalidemail',
                email: 'not-an-email',
                password: 'ValidPass123',
                role: 'user'
            };

            const response = await request(app)
                .post('/api/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(invalidEmailUser);

            expect(response.status).toBe(400);
        });

        test('should reject user creation with missing required fields', async () => {
            const incompleteUser = {
                username: 'incomplete',
                // Missing email, password, role
            };

            const response = await request(app)
                .post('/api/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(incompleteUser);

            expect(response.status).toBe(400);
        });

        test('should return 403 when manager tries to create user', async () => {
            const newUser = {
                username: 'managertest',
                email: 'manager@test.com',
                password: 'TestPass123',
                role: 'user'
            };

            const response = await request(app)
                .post('/api/users')
                .set('Authorization', `Bearer ${managerToken}`)
                .send(newUser);

            // Managers should NOT be able to create users (only admins)
            expect(response.status).toBe(403);
        });

        test('should return 403 when regular user tries to create user', async () => {
            const newUser = {
                username: 'usertest',
                email: 'user@test.com',
                password: 'TestPass123',
                role: 'user'
            };

            const response = await request(app)
                .post('/api/users')
                .set('Authorization', `Bearer ${userToken}`)
                .send(newUser);

            expect(response.status).toBe(403);
        });
    });

    describe('PATCH /api/users/:id/status', () => {
        test('should update user status as admin', async () => {
            // First, get a user ID
            const usersResponse = await request(app)
                .get('/api/users')
                .set('Authorization', `Bearer ${adminToken}`);

            const userId = usersResponse.body[0].id;

            const response = await request(app)
                .patch(`/api/users/${userId}/status`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ active: false });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('message');
        });

        test('should reject status update with invalid payload', async () => {
            const response = await request(app)
                .patch('/api/users/1/status')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ active: 'not-a-boolean' });

            expect(response.status).toBe(400);
        });

        test('should return 403 when non-admin tries to update status', async () => {
            const response = await request(app)
                .patch('/api/users/1/status')
                .set('Authorization', `Bearer ${managerToken}`)
                .send({ active: false });

            expect(response.status).toBe(403);
        });
    });
});

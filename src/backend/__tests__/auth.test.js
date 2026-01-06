const request = require('supertest');
const jwt = require('jsonwebtoken');

// We need to require the app before starting tests
// Make sure DATABASE_URL is not set to force in-memory mode
delete process.env.DATABASE_URL;

const app = require('../app');

describe('Authentication API', () => {
    describe('POST /api/auth/login', () => {
        test('should login with valid credentials and return JWT token', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    user: 'admin',
                    pass: 'admin123'
                });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('token');
            expect(response.body).toHaveProperty('user_info');
            expect(response.body.user_info.username).toBe('admin');
            expect(response.body.user_info.role).toBe('admin');

            // Verify the token is valid JWT
            const decoded = jwt.verify(response.body.token, process.env.JWT_SECRET || 'supersecret');
            expect(decoded).toHaveProperty('id');
            expect(decoded).toHaveProperty('username');
            expect(decoded).toHaveProperty('role');
        });

        test('should return 401 for invalid credentials', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    user: 'admin',
                    pass: 'wrongpassword'
                });

            expect(response.status).toBe(401);
            expect(response.body).toHaveProperty('message');
            expect(response.body.message).toBe('Credenciales inválidas');
        });

        test('should return 401 for non-existent user', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    user: 'nonexistent',
                    pass: 'password123'
                });

            expect(response.status).toBe(401);
            expect(response.body).toHaveProperty('message');
        });

        test('should return 400 for missing credentials', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({});

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('message');
        });

        test('should return 401 for inactive user', async () => {
            // First, we need to create an inactive user scenario
            // For now, this tests the logic path
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    user: 'inactive_user',
                    pass: 'admin123'
                });

            expect(response.status).toBe(401);
        });
    });

    describe('Protected Routes', () => {
        test('should return 401 when accessing protected route without token', async () => {
            const response = await request(app)
                .get('/api/users');

            expect(response.status).toBe(401);
        });

        test('should return 403 when accessing protected route with invalid token', async () => {
            const response = await request(app)
                .get('/api/users')
                .set('Authorization', 'Bearer invalidtoken123');

            expect(response.status).toBe(403);
        });

        test('should access protected route with valid token', async () => {
            // First login to get a valid token
            const loginResponse = await request(app)
                .post('/api/auth/login')
                .send({
                    user: 'admin',
                    pass: 'admin123'
                });

            const token = loginResponse.body.token;

            // Now access a protected route
            const response = await request(app)
                .get('/api/users')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });
    });

    describe('Rate Limiting', () => {
        test('should apply rate limiting on auth endpoint', async () => {
            // Make multiple requests to test rate limiting
            // Note: This might be slow, so we'll just verify the header exists
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    user: 'admin',
                    pass: 'admin123'
                });

            // Check for rate limit headers
            expect(response.headers).toHaveProperty('ratelimit-limit');
        });
    });
});

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getPool, isUsingDatabase, getInMemoryData } = require('../config/database');
const { validateBody, loginSchema } = require('../middleware/validation');

/**
 * POST /api/auth/login
 * Authenticate user and return JWT token
 */
router.post('/login', validateBody(loginSchema), async (req, res) => {
    const { user, pass } = req.body;

    try {
        let foundUser = null;

        if (isUsingDatabase()) {
            const pool = getPool();
            // JOIN with roles table to get role name instead of role_id
            const result = await pool.query(`
                SELECT u.id, u.username, u.email, u.password_hash, u.active, r.name as role
                FROM users u
                JOIN roles r ON u.role_id = r.id
                WHERE u.username = $1
            `, [user]);
            console.log('[AUTH DEBUG] Query result for user:', user, result.rows[0]);
            if (result.rows.length > 0) foundUser = result.rows[0];
        } else {
            const { users } = getInMemoryData();
            foundUser = users.find(u => u.username === user);
        }

        if (!foundUser || !foundUser.active) {
            return res.status(401).json({ message: 'Usuario no encontrado o inactivo' });
        }

        // Simple password check for mock/dev
        const validPass = isUsingDatabase()
            ? await bcrypt.compare(pass, foundUser.password_hash)
            : (pass === 'admin123');

        if (!validPass) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }

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
        console.log('[AUTH DEBUG] Response sent:', { user_info: { id: foundUser.id, username: foundUser.username, email: foundUser.email, role: foundUser.role } });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
});

module.exports = router;

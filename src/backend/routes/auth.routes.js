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
            const result = await pool.query('SELECT * FROM users WHERE username = $1', [user]);
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
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
});

module.exports = router;

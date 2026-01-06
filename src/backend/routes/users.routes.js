const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { authenticateToken, isAdmin, isAdminOrManager } = require('../middleware/auth');
const { validateBody, createUserSchema, updateUserSchema, updateUserStatusSchema } = require('../middleware/validation');
const { getPool, isUsingDatabase, getInMemoryData } = require('../config/database');

/**
 * GET /api/users
 * Get all users (Admin or Manager)
 * Managers can only see users with role='user'
 */
router.get('/', authenticateToken, isAdminOrManager, async (req, res) => {
    try {
        let query = 'SELECT id, username, email, role, active FROM users ORDER BY created_at DESC';
        let queryParams = [];

        if (isUsingDatabase()) {
            const pool = getPool();

            // Filter: Managers can only see role='user'
            if (req.user.role === 'manager') {
                query = 'SELECT id, username, email, role, active FROM users WHERE role = $1 ORDER BY created_at DESC';
                queryParams = ['user'];
            }

            const result = await pool.query(query, queryParams);
            res.json(result.rows);
        } else {
            const { users } = getInMemoryData();

            if (req.user.role === 'manager') {
                return res.json(users.filter(u => u.role === 'user'));
            }

            res.json(users);
        }
    } catch (err) {
        console.error('Error fetching users:', err);
        res.status(500).json({ message: 'Error al obtener usuarios' });
    }
});

/**
 * POST /api/users
 * Create new user (Admin only)
 */
router.post('/', authenticateToken, isAdmin, validateBody(createUserSchema), async (req, res) => {
    const { username, email, password, role } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        if (isUsingDatabase()) {
            const pool = getPool();
            const result = await pool.query(
                'INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id',
                [username, email, hashedPassword, role]
            );
            res.status(201).json({ message: 'Usuario creado exitosamente', id: result.rows[0].id });
        } else {
            const inMemory = getInMemoryData();
            const newUser = {
                id: String(inMemory.nextUserId++),
                username,
                email,
                password_hash: hashedPassword,
                role,
                active: true
            };
            inMemory.users.push(newUser);
            res.status(201).json({ message: 'Usuario creado exitosamente (In-Memory)', id: newUser.id });
        }
    } catch (err) {
        console.error('Error creating user:', err);

        // Handle duplicate username/email
        if (err.code === '23505') {
            return res.status(400).json({ message: 'El nombre de usuario o email ya existe' });
        }

        res.status(500).json({ message: 'Error al crear usuario' });
    }
});

/**
 * PUT /api/users/:id
 * Update user (Admin only)
 */
router.put('/:id', authenticateToken, isAdmin, validateBody(updateUserSchema), async (req, res) => {
    const { id } = req.params;
    const { username, email, password, role, active } = req.body;

    try {
        if (isUsingDatabase()) {
            const pool = getPool();
            
            // Build dynamic query for fields that are provided
            const updates = [];
            const values = [];
            let paramIndex = 1;

            if (username !== undefined) {
                updates.push(`username = $${paramIndex++}`);
                values.push(username);
            }
            if (email !== undefined) {
                updates.push(`email = $${paramIndex++}`);
                values.push(email);
            }
            if (password !== undefined && password !== '') {
                const hashedPassword = await bcrypt.hash(password, 10);
                updates.push(`password_hash = $${paramIndex++}`);
                values.push(hashedPassword);
            }
            if (role !== undefined) {
                updates.push(`role = $${paramIndex++}`);
                values.push(role);
            }
            if (active !== undefined) {
                updates.push(`active = $${paramIndex++}`);
                values.push(active);
            }

            if (updates.length === 0) {
                return res.status(400).json({ message: 'No hay campos para actualizar' });
            }

            values.push(id);
            const query = `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex}`;
            await pool.query(query, values);
            
            res.json({ message: 'Usuario actualizado exitosamente' });
        } else {
            const { users } = getInMemoryData();
            const idx = users.findIndex(u => u.id === id);
            
            if (idx === -1) {
                return res.status(404).json({ message: 'Usuario no encontrado' });
            }

            if (username !== undefined) users[idx].username = username;
            if (email !== undefined) users[idx].email = email;
            if (role !== undefined) users[idx].role = role;
            if (active !== undefined) users[idx].active = active;
            
            res.json({ message: 'Usuario actualizado exitosamente (In-Memory)' });
        }
    } catch (err) {
        console.error('Error updating user:', err);
        
        // Handle duplicate username/email
        if (err.code === '23505') {
            return res.status(400).json({ message: 'El nombre de usuario o email ya existe' });
        }

        res.status(500).json({ message: 'Error al actualizar usuario' });
    }
});

/**
 * PATCH /api/users/:id/status
 * Update user active status (Admin only)
 */
router.patch('/:id/status', authenticateToken, isAdmin, validateBody(updateUserStatusSchema), async (req, res) => {
    const { id } = req.params;
    const { active } = req.body;

    try {
        if (isUsingDatabase()) {
            const pool = getPool();
            await pool.query('UPDATE users SET active = $1 WHERE id = $2', [active, id]);
        } else {
            const { users } = getInMemoryData();
            const user = users.find(u => u.id === id);
            if (user) {
                user.active = active;
            } else {
                return res.status(404).json({ message: 'Usuario no encontrado' });
            }
        }

        res.json({ message: 'Estado de usuario actualizado exitosamente' });
    } catch (err) {
        console.error('Error updating user status:', err);
        res.status(500).json({ message: 'Error al actualizar estado de usuario' });
    }
});

module.exports = router;

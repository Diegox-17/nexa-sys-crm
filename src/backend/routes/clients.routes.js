const express = require('express');
const router = express.Router();
const { authenticateToken, isAdmin, isAdminOrManager } = require('../middleware/auth');
const { validateBody, createClientSchema, updateClientSchema, createCustomFieldSchema, updateCustomFieldSchema } = require('../middleware/validation');
const { getPool, isUsingDatabase, getInMemoryData } = require('../config/database');

/**
 * GET /api/clients
 * Get all clients (all authenticated users)
 * Regular users only see active clients
 */
router.get('/', authenticateToken, async (req, res) => {
    try {
        let clientsResponse = [];

        if (isUsingDatabase()) {
            const pool = getPool();
            const result = await pool.query('SELECT * FROM clients ORDER BY created_at DESC');
            clientsResponse = result.rows;
        } else {
            const { clients } = getInMemoryData();
            clientsResponse = [...clients];
        }

        // Filter for regular users
        if (req.user.role === 'user') {
            clientsResponse = clientsResponse.filter(c => c.active);
        }

        res.json(clientsResponse);
    } catch (err) {
        console.error('Error fetching clients:', err);
        res.status(500).json({ message: 'Error al obtener clientes' });
    }
});

/**
 * POST /api/clients
 * Create new client (all authenticated users)
 */
router.post('/', authenticateToken, validateBody(createClientSchema), async (req, res) => {
    const { name, contact_name, industry, email, phone, notes, projects, custom_data } = req.body;

    try {
        if (isUsingDatabase()) {
            const pool = getPool();
            const query = `
                INSERT INTO clients (name, contact_name, industry, email, phone, notes, projects, custom_data)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING id
            `;
            const values = [name, contact_name, industry, email, phone, notes, projects || [], custom_data || {}];
            const result = await pool.query(query, values);
            res.status(201).json({ id: result.rows[0].id, message: 'Cliente creado exitosamente' });
        } else {
            const inMemory = getInMemoryData();
            const newClient = {
                id: String(inMemory.nextClientId++),
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
            inMemory.clients.push(newClient);
            res.status(201).json({ id: newClient.id, message: 'Cliente creado exitosamente (In-Memory)' });
        }
    } catch (err) {
        console.error('Error creating client:', err);
        res.status(500).json({ message: 'Error al crear cliente' });
    }
});

/**
 * PUT /api/clients/:id
 * Update client (Admin/Manager only)
 */
router.put('/:id', authenticateToken, isAdminOrManager, validateBody(updateClientSchema), async (req, res) => {
    const { id } = req.params;
    const { name, contact_name, industry, email, phone, notes, projects, custom_data, active } = req.body;

    try {
        if (isUsingDatabase()) {
            const pool = getPool();
            await pool.query(
                `UPDATE clients SET
                    name=$1, contact_name=$2, industry=$3, email=$4, phone=$5,
                    notes=$6, projects=$7, custom_data=$8, active=$9, updated_at=CURRENT_TIMESTAMP
                 WHERE id=$10`,
                [name, contact_name, industry, email, phone, notes, projects, custom_data, active, id]
            );
            res.json({ message: 'Cliente actualizado exitosamente' });
        } else {
            const { clients } = getInMemoryData();
            const idx = clients.findIndex(c => c.id === id);

            if (idx === -1) {
                return res.status(404).json({ message: 'Cliente no encontrado' });
            }

            clients[idx] = { ...clients[idx], name, contact_name, industry, email, phone, notes, projects, custom_data, active };
            res.json({ message: 'Cliente actualizado exitosamente (In-Memory)' });
        }
    } catch (err) {
        console.error('Error updating client:', err);
        res.status(500).json({ message: 'Error al actualizar cliente' });
    }
});

/**
 * GET /api/clients/fields
 * Get custom field definitions for clients
 */
router.get('/fields', authenticateToken, async (req, res) => {
    try {
        if (isUsingDatabase()) {
            const pool = getPool();
            const result = await pool.query('SELECT * FROM client_field_definitions ORDER BY category, label');
            res.json(result.rows);
        } else {
            const { customFields } = getInMemoryData();
            res.json(customFields);
        }
    } catch (err) {
        console.error('Error fetching custom fields:', err);
        res.status(500).json({ message: 'Error al obtener campos personalizados' });
    }
});

/**
 * POST /api/clients/fields
 * Create new custom field (Admin only)
 */
router.post('/fields', authenticateToken, isAdmin, validateBody(createCustomFieldSchema), async (req, res) => {
    const { name, label, type, category, options } = req.body;

    try {
        const internalName = name.toLowerCase().replace(/\s+/g, '_');
        const fieldCategory = category || 'General';

        if (isUsingDatabase()) {
            const pool = getPool();
            await pool.query(
                'INSERT INTO client_field_definitions (name, label, type, category, options) VALUES ($1, $2, $3, $4, $5)',
                [internalName, label, type, fieldCategory, options || null]
            );
        } else {
            const { customFields } = getInMemoryData();

            if (customFields.some(f => f.name === internalName)) {
                return res.status(400).json({ message: 'El campo ya existe' });
            }

            const inMemory = getInMemoryData();
            customFields.push({
                id: String(inMemory.nextFieldId++),
                name: internalName,
                label,
                type,
                category: fieldCategory,
                options: options || null,
                active: true
            });
        }

        res.status(201).json({ message: 'Campo agregado exitosamente' });
    } catch (err) {
        console.error('Error creating custom field:', err);

        // Handle duplicate field name
        if (err.code === '23505') {
            return res.status(400).json({ message: 'El campo ya existe' });
        }

        res.status(500).json({ message: 'Error al crear campo personalizado' });
    }
});

/**
 * PUT /api/clients/fields/:id
 * Update custom field (Admin only - soft delete supported)
 */
router.put('/fields/:id', authenticateToken, isAdmin, validateBody(updateCustomFieldSchema), async (req, res) => {
    const { id } = req.params;
    const { label, category, active } = req.body;

    try {
        if (isUsingDatabase()) {
            const pool = getPool();
            await pool.query(
                'UPDATE client_field_definitions SET label=$1, category=$2, active=$3 WHERE id=$4',
                [label, category, active, id]
            );
        } else {
            const { customFields } = getInMemoryData();
            const idx = customFields.findIndex(f => f.id === id);

            if (idx === -1) {
                return res.status(404).json({ message: 'Campo no encontrado' });
            }

            customFields[idx] = { ...customFields[idx], label, category, active };
        }

        res.json({ message: 'Campo actualizado exitosamente' });
    } catch (err) {
        console.error('Error updating custom field:', err);
        res.status(500).json({ message: 'Error al actualizar campo' });
    }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { getPool, isUsingDatabase, getInMemoryData } = require('../config/database');

/**
 * GET /api/dashboard/stats
 * Get dashboard statistics
 */
router.get('/stats', authenticateToken, async (req, res) => {
    try {
        let clientCount = 0;

        if (isUsingDatabase()) {
            const pool = getPool();
            const result = await pool.query('SELECT COUNT(*) FROM clients WHERE active = true');
            clientCount = parseInt(result.rows[0].count);
        } else {
            const { clients } = getInMemoryData();
            clientCount = clients.filter(c => c.active).length;
        }

        res.json({
            total_cl: clientCount,
            total_tasks: 18, // TODO: Calculate from actual tasks
            active_sessions: 1, // TODO: Implement session tracking
            security_level: 'NIVEL 1'
        });
    } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        res.status(500).json({ message: 'Error al obtener estadísticas del dashboard' });
    }
});

module.exports = router;

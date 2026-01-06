const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

// Import database configuration
const { initializeDatabase, isUsingDatabase } = require('./config/database');

// Import middleware
const { generalLimiter, authLimiter, apiLimiter } = require('./middleware/security');

// Import routes
const authRoutes = require('./routes/auth.routes');
const usersRoutes = require('./routes/users.routes');
const clientsRoutes = require('./routes/clients.routes');
const projectsRoutes = require('./routes/projects.routes');
const dashboardRoutes = require('./routes/dashboard.routes');

const app = express();
const PORT = process.env.PORT || 5000;

// ============================================
// SECURITY MIDDLEWARE
// ============================================
// Helmet helps secure Express apps by setting various HTTP headers
app.use(helmet({
    contentSecurityPolicy: false, // Disable for development, enable in production with proper config
    crossOriginEmbedderPolicy: false
}));

// CORS configuration
app.use(cors());

// Rate limiting
app.use(generalLimiter);

// Body parser
app.use(express.json());

// Request logging middleware (development only)
if (process.env.NODE_ENV !== 'production') {
    app.use((req, res, next) => {
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
        next();
    });
}

// ============================================
// ROUTES
// ============================================

// Health check (no auth required)
app.get('/health', (req, res) => res.send('OK'));

// Authentication routes (with stricter rate limiting)
app.use('/api/auth', authLimiter, authRoutes);

// API routes (with standard API rate limiting)
app.use('/api/users', apiLimiter, usersRoutes);
app.use('/api/clients', apiLimiter, clientsRoutes);
app.use('/api/projects', apiLimiter, projectsRoutes);
app.use('/api/dashboard', apiLimiter, dashboardRoutes);

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler
app.use((req, res) => {
    res.status(404).json({ message: 'Ruta no encontrada' });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        message: err.message || 'Error interno del servidor',
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    });
});

// ============================================
// SERVER INITIALIZATION
// ============================================

const startServer = async () => {
    try {
        // Initialize database connection
        await initializeDatabase();

        // Start server
        app.listen(PORT, () => {
            console.log(`========================================`);
            console.log(`✅ NEXA-Sys Backend Server RUNNING`);
            console.log(`📡 Port: ${PORT}`);
            console.log(`🗃️  Database Mode: ${isUsingDatabase() ? 'PostgreSQL (Production)' : 'IN-MEMORY (Development)'}`);
            console.log(`🔒 Security: Helmet + Rate Limiting enabled`);
            console.log(`✅ Validation: Joi schemas active`);
            console.log(`👤 Default Admin: admin / admin123`);
            console.log(`========================================`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

// Handle graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT signal received: closing HTTP server');
    process.exit(0);
});

// Only start the server if this file is run directly (not required by tests)
if (require.main === module) {
    startServer();
} else {
    // Initialize database for tests (wait for it to complete)
    initializeDatabase().catch(err => {
        console.warn('⚠️  Database initialization warning in tests:', err.message);
    });
}

module.exports = app;

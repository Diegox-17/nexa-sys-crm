const { Pool } = require('pg');

// ============================================
// HYBRID DATABASE MODE
// ============================================
let useDatabase = false;
let pool = null;

// In-memory storage (fallback)
const inMemoryData = {
    users: [
        { id: '1', username: 'admin', email: 'admin@nexa-sys.com', password_hash: '$2a$10$mockhashedpassword', role: 'admin', active: true },
        { id: '2', username: 'manager', email: 'manager@nexa-sys.com', password_hash: '$2a$10$mockhashedpassword', role: 'manager', active: true },
        { id: '3', username: 'user', email: 'user@nexa-sys.com', password_hash: '$2a$10$mockhashedpassword', role: 'user', active: true }
    ],
    nextUserId: 4,

    clients: [
        {
            id: '1',
            name: 'Innovatech S.A.',
            contact_name: 'Carlos Mendez',
            industry: 'tech',
            email: 'c.mendez@innovatech.com',
            phone: '+52 55 1234 5678',
            projects: ['Migración Cloud', 'App Móvil'],
            active: true,
            custom_data: { rfc: 'INN123456789' }
        },
        {
            id: '2',
            name: 'Grupo Retail MX',
            contact_name: 'Sofia Ramirez',
            industry: 'retail',
            email: 'sramirez@gruporetail.mx',
            phone: '+52 81 8888 9999',
            projects: ['eCommerce'],
            active: false,
            custom_data: {}
        }
    ],
    nextClientId: 3,

    customFields: [
        { id: '1', name: 'rfc', label: 'RFC', type: 'text', category: 'Datos Fiscales', active: true },
        { id: '2', name: 'anniversary_date', label: 'Fecha Aniversario', type: 'date', category: 'General', active: true }
    ],
    nextFieldId: 3,

    projects: [
        {
            id: '1',
            client_id: '1',
            name: 'Migración Cloud Innovatech',
            description: 'Migración de servidores legacy a Azure',
            status: 'en_progreso',
            start_date: '2023-10-01',
            end_date: '2024-03-31',
            responsible_id: '1',
            // BUG #025: New metadata fields
            budget: 150000.00,
            priority: 'high',
            progress_percentage: 65,
            //
            custom_data: {
                'repo_url': 'https://github.com/innovatech/migration',
                'tech_stack': ['Azure', 'Node.js', 'React']
            },
            created_at: new Date().toISOString(),
            deleted_at: null
        }
    ],
    nextProjectId: 2,

    projectTasks: [
        {
            id: '1',
            project_id: '1',
            description: 'Análisis de arquitectura actual',
            status: 'completada',
            assigned_to: '2',
            created_by: '1',
            created_at: new Date().toISOString()
        },
        {
            id: '2',
            project_id: '1',
            description: 'Configuración de Tenant Azure',
            status: 'en_progreso',
            assigned_to: '1',
            created_by: '1',
            created_at: new Date().toISOString()
        }
    ],
    nextTaskId: 3,

    projectFieldDefinitions: [
        // BUG #026: Enhanced field definitions with all required fields
        { 
            id: '1', 
            name: 'repo_url', 
            label: 'URL del Repositorio', 
            type: 'url', 
            category: 'Técnico', 
            is_required: false, 
            sort_order: 1, 
            options: null, 
            active: true 
        },
        { 
            id: '2', 
            name: 'tech_stack', 
            label: 'Stack Tecnológico', 
            type: 'multiselect', 
            category: 'Técnico', 
            is_required: false, 
            sort_order: 2, 
            options: ['React', 'Vue', 'Angular', 'Node.js'], 
            active: true 
        },
        { 
            id: '3', 
            name: 'sprint_actual', 
            label: 'Sprint Actual', 
            type: 'number', 
            category: 'Agile', 
            is_required: false, 
            sort_order: 3, 
            options: null, 
            active: true 
        },
        { 
            id: '4', 
            name: 'budget_approved', 
            label: 'Presupuesto Aprobado', 
            type: 'checkbox', 
            category: 'Financiero', 
            is_required: true, 
            sort_order: 4, 
            options: null, 
            active: true 
        }
    ],
    nextProjectFieldId: 5
};

/**
 * Initialize database connection
 * Attempts to connect to PostgreSQL, falls back to in-memory if unavailable
 */
const initializeDatabase = async () => {
    if (process.env.DATABASE_URL) {
        pool = new Pool({
            connectionString: process.env.DATABASE_URL,
        });

        try {
            await pool.query('SELECT NOW()');
            useDatabase = true;
            console.log('✅ PostgreSQL connected successfully');
        } catch (err) {
            console.warn('⚠️  PostgreSQL connection failed:', err.message);
            console.warn('🔄 Falling back to IN-MEMORY mode');
            useDatabase = false;
        }
    } else {
        console.log('ℹ️  DATABASE_URL not found - using IN-MEMORY mode');
    }
};

/**
 * Get database connection pool
 * @returns {Pool|null} PostgreSQL pool or null if in memory mode
 */
const getPool = () => pool;

/**
 * Check if using database or in-memory storage
 * @returns {boolean} True if using database, false if in-memory
 */
const isUsingDatabase = () => useDatabase;

/**
 * Get in-memory data store
 * @returns {Object} In-memory data object
 */
const getInMemoryData = () => inMemoryData;

module.exports = {
    initializeDatabase,
    getPool,
    isUsingDatabase,
    getInMemoryData
};

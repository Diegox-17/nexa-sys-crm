-- Migration Phase 3: Client Management
-- 1. Clients Table
CREATE TABLE IF NOT EXISTS clients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255) NOT NULL,
    industry VARCHAR(100), -- tech, retail, finance, etc.
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    active BOOLEAN DEFAULT TRUE,
    projects TEXT[], -- Array of strings for project tags
    notes TEXT,
    custom_data JSONB DEFAULT '{}'::jsonb, -- Stores values for custom fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Client Custom Fields Definitions (for Admin configuration)
CREATE TABLE IF NOT EXISTS client_field_definitions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE, -- Internal key (e.g., 'rfc')
    label VARCHAR(255) NOT NULL, -- Display label (e.g., 'RFC')
    type VARCHAR(50) NOT NULL, -- text, number, date, longtext
    category VARCHAR(100) DEFAULT 'General', -- Categorization
    active BOOLEAN DEFAULT TRUE, -- Soft delete
    options TEXT[], -- For select lists if needed later
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Seed some initial data
INSERT INTO clients (name, contact_name, industry, email, phone, projects, active, custom_data) 
VALUES 
('Innovatech S.A.', 'Carlos Mendez', 'tech', 'c.mendez@innovatech.com', '+52 55 1234 5678', ARRAY['Migración Cloud', 'App Móvil'], true, '{"rfc": "INN123456789"}'),
('Grupo Retail MX', 'Sofia Ramirez', 'retail', 'sramirez@gruporetail.mx', '+52 81 8888 9999', ARRAY['eCommerce'], false, '{}');

-- 4. Seed initial custom fields logic
INSERT INTO client_field_definitions (name, label, type, category)
VALUES 
('rfc', 'RFC', 'text', 'Datos Fiscales'),
('anniversary_date', 'Fecha Aniversario', 'date', 'General');

-- NEXA-Sys V.02 CRM - Database Initialization
-- Database: PostgreSQL
-- Version: 2.1 (BUG #025/026 Fix - Metadatos de Proyecto y Administrador de Campos)

-- Extension for UUIDs if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- Phase 1-2: Core (Users & Auth)
-- ==========================================

-- Table: Roles
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);

-- Initial Roles
INSERT INTO roles (name) VALUES ('admin'), ('manager'), ('user') ON CONFLICT DO NOTHING;

-- Table: Users
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role_id INT REFERENCES roles(id),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: Sessions (Optional for JWT Blacklisting or State)
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    token TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Initial Users with PROPER bcrypt password hashes (BUG-FIX)
-- Generated with bcrypt.hash('password', 10)
INSERT INTO users (username, email, password_hash, role_id)
SELECT 'admin', 'admin@nexa-sys.com', '$2a$10$r01xUlV8f6O4iriJZnnpaOt6XS8UJbcjzh7kHnft5QkPhJQ6hUA1C', id FROM roles WHERE name = 'admin'
UNION ALL
SELECT 'manager', 'manager@nexa-sys.com', '$2a$10$k/wJpHJK79v14zPDCVZCleDziSSHFDGjLk6wR2sjU5v0oxZ5A2i76', id FROM roles WHERE name = 'manager'
UNION ALL
SELECT 'user', 'user@nexa-sys.com', '$2a$10$5ZWsbmUIrcUMDVCsX98q9OpsfgdQ42/jVCIUivdwRKGGWR4qlflXa', id FROM roles WHERE name = 'user'
ON CONFLICT DO NOTHING;

-- ==========================================
-- Phase 3: Client Management
-- ==========================================

-- Table: Clients
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

-- Table: Client Custom Fields Definitions (for Admin configuration)
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

-- Seed Initial Clients
INSERT INTO clients (name, contact_name, industry, email, phone, projects, active, custom_data)
VALUES
('Innovatech S.A.', 'Carlos Mendez', 'tech', 'c.mendez@innovatech.com', '+52 55 1234 5678', ARRAY['Migración Cloud', 'App Móvil'], true, '{"rfc": "INN123456789"}'),
('Grupo Retail MX', 'Sofia Ramirez', 'retail', 'sramirez@gruporetail.mx', '+52 81 8888 9999', ARRAY['eCommerce'], false, '{}');

-- Seed Initial Client Custom Fields
INSERT INTO client_field_definitions (name, label, type, category)
VALUES
('rfc', 'RFC', 'text', 'Datos Fiscales'),
('anniversary_date', 'Fecha Aniversario', 'date', 'General');

-- ==========================================
-- Phase 4: Project Management (BUG #025/026 Fix)
-- ==========================================

-- Table: Projects
-- BUG #025 FIX: Added budget, priority, progress_percentage fields
CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'prospectado', -- 'prospectado', 'cotizado', 'en_progreso', 'pausado', 'finalizado'
    start_date DATE,
    end_date DATE,
    responsible_id UUID REFERENCES users(id),
    -- BUG #025 FIX: Nuevos campos de metadatos de negocio
    budget DECIMAL(12, 2), -- Presupuesto estimado del proyecto
    priority VARCHAR(20) DEFAULT 'medium', -- 'high', 'medium', 'low'
    progress_percentage INTEGER DEFAULT 0, -- Porcentaje de avance (0-100)
    --
    custom_data JSONB DEFAULT '{}'::jsonb, -- Stores values for custom fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL -- Soft Delete
);

-- Table: Project Tasks
CREATE TABLE IF NOT EXISTS project_tasks (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pendiente', -- 'pendiente', 'en_progreso', 'completada', 'aprobada'
    assigned_to UUID REFERENCES users(id),
    created_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: Project Custom Fields Definitions
-- BUG #026 FIX: Enhanced schema with label, category, is_required, sort_order, options
CREATE TABLE IF NOT EXISTS project_field_definitions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE, -- Internal key (e.g., 'repo_url')
    label VARCHAR(255) NOT NULL, -- Display label (e.g., 'URL del Repositorio')
    type VARCHAR(50) NOT NULL, -- text, number, date, url, email, select, multiselect, textarea, checkbox
    category VARCHAR(100) DEFAULT 'General', -- 'General', 'Técnico', 'Gestión', 'Agile', 'Financiero'
    is_required BOOLEAN DEFAULT FALSE, -- Campo obligatorio
    sort_order INTEGER DEFAULT 0, -- Orden de presentación
    options TEXT[], -- For select/multiselect: 'React;Vue;Angular'
    active BOOLEAN DEFAULT TRUE, -- Soft delete
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed Initial Project Fields (BUG #026 FIX - Updated schema)
INSERT INTO project_field_definitions (name, label, type, category, is_required, sort_order, options)
VALUES
('repo_url', 'URL del Repositorio', 'url', 'General', false, 1, null),
('tech_stack', 'Stack Tecnológico', 'multiselect', 'Técnico', false, 2, '{"React","Vue","Angular","Node.js","Python"}'),
('estimated_hours', 'Horas Estimadas', 'number', 'Gestión', false, 3, null),
('current_sprint', 'Sprint Actual', 'number', 'Agile', false, 4, null),
('doc_link', 'Enlace a Documentación', 'url', 'General', false, 5, null)
ON CONFLICT DO NOTHING;

-- Table: Project Custom Field Values (Values for custom fields per project)
CREATE TABLE IF NOT EXISTS project_custom_field_values (
    definition_id INTEGER REFERENCES project_field_definitions(id) ON DELETE CASCADE,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    value TEXT, -- Se castea según field_type en aplicación
    PRIMARY KEY (definition_id, project_id)
);

-- ==========================================
-- Phase 4: Seed Sample Data
-- ==========================================

-- Insert sample project with BUG #025 fields
INSERT INTO projects (client_id, name, description, status, start_date, end_date, responsible_id, budget, priority, progress_percentage, custom_data)
SELECT
    1,
    'Migración Cloud - Corp. Alfa',
    'Migración completa del sistema legacy a infraestructura cloud AWS. Incluye bases de datos, aplicaciones y servicios.',
    'en_progreso',
    '2025-01-15',
    '2025-06-30',
    (SELECT id FROM users WHERE username = 'admin'),
    45000.00,
    'high',
    35,
    '{"repo_url": "https://github.com/corp-alfa/cloud-migration"}'::jsonb
WHERE EXISTS (SELECT 1 FROM clients WHERE id = 1)
AND NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Migración Cloud - Corp. Alfa');

-- ==========================================
-- Indexes for Performance
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_projects_client_id ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_deleted_at ON projects(deleted_at);
CREATE INDEX IF NOT EXISTS idx_project_tasks_project_id ON project_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_project_field_definitions_active ON project_field_definitions(active);
CREATE INDEX IF NOT EXISTS idx_project_field_definitions_category ON project_field_definitions(category);
CREATE INDEX IF NOT EXISTS idx_project_custom_field_values_project ON project_custom_field_values(project_id);

-- NEXA-Sys V.02 CRM - Migration Script
-- Migration: v1.0 -> v2.1 (BUG #025/026 Fix)
-- Fecha: 2026-01-03
-- Este script debe ejecutarse en bases de datos existentes

-- ==========================================
-- BUG #025 FIX: Agregar campos de metadatos a projects
-- ==========================================

-- Agregar columna budget (Presupuesto)
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS budget DECIMAL(12, 2);

-- Agregar columna priority (Prioridad)
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'medium';

-- Agregar columna progress_percentage (Porcentaje de avance)
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS progress_percentage INTEGER DEFAULT 0;

-- Actualizar valores existentes con defaults
UPDATE projects SET priority = 'medium' WHERE priority IS NULL;
UPDATE projects SET progress_percentage = 0 WHERE progress_percentage IS NULL;

-- ==========================================
-- BUG #026 FIX: Mejorar schema de project_field_definitions
-- ==========================================

-- Agregar columna label si no existe
ALTER TABLE project_field_definitions
ADD COLUMN IF NOT EXISTS label VARCHAR(255) NOT NULL DEFAULT 'Untitled';

-- Actualizar label desde name si está vacío
UPDATE project_field_definitions
SET label = INITCAP(REPLACE(name, '_', ' '))
WHERE label = 'Untitled' OR label IS NULL;

-- Agregar columna category
ALTER TABLE project_field_definitions
ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'General';

-- Agregar columna is_required
ALTER TABLE project_field_definitions
ADD COLUMN IF NOT EXISTS is_required BOOLEAN DEFAULT FALSE;

-- Agregar columna sort_order
ALTER TABLE project_field_definitions
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Agregar columna options
ALTER TABLE project_field_definitions
ADD COLUMN IF NOT EXISTS options TEXT[];

-- Actualizar tipos de datos si es necesario
ALTER TABLE project_field_definitions
ALTER COLUMN name TYPE VARCHAR(100),
ALTER COLUMN type TYPE VARCHAR(50);

-- ==========================================
-- Seed: Agregar campos iniciales si no existen
-- ==========================================

INSERT INTO project_field_definitions (name, label, type, category, is_required, sort_order, options)
VALUES
('repo_url', 'URL del Repositorio', 'url', 'General', false, 1, null),
('tech_stack', 'Stack Tecnológico', 'multiselect', 'Técnico', false, 2, '{"React","Vue","Angular","Node.js","Python"}'),
('estimated_hours', 'Horas Estimadas', 'number', 'Gestión', false, 3, null),
('current_sprint', 'Sprint Actual', 'number', 'Agile', false, 4, null),
('doc_link', 'Enlace a Documentación', 'url', 'General', false, 5, null)
ON CONFLICT (name) DO NOTHING;

-- ==========================================
-- Indices para rendimiento
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_deleted_at ON projects(deleted_at);
CREATE INDEX IF NOT EXISTS idx_project_field_definitions_active ON project_field_definitions(active);
CREATE INDEX IF NOT EXISTS idx_project_field_definitions_category ON project_field_definitions(category);

-- ==========================================
-- Verificación
-- ==========================================

SELECT 'projects table columns:' as info;
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'projects'
ORDER BY ordinal_position;

SELECT 'project_field_definitions table columns:' as info;
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'project_field_definitions'
ORDER BY ordinal_position;

SELECT 'Campo definitions activos:' as info, COUNT(*) as count
FROM project_field_definitions
WHERE active = true;

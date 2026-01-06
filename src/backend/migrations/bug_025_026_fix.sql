-- ============================================
-- BUG #025/026 FIX: Migration Script
-- ============================================
-- This script adds the missing metadata fields to projects table
-- and enhances project_field_definitions table

-- Add missing metadata fields to projects table (BUG #025)
DO $$
BEGIN
    -- Check if budget column exists before adding
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'projects' AND column_name = 'budget'
    ) THEN
        ALTER TABLE projects ADD COLUMN budget DECIMAL(12, 2);
        RAISE NOTICE 'Added budget column to projects table';
    END IF;

    -- Check if priority column exists before adding
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'projects' AND column_name = 'priority'
    ) THEN
        ALTER TABLE projects ADD COLUMN priority VARCHAR(20) DEFAULT 'medium';
        RAISE NOTICE 'Added priority column to projects table';
    END IF;

    -- Check if progress_percentage column exists before adding
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'projects' AND column_name = 'progress_percentage'
    ) THEN
        ALTER TABLE projects ADD COLUMN progress_percentage INTEGER DEFAULT 0;
        RAISE NOTICE 'Added progress_percentage column to projects table';
    END IF;
END $$;

-- Enhance project_field_definitions table (BUG #026)
DO $$
BEGIN
    -- Check if label column exists before adding
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'project_field_definitions' AND column_name = 'label'
    ) THEN
        ALTER TABLE project_field_definitions ADD COLUMN label VARCHAR(255) NOT NULL DEFAULT 'Untitled';
        RAISE NOTICE 'Added label column to project_field_definitions table';
    END IF;

    -- Check if category column exists before adding
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'project_field_definitions' AND column_name = 'category'
    ) THEN
        ALTER TABLE project_field_definitions ADD COLUMN category VARCHAR(100) DEFAULT 'General';
        RAISE NOTICE 'Added category column to project_field_definitions table';
    END IF;

    -- Check if is_required column exists before adding
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'project_field_definitions' AND column_name = 'is_required'
    ) THEN
        ALTER TABLE project_field_definitions ADD COLUMN is_required BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added is_required column to project_field_definitions table';
    END IF;

    -- Check if sort_order column exists before adding
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'project_field_definitions' AND column_name = 'sort_order'
    ) THEN
        ALTER TABLE project_field_definitions ADD COLUMN sort_order INTEGER DEFAULT 0;
        RAISE NOTICE 'Added sort_order column to project_field_definitions table';
    END IF;

    -- Check if options column exists before adding
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'project_field_definitions' AND column_name = 'options'
    ) THEN
        ALTER TABLE project_field_definitions ADD COLUMN options TEXT[];
        RAISE NOTICE 'Added options column to project_field_definitions table';
    END IF;

    -- Check if active column exists before adding
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'project_field_definitions' AND column_name = 'active'
    ) THEN
        ALTER TABLE project_field_definitions ADD COLUMN active BOOLEAN DEFAULT TRUE;
        RAISE NOTICE 'Added active column to project_field_definitions table';
    END IF;
END $$;

-- Update column types if they exist but have wrong types
DO $$
BEGIN
    -- Update name column type if needed
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'project_field_definitions' AND column_name = 'name'
    ) THEN
        -- Only alter if type is not VARCHAR(100)
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'project_field_definitions' AND column_name = 'name' 
            AND data_type = 'character varying' AND character_maximum_length = 100
        ) THEN
            ALTER TABLE project_field_definitions ALTER COLUMN name TYPE VARCHAR(100);
            RAISE NOTICE 'Updated name column type to VARCHAR(100)';
        END IF;
    END IF;

    -- Update type column type if needed
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'project_field_definitions' AND column_name = 'type'
    ) THEN
        -- Only alter if type is not VARCHAR(50)
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'project_field_definitions' AND column_name = 'type' 
            AND data_type = 'character varying' AND character_maximum_length = 50
        ) THEN
            ALTER TABLE project_field_definitions ALTER COLUMN type TYPE VARCHAR(50);
            RAISE NOTICE 'Updated type column type to VARCHAR(50)';
        END IF;
    END IF;
END $$;

-- Add constraints for priority field
DO $$
BEGIN
    -- Add check constraint for priority if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'projects_priority_check'
    ) THEN
        ALTER TABLE projects ADD CONSTRAINT projects_priority_check 
        CHECK (priority IN ('high', 'medium', 'low'));
        RAISE NOTICE 'Added priority check constraint to projects table';
    END IF;
END $$;

-- Add constraints for progress_percentage field
DO $$
BEGIN
    -- Add check constraint for progress_percentage if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'projects_progress_check'
    ) THEN
        ALTER TABLE projects ADD CONSTRAINT projects_progress_check 
        CHECK (progress_percentage >= 0 AND progress_percentage <= 100);
        RAISE NOTICE 'Added progress_percentage check constraint to projects table';
    END IF;
END $$;

-- Insert sample custom field definitions for testing (BUG #026)
INSERT INTO project_field_definitions (name, label, type, category, is_required, sort_order, options, active)
VALUES 
    ('repo_url', 'URL del Repositorio', 'url', 'Técnico', false, 1, NULL, true),
    ('tech_stack', 'Stack Tecnológico', 'multiselect', 'Técnico', false, 2, ARRAY['React', 'Vue', 'Angular', 'Node.js'], true),
    ('sprint_actual', 'Sprint Actual', 'number', 'Agile', false, 3, NULL, true),
    ('budget_approved', 'Presupuesto Aprobado', 'checkbox', 'Financiero', true, 4, NULL, true)
ON CONFLICT (name) DO NOTHING;

RAISE NOTICE 'Migration completed successfully for BUG #025/026';
-- Migración para Fase 2: Gestión de Usuarios
-- Ejecutar este script en tu base de datos PostgreSQL local

-- 1. Agregar el rol 'manager' si no existe
INSERT INTO roles (name) 
VALUES ('manager') 
ON CONFLICT (name) DO NOTHING;

-- 2. Agregar la columna 'active' a la tabla users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT TRUE;

-- 3. Actualizar todos los usuarios existentes como activos
UPDATE users 
SET active = TRUE 
WHERE active IS NULL;

-- Verificar que los cambios se aplicaron correctamente
SELECT 'Roles disponibles:' as verificacion;
SELECT * FROM roles;

SELECT 'Columnas de la tabla users:' as verificacion;
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'users';

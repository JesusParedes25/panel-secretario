-- Script para resetear la base de datos
-- Panel Secretario - Gobierno de Hidalgo
-- ¡ADVERTENCIA! Este script elimina TODOS los datos

-- Eliminar vistas
DROP VIEW IF EXISTS v_tramites_geo CASCADE;
DROP VIEW IF EXISTS v_top_tramites CASCADE;
DROP VIEW IF EXISTS v_resumen_global CASCADE;
DROP VIEW IF EXISTS v_resumen_dependencia CASCADE;

-- Eliminar tablas
DROP TABLE IF EXISTS carga_logs CASCADE;
DROP TABLE IF EXISTS tramites CASCADE;
DROP TABLE IF EXISTS dependencias CASCADE;

-- Eliminar funciones
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Recrear esquema completo
\i /docker-entrypoint-initdb.d/01-schema.sql
\i /docker-entrypoint-initdb.d/02-views.sql
\i /docker-entrypoint-initdb.d/03-seed.sql

-- Confirmar reset
SELECT 'Base de datos reseteada correctamente' AS status;

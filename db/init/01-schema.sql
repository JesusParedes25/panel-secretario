-- Panel Secretario - Esquema de Base de Datos
-- PostgreSQL 15 + PostGIS 3.3

-- Habilitar extensión PostGIS para soporte geográfico
CREATE EXTENSION IF NOT EXISTS postgis;

-- Tabla de Dependencias
CREATE TABLE IF NOT EXISTS dependencias (
  id SERIAL PRIMARY KEY,
  nombre TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índice para búsquedas por nombre
CREATE INDEX idx_dependencias_nombre ON dependencias(nombre);

-- Tabla de Trámites
CREATE TABLE IF NOT EXISTS tramites (
  id SERIAL PRIMARY KEY,
  dependencia_id INT NOT NULL REFERENCES dependencias(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  anio INT NOT NULL DEFAULT 2025,
  nivel_digitalizacion NUMERIC(4,1) NOT NULL DEFAULT 0.0 CHECK (nivel_digitalizacion >= 0 AND nivel_digitalizacion <= 6),
  fase1_tramites_intervenidos BOOLEAN NOT NULL DEFAULT FALSE,
  fase2_modelado BOOLEAN NOT NULL DEFAULT FALSE,
  fase3_reingenieria BOOLEAN NOT NULL DEFAULT FALSE,
  fase4_digitalizacion BOOLEAN NOT NULL DEFAULT FALSE,
  fase5_implementacion BOOLEAN NOT NULL DEFAULT FALSE,
  fase6_liberacion BOOLEAN NOT NULL DEFAULT FALSE,
  s INT NOT NULL DEFAULT 0,
  r INT NOT NULL DEFAULT 0,
  geolocation GEOMETRY(Point, 4326),
  -- Para coordenadas geográficas (lat, lng)
  metadata JSONB,
  -- Campo flexible para datos adicionales
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para optimizar consultas
CREATE INDEX idx_tramites_dependencia ON tramites(dependencia_id);
CREATE INDEX idx_tramites_anio ON tramites(anio);
CREATE INDEX idx_tramites_nombre ON tramites USING gin(to_tsvector('spanish', nombre));
CREATE INDEX idx_tramites_nivel ON tramites(nivel_digitalizacion);
CREATE INDEX idx_tramites_geolocation ON tramites USING gist(geolocation);

-- Función para actualizar timestamp automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar updated_at
CREATE TRIGGER update_dependencias_updated_at BEFORE UPDATE ON dependencias
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tramites_updated_at BEFORE UPDATE ON tramites
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Tabla de Logs de Carga (para auditoría)
CREATE TABLE IF NOT EXISTS carga_logs (
  id SERIAL PRIMARY KEY,
  filename TEXT NOT NULL,
  rows_read INT NOT NULL DEFAULT 0,
  rows_inserted INT NOT NULL DEFAULT 0,
  rows_invalid INT NOT NULL DEFAULT 0,
  errors JSONB,
  uploaded_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_carga_logs_created ON carga_logs(created_at DESC);

-- Tabla de Usuarios
CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  nombre TEXT NOT NULL,
  rol TEXT NOT NULL DEFAULT 'viewer' CHECK (rol IN ('admin', 'capturista', 'viewer')),
  dependencia_id INT REFERENCES dependencias(id) ON DELETE SET NULL,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  ultimo_acceso TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_usuarios_username ON usuarios(username);
CREATE INDEX idx_usuarios_rol ON usuarios(rol);

CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON usuarios
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Tabla de Configuración (metas globales)
CREATE TABLE IF NOT EXISTS configuracion (
  id SERIAL PRIMARY KEY,
  clave TEXT UNIQUE NOT NULL,
  valor JSONB NOT NULL,
  descripcion TEXT,
  updated_by INT REFERENCES usuarios(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_configuracion_updated_at BEFORE UPDATE ON configuracion
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insertar configuración inicial de metas (estructura multi-año)
INSERT INTO configuracion (clave, valor, descripcion) VALUES
  ('metas_por_anio', '{"2025": {"total": 300, "e1": 300, "e2": 250, "e3": 200, "e4": 150, "e5": 100, "e6": 50}}', 'Metas por año'),
  ('semaforo_config', '{"verde": 50, "ambar": 25}', 'Umbrales para el semáforo de dependencias')
ON CONFLICT (clave) DO NOTHING;

-- Nota: El usuario admin se crea automáticamente al iniciar la API
-- con contraseña por defecto: admin123

-- Comentarios para documentación
COMMENT ON TABLE dependencias IS 'Catálogo de dependencias gubernamentales';
COMMENT ON TABLE tramites IS 'Trámites y su nivel de digitalización por dependencia';
COMMENT ON TABLE carga_logs IS 'Registro de cargas de archivos CSV';
COMMENT ON TABLE usuarios IS 'Usuarios del sistema con roles';
COMMENT ON TABLE configuracion IS 'Configuración global del sistema (metas, umbrales, etc)';

COMMENT ON COLUMN tramites.nivel_digitalizacion IS 'Nivel de digitalización del trámite (0.0 a 6.0)';
COMMENT ON COLUMN tramites.fase1_tramites_intervenidos IS 'Fase 1: Trámites Intervenidos';
COMMENT ON COLUMN tramites.fase2_modelado IS 'Fase 2: Modelado';
COMMENT ON COLUMN tramites.fase3_reingenieria IS 'Fase 3: Reingeniería';
COMMENT ON COLUMN tramites.fase4_digitalizacion IS 'Fase 4: Digitalización';
COMMENT ON COLUMN tramites.fase5_implementacion IS 'Fase 5: Implementación';
COMMENT ON COLUMN tramites.fase6_liberacion IS 'Fase 6: Liberación';
COMMENT ON COLUMN tramites.s IS 'Acciones de Simplificación (Etapa 3)';
COMMENT ON COLUMN tramites.r IS 'Acciones de Regulación (Etapa 3)';
COMMENT ON COLUMN tramites.geolocation IS 'Coordenadas geográficas (PostGIS Point)';

-- Vistas Ejecutivas para Análisis
-- Panel Secretario - Gobierno de Hidalgo

-- Vista: Resumen por Dependencia
-- Usa CTE para calcular el máximo promedio de acciones para normalización dinámica
CREATE OR REPLACE VIEW v_resumen_dependencia AS
WITH stats AS (
  SELECT 
    dependencia_id,
    COALESCE((SUM(s) + SUM(r))::NUMERIC / NULLIF(COUNT(*), 0), 0) AS promedio_acciones
  FROM tramites
  GROUP BY dependencia_id
),
max_stats AS (
  SELECT GREATEST(MAX(promedio_acciones), 1) AS max_promedio_acciones FROM stats
)
SELECT
  d.id AS dependencia_id,
  d.nombre AS dependencia,
  COUNT(t.id) AS total_tramites,
  ROUND(AVG(t.nivel_digitalizacion), 2) AS promedio_nivel,
  SUM(CASE WHEN t.fase1_tramites_intervenidos THEN 1 ELSE 0 END) AS f1,
  SUM(CASE WHEN t.fase2_modelado THEN 1 ELSE 0 END) AS f2,
  SUM(CASE WHEN t.fase3_reingenieria THEN 1 ELSE 0 END) AS f3,
  SUM(CASE WHEN t.fase4_digitalizacion THEN 1 ELSE 0 END) AS f4,
  SUM(CASE WHEN t.fase5_implementacion THEN 1 ELSE 0 END) AS f5,
  SUM(CASE WHEN t.fase6_liberacion THEN 1 ELSE 0 END) AS f6,
  -- Total de acciones (s + r)
  COALESCE(SUM(t.s), 0) + COALESCE(SUM(t.r), 0) AS total_acciones,
  -- Porcentajes por fase
  ROUND(100.0 * SUM(CASE WHEN t.fase1_tramites_intervenidos THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(t.id), 0), 2) AS porcentaje_f1,
  ROUND(100.0 * SUM(CASE WHEN t.fase2_modelado THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(t.id), 0), 2) AS porcentaje_f2,
  ROUND(100.0 * SUM(CASE WHEN t.fase3_reingenieria THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(t.id), 0), 2) AS porcentaje_f3,
  ROUND(100.0 * SUM(CASE WHEN t.fase4_digitalizacion THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(t.id), 0), 2) AS porcentaje_f4,
  ROUND(100.0 * SUM(CASE WHEN t.fase5_implementacion THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(t.id), 0), 2) AS porcentaje_f5,
  ROUND(100.0 * SUM(CASE WHEN t.fase6_liberacion THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(t.id), 0), 2) AS porcentaje_f6,
  -- Porcentaje de trámites que llegaron a E3 O E4 (misma jerarquía)
  ROUND(100.0 * SUM(CASE WHEN t.fase3_reingenieria OR t.fase4_digitalizacion THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(t.id), 0), 2) AS porcentaje_e3_o_e4,
  -- Porcentaje de trámites que llegaron a E5 O E6
  ROUND(100.0 * SUM(CASE WHEN t.fase5_implementacion OR t.fase6_liberacion THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(t.id), 0), 2) AS porcentaje_e5_o_e6,
  -- Semáforo ponderado con normalización dinámica
  -- Fórmula: score = (% E3 o E4) * 0.50 + (acciones normalizadas) * 0.35 + (% E5 o E6) * 0.15
  -- Acciones normalizadas = (promedio_acciones / max_promedio_acciones) * 100
  -- Verde: score >= 50 | Ámbar: score >= 25 | Rojo: score < 25
  CASE
    WHEN (
      COALESCE(ROUND(100.0 * SUM(CASE WHEN t.fase3_reingenieria OR t.fase4_digitalizacion THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(t.id), 0), 2), 0) * 0.50 +
      COALESCE(100.0 * (COALESCE(SUM(t.s), 0) + COALESCE(SUM(t.r), 0))::NUMERIC / NULLIF(COUNT(t.id), 0) / ms.max_promedio_acciones, 0) * 0.35 +
      COALESCE(ROUND(100.0 * SUM(CASE WHEN t.fase5_implementacion OR t.fase6_liberacion THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(t.id), 0), 2), 0) * 0.15
    ) >= 50 THEN 'verde'
    WHEN (
      COALESCE(ROUND(100.0 * SUM(CASE WHEN t.fase3_reingenieria OR t.fase4_digitalizacion THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(t.id), 0), 2), 0) * 0.50 +
      COALESCE(100.0 * (COALESCE(SUM(t.s), 0) + COALESCE(SUM(t.r), 0))::NUMERIC / NULLIF(COUNT(t.id), 0) / ms.max_promedio_acciones, 0) * 0.35 +
      COALESCE(ROUND(100.0 * SUM(CASE WHEN t.fase5_implementacion OR t.fase6_liberacion THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(t.id), 0), 2), 0) * 0.15
    ) >= 25 THEN 'ambar'
    ELSE 'rojo'
  END AS semaforo
FROM dependencias d
LEFT JOIN tramites t ON t.dependencia_id = d.id
CROSS JOIN max_stats ms
GROUP BY d.id, d.nombre, ms.max_promedio_acciones
ORDER BY total_tramites DESC;

-- Vista: Resumen Global
CREATE OR REPLACE VIEW v_resumen_global AS
SELECT
  COUNT(*) AS total_tramites,
  COUNT(DISTINCT dependencia_id) AS total_dependencias,
  ROUND(AVG(nivel_digitalizacion), 2) AS promedio_nivel_global,
  -- Total objetivo (meta 2025)
  300 AS total_objetivo,
  -- Total de acciones implementadas (s + r)
  COALESCE(SUM(s), 0) + COALESCE(SUM(r), 0) AS total_acciones,
  -- Totales acumulativos (trámites que han alcanzado AL MENOS esta etapa)
  SUM(CASE WHEN fase1_tramites_intervenidos THEN 1 ELSE 0 END) AS total_f1,
  SUM(CASE WHEN fase2_modelado THEN 1 ELSE 0 END) AS total_f2,
  SUM(CASE WHEN fase3_reingenieria THEN 1 ELSE 0 END) AS total_f3,
  SUM(CASE WHEN fase4_digitalizacion THEN 1 ELSE 0 END) AS total_f4,
  SUM(CASE WHEN fase5_implementacion THEN 1 ELSE 0 END) AS total_f5,
  SUM(CASE WHEN fase6_liberacion THEN 1 ELSE 0 END) AS total_f6,
  -- Porcentajes globales basados en el objetivo de 300 trámites
  ROUND(100.0 * SUM(CASE WHEN fase1_tramites_intervenidos THEN 1 ELSE 0 END)::NUMERIC / 300, 2) AS porcentaje_f1,
  ROUND(100.0 * SUM(CASE WHEN fase2_modelado THEN 1 ELSE 0 END)::NUMERIC / 300, 2) AS porcentaje_f2,
  ROUND(100.0 * SUM(CASE WHEN fase3_reingenieria THEN 1 ELSE 0 END)::NUMERIC / 300, 2) AS porcentaje_f3,
  ROUND(100.0 * SUM(CASE WHEN fase4_digitalizacion THEN 1 ELSE 0 END)::NUMERIC / 300, 2) AS porcentaje_f4,
  ROUND(100.0 * SUM(CASE WHEN fase5_implementacion THEN 1 ELSE 0 END)::NUMERIC / 300, 2) AS porcentaje_f5,
  ROUND(100.0 * SUM(CASE WHEN fase6_liberacion THEN 1 ELSE 0 END)::NUMERIC / 300, 2) AS porcentaje_f6
FROM tramites;

-- Vista: Top 10 Trámites Más Digitalizados
CREATE OR REPLACE VIEW v_top_tramites AS
SELECT
  t.id,
  d.nombre AS dependencia,
  t.nombre AS tramite,
  t.nivel_digitalizacion,
  t.fase1_tramites_intervenidos,
  t.fase2_modelado,
  t.fase3_reingenieria,
  t.fase4_digitalizacion,
  t.fase5_implementacion,
  t.fase6_liberacion
FROM tramites t
INNER JOIN dependencias d ON t.dependencia_id = d.id
ORDER BY t.nivel_digitalizacion DESC, t.nombre
LIMIT 10;

-- Comentarios
COMMENT ON VIEW v_resumen_dependencia IS 'Resumen ejecutivo por dependencia con KPIs y semáforo';
COMMENT ON VIEW v_resumen_global IS 'KPIs globales del proceso de simplificación';
COMMENT ON VIEW v_top_tramites IS 'Top 10 trámites con mayor nivel de digitalización';

-- Actualizar vista v_resumen_global para calcular porcentajes sobre 300 trámites objetivo
-- Meta 2025: Simplificar 300 trámites

DROP VIEW IF EXISTS v_resumen_global CASCADE;

CREATE OR REPLACE VIEW v_resumen_global AS
SELECT
  COUNT(*) AS total_tramites,
  COUNT(DISTINCT dependencia_id) AS total_dependencias,
  ROUND(AVG(nivel_digitalizacion), 2) AS promedio_nivel_global,
  -- Total objetivo (meta 2025)
  300 AS total_objetivo,
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

COMMENT ON VIEW v_resumen_global IS 'KPIs globales del proceso de simplificación con meta de 300 trámites';

SELECT 'Vista actualizada correctamente - Porcentajes basados en 300 trámites objetivo' AS status;

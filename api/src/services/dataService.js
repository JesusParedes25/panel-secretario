/**
 * Servicio de Consultas de Datos
 * Panel Secretario - Gobierno de Hidalgo
 */

const db = require('../config/database');
const logger = require('../config/logger');

/**
 * Obtiene el resumen global de KPIs
 */
const getResumenGlobal = async () => {
  try {
    const result = await db.query('SELECT * FROM v_resumen_global');
    
    if (result.rows.length === 0) {
      return {
        total_tramites: 0,
        total_dependencias: 0,
        promedio_nivel_global: 0,
        fases: [],
        porcentajes: [],
      };
    }

    const data = result.rows[0];

    return {
      total_tramites: parseInt(data.total_tramites) || 0,
      total_dependencias: parseInt(data.total_dependencias) || 0,
      promedio_nivel_global: parseFloat(data.promedio_nivel_global) || 0,
      fases: [
        { fase: 'F1', nombre: 'Trámites Intervenidos', total: parseInt(data.total_f1) || 0, porcentaje: parseFloat(data.porcentaje_f1) || 0 },
        { fase: 'F2', nombre: 'Modelado', total: parseInt(data.total_f2) || 0, porcentaje: parseFloat(data.porcentaje_f2) || 0 },
        { fase: 'F3', nombre: 'Reingeniería', total: parseInt(data.total_f3) || 0, porcentaje: parseFloat(data.porcentaje_f3) || 0 },
        { fase: 'F4', nombre: 'Digitalización', total: parseInt(data.total_f4) || 0, porcentaje: parseFloat(data.porcentaje_f4) || 0 },
        { fase: 'F5', nombre: 'Implementación', total: parseInt(data.total_f5) || 0, porcentaje: parseFloat(data.porcentaje_f5) || 0 },
        { fase: 'F6', nombre: 'Liberación', total: parseInt(data.total_f6) || 0, porcentaje: parseFloat(data.porcentaje_f6) || 0 },
      ],
    };
  } catch (error) {
    logger.error('Error obteniendo resumen global', { error: error.message });
    throw error;
  }
};

/**
 * Obtiene el resumen por dependencias
 */
const getResumenDependencias = async () => {
  try {
    const result = await db.query(`
      SELECT * FROM v_resumen_dependencia
      ORDER BY total_tramites DESC
    `);

    return result.rows.map((row) => ({
      dependencia_id: row.dependencia_id,
      dependencia: row.dependencia,
      total_tramites: parseInt(row.total_tramites) || 0,
      promedio_nivel: parseFloat(row.promedio_nivel) || 0,
      fases: {
        f1: parseInt(row.f1) || 0,
        f2: parseInt(row.f2) || 0,
        f3: parseInt(row.f3) || 0,
        f4: parseInt(row.f4) || 0,
        f5: parseInt(row.f5) || 0,
        f6: parseInt(row.f6) || 0,
      },
      porcentajes: {
        f1: parseFloat(row.porcentaje_f1) || 0,
        f2: parseFloat(row.porcentaje_f2) || 0,
        f3: parseFloat(row.porcentaje_f3) || 0,
        f4: parseFloat(row.porcentaje_f4) || 0,
        f5: parseFloat(row.porcentaje_f5) || 0,
        f6: parseFloat(row.porcentaje_f6) || 0,
      },
      semaforo: row.semaforo,
    }));
  } catch (error) {
    logger.error('Error obteniendo resumen de dependencias', { error: error.message });
    throw error;
  }
};

/**
 * Obtiene lista de trámites con filtros y paginación
 */
const getTramites = async (filters = {}) => {
  try {
    const { dependencia, search, fase, page = 1, limit = 50 } = filters;
    
    let query = `
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
        t.fase6_liberacion,
        t.updated_at
      FROM tramites t
      INNER JOIN dependencias d ON t.dependencia_id = d.id
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    // Filtro por dependencia
    if (dependencia && dependencia.trim() !== '') {
      query += ` AND d.nombre ILIKE $${paramIndex}`;
      params.push(`%${dependencia.trim()}%`);
      paramIndex++;
    }

    // Filtro por búsqueda de texto
    if (search && search.trim() !== '') {
      query += ` AND t.nombre ILIKE $${paramIndex}`;
      params.push(`%${search.trim()}%`);
      paramIndex++;
    }

    // Filtro por fase
    if (fase) {
      const faseInt = parseInt(fase);
      if (faseInt >= 1 && faseInt <= 6) {
        const faseColumn = `fase${faseInt}_${
          faseInt === 1 ? 'tramites_intervenidos' :
          faseInt === 2 ? 'modelado' :
          faseInt === 3 ? 'reingenieria' :
          faseInt === 4 ? 'digitalizacion' :
          faseInt === 5 ? 'implementacion' : 'liberacion'
        }`;
        query += ` AND t.${faseColumn} = true`;
      }
    }

    // Contar total
    const countQuery = `SELECT COUNT(*) as total FROM (${query}) AS filtered`;
    const countResult = await db.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);

    // Ordenar y paginar
    query += ` ORDER BY t.nivel_digitalizacion DESC, t.nombre`;
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

    const result = await db.query(query, params);

    return {
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  } catch (error) {
    logger.error('Error obteniendo trámites', { error: error.message });
    throw error;
  }
};

/**
 * Obtiene datos para gráficas (KPIs formateados para Chart.js)
 */
const getKPIs = async () => {
  try {
    const resumenGlobal = await getResumenGlobal();
    const resumenDeps = await getResumenDependencias();

    // Funnel de fases
    const funnel = {
      labels: resumenGlobal.fases.map((f) => f.nombre),
      datasets: [
        {
          label: 'Trámites por Fase',
          data: resumenGlobal.fases.map((f) => f.total),
          backgroundColor: [
            'rgba(159, 34, 65, 0.8)',
            'rgba(35, 91, 78, 0.8)',
            'rgba(188, 149, 92, 0.8)',
            'rgba(221, 201, 163, 0.8)',
            'rgba(111, 114, 113, 0.8)',
            'rgba(152, 152, 154, 0.8)',
          ],
        },
      ],
    };

    // Ordenar dependencias por score de fases avanzadas (peso mayor a F6, F5, F4)
    const depsOrdenadas = [...resumenDeps].sort((a, b) => {
      const scoreA = (a.fases.f6 * 6) + (a.fases.f5 * 5) + (a.fases.f4 * 4) + (a.fases.f3 * 3) + (a.fases.f2 * 2) + (a.fases.f1 * 1);
      const scoreB = (b.fases.f6 * 6) + (b.fases.f5 * 5) + (b.fases.f4 * 4) + (b.fases.f3 * 3) + (b.fases.f2 * 2) + (b.fases.f1 * 1);
      return scoreB - scoreA; // Descendente: mayor score primero
    });

    // Barras apiladas horizontales con todas las dependencias
    const stackedBars = {
      labels: depsOrdenadas.map((d) => d.dependencia),
      datasets: [
        {
          label: 'F6 - Liberación',
          data: depsOrdenadas.map((d) => d.fases.f6),
          backgroundColor: 'rgba(22, 163, 74, 0.9)', // Verde oscuro
          borderColor: 'rgba(22, 163, 74, 1)',
          borderWidth: 1,
        },
        {
          label: 'F5 - Implementación',
          data: depsOrdenadas.map((d) => d.fases.f5),
          backgroundColor: 'rgba(34, 197, 94, 0.9)', // Verde
          borderColor: 'rgba(34, 197, 94, 1)',
          borderWidth: 1,
        },
        {
          label: 'F4 - Digitalización',
          data: depsOrdenadas.map((d) => d.fases.f4),
          backgroundColor: 'rgba(132, 204, 22, 0.9)', // Lima
          borderColor: 'rgba(132, 204, 22, 1)',
          borderWidth: 1,
        },
        {
          label: 'F3 - Reingeniería',
          data: depsOrdenadas.map((d) => d.fases.f3),
          backgroundColor: 'rgba(251, 191, 36, 0.9)', // Amarillo
          borderColor: 'rgba(251, 191, 36, 1)',
          borderWidth: 1,
        },
        {
          label: 'F2 - Modelado',
          data: depsOrdenadas.map((d) => d.fases.f2),
          backgroundColor: 'rgba(251, 146, 60, 0.9)', // Naranja
          borderColor: 'rgba(251, 146, 60, 1)',
          borderWidth: 1,
        },
        {
          label: 'F1 - Intervenidos',
          data: depsOrdenadas.map((d) => d.fases.f1),
          backgroundColor: 'rgba(239, 68, 68, 0.9)', // Rojo
          borderColor: 'rgba(239, 68, 68, 1)',
          borderWidth: 1,
        },
      ],
    };

    // TODOS los trámites por mayor avance (fase máxima alcanzada)
    // Consulta directa a la tabla para obtener TODOS los trámites
    const topResult = await db.query(`
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
        t.fase6_liberacion,
        (
          CASE WHEN t.fase6_liberacion THEN 6
               WHEN t.fase5_implementacion THEN 5
               WHEN t.fase4_digitalizacion THEN 4
               WHEN t.fase3_reingenieria THEN 3
               WHEN t.fase2_modelado THEN 2
               WHEN t.fase1_tramites_intervenidos THEN 1
               ELSE 0
          END
        ) as fase_maxima
      FROM tramites t
      INNER JOIN dependencias d ON t.dependencia_id = d.id
      ORDER BY fase_maxima DESC, t.nombre ASC
    `);
    const topTramites = topResult.rows;

    return {
      funnel,
      stackedBars,
      topTramites,
    };
  } catch (error) {
    logger.error('Error obteniendo KPIs', { error: error.message });
    throw error;
  }
};

/**
 * Obtiene trámites con geolocalización
 */
const getTramitesGeo = async () => {
  try {
    const result = await db.query('SELECT * FROM v_tramites_geo');
    return result.rows;
  } catch (error) {
    logger.error('Error obteniendo trámites geo', { error: error.message });
    throw error;
  }
};

/**
 * Exporta datos a CSV
 */
const exportToCSV = async () => {
  try {
    const result = await db.query(`
      SELECT
        d.nombre AS dependencia,
        t.nombre AS tramite,
        t.nivel_digitalizacion,
        t.fase1_tramites_intervenidos::int AS fase1_tramites_intervenidos,
        t.fase2_modelado::int AS fase2_modelado,
        t.fase3_reingenieria::int AS fase3_reingenieria,
        t.fase4_digitalizacion::int AS fase4_digitalizacion,
        t.fase5_implementacion::int AS fase5_implementacion,
        t.fase6_liberacion::int AS fase6_liberacion
      FROM tramites t
      INNER JOIN dependencias d ON t.dependencia_id = d.id
      ORDER BY d.nombre, t.nombre
    `);

    // Generar CSV
    let csv = 'dependencia,tramite,nivel_digitalizacion,fase1_tramites_intervenidos,fase2_modelado,fase3_reingenieria,fase4_digitalizacion,fase5_implementacion,fase6_liberacion\n';
    
    result.rows.forEach((row) => {
      csv += `"${row.dependencia}","${row.tramite}",${row.nivel_digitalizacion},${row.fase1_tramites_intervenidos},${row.fase2_modelado},${row.fase3_reingenieria},${row.fase4_digitalizacion},${row.fase5_implementacion},${row.fase6_liberacion}\n`;
    });

    return csv;
  } catch (error) {
    logger.error('Error exportando a CSV', { error: error.message });
    throw error;
  }
};

module.exports = {
  getResumenGlobal,
  getResumenDependencias,
  getTramites,
  getKPIs,
  getTramitesGeo,
  exportToCSV,
};

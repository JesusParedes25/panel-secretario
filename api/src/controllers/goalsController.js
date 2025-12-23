/**
 * Controlador de Metas
 * Panel Secretario - Gobierno de Hidalgo
 */

const db = require('../config/database');
const logger = require('../config/logger');
const configService = require('../services/configService');

/**
 * Función auxiliar para calcular porcentaje
 */
const calcPct = (actual, meta) => {
  if (!meta || meta === 0) return 0;
  return Math.min((actual / meta) * 100, 100);
};

/**
 * Obtiene los años disponibles con datos
 */
const getAniosConDatos = async (req, res) => {
  try {
    // Obtener años con datos en tramites
    const result = await db.query(`
      SELECT DISTINCT anio FROM tramites ORDER BY anio
    `);
    const aniosConDatos = result.rows.map(r => r.anio);
    
    // Obtener años con metas configuradas
    const metasPorAnio = await configService.getMetasPorAnio();
    const aniosConMetas = Object.keys(metasPorAnio).map(a => parseInt(a));
    
    // Combinar y ordenar
    const todosAnios = [...new Set([...aniosConDatos, ...aniosConMetas])].sort();
    
    res.json({
      success: true,
      data: {
        aniosConDatos,
        aniosConMetas,
        todosAnios,
      },
    });
  } catch (error) {
    logger.error('Error obteniendo años', { error: error.message });
    res.status(500).json({ success: false, error: 'Error obteniendo años' });
  }
};

/**
 * Obtiene las metas y el progreso actual
 * Soporta filtro por año o combinado
 */
const getGoals = async (req, res) => {
  try {
    const { anio } = req.query; // 'all', '2025', '2026', etc.
    
    // Obtener años disponibles con datos
    const aniosResult = await db.query(`SELECT DISTINCT anio FROM tramites ORDER BY anio`);
    const aniosDisponibles = aniosResult.rows.map(r => r.anio);
    
    // Obtener metas de todos los años
    const metasPorAnio = await configService.getMetasPorAnio();
    
    // Determinar qué años mostrar
    let aniosAMostrar = aniosDisponibles;
    let esCombinado = true;
    
    if (anio && anio !== 'all') {
      aniosAMostrar = [parseInt(anio)];
      esCombinado = false;
    }
    
    // Construir query según filtro
    let whereClause = '';
    let queryParams = [];
    if (!esCombinado && aniosAMostrar.length === 1) {
      whereClause = 'WHERE anio = $1';
      queryParams = [aniosAMostrar[0]];
    }
    
    // Obtener datos
    const result = await db.query(`
      SELECT
        COUNT(*) AS total_tramites,
        SUM(CASE WHEN fase1_tramites_intervenidos THEN 1 ELSE 0 END) AS total_f1,
        SUM(CASE WHEN fase2_modelado THEN 1 ELSE 0 END) AS total_f2,
        SUM(CASE WHEN fase3_reingenieria THEN 1 ELSE 0 END) AS total_f3,
        SUM(s) AS total_s,
        SUM(r) AS total_r,
        SUM(CASE WHEN fase4_digitalizacion THEN 1 ELSE 0 END) AS total_f4,
        SUM(CASE WHEN fase5_implementacion THEN 1 ELSE 0 END) AS total_f5,
        SUM(CASE WHEN fase6_liberacion THEN 1 ELSE 0 END) AS total_f6
      FROM tramites
      ${whereClause}
    `, queryParams);

    const data = result.rows[0];
    
    // Calcular metas combinadas o individuales
    let goals;
    if (esCombinado && aniosDisponibles.length > 1) {
      // Sumar metas de todos los años
      goals = { total: 0, etapa1: 0, etapa2: 0, etapa3: 0, etapa4: 0, etapa5: 0, etapa6: 0 };
      for (const a of aniosDisponibles) {
        const m = metasPorAnio[a] || { total: 0, e1: 0, e2: 0, e3: 0, e4: 0, e5: 0, e6: 0 };
        goals.total += m.total || 0;
        goals.etapa1 += m.e1 || 0;
        goals.etapa2 += m.e2 || 0;
        goals.etapa3 += m.e3 || 0;
        goals.etapa4 += m.e4 || 0;
        goals.etapa5 += m.e5 || 0;
        goals.etapa6 += m.e6 || 0;
      }
      goals.label = aniosDisponibles.join('-');
    } else {
      const selectedAnio = aniosAMostrar[0] || 2025;
      const m = metasPorAnio[selectedAnio] || { total: 300, e1: 300, e2: 250, e3: 200, e4: 150, e5: 100, e6: 50 };
      goals = {
        total: m.total || 300,
        etapa1: m.e1 || 300,
        etapa2: m.e2 || 250,
        etapa3: m.e3 || 200,
        etapa4: m.e4 || 150,
        etapa5: m.e5 || 100,
        etapa6: m.e6 || 50,
        label: String(selectedAnio),
      };
    }

    // Calcular porcentajes por etapa
    const progress = {
      etapa1: {
        actual: parseInt(data.total_f1) || 0,
        meta: goals.etapa1,
        porcentaje: calcPct(parseInt(data.total_f1) || 0, goals.etapa1),
      },
      etapa2: {
        actual: parseInt(data.total_f2) || 0,
        meta: goals.etapa2,
        porcentaje: calcPct(parseInt(data.total_f2) || 0, goals.etapa2),
      },
      etapa3: {
        actual: (parseInt(data.total_s) || 0) + (parseInt(data.total_r) || 0),
        meta: goals.etapa3,
        porcentaje: calcPct((parseInt(data.total_s) || 0) + (parseInt(data.total_r) || 0), goals.etapa3),
        s: parseInt(data.total_s) || 0,
        r: parseInt(data.total_r) || 0,
      },
      etapa4: {
        actual: parseInt(data.total_f4) || 0,
        meta: goals.etapa4,
        porcentaje: calcPct(parseInt(data.total_f4) || 0, goals.etapa4),
      },
      etapa5: {
        actual: parseInt(data.total_f5) || 0,
        meta: goals.etapa5,
        porcentaje: calcPct(parseInt(data.total_f5) || 0, goals.etapa5),
      },
      etapa6: {
        actual: parseInt(data.total_f6) || 0,
        meta: goals.etapa6,
        porcentaje: calcPct(parseInt(data.total_f6) || 0, goals.etapa6),
      },
    };

    res.json({
      success: true,
      data: {
        goals,
        progress,
        totalTramites: parseInt(data.total_tramites) || 0,
        aniosDisponibles,
        esCombinado,
        anioSeleccionado: esCombinado ? 'all' : aniosAMostrar[0],
        metasPorAnio,
      },
    });
  } catch (error) {
    logger.error('Error obteniendo metas', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Error obteniendo metas y progreso',
    });
  }
};

module.exports = {
  getGoals,
  getAniosConDatos,
};

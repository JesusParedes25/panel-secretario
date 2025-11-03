/**
 * Controlador de Metas
 * Panel Secretario - Gobierno de Hidalgo
 */

const db = require('../config/database');
const logger = require('../config/logger');
const { getAllGoals, calculateEtapaPercentage } = require('../config/goals');

/**
 * Obtiene las metas y el progreso actual
 */
const getGoals = async (req, res) => {
  try {
    // Obtener metas configuradas
    const goals = getAllGoals();
    
    // Obtener datos actuales de la base de datos
    const result = await db.query(`
      SELECT
        COUNT(*) AS total_tramites,
        SUM(CASE WHEN fase1_tramites_intervenidos THEN 1 ELSE 0 END) AS total_f1,
        SUM(CASE WHEN fase2_modelado THEN 1 ELSE 0 END) AS total_f2,
        SUM(CASE WHEN fase3_reingenieria THEN 1 ELSE 0 END) AS total_f3,
        SUM(CASE WHEN fase4_digitalizacion THEN 1 ELSE 0 END) AS total_f4,
        SUM(CASE WHEN fase5_implementacion THEN 1 ELSE 0 END) AS total_f5,
        SUM(CASE WHEN fase6_liberacion THEN 1 ELSE 0 END) AS total_f6
      FROM tramites
    `);

    const data = result.rows[0];
    
    // Calcular porcentajes por etapa
    const progress = {
      etapa1: {
        actual: parseInt(data.total_f1) || 0,
        meta: goals.etapa1,
        porcentaje: calculateEtapaPercentage(parseInt(data.total_f1) || 0, 1),
      },
      etapa2: {
        actual: parseInt(data.total_f2) || 0,
        meta: goals.etapa2,
        porcentaje: calculateEtapaPercentage(parseInt(data.total_f2) || 0, 2),
      },
      etapa3: {
        actual: parseInt(data.total_f3) || 0,
        meta: goals.etapa3,
        porcentaje: calculateEtapaPercentage(parseInt(data.total_f3) || 0, 3),
      },
      etapa4: {
        actual: parseInt(data.total_f4) || 0,
        meta: goals.etapa4,
        porcentaje: calculateEtapaPercentage(parseInt(data.total_f4) || 0, 4),
      },
      etapa5: {
        actual: parseInt(data.total_f5) || 0,
        meta: goals.etapa5,
        porcentaje: calculateEtapaPercentage(parseInt(data.total_f5) || 0, 5),
      },
      etapa6: {
        actual: parseInt(data.total_f6) || 0,
        meta: goals.etapa6,
        porcentaje: calculateEtapaPercentage(parseInt(data.total_f6) || 0, 6),
      },
    };

    res.json({
      success: true,
      data: {
        goals,
        progress,
        totalTramites: parseInt(data.total_tramites) || 0,
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
};

/**
 * Controlador de Consultas de Datos
 * Panel Secretario - Gobierno de Hidalgo
 */

const dataService = require('../services/dataService');
const logger = require('../config/logger');

/**
 * GET /api/v1/resumen/global
 * Obtiene KPIs globales
 * Soporta query param ?anio=2025 o ?anio=all
 */
const getResumenGlobal = async (req, res, next) => {
  try {
    const { anio } = req.query;
    const data = await dataService.getResumenGlobal(anio);
    
    res.json({
      success: true,
      data,
      anio: anio || 'all',
    });
  } catch (error) {
    logger.error('Error en getResumenGlobal', { error: error.message });
    next(error);
  }
};

/**
 * GET /api/v1/resumen/dependencias
 * Obtiene resumen por dependencia
 */
const getResumenDependencias = async (req, res, next) => {
  try {
    const data = await dataService.getResumenDependencias();
    
    res.json({
      success: true,
      data,
    });
  } catch (error) {
    logger.error('Error en getResumenDependencias', { error: error.message });
    next(error);
  }
};

/**
 * GET /api/v1/tramites
 * Obtiene lista de trámites con filtros
 */
const getTramites = async (req, res, next) => {
  try {
    const { dependencia, search, fase, page, limit } = req.query;
    
    const filters = {
      dependencia,
      search,
      fase,
      page: page || 1,
      limit: limit || 50,
    };

    const result = await dataService.getTramites(filters);
    
    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    logger.error('Error en getTramites', { error: error.message });
    next(error);
  }
};

/**
 * GET /api/v1/kpis
 * Obtiene datos formateados para gráficas
 */
const getKPIs = async (req, res, next) => {
  try {
    const data = await dataService.getKPIs();
    
    res.json({
      success: true,
      data,
    });
  } catch (error) {
    logger.error('Error en getKPIs', { error: error.message });
    next(error);
  }
};

/**
 * GET /api/v1/export/csv
 * Exporta datos actuales a CSV
 */
const exportCSV = async (req, res, next) => {
  try {
    const csv = await dataService.exportToCSV();
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=panel_secretario_export.csv');
    res.send(csv);
  } catch (error) {
    logger.error('Error en exportCSV', { error: error.message });
    next(error);
  }
};

module.exports = {
  getResumenGlobal,
  getResumenDependencias,
  getTramites,
  getKPIs,
  exportCSV,
};

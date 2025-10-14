/**
 * Controlador de Carga de Archivos
 * Panel Secretario - Gobierno de Hidalgo
 */

const uploadService = require('../services/uploadService');
const logger = require('../config/logger');
const fs = require('fs').promises;

/**
 * POST /api/v1/upload/csv
 * Procesa y carga archivo CSV
 */
const uploadCSV = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No se recibió ningún archivo. Use el campo "file"',
      });
    }

    logger.info('Procesando carga de CSV', {
      filename: req.file.originalname,
      size: req.file.size,
    });

    // Validar tipo de archivo
    const allowedMimes = ['text/csv', 'application/vnd.ms-excel', 'text/plain'];
    if (!allowedMimes.includes(req.file.mimetype)) {
      await fs.unlink(req.file.path); // Eliminar archivo
      return res.status(400).json({
        success: false,
        error: 'Tipo de archivo no permitido. Solo archivos CSV',
      });
    }

    // Procesar CSV
    const results = await uploadService.processCSV(req.file.path, req.file.originalname);

    // Eliminar archivo temporal
    await fs.unlink(req.file.path);

    logger.info('CSV procesado exitosamente', {
      filename: req.file.originalname,
      rowsRead: results.rowsRead,
      rowsInserted: results.rowsInserted,
      rowsUpdated: results.rowsUpdated,
      rowsInvalid: results.rowsInvalid,
    });

    res.json({
      success: true,
      message: 'CSV procesado correctamente',
      data: {
        filename: req.file.originalname,
        rowsRead: results.rowsRead,
        rowsInserted: results.rowsInserted,
        rowsUpdated: results.rowsUpdated,
        rowsInvalid: results.rowsInvalid,
        errors: results.errors.slice(0, 20), // Limitar errores mostrados
      },
    });
  } catch (error) {
    logger.error('Error en uploadCSV', { error: error.message });
    
    // Intentar eliminar archivo si existe
    if (req.file && req.file.path) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        logger.error('Error eliminando archivo temporal', { error: unlinkError.message });
      }
    }
    
    next(error);
  }
};

module.exports = {
  uploadCSV,
};

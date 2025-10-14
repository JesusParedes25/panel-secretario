/**
 * Middleware de Manejo de Errores
 * Panel Secretario - Gobierno de Hidalgo
 */

const logger = require('../config/logger');

/**
 * Middleware global de manejo de errores
 */
const errorHandler = (err, req, res, next) => {
  // Log del error
  logger.error('Error en la aplicación', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Errores de PostgreSQL
  if (err.code && err.code.startsWith('22')) {
    // Errores de datos (22xxx)
    return res.status(400).json({
      success: false,
      error: 'Datos inválidos',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }

  if (err.code && err.code.startsWith('23')) {
    // Errores de integridad (23xxx)
    return res.status(409).json({
      success: false,
      error: 'Conflicto de integridad de datos',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }

  // Errores de Multer (upload)
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      error: 'Archivo demasiado grande',
      maxSize: process.env.MAX_FILE_SIZE || '20MB',
    });
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      success: false,
      error: 'Campo de archivo inesperado',
    });
  }

  // Error genérico
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Error interno del servidor';

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

/**
 * Middleware para rutas no encontradas (404)
 */
const notFound = (req, res) => {
  logger.warn('Ruta no encontrada', {
    path: req.path,
    method: req.method,
  });

  res.status(404).json({
    success: false,
    error: 'Ruta no encontrada',
    path: req.path,
  });
};

module.exports = {
  errorHandler,
  notFound,
};

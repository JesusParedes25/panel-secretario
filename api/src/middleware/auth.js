/**
 * Middleware de Autenticación por API Key
 * Panel Secretario - Gobierno de Hidalgo
 */

const logger = require('../config/logger');

/**
 * Verifica la API Key en el header x-api-key
 */
const verifyApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  const validApiKey = process.env.API_KEY;

  if (!validApiKey) {
    logger.error('API_KEY no configurada en variables de entorno');
    return res.status(500).json({
      success: false,
      error: 'Configuración de seguridad no disponible',
    });
  }

  if (!apiKey) {
    logger.warn('Intento de acceso sin API Key', {
      ip: req.ip,
      path: req.path,
    });
    return res.status(401).json({
      success: false,
      error: 'API Key requerida. Incluir header x-api-key',
    });
  }

  if (apiKey !== validApiKey) {
    logger.warn('Intento de acceso con API Key inválida', {
      ip: req.ip,
      path: req.path,
    });
    return res.status(403).json({
      success: false,
      error: 'API Key inválida',
    });
  }

  logger.debug('API Key válida', { path: req.path });
  next();
};

/**
 * API Key opcional - no bloquea si falta, solo valida si existe
 */
const optionalApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (apiKey) {
    return verifyApiKey(req, res, next);
  }
  
  next();
};

module.exports = {
  verifyApiKey,
  optionalApiKey,
};

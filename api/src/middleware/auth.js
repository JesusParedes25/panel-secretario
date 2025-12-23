/**
 * Middleware de Autenticación por API Key y JWT
 * Panel Secretario - Gobierno de Hidalgo
 */

const logger = require('../config/logger');
const authService = require('../services/authService');

/**
 * Verifica token JWT en el header Authorization
 */
const verifyJWT = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Token de acceso requerido',
    });
  }

  const decoded = authService.verifyToken(token);
  if (!decoded) {
    return res.status(403).json({
      success: false,
      error: 'Token inválido o expirado',
    });
  }

  req.user = decoded;
  next();
};

/**
 * Verifica que el usuario sea administrador
 */
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.rol !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Se requieren permisos de administrador',
    });
  }
  next();
};

/**
 * JWT opcional - no bloquea si falta, solo valida si existe
 */
const optionalJWT = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    const decoded = authService.verifyToken(token);
    if (decoded) {
      req.user = decoded;
    }
  }
  next();
};

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
  verifyJWT,
  requireAdmin,
  optionalJWT,
};

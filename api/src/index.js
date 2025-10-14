/**
 * Servidor API REST
 * Panel Secretario - Gobierno de Hidalgo
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const fs = require('fs');
const path = require('path');

const logger = require('./config/logger');
const routes = require('./routes');
const { errorHandler, notFound } = require('./middleware/errorHandler');

// Crear directorio de uploads si no existe
const uploadDir = process.env.UPLOAD_DIR || '/tmp/uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  logger.info('Directorio de uploads creado', { path: uploadDir });
}

// Crear directorio de logs si no existe (producción)
if (process.env.NODE_ENV === 'production') {
  const logsDir = path.join(__dirname, '../logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
    logger.info('Directorio de logs creado', { path: logsDir });
  }
}

// Crear aplicación Express
const app = express();
const PORT = process.env.PORT || 8080;

// Confiar en proxy (Nginx)
app.set('trust proxy', true);

// ========== Middlewares de Seguridad ==========
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));

// ========== CORS ==========
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = process.env.CORS_ORIGINS
      ? process.env.CORS_ORIGINS.split(',')
      : ['http://localhost:5173', 'http://localhost'];

    // Permitir requests sin origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
};

app.use(cors(corsOptions));

// ========== Body Parsers ==========
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ========== Request Logging ==========
app.use((req, res, next) => {
  logger.info('Request recibido', {
    method: req.method,
    path: req.path,
    ip: req.ip,
  });
  next();
});

// ========== Rutas ==========
app.use('/api/v1', routes);

// Ruta raíz
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'API Panel Secretario - Gobierno de Hidalgo',
    version: '1.0.0',
    endpoints: {
      health: '/api/v1/health',
      upload: 'POST /api/v1/upload/csv',
      resumen: {
        global: 'GET /api/v1/resumen/global',
        dependencias: 'GET /api/v1/resumen/dependencias',
      },
      tramites: 'GET /api/v1/tramites',
      kpis: 'GET /api/v1/kpis',
      geo: 'GET /api/v1/tramites/geo',
      export: 'GET /api/v1/export/csv',
    },
  });
});

// ========== Error Handlers ==========
app.use(notFound);
app.use(errorHandler);

// ========== Iniciar Servidor ==========
const server = app.listen(PORT, () => {
  logger.info(`🚀 Servidor API iniciado en puerto ${PORT}`, {
    env: process.env.NODE_ENV || 'development',
    port: PORT,
  });
});

// Manejo de señales de cierre
const gracefulShutdown = (signal) => {
  logger.info(`Señal ${signal} recibida, cerrando servidor...`);
  
  server.close(() => {
    logger.info('Servidor cerrado correctamente');
    process.exit(0);
  });

  // Forzar cierre después de 10 segundos
  setTimeout(() => {
    logger.error('No se pudo cerrar correctamente, forzando cierre');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Manejo de errores no capturados
process.on('uncaughtException', (error) => {
  logger.error('Excepción no capturada', { error: error.message, stack: error.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Promesa rechazada no manejada', { reason, promise });
});

module.exports = app;

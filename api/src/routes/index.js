/**
 * Rutas de la API
 * Panel Secretario - Gobierno de Hidalgo
 */

const express = require('express');
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const path = require('path');

const { verifyApiKey, optionalApiKey } = require('../middleware/auth');
const uploadController = require('../controllers/uploadController');
const dataController = require('../controllers/dataController');

const router = express.Router();

// Configuración de Multer para uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, process.env.UPLOAD_DIR || '/tmp/uploads');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '20971520'), // 20MB default
  },
  fileFilter: (req, file, cb) => {
    const allowedExts = ['.csv', '.txt'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Solo archivos CSV permitidos'));
    }
  },
});

// Rate limiter para uploads (más restrictivo)
const uploadLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutos
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '5'), // 5 requests
  message: {
    success: false,
    error: 'Demasiadas solicitudes de carga. Intente más tarde.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter general
const apiLimiter = rateLimit({
  windowMs: 60000, // 1 minuto
  max: 100, // 100 requests por minuto
  message: {
    success: false,
    error: 'Demasiadas solicitudes. Intente más tarde.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Aplicar rate limiter general a todas las rutas
router.use(apiLimiter);

// ========== Health Check ==========
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API Panel Secretario - Gobierno de Hidalgo',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// ========== Carga de Datos ==========
router.post('/upload/csv', verifyApiKey, uploadLimiter, upload.single('file'), uploadController.uploadCSV);

// ========== Consultas Ejecutivas ==========
// Resumen global - acceso público (opcional API key)
router.get('/resumen/global', optionalApiKey, dataController.getResumenGlobal);

// Resumen por dependencias - acceso público
router.get('/resumen/dependencias', optionalApiKey, dataController.getResumenDependencias);

// Lista de trámites con filtros - acceso público
router.get('/tramites', optionalApiKey, dataController.getTramites);

// KPIs para gráficas - acceso público
router.get('/kpis', optionalApiKey, dataController.getKPIs);

// ========== Exportación ==========
router.get('/export/csv', optionalApiKey, dataController.exportCSV);

module.exports = router;

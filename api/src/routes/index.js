/**
 * Rutas de la API
 * Panel Secretario - Gobierno de Hidalgo
 */

const express = require('express');
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const path = require('path');

const { verifyApiKey, optionalApiKey, verifyJWT, requireAdmin } = require('../middleware/auth');
const uploadController = require('../controllers/uploadController');
const dataController = require('../controllers/dataController');
const goalsController = require('../controllers/goalsController');
const authService = require('../services/authService');
const configService = require('../services/configService');

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

// Metas y progreso por etapa - acceso público
router.get('/goals', optionalApiKey, goalsController.getGoals);

// ========== Exportación ==========
router.get('/export/csv', optionalApiKey, dataController.exportCSV);

// ========== Autenticación ==========
router.post('/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Usuario y contraseña requeridos',
      });
    }

    const result = await authService.login(username, password);
    
    if (!result.success) {
      return res.status(401).json(result);
    }

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error en el servidor',
    });
  }
});

router.get('/auth/me', verifyJWT, (req, res) => {
  res.json({
    success: true,
    data: req.user,
  });
});

router.post('/auth/change-password', verifyJWT, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Contraseña actual y nueva requeridas',
      });
    }

    const result = await authService.changePassword(req.user.id, currentPassword, newPassword);
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json({
      success: true,
      message: 'Contraseña actualizada correctamente',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error en el servidor',
    });
  }
});

// ========== Configuración Multi-Año ==========

// Obtener todas las metas por año
router.get('/config/metas', optionalApiKey, async (req, res) => {
  try {
    const metasPorAnio = await configService.getMetasPorAnio();
    res.json({
      success: true,
      data: metasPorAnio,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error obteniendo metas',
    });
  }
});

// Actualizar metas de un año específico
router.put('/config/metas/:anio', optionalApiKey, async (req, res) => {
  try {
    const { anio } = req.params;
    const metas = req.body;
    
    // Validar estructura de metas
    const requiredFields = ['total', 'e1', 'e2', 'e3', 'e4', 'e5', 'e6'];
    for (const field of requiredFields) {
      if (typeof metas[field] !== 'number' || metas[field] < 0) {
        return res.status(400).json({
          success: false,
          error: `Campo '${field}' debe ser un número positivo`,
        });
      }
    }

    const result = await configService.updateMetasAnio(anio, metas, null);
    res.json({
      success: true,
      data: result,
      message: `Metas ${anio} actualizadas correctamente`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error actualizando metas',
    });
  }
});

// Agregar un nuevo año
router.post('/config/anios', optionalApiKey, async (req, res) => {
  try {
    const { anio, metas } = req.body;
    
    if (!anio || anio < 2020 || anio > 2050) {
      return res.status(400).json({
        success: false,
        error: 'Año inválido',
      });
    }

    const result = await configService.addAnio(anio, metas, null);
    res.json({
      success: true,
      data: result,
      message: `Año ${anio} agregado correctamente`,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Eliminar un año
router.delete('/config/anios/:anio', optionalApiKey, async (req, res) => {
  try {
    const { anio } = req.params;
    const result = await configService.deleteAnio(anio, null);
    res.json({
      success: true,
      data: result,
      message: `Año ${anio} eliminado correctamente`,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// ========== Preview CSV (antes de cargar) ==========
router.post('/upload/preview', optionalApiKey, upload.single('file'), uploadController.previewCSV);

module.exports = router;

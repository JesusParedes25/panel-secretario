/**
 * Controlador de Carga de Archivos
 * Panel Secretario - Gobierno de Hidalgo
 */

const uploadService = require('../services/uploadService');
const logger = require('../config/logger');
const fs = require('fs').promises;
const { parse } = require('csv-parse/sync');

/**
 * POST /api/v1/upload/csv
 * Procesa y carga archivo CSV
 * Soporta parámetro 'anio' para asociar datos a un año específico
 */
const uploadCSV = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No se recibió ningún archivo. Use el campo "file"',
      });
    }

    // Obtener año del body o query (default: año actual)
    const anio = parseInt(req.body.anio || req.query.anio) || new Date().getFullYear();

    logger.info('Procesando carga de CSV', {
      filename: req.file.originalname,
      size: req.file.size,
      anio,
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

    // Procesar CSV con año
    const results = await uploadService.processCSV(req.file.path, req.file.originalname, anio);

    // Eliminar archivo temporal
    await fs.unlink(req.file.path);

    logger.info('CSV procesado exitosamente', {
      filename: req.file.originalname,
      anio,
      rowsRead: results.rowsRead,
      rowsInserted: results.rowsInserted,
      rowsUpdated: results.rowsUpdated,
      rowsInvalid: results.rowsInvalid,
    });

    res.json({
      success: true,
      message: `CSV procesado correctamente para el año ${anio}`,
      data: {
        filename: req.file.originalname,
        anio,
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

/**
 * POST /api/v1/upload/preview
 * Vista previa del CSV sin cargar a la base de datos
 */
const previewCSV = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No se recibió ningún archivo. Use el campo "file"',
      });
    }

    logger.info('Generando vista previa de CSV', {
      filename: req.file.originalname,
      size: req.file.size,
    });

    // Leer archivo
    const content = await fs.readFile(req.file.path, 'utf-8');
    
    // Parsear CSV
    let records;
    try {
      records = parse(content, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        bom: true,
      });
    } catch (parseError) {
      await fs.unlink(req.file.path);
      return res.status(400).json({
        success: false,
        error: `Error parseando CSV: ${parseError.message}`,
      });
    }

    // Eliminar archivo temporal
    await fs.unlink(req.file.path);

    // Validar columnas requeridas
    const requiredColumns = [
      'dependencia',
      'tramite',
      'nivel_digitalizacion',
      'fase1_tramites_intervenidos',
      'fase2_modelado',
      'fase3_reingenieria',
      'fase4_digitalizacion',
      'fase5_implementacion',
      'fase6_liberacion',
    ];

    const headers = records.length > 0 ? Object.keys(records[0]) : [];
    const missingColumns = requiredColumns.filter(col => !headers.includes(col));
    const hasOptionalS = headers.includes('s');
    const hasOptionalR = headers.includes('r');

    // Generar estadísticas de preview
    const dependencias = new Set();
    const tramites = [];
    const errors = [];

    records.forEach((row, index) => {
      const rowErrors = [];
      
      // Validar dependencia
      if (!row.dependencia || row.dependencia.trim() === '') {
        rowErrors.push('Dependencia vacía');
      } else {
        dependencias.add(row.dependencia.trim());
      }

      // Validar trámite
      if (!row.tramite || row.tramite.trim() === '') {
        rowErrors.push('Trámite vacío');
      }

      // Validar nivel_digitalizacion
      const nivel = parseFloat(row.nivel_digitalizacion);
      if (isNaN(nivel) || nivel < 0 || nivel > 6) {
        rowErrors.push(`Nivel de digitalización inválido: ${row.nivel_digitalizacion}`);
      }

      // Validar fases (booleanos)
      const faseFields = ['fase1_tramites_intervenidos', 'fase2_modelado', 'fase3_reingenieria', 
                         'fase4_digitalizacion', 'fase5_implementacion', 'fase6_liberacion'];
      faseFields.forEach(field => {
        const val = row[field]?.toString().toLowerCase();
        if (!['true', 'false', '1', '0', 'si', 'no', 'sí', ''].includes(val || '')) {
          rowErrors.push(`${field} debe ser booleano`);
        }
      });

      if (rowErrors.length > 0) {
        errors.push({ row: index + 2, errors: rowErrors });
      }

      // Agregar a lista de trámites (primeros 50 para preview)
      if (tramites.length < 50) {
        tramites.push({
          dependencia: row.dependencia?.trim() || '',
          tramite: row.tramite?.trim() || '',
          nivel_digitalizacion: nivel || 0,
          s: parseInt(row.s) || 0,
          r: parseInt(row.r) || 0,
          fases: {
            e1: ['true', '1', 'si', 'sí'].includes((row.fase1_tramites_intervenidos || '').toLowerCase()),
            e2: ['true', '1', 'si', 'sí'].includes((row.fase2_modelado || '').toLowerCase()),
            e3: ['true', '1', 'si', 'sí'].includes((row.fase3_reingenieria || '').toLowerCase()),
            e4: ['true', '1', 'si', 'sí'].includes((row.fase4_digitalizacion || '').toLowerCase()),
            e5: ['true', '1', 'si', 'sí'].includes((row.fase5_implementacion || '').toLowerCase()),
            e6: ['true', '1', 'si', 'sí'].includes((row.fase6_liberacion || '').toLowerCase()),
          },
        });
      }
    });

    res.json({
      success: true,
      data: {
        filename: req.file.originalname,
        totalRows: records.length,
        totalDependencias: dependencias.size,
        dependencias: Array.from(dependencias).sort(),
        headers,
        missingColumns,
        hasOptionalS,
        hasOptionalR,
        validRows: records.length - errors.length,
        invalidRows: errors.length,
        errors: errors.slice(0, 20),
        preview: tramites,
      },
    });
  } catch (error) {
    logger.error('Error en previewCSV', { error: error.message });
    
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
  previewCSV,
};

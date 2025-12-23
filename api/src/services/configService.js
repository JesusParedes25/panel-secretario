/**
 * Servicio de Configuración
 * Panel Secretario - Gobierno de Hidalgo
 */

const db = require('../config/database');
const logger = require('../config/logger');

/**
 * Obtener configuración por clave
 */
const getConfig = async (clave) => {
  try {
    const result = await db.query(
      'SELECT valor, descripcion, updated_at FROM configuracion WHERE clave = $1',
      [clave]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  } catch (error) {
    logger.error('Error obteniendo configuración', { clave, error: error.message });
    throw error;
  }
};

/**
 * Obtener todas las configuraciones
 */
const getAllConfig = async () => {
  try {
    const result = await db.query(
      'SELECT clave, valor, descripcion, updated_at FROM configuracion ORDER BY clave'
    );
    return result.rows;
  } catch (error) {
    logger.error('Error obteniendo configuraciones', { error: error.message });
    throw error;
  }
};

/**
 * Actualizar configuración
 */
const updateConfig = async (clave, valor, userId) => {
  try {
    const result = await db.query(
      `UPDATE configuracion 
       SET valor = $1, updated_by = $2, updated_at = CURRENT_TIMESTAMP
       WHERE clave = $3
       RETURNING clave, valor, descripcion, updated_at`,
      [JSON.stringify(valor), userId, clave]
    );

    if (result.rows.length === 0) {
      // Si no existe, crear
      const insertResult = await db.query(
        `INSERT INTO configuracion (clave, valor, updated_by)
         VALUES ($1, $2, $3)
         RETURNING clave, valor, descripcion, updated_at`,
        [clave, JSON.stringify(valor), userId]
      );
      return insertResult.rows[0];
    }

    return result.rows[0];
  } catch (error) {
    logger.error('Error actualizando configuración', { clave, error: error.message });
    throw error;
  }
};

/**
 * Obtener todas las metas por año
 */
const getMetasPorAnio = async () => {
  try {
    const config = await getConfig('metas_por_anio');
    if (!config) {
      // Valores por defecto
      return {
        '2025': { total: 300, e1: 300, e2: 250, e3: 200, e4: 150, e5: 100, e6: 50 },
      };
    }
    return config.valor;
  } catch (error) {
    logger.error('Error obteniendo metas por año', { error: error.message });
    throw error;
  }
};

/**
 * Obtener metas de un año específico
 */
const getMetasAnio = async (anio) => {
  try {
    const metasPorAnio = await getMetasPorAnio();
    return metasPorAnio[anio] || { total: 300, e1: 300, e2: 250, e3: 200, e4: 150, e5: 100, e6: 50 };
  } catch (error) {
    logger.error('Error obteniendo metas del año', { anio, error: error.message });
    throw error;
  }
};

/**
 * Obtener años disponibles
 */
const getAniosDisponibles = async () => {
  try {
    const metasPorAnio = await getMetasPorAnio();
    return Object.keys(metasPorAnio).map(a => parseInt(a)).sort();
  } catch (error) {
    logger.error('Error obteniendo años disponibles', { error: error.message });
    throw error;
  }
};

/**
 * Actualizar metas de un año específico
 */
const updateMetasAnio = async (anio, metas, userId) => {
  try {
    const metasPorAnio = await getMetasPorAnio();
    metasPorAnio[anio] = metas;
    return await updateConfig('metas_por_anio', metasPorAnio, userId);
  } catch (error) {
    logger.error('Error actualizando metas del año', { anio, error: error.message });
    throw error;
  }
};

/**
 * Agregar un nuevo año con metas por defecto
 */
const addAnio = async (anio, metas, userId) => {
  try {
    const metasPorAnio = await getMetasPorAnio();
    if (metasPorAnio[anio]) {
      throw new Error(`El año ${anio} ya existe`);
    }
    metasPorAnio[anio] = metas || { total: 300, e1: 300, e2: 250, e3: 200, e4: 150, e5: 100, e6: 50 };
    return await updateConfig('metas_por_anio', metasPorAnio, userId);
  } catch (error) {
    logger.error('Error agregando año', { anio, error: error.message });
    throw error;
  }
};

/**
 * Eliminar un año
 */
const deleteAnio = async (anio, userId) => {
  try {
    const metasPorAnio = await getMetasPorAnio();
    if (!metasPorAnio[anio]) {
      throw new Error(`El año ${anio} no existe`);
    }
    delete metasPorAnio[anio];
    return await updateConfig('metas_por_anio', metasPorAnio, userId);
  } catch (error) {
    logger.error('Error eliminando año', { anio, error: error.message });
    throw error;
  }
};

module.exports = {
  getConfig,
  getAllConfig,
  updateConfig,
  getMetasPorAnio,
  getMetasAnio,
  getAniosDisponibles,
  updateMetasAnio,
  addAnio,
  deleteAnio,
};

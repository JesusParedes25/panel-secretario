/**
 * Configuración de Base de Datos PostgreSQL
 * Panel Secretario - Gobierno de Hidalgo
 */

const { Pool } = require('pg');
const logger = require('./logger');

// Configuración del pool de conexiones
const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: parseInt(process.env.PGPORT || '5432', 10),
  database: process.env.PGDATABASE || 'panel_secretario',
  user: process.env.PGUSER || 'panel_user',
  password: process.env.PGPASSWORD || 'panel_password',
  max: 20, // Máximo de conexiones en el pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Evento de error del pool
pool.on('error', (err) => {
  logger.error('Error inesperado en el pool de PostgreSQL', { error: err.message });
});

// Test de conexión
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    logger.error('Error conectando a PostgreSQL', { error: err.message });
  } else {
    logger.info('Conexión a PostgreSQL establecida correctamente', {
      timestamp: res.rows[0].now,
    });
  }
});

/**
 * Ejecuta una query con manejo de errores
 * @param {string} text - Query SQL
 * @param {Array} params - Parámetros de la query
 * @returns {Promise} - Resultado de la query
 */
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    logger.debug('Query ejecutada', { duration, rows: res.rowCount });
    return res;
  } catch (error) {
    logger.error('Error ejecutando query', { error: error.message, query: text });
    throw error;
  }
};

/**
 * Obtiene un cliente del pool para transacciones
 * @returns {Promise} - Cliente de PostgreSQL
 */
const getClient = async () => {
  const client = await pool.connect();
  const query = client.query;
  const release = client.release;

  // Monkeypatching para logging
  client.query = (...args) => {
    client.lastQuery = args;
    return query.apply(client, args);
  };

  client.release = () => {
    client.query = query;
    client.release = release;
    return release.apply(client);
  };

  return client;
};

module.exports = {
  query,
  getClient,
  pool,
};

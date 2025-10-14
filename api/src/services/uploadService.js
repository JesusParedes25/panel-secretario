/**
 * Servicio de Carga de CSV
 * Panel Secretario - Gobierno de Hidalgo
 */

const fs = require('fs');
const { parse } = require('csv-parse');
const db = require('../config/database');
const logger = require('../config/logger');

/**
 * Normaliza el nombre de una columna (quitar espacios, saltos de línea, comillas)
 */
const normalizeHeader = (header) => {
  return header
    .trim()
    .replace(/["\r\n]/g, '')
    .toLowerCase();
};

/**
 * Valida y normaliza una fila de datos
 */
const validateRow = (row) => {
  const errors = [];

  // Validar dependencia
  if (!row.dependencia || row.dependencia.trim() === '') {
    errors.push('Dependencia vacía');
  }

  // Validar tramite
  if (!row.tramite || row.tramite.trim() === '') {
    errors.push('Trámite vacío');
  }

  // Validar nivel_digitalizacion
  const nivel = parseFloat(row.nivel_digitalizacion);
  if (isNaN(nivel) || nivel < 0 || nivel > 6) {
    errors.push(`Nivel de digitalización inválido: ${row.nivel_digitalizacion}`);
  }

  // Validar fases (deben ser 0 o 1)
  const fases = [
    'fase1_tramites_intervenidos',
    'fase2_modelado',
    'fase3_reingenieria',
    'fase4_digitalizacion',
    'fase5_implementacion',
    'fase6_liberacion',
  ];

  fases.forEach((fase) => {
    const valor = parseInt(row[fase]);
    if (valor !== 0 && valor !== 1) {
      errors.push(`${fase} debe ser 0 o 1, recibido: ${row[fase]}`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    data: {
      dependencia: row.dependencia.trim(),
      tramite: row.tramite.trim(),
      nivel_digitalizacion: nivel,
      fase1_tramites_intervenidos: parseInt(row.fase1_tramites_intervenidos) === 1,
      fase2_modelado: parseInt(row.fase2_modelado) === 1,
      fase3_reingenieria: parseInt(row.fase3_reingenieria) === 1,
      fase4_digitalizacion: parseInt(row.fase4_digitalizacion) === 1,
      fase5_implementacion: parseInt(row.fase5_implementacion) === 1,
      fase6_liberacion: parseInt(row.fase6_liberacion) === 1,
    },
  };
};

/**
 * Upsert de dependencia (inserta si no existe, retorna ID)
 */
const upsertDependencia = async (client, nombre) => {
  const query = `
    INSERT INTO dependencias (nombre)
    VALUES ($1)
    ON CONFLICT (nombre) DO UPDATE SET nombre = EXCLUDED.nombre
    RETURNING id
  `;
  const result = await client.query(query, [nombre]);
  return result.rows[0].id;
};

/**
 * Upsert de trámite (actualiza si existe con mismo nombre y dependencia)
 */
const upsertTramite = async (client, data, dependenciaId) => {
  const query = `
    INSERT INTO tramites (
      dependencia_id, nombre, nivel_digitalizacion,
      fase1_tramites_intervenidos, fase2_modelado, fase3_reingenieria,
      fase4_digitalizacion, fase5_implementacion, fase6_liberacion
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    ON CONFLICT ON CONSTRAINT tramites_pkey DO NOTHING
    RETURNING id
  `;

  // Primero verificar si existe
  const checkQuery = `
    SELECT id FROM tramites
    WHERE dependencia_id = $1 AND nombre = $2
  `;
  const existing = await client.query(checkQuery, [dependenciaId, data.tramite]);

  if (existing.rows.length > 0) {
    // Actualizar
    const updateQuery = `
      UPDATE tramites SET
        nivel_digitalizacion = $3,
        fase1_tramites_intervenidos = $4,
        fase2_modelado = $5,
        fase3_reingenieria = $6,
        fase4_digitalizacion = $7,
        fase5_implementacion = $8,
        fase6_liberacion = $9,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND dependencia_id = $2
      RETURNING id
    `;
    const result = await client.query(updateQuery, [
      existing.rows[0].id,
      dependenciaId,
      data.nivel_digitalizacion,
      data.fase1_tramites_intervenidos,
      data.fase2_modelado,
      data.fase3_reingenieria,
      data.fase4_digitalizacion,
      data.fase5_implementacion,
      data.fase6_liberacion,
    ]);
    return { id: result.rows[0].id, updated: true };
  } else {
    // Insertar
    const result = await client.query(query, [
      dependenciaId,
      data.tramite,
      data.nivel_digitalizacion,
      data.fase1_tramites_intervenidos,
      data.fase2_modelado,
      data.fase3_reingenieria,
      data.fase4_digitalizacion,
      data.fase5_implementacion,
      data.fase6_liberacion,
    ]);
    return { id: result.rows[0].id, updated: false };
  }
};

/**
 * Procesa archivo CSV y carga los datos
 */
const processCSV = async (filePath, filename) => {
  return new Promise((resolve, reject) => {
    const results = {
      rowsRead: 0,
      rowsInserted: 0,
      rowsUpdated: 0,
      rowsInvalid: 0,
      errors: [],
    };

    const records = [];

    const parser = parse({
      columns: (headers) => headers.map(normalizeHeader),
      skip_empty_lines: true,
      trim: true,
      delimiter: [',', '\t'], // Soportar coma y tabulador
      relax_quotes: true,
    });

    parser.on('readable', function() {
      let record;
      while ((record = parser.read()) !== null) {
        records.push(record);
      }
    });

    parser.on('error', (error) => {
      logger.error('Error leyendo archivo CSV', { error: error.message });
      reject(error);
    });

    parser.on('end', async () => {
      const client = await db.getClient();

      try {
        await client.query('BEGIN');

        for (const record of records) {
          results.rowsRead++;

          // Validar fila
          const validation = validateRow(record);

          if (!validation.valid) {
            results.rowsInvalid++;
            results.errors.push({
              row: results.rowsRead,
              errors: validation.errors,
              data: record,
            });
            continue;
          }

          try {
            // Upsert dependencia
            const dependenciaId = await upsertDependencia(
              client,
              validation.data.dependencia
            );

            // Upsert trámite
            const tramiteResult = await upsertTramite(
              client,
              validation.data,
              dependenciaId
            );

            if (tramiteResult.updated) {
              results.rowsUpdated++;
            } else {
              results.rowsInserted++;
            }
          } catch (error) {
            logger.error('Error procesando fila', {
              row: results.rowsRead,
              error: error.message,
            });
            results.rowsInvalid++;
            results.errors.push({
              row: results.rowsRead,
              errors: [error.message],
              data: record,
            });
          }
        }

        // Registrar en log de cargas
        await client.query(
          `INSERT INTO carga_logs (filename, rows_read, rows_inserted, rows_invalid, errors)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            filename,
            results.rowsRead,
            results.rowsInserted + results.rowsUpdated,
            results.rowsInvalid,
            JSON.stringify(results.errors.slice(0, 100)), // Limitar a 100 errores
          ]
        );

        await client.query('COMMIT');
        client.release();
        resolve(results);
      } catch (error) {
        await client.query('ROLLBACK');
        client.release();
        logger.error('Error en transacción de carga CSV', { error: error.message });
        reject(error);
      }
    });

    fs.createReadStream(filePath).pipe(parser);
  });
};

module.exports = {
  processCSV,
};

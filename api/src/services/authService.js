/**
 * Servicio de Autenticación
 * Panel Secretario - Gobierno de Hidalgo
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const logger = require('../config/logger');

const JWT_SECRET = process.env.JWT_SECRET || 'panel-secretario-jwt-secret-2025';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

/**
 * Autenticar usuario
 */
const login = async (username, password) => {
  try {
    const result = await db.query(
      'SELECT id, username, password_hash, nombre, rol, dependencia_id, activo FROM usuarios WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return { success: false, error: 'Usuario no encontrado' };
    }

    const user = result.rows[0];

    if (!user.activo) {
      return { success: false, error: 'Usuario desactivado' };
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return { success: false, error: 'Contraseña incorrecta' };
    }

    // Actualizar último acceso
    await db.query(
      'UPDATE usuarios SET ultimo_acceso = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    // Generar token JWT
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        nombre: user.nombre,
        rol: user.rol,
        dependencia_id: user.dependencia_id,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return {
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        nombre: user.nombre,
        rol: user.rol,
        dependencia_id: user.dependencia_id,
      },
    };
  } catch (error) {
    logger.error('Error en login', { error: error.message });
    throw error;
  }
};

/**
 * Verificar token JWT
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

/**
 * Crear usuario (solo admin)
 */
const createUser = async (userData) => {
  try {
    const { username, password, nombre, rol, dependencia_id } = userData;

    // Hash de la contraseña
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    const result = await db.query(
      `INSERT INTO usuarios (username, password_hash, nombre, rol, dependencia_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, username, nombre, rol, dependencia_id, created_at`,
      [username, password_hash, nombre, rol || 'viewer', dependencia_id || null]
    );

    return { success: true, user: result.rows[0] };
  } catch (error) {
    if (error.code === '23505') {
      return { success: false, error: 'El nombre de usuario ya existe' };
    }
    logger.error('Error creando usuario', { error: error.message });
    throw error;
  }
};

/**
 * Cambiar contraseña
 */
const changePassword = async (userId, currentPassword, newPassword) => {
  try {
    const result = await db.query(
      'SELECT password_hash FROM usuarios WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return { success: false, error: 'Usuario no encontrado' };
    }

    const validPassword = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
    if (!validPassword) {
      return { success: false, error: 'Contraseña actual incorrecta' };
    }

    const saltRounds = 10;
    const password_hash = await bcrypt.hash(newPassword, saltRounds);

    await db.query(
      'UPDATE usuarios SET password_hash = $1 WHERE id = $2',
      [password_hash, userId]
    );

    return { success: true };
  } catch (error) {
    logger.error('Error cambiando contraseña', { error: error.message });
    throw error;
  }
};

/**
 * Inicializar usuario admin por defecto
 */
const initDefaultAdmin = async () => {
  try {
    const result = await db.query(
      'SELECT id FROM usuarios WHERE username = $1',
      ['admin']
    );

    if (result.rows.length === 0) {
      const saltRounds = 10;
      const password_hash = await bcrypt.hash('admin123', saltRounds);

      await db.query(
        `INSERT INTO usuarios (username, password_hash, nombre, rol)
         VALUES ($1, $2, $3, $4)`,
        ['admin', password_hash, 'Administrador', 'admin']
      );

      logger.info('Usuario admin creado con contraseña por defecto: admin123');
    }
  } catch (error) {
    logger.error('Error inicializando admin', { error: error.message });
  }
};

module.exports = {
  login,
  verifyToken,
  createUser,
  changePassword,
  initDefaultAdmin,
  JWT_SECRET,
};

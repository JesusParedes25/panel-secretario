/**
 * Configuración de Metas por Etapa
 * Panel Secretario - Gobierno de Hidalgo
 * 
 * Define las metas objetivo para cada etapa del proceso de simplificación.
 * Estas metas pueden ser actualizadas anualmente según los objetivos del gobierno.
 */

const GOALS_2025 = {
  // Meta total de trámites
  total: parseInt(process.env.GOAL_TOTAL || '300'),
  
  // Metas por etapa
  etapa1: parseInt(process.env.GOAL_ETAPA1 || '300'),  // Trámites Intervenidos
  etapa2: parseInt(process.env.GOAL_ETAPA2 || '300'),  // Modelado
  etapa3: parseInt(process.env.GOAL_ETAPA3 || '150'),  // Reingeniería
  etapa4: parseInt(process.env.GOAL_ETAPA4 || '100'),  // Digitalización
  etapa5: parseInt(process.env.GOAL_ETAPA5 || '100'),  // Implementación
  etapa6: parseInt(process.env.GOAL_ETAPA6 || '100'),  // Liberación
};

/**
 * Calcula el porcentaje de avance de una etapa
 * @param {number} actual - Número actual de trámites en la etapa
 * @param {number} etapaNum - Número de etapa (1-6)
 * @returns {number} Porcentaje de avance (0-100)
 */
const calculateEtapaPercentage = (actual, etapaNum) => {
  const goal = GOALS_2025[`etapa${etapaNum}`];
  if (!goal || goal === 0) return 0;
  return Math.min((actual / goal) * 100, 100);
};

/**
 * Obtiene la meta de una etapa específica
 * @param {number} etapaNum - Número de etapa (1-6)
 * @returns {number} Meta objetivo
 */
const getEtapaGoal = (etapaNum) => {
  return GOALS_2025[`etapa${etapaNum}`] || 0;
};

/**
 * Obtiene todas las metas
 * @returns {object} Objeto con todas las metas
 */
const getAllGoals = () => {
  return { ...GOALS_2025 };
};

module.exports = {
  GOALS_2025,
  calculateEtapaPercentage,
  getEtapaGoal,
  getAllGoals,
};

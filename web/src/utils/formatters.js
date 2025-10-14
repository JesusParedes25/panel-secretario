/**
 * Utilidades de Formateo
 * Panel Secretario - Gobierno de Hidalgo
 */

/**
 * Formatea un número con separador de miles
 */
export const formatNumber = (num) => {
  if (num === null || num === undefined) return '0';
  return new Intl.NumberFormat('es-MX').format(num);
};

/**
 * Formatea un porcentaje
 */
export const formatPercentage = (num, decimals = 1) => {
  if (num === null || num === undefined) return '0%';
  return `${Number(num).toFixed(decimals)}%`;
};

/**
 * Formatea una fecha
 */
export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
};

/**
 * Formatea fecha y hora
 */
export const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('es-MX', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

/**
 * Trunca texto largo
 */
export const truncateText = (text, maxLength = 50) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};

/**
 * Obtiene color de semáforo
 */
export const getSemaforoColor = (semaforo) => {
  const colors = {
    verde: 'bg-success text-success-content',
    ambar: 'bg-warning text-warning-content',
    rojo: 'bg-error text-error-content',
  };
  return colors[semaforo] || 'bg-neutral text-neutral-content';
};

/**
 * Obtiene emoji de semáforo
 */
export const getSemaforoEmoji = (semaforo) => {
  const emojis = {
    verde: '🟢',
    ambar: '🟡',
    rojo: '🔴',
  };
  return emojis[semaforo] || '⚪';
};

/**
 * Descarga un archivo blob
 */
export const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

/**
 * Obtiene nombre de fase
 */
export const getFaseName = (faseKey) => {
  const names = {
    f1: 'Trámites Intervenidos',
    f2: 'Modelado',
    f3: 'Reingeniería',
    f4: 'Digitalización',
    f5: 'Implementación',
    f6: 'Liberación',
  };
  return names[faseKey] || faseKey;
};

/**
 * Convierte objeto de fases a array
 */
export const fasesToArray = (fases) => {
  if (!fases) return [];
  return [
    { key: 'f1', name: 'F1', fullName: 'Trámites Intervenidos', value: fases.f1 || 0 },
    { key: 'f2', name: 'F2', fullName: 'Modelado', value: fases.f2 || 0 },
    { key: 'f3', name: 'F3', fullName: 'Reingeniería', value: fases.f3 || 0 },
    { key: 'f4', name: 'F4', fullName: 'Digitalización', value: fases.f4 || 0 },
    { key: 'f5', name: 'F5', fullName: 'Implementación', value: fases.f5 || 0 },
    { key: 'f6', name: 'F6', fullName: 'Liberación', value: fases.f6 || 0 },
  ];
};

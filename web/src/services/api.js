/**
 * Cliente de API
 * Panel Secretario - Gobierno de Hidalgo
 */

import axios from 'axios';

// Configuración base de Axios
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de requests (agregar API key si existe)
api.interceptors.request.use(
  (config) => {
    const apiKey = import.meta.env.VITE_API_KEY;
    if (apiKey) {
      config.headers['x-api-key'] = apiKey;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor de responses (manejo de errores)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // El servidor respondió con un status code fuera del rango 2xx
      console.error('Error de respuesta:', error.response.data);
    } else if (error.request) {
      // La request fue hecha pero no se recibió respuesta
      console.error('Error de red:', error.message);
    } else {
      // Algo sucedió al configurar la request
      console.error('Error:', error.message);
    }
    return Promise.reject(error);
  }
);

/**
 * Servicios de la API
 */
const apiService = {
  // Health check
  health: () => api.get('/health'),

  // Resumen global
  getResumenGlobal: () => api.get('/resumen/global'),

  // Resumen por dependencias
  getResumenDependencias: () => api.get('/resumen/dependencias'),

  // Lista de trámites con filtros
  getTramites: (params = {}) => api.get('/tramites', { params }),

  // KPIs para gráficas
  getKPIs: () => api.get('/kpis'),

  // Obtener metas y progreso por etapa
  getGoals: () => api.get('/goals'),

  // Subir archivo CSV
  uploadCSV: (file, onUploadProgress) => {
    const formData = new FormData();
    formData.append('file', file);

    return api.post('/upload/csv', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    });
  },

  // Exportar CSV
  exportCSV: () => api.get('/export/csv', {
    responseType: 'blob',
  }),
};

export default apiService;

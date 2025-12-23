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

// Interceptor de requests (agregar API key y token JWT si existen)
api.interceptors.request.use(
  (config) => {
    const apiKey = import.meta.env.VITE_API_KEY;
    if (apiKey) {
      config.headers['x-api-key'] = apiKey;
    }
    
    // Agregar token JWT si existe
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
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

  // Resumen global (con filtro de año opcional)
  getResumenGlobal: (anio = null) => api.get('/resumen/global', { params: anio ? { anio } : {} }),

  // Resumen por dependencias
  getResumenDependencias: (anio = null) => api.get('/resumen/dependencias', { params: anio ? { anio } : {} }),

  // Lista de trámites con filtros
  getTramites: (params = {}) => api.get('/tramites', { params }),

  // KPIs para gráficas
  getKPIs: () => api.get('/kpis'),

  // Obtener metas y progreso por etapa (con filtro de año opcional)
  getGoals: (anio = null) => api.get('/goals', { params: anio ? { anio } : {} }),

  // Subir archivo CSV (con año opcional)
  uploadCSV: (file, anio = null, onUploadProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    if (anio) {
      formData.append('anio', anio);
    }

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

  // ========== Autenticación ==========
  login: (username, password) => api.post('/auth/login', { username, password }),
  
  getMe: () => api.get('/auth/me'),
  
  changePassword: (currentPassword, newPassword) => 
    api.post('/auth/change-password', { currentPassword, newPassword }),

  // ========== Configuración Multi-Año ==========
  // Obtener todas las metas por año
  getMetas: () => api.get('/config/metas'),
  
  // Actualizar metas de un año específico
  updateMetasAnio: (anio, metas) => api.put(`/config/metas/${anio}`, metas),
  
  // Agregar un nuevo año
  addAnio: (anio, metas) => api.post('/config/anios', { anio, metas }),
  
  // Eliminar un año
  deleteAnio: (anio) => api.delete(`/config/anios/${anio}`),

  // ========== Preview y Carga con Auth ==========
  previewCSV: (file, onUploadProgress) => {
    const formData = new FormData();
    formData.append('file', file);

    return api.post('/upload/preview', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    });
  },

  uploadCSVAuth: (file, onUploadProgress) => {
    const formData = new FormData();
    formData.append('file', file);

    return api.post('/upload/csv-auth', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    });
  },
};

export default apiService;

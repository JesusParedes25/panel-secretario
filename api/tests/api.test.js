/**
 * Tests de API
 * Panel Secretario - Gobierno de Hidalgo
 */

const request = require('supertest');
const app = require('../src/index');

describe('API Tests', () => {
  describe('Health Check', () => {
    it('GET /api/v1/health debería retornar 200', async () => {
      const res = await request(app).get('/api/v1/health');
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('Panel Secretario');
    });
  });

  describe('Resumen Global', () => {
    it('GET /api/v1/resumen/global debería retornar datos', async () => {
      const res = await request(app).get('/api/v1/resumen/global');
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data).toHaveProperty('total_tramites');
      expect(res.body.data).toHaveProperty('total_dependencias');
      expect(res.body.data).toHaveProperty('promedio_nivel_global');
      expect(res.body.data).toHaveProperty('fases');
    });
  });

  describe('Resumen Dependencias', () => {
    it('GET /api/v1/resumen/dependencias debería retornar array', async () => {
      const res = await request(app).get('/api/v1/resumen/dependencias');
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('Trámites', () => {
    it('GET /api/v1/tramites debería retornar lista paginada', async () => {
      const res = await request(app).get('/api/v1/tramites?page=1&limit=10');
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.pagination).toBeDefined();
      expect(res.body.pagination).toHaveProperty('page');
      expect(res.body.pagination).toHaveProperty('total');
    });

    it('GET /api/v1/tramites con filtro debería funcionar', async () => {
      const res = await request(app).get('/api/v1/tramites?search=Registro');
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('KPIs', () => {
    it('GET /api/v1/kpis debería retornar datos para gráficas', async () => {
      const res = await request(app).get('/api/v1/kpis');
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('funnel');
      expect(res.body.data).toHaveProperty('stackedBars');
      expect(res.body.data).toHaveProperty('topTramites');
    });
  });

  describe('Export CSV', () => {
    it('GET /api/v1/export/csv debería retornar CSV', async () => {
      const res = await request(app).get('/api/v1/export/csv');
      
      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.text).toContain('dependencia,tramite');
    });
  });

  describe('Upload CSV', () => {
    it('POST /api/v1/upload/csv sin API key debería retornar 401', async () => {
      const res = await request(app).post('/api/v1/upload/csv');
      
      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('POST /api/v1/upload/csv sin archivo debería retornar 400', async () => {
      const res = await request(app)
        .post('/api/v1/upload/csv')
        .set('x-api-key', process.env.API_KEY || 'test-api-key');
      
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Rutas no encontradas', () => {
    it('GET /api/v1/ruta-inexistente debería retornar 404', async () => {
      const res = await request(app).get('/api/v1/ruta-inexistente');
      
      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });
});

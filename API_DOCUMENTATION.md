# Documentación de API

## Panel de Simplificación - API REST v1

**Base URL**: `/api/v1`

## 🔐 Autenticación

La mayoría de endpoints requieren autenticación por API Key.

### Header Requerido

```http
x-api-key: tu-api-key-aqui
```

### Endpoints Públicos (API Key Opcional)

- `GET /health`
- `GET /resumen/global`
- `GET /resumen/dependencias`
- `GET /tramites`
- `GET /kpis`
- `GET /tramites/geo`
- `GET /export/csv`

### Endpoints Protegidos (API Key Requerida)

- `POST /upload/csv`

## 📡 Endpoints

---

### Health Check

Verifica el estado del servicio.

**Endpoint**: `GET /health`

**Autenticación**: No requerida

**Respuesta Exitosa** (200 OK):

```json
{
  "success": true,
  "message": "API Panel Secretario - Gobierno de Hidalgo",
  "version": "1.0.0",
  "timestamp": "2025-01-14T10:30:00.000Z"
}
```

**Ejemplo de Uso**:

```bash
curl http://localhost/api/v1/health
```

---

### Resumen Global

Obtiene KPIs globales del proceso de simplificación.

**Endpoint**: `GET /resumen/global`

**Autenticación**: Opcional

**Respuesta Exitosa** (200 OK):

```json
{
  "success": true,
  "data": {
    "total_tramites": 29,
    "total_dependencias": 10,
    "promedio_nivel_global": 3.76,
    "fases": [
      {
        "fase": "F1",
        "nombre": "Trámites Intervenidos",
        "total": 29,
        "porcentaje": 100.00
      },
      {
        "fase": "F2",
        "nombre": "Modelado",
        "total": 29,
        "porcentaje": 100.00
      },
      {
        "fase": "F3",
        "nombre": "Reingeniería",
        "total": 27,
        "porcentaje": 93.10
      },
      {
        "fase": "F4",
        "nombre": "Digitalización",
        "total": 18,
        "porcentaje": 62.07
      },
      {
        "fase": "F5",
        "nombre": "Implementación",
        "total": 10,
        "porcentaje": 34.48
      },
      {
        "fase": "F6",
        "nombre": "Liberación",
        "total": 8,
        "porcentaje": 27.59
      }
    ]
  }
}
```

**Ejemplo de Uso**:

```bash
curl http://localhost/api/v1/resumen/global
```

---

### Resumen por Dependencias

Obtiene métricas agrupadas por dependencia.

**Endpoint**: `GET /resumen/dependencias`

**Autenticación**: Opcional

**Respuesta Exitosa** (200 OK):

```json
{
  "success": true,
  "data": [
    {
      "dependencia_id": 1,
      "dependencia": "SECRETARÍA DE SEGURIDAD PÚBLICA",
      "total_tramites": 3,
      "promedio_nivel": 2.17,
      "fases": {
        "f1": 3,
        "f2": 3,
        "f3": 2,
        "f4": 1,
        "f5": 0,
        "f6": 0
      },
      "porcentajes": {
        "f1": 100.00,
        "f2": 100.00,
        "f3": 66.67,
        "f4": 33.33,
        "f5": 0.00,
        "f6": 0.00
      },
      "semaforo": "rojo"
    }
  ]
}
```

**Semáforo**:
- `verde`: ≥50% de trámites en F4 o superior
- `ambar`: ≥30% de trámites en F2 o superior
- `rojo`: Menos del 30% en F2

**Ejemplo de Uso**:

```bash
curl http://localhost/api/v1/resumen/dependencias
```

---

### Lista de Trámites

Obtiene lista de trámites con filtros y paginación.

**Endpoint**: `GET /tramites`

**Autenticación**: Opcional

**Query Parameters**:

| Parámetro | Tipo | Descripción | Por Defecto |
|-----------|------|-------------|-------------|
| `dependencia` | string | Filtrar por nombre de dependencia (parcial) | - |
| `search` | string | Buscar en nombre de trámite (parcial) | - |
| `page` | integer | Número de página | 1 |
| `limit` | integer | Resultados por página | 50 |

**Respuesta Exitosa** (200 OK):

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "dependencia": "SECRETARÍA DE SEGURIDAD PÚBLICA",
      "tramite": "Prevención Social de la Violencia y la Delincuencia",
      "nivel_digitalizacion": 1.0,
      "fase1_tramites_intervenidos": true,
      "fase2_modelado": true,
      "fase3_reingenieria": true,
      "fase4_digitalizacion": false,
      "fase5_implementacion": false,
      "fase6_liberacion": false,
      "updated_at": "2025-01-14T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 29,
    "totalPages": 1
  }
}
```

**Ejemplos de Uso**:

```bash
# Todos los trámites (primera página)
curl http://localhost/api/v1/tramites

# Buscar por texto
curl "http://localhost/api/v1/tramites?search=Registro"

# Filtrar por dependencia
curl "http://localhost/api/v1/tramites?dependencia=SALUD"

# Paginación
curl "http://localhost/api/v1/tramites?page=2&limit=10"

# Combinación de filtros
curl "http://localhost/api/v1/tramites?dependencia=EDUCACIÓN&search=Certificación&page=1&limit=20"
```

---

### KPIs para Gráficas

Obtiene datos formateados para Chart.js.

**Endpoint**: `GET /kpis`

**Autenticación**: Opcional

**Respuesta Exitosa** (200 OK):

```json
{
  "success": true,
  "data": {
    "funnel": {
      "labels": ["Trámites Intervenidos", "Modelado", "Reingeniería", "Digitalización", "Implementación", "Liberación"],
      "datasets": [{
        "label": "Trámites por Fase",
        "data": [29, 29, 27, 18, 10, 8],
        "backgroundColor": ["rgba(159, 34, 65, 0.8)", "..."]
      }]
    },
    "stackedBars": {
      "labels": ["SECRETARÍA DE SEGURIDAD PÚBLI...", "..."],
      "datasets": [
        {
          "label": "F1",
          "data": [3, 3, 3, 3, 3, 3, 3, 2, 3, 3],
          "backgroundColor": "rgba(159, 34, 65, 0.9)"
        }
      ]
    },
    "topTramites": [
      {
        "id": 9,
        "dependencia": "SECRETARÍA DE SALUD",
        "tramite": "Registro de Defunción",
        "nivel_digitalizacion": 6.0,
        "fase1_tramites_intervenidos": true,
        "fase2_modelado": true,
        "fase3_reingenieria": true,
        "fase4_digitalizacion": true,
        "fase5_implementacion": true,
        "fase6_liberacion": true
      }
    ]
  }
}
```

**Ejemplo de Uso**:

```bash
curl http://localhost/api/v1/kpis
```

---

### Trámites Georreferenciados

Obtiene trámites con coordenadas geográficas.

**Endpoint**: `GET /tramites/geo`

**Autenticación**: Opcional

**Respuesta Exitosa** (200 OK):

```json
{
  "success": true,
  "data": [
    {
      "id": 27,
      "dependencia": "SECRETARÍA DE GOBIERNO",
      "tramite": "Registro Civil - Acta de Nacimiento",
      "nivel_digitalizacion": 6.0,
      "lat": 20.0911,
      "lng": -98.7624,
      "liberado": true
    }
  ]
}
```

**Ejemplo de Uso**:

```bash
curl http://localhost/api/v1/tramites/geo
```

---

### Subir Archivo CSV

Carga masiva de datos desde archivo CSV.

**Endpoint**: `POST /upload/csv`

**Autenticación**: **REQUERIDA**

**Headers**:
```http
x-api-key: tu-api-key
Content-Type: multipart/form-data
```

**Body**:
- `file`: Archivo CSV (campo form-data)

**Formato del CSV**:

```csv
dependencia,tramite,nivel_digitalizacion,fase1_tramites_intervenidos,fase2_modelado,fase3_reingenieria,fase4_digitalizacion,fase5_implementacion,fase6_liberacion
SECRETARÍA DE EJEMPLO,Trámite de Prueba,3.5,1,1,1,1,0,0
```

**Validaciones**:
- Tamaño máximo: 20MB
- Formato: CSV (extensión .csv)
- Columnas requeridas: todas las del ejemplo
- `nivel_digitalizacion`: 0.0 - 6.0
- Fases: 0 o 1 (booleanos)

**Respuesta Exitosa** (200 OK):

```json
{
  "success": true,
  "message": "CSV procesado correctamente",
  "data": {
    "filename": "datos_tramites.csv",
    "rowsRead": 100,
    "rowsInserted": 85,
    "rowsUpdated": 10,
    "rowsInvalid": 5,
    "errors": [
      {
        "row": 23,
        "errors": ["Nivel de digitalización inválido: 7.5"],
        "data": {...}
      }
    ]
  }
}
```

**Errores Comunes**:

- **401 Unauthorized**: API Key faltante o inválida
- **400 Bad Request**: Archivo faltante o formato inválido
- **413 Payload Too Large**: Archivo mayor a 20MB
- **429 Too Many Requests**: Rate limit excedido (5 uploads/15min)

**Ejemplo de Uso**:

```bash
curl -X POST \
  -H "x-api-key: tu-api-key" \
  -F "file=@datos_tramites.csv" \
  http://localhost/api/v1/upload/csv
```

---

### Exportar CSV

Exporta el estado actual de los datos a CSV.

**Endpoint**: `GET /export/csv`

**Autenticación**: Opcional

**Respuesta**: Archivo CSV

**Headers de Respuesta**:
```http
Content-Type: text/csv; charset=utf-8
Content-Disposition: attachment; filename=panel_secretario_export.csv
```

**Ejemplo de Uso**:

```bash
curl http://localhost/api/v1/export/csv -o export.csv
```

---

## ⚠️ Códigos de Error

| Código | Significado | Descripción |
|--------|-------------|-------------|
| 200 | OK | Solicitud exitosa |
| 400 | Bad Request | Datos inválidos o faltantes |
| 401 | Unauthorized | API Key faltante |
| 403 | Forbidden | API Key inválida |
| 404 | Not Found | Recurso no encontrado |
| 409 | Conflict | Conflicto de integridad de datos |
| 413 | Payload Too Large | Archivo demasiado grande |
| 429 | Too Many Requests | Rate limit excedido |
| 500 | Internal Server Error | Error del servidor |

**Formato de Error**:

```json
{
  "success": false,
  "error": "Descripción del error"
}
```

---

## 🔒 Rate Limiting

**Upload de CSV**:
- Ventana: 15 minutos
- Máximo: 5 solicitudes

**Otros endpoints**:
- Ventana: 1 minuto
- Máximo: 100 solicitudes

**Headers de Rate Limit**:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642165200
```

---

## 🌐 CORS

Orígenes permitidos configurables via `CORS_ORIGINS` en `.env`.

Por defecto en desarrollo:
- `http://localhost`
- `http://localhost:5173`

---

## 📝 Notas Adicionales

### Paginación

Todos los endpoints con paginación devuelven:

```json
{
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "totalPages": 3
  }
}
```

### Timestamps

Todas las fechas están en formato ISO 8601 UTC:
```
2025-01-14T10:30:00.000Z
```

### Ordenamiento

Por defecto:
- Dependencias: Por total de trámites (DESC)
- Trámites: Por nivel de digitalización (DESC), luego nombre (ASC)

---

## 🧪 Testing con Postman

Importa esta colección para probar todos los endpoints:

```json
{
  "info": {
    "name": "Panel Secretario API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost/api/v1"
    },
    {
      "key": "apiKey",
      "value": "tu-api-key"
    }
  ]
}
```

---

Para soporte técnico, contacta al equipo de COEMERE.

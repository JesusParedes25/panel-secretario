# Estructura del Proyecto

## Panel de Simplificación - Gobierno de Hidalgo

```
panel-secretario/
│
├── 📁 api/                          # Backend Express + Node.js
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js          # Configuración PostgreSQL
│   │   │   └── logger.js            # Winston logger
│   │   ├── middleware/
│   │   │   ├── auth.js              # Autenticación API Key
│   │   │   └── errorHandler.js      # Manejo global de errores
│   │   ├── services/
│   │   │   ├── uploadService.js     # Procesamiento de CSV
│   │   │   └── dataService.js       # Consultas ejecutivas
│   │   ├── controllers/
│   │   │   ├── uploadController.js  # Controlador de carga
│   │   │   └── dataController.js    # Controlador de datos
│   │   ├── routes/
│   │   │   └── index.js             # Definición de rutas API
│   │   └── index.js                 # Entry point del servidor
│   ├── tests/
│   │   └── api.test.js              # Tests con Jest + Supertest
│   ├── package.json
│   ├── jest.config.js
│   ├── Dockerfile
│   └── .env.example
│
├── 📁 web/                          # Frontend React + Vite
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout.jsx           # Layout principal con navbar
│   │   │   ├── KPICard.jsx          # Tarjetas de KPIs
│   │   │   ├── MapView.jsx          # Mapa Leaflet
│   │   │   ├── ParticlesBackground.jsx  # Fondo animado
│   │   │   └── Charts/
│   │   │       ├── FunnelChart.jsx  # Gráfica de embudo
│   │   │       └── StackedBarChart.jsx  # Barras apiladas
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx        # Dashboard ejecutivo
│   │   │   ├── Dependencias.jsx     # Explorador de dependencias
│   │   │   ├── Tramites.jsx         # Buscador de trámites
│   │   │   ├── Carga.jsx            # Carga de CSV
│   │   │   └── Acerca.jsx           # Información del proyecto
│   │   ├── services/
│   │   │   └── api.js               # Cliente Axios
│   │   ├── utils/
│   │   │   └── formatters.js        # Utilidades de formato
│   │   ├── App.jsx                  # Componente principal
│   │   ├── main.jsx                 # Entry point
│   │   └── index.css                # Estilos globales
│   ├── public/
│   │   ├── sample-data/
│   │   │   └── panel_secretario.csv # CSV de ejemplo
│   │   └── vite.svg
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── nginx.conf
│   ├── Dockerfile
│   └── .env.example
│
├── 📁 db/                           # Base de Datos PostgreSQL
│   ├── init/
│   │   ├── 01-schema.sql            # Esquema de tablas
│   │   ├── 02-views.sql             # Vistas ejecutivas
│   │   └── 03-seed.sql              # Datos de ejemplo
│   └── reset.sql                    # Script de reset
│
├── 📁 nginx/                        # Reverse Proxy
│   └── default.conf                 # Configuración Nginx
│
├── 📁 scripts/                      # Scripts de Deployment
│   ├── deploy.sh                    # Deployment automatizado
│   └── renew-certs.sh               # Renovación SSL
│
├── 📁 sample-data/                  # Datos de Prueba
│   └── panel_secretario.csv         # CSV de ejemplo
│
├── 📁 certbot/                      # Let's Encrypt (generado)
│   ├── conf/
│   └── www/
│
├── 📄 docker-compose.yml            # Orquestación de servicios
├── 📄 .env.example                  # Variables de entorno
├── 📄 .gitignore                    # Archivos ignorados por Git
├── 📄 .gitattributes                # Configuración Git
├── 📄 .dockerignore                 # Archivos ignorados por Docker
├── 📄 .editorconfig                 # Configuración del editor
├── 📄 .prettierrc                   # Configuración Prettier
│
├── 📄 package.json                  # Root package.json (workspace)
├── 📄 Makefile                      # Comandos útiles
│
├── 📖 README.md                     # Documentación principal
├── 📖 QUICKSTART.md                 # Guía de inicio rápido
├── 📖 DEPLOYMENT.md                 # Guía de deployment
├── 📖 API_DOCUMENTATION.md          # Documentación de API
├── 📖 CONTRIBUTING.md               # Guía de contribución
├── 📖 SECURITY.md                   # Política de seguridad
├── 📖 CHANGELOG.md                  # Historial de cambios
├── 📖 PROJECT_STRUCTURE.md          # Este archivo
├── 📖 LICENSE                       # Licencia
│
└── 📁 (generados en runtime)
    ├── postgres_data/               # Datos de PostgreSQL (volumen)
    ├── uploads/                     # Archivos subidos (volumen)
    ├── api_logs/                    # Logs del API (volumen)
    └── backups/                     # Backups de BD
```

---

## 🗂️ Descripción de Componentes

### Backend (API)

#### **Config**
- `database.js`: Pool de conexiones a PostgreSQL con pg
- `logger.js`: Sistema de logging con Winston

#### **Middleware**
- `auth.js`: Verificación de API Key en headers
- `errorHandler.js`: Manejo centralizado de errores y respuestas

#### **Services**
- `uploadService.js`: Parseo y validación de CSV, upsert a BD
- `dataService.js`: Consultas complejas, agregaciones, exports

#### **Controllers**
- `uploadController.js`: Lógica de carga de archivos
- `dataController.js`: Lógica de consultas de datos

#### **Routes**
- Define todos los endpoints de la API REST v1

### Frontend (Web)

#### **Components**
- `Layout.jsx`: Header, navegación, footer
- `KPICard.jsx`: Tarjetas reutilizables para métricas
- `MapView.jsx`: Mapa con Leaflet y marcadores
- `ParticlesBackground.jsx`: Animación de fondo sutil
- **Charts/**: Gráficas con Chart.js (Funnel, Barras)

#### **Pages**
- `Dashboard.jsx`: Vista principal con KPIs y gráficas
- `Dependencias.jsx`: Tabla de dependencias con filtros
- `Tramites.jsx`: Buscador de trámites con paginación
- `Carga.jsx`: Interfaz de carga de CSV
- `Acerca.jsx`: Información del proyecto

#### **Services**
- `api.js`: Cliente HTTP con Axios, interceptors

#### **Utils**
- `formatters.js`: Funciones para formatear números, fechas, etc.

### Base de Datos

#### **Schema** (01-schema.sql)
- `dependencias`: Catálogo de instituciones
- `tramites`: Trámites con fases de simplificación
- `carga_logs`: Auditoría de cargas de CSV
- Triggers y funciones de PostgreSQL

#### **Views** (02-views.sql)
- `v_resumen_global`: KPIs globales
- `v_resumen_dependencia`: Métricas por dependencia
- `v_top_tramites`: Top 10 más digitalizados
- `v_tramites_geo`: Trámites con coordenadas

#### **Seed** (03-seed.sql)
- Datos de ejemplo (29 trámites, 10 dependencias)

### Infraestructura

#### **Docker Compose**
- 5 servicios: db, api, web, nginx, certbot
- Volúmenes persistentes
- Health checks
- Network isolation

#### **Nginx**
- Reverse proxy para API y frontend
- Configuración SSL/TLS
- Headers de seguridad
- Compresión gzip

#### **Scripts**
- `deploy.sh`: Deployment completo en Rocky Linux
- `renew-certs.sh`: Renovación automática de SSL

---

## 📦 Dependencias Principales

### Backend
```json
{
  "express": "4.21.0",
  "pg": "^8.13.1",
  "multer": "^1.4.5-lts.1",
  "csv-parse": "^5.6.0",
  "cors": "^2.8.5",
  "winston": "^3.17.0",
  "helmet": "^8.0.0"
}
```

### Frontend
```json
{
  "react": "19.1.0",
  "react-router-dom": "^7.1.3",
  "axios": "^1.7.9",
  "chart.js": "^4.4.7",
  "leaflet": "^1.9.4",
  "tailwindcss": "^4.1.7",
  "daisyui": "^5.0.0"
}
```

---

## 🔄 Flujo de Datos

```
┌─────────────┐
│  Usuario    │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────┐
│      Nginx (Reverse Proxy)      │
│  - Rutas /api/* → API Backend   │
│  - Rutas /* → React Frontend    │
└────────┬──────────────┬─────────┘
         │              │
    /api/*              /*
         │              │
         ▼              ▼
┌──────────────┐  ┌──────────────┐
│   API REST   │  │  React SPA   │
│  (Express)   │  │   (Vite)     │
└──────┬───────┘  └──────────────┘
       │
       │ SQL Queries
       ▼
┌──────────────────┐
│   PostgreSQL     │
│   + PostGIS      │
└──────────────────┘
```

---

## 🎨 Arquitectura de Frontend

```
App.jsx (Router)
  │
  ├── Layout.jsx (Navbar, Footer)
  │     │
  │     └── ParticlesBackground.jsx
  │
  ├── Dashboard.jsx
  │     ├── KPICard × 4
  │     ├── FunnelChart
  │     ├── StackedBarChart
  │     └── MapView
  │
  ├── Dependencias.jsx
  │     └── Tabla con filtros
  │
  ├── Tramites.jsx
  │     └── Tabla con paginación
  │
  ├── Carga.jsx
  │     └── Upload con drag & drop
  │
  └── Acerca.jsx
```

---

## 🔌 API Endpoints

```
/api/v1
  ├── GET  /health                    # Health check
  ├── POST /upload/csv                # Subir CSV (requiere API Key)
  ├── GET  /resumen/global            # KPIs globales
  ├── GET  /resumen/dependencias      # Resumen por dependencia
  ├── GET  /tramites                  # Lista de trámites (filtrable)
  ├── GET  /kpis                      # Datos para gráficas
  ├── GET  /tramites/geo              # Trámites con coordenadas
  └── GET  /export/csv                # Exportar a CSV
```

---

## 🗄️ Esquema de Base de Datos

```sql
dependencias
  ├── id (PK)
  ├── nombre (UNIQUE)
  ├── created_at
  └── updated_at

tramites
  ├── id (PK)
  ├── dependencia_id (FK → dependencias.id)
  ├── nombre
  ├── nivel_digitalizacion (0.0 - 6.0)
  ├── fase1_tramites_intervenidos (BOOLEAN)
  ├── fase2_modelado (BOOLEAN)
  ├── fase3_reingenieria (BOOLEAN)
  ├── fase4_digitalizacion (BOOLEAN)
  ├── fase5_implementacion (BOOLEAN)
  ├── fase6_liberacion (BOOLEAN)
  ├── geolocation (GEOMETRY Point)
  ├── metadata (JSONB)
  ├── created_at
  └── updated_at

carga_logs
  ├── id (PK)
  ├── filename
  ├── rows_read
  ├── rows_inserted
  ├── rows_invalid
  ├── errors (JSONB)
  ├── uploaded_by
  └── created_at
```

---

## 🚀 Comandos Rápidos

```bash
# Desarrollo
make dev                # Levantar con logs
make dev-api            # Solo API (local)
make dev-web            # Solo frontend (local)

# Producción
make build              # Construir imágenes
make up                 # Levantar servicios
make down               # Detener servicios

# Mantenimiento
make logs               # Ver logs
make status             # Ver estado
make backup-db          # Backup de BD
make ssl-cert           # Obtener SSL

# Testing
make test               # Ejecutar tests
make health             # Health check
```

---

## 📊 Métricas del Proyecto

- **Lenguajes**: JavaScript (ES6+), SQL, Shell
- **Frameworks**: React 19, Express 4
- **Base de Datos**: PostgreSQL 15 + PostGIS 3.3
- **Líneas de Código**: ~6,000+
- **Componentes React**: 15+
- **Endpoints API**: 8
- **Tablas BD**: 3
- **Vistas BD**: 4
- **Tests**: 10+

---

**Última actualización**: 14 de enero de 2025

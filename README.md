# Panel de Simplificación – Gobierno de Hidalgo

Plataforma institucional de analítica ejecutiva para mostrar al Secretario y Gobernador los avances del proceso de simplificación de trámites estatales realizados por la Comisión Estatal de Mejora Regulatoria.

## 🎯 Características

- **Dashboard Ejecutivo**: KPIs, gráficas de funnel, barras apiladas por dependencia
- **Explorador de Dependencias**: Ranking y métricas por institución
- **Buscador de Trámites**: Filtros avanzados y tabla paginada
- **Carga de Datos**: Import CSV con validación y logs
- **Exportación**: Descarga del estado actual en CSV
- **Mapa Interactivo**: Visualización geográfica (Leaflet + PostGIS)
- **Responsive**: Diseño optimizado para móviles y escritorio

## 🛠 Stack Tecnológico

### Frontend
- React 19.1.0
- Vite (dev server / build)
- React Router DOM v7
- TailwindCSS 4.1.7
- DaisyUI 5.0
- Chart.js + react-chartjs-2
- Leaflet + react-leaflet
- Axios
- Heroicons + React Icons
- react-tsparticles

### Backend
- Node.js 20 LTS
- Express 4.21
- pg (PostgreSQL client)
- Multer (file uploads)
- csv-parse
- CORS

### Base de Datos
- PostgreSQL 15
- PostGIS 3.3

### Infraestructura
- Docker & Docker Compose
- Nginx (reverse proxy)
- Let's Encrypt (SSL/TLS)
- Rocky Linux

## 🎨 Colores Institucionales

- **Primario**: #9F2241 (Pantone 7420 C)
- **Secundario**: #235B4E (Pantone 626 C)
- **Acentos**: #BC955C (465 C), #DDC9A3 (468 C)
- **Neutros**: #6F7271, #98989A, #10312B, #691C32

## 📁 Estructura del Proyecto

```
panel-secretario/
├── api/                    # Backend Express
│   ├── src/
│   │   ├── config/        # Configuración
│   │   ├── routes/        # Rutas API
│   │   ├── controllers/   # Controladores
│   │   ├── services/      # Lógica de negocio
│   │   ├── middleware/    # Middlewares
│   │   └── index.js       # Entry point
│   ├── tests/             # Tests con supertest
│   ├── package.json
│   └── .env.example
├── web/                   # Frontend React
│   ├── src/
│   │   ├── components/    # Componentes React
│   │   ├── pages/         # Páginas
│   │   ├── services/      # API client
│   │   ├── hooks/         # Custom hooks
│   │   ├── utils/         # Utilidades
│   │   └── App.jsx        # App principal
│   ├── public/
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
├── db/                    # PostgreSQL
│   ├── init/
│   │   ├── 01-schema.sql
│   │   ├── 02-views.sql
│   │   └── 03-seed.sql
│   └── reset.sql
├── nginx/                 # Nginx config
│   └── default.conf
├── scripts/               # Scripts de deployment
│   ├── deploy.sh
│   └── renew-certs.sh
├── sample-data/           # Datos de prueba
│   └── panel_secretario.csv
├── docker-compose.yml
├── .env.example
└── README.md
```

## 🚀 Instalación y Despliegue

### Desarrollo Local

1. **Clonar repositorio**:
```bash
git clone <repo-url>
cd panel-secretario
```

2. **Configurar variables de entorno**:
```bash
cp .env.example .env
# Editar .env con tus valores
```

3. **Levantar servicios con Docker**:
```bash
docker-compose up -d
```

4. **Acceder a la aplicación**:
- Frontend: http://localhost
- API: http://localhost/api/v1/health

### Despliegue en Producción (Rocky Linux)

**Requisitos**: Servidor con Rocky Linux 8+, dominio DNS configurado.

```bash
# Ejecutar script de deployment
bash scripts/deploy.sh

# El script instalará Docker, configurará servicios y emitirá certificados SSL
```

## 📊 Formato de CSV

El archivo CSV debe tener la siguiente estructura:

```csv
dependencia,tramite,nivel_digitalizacion,fase1_tramites_intervenidos,fase2_modelado,fase3_reingenieria,fase4_digitalizacion,fase5_implementacion,fase6_liberacion
SECRETARÍA DE SEGURIDAD PÚBLICA,Prevención Social de la Violencia y la Delincuencia,1,1,1,1,0,0,0
SECRETARÍA DE EDUCACIÓN PÚBLICA,Registro de Título Profesional,5,1,1,1,1,1,1
```

**Notas**:
- `nivel_digitalizacion`: Número decimal (0.0 - 6.0)
- Fases: Valores binarios (0 o 1)
- Delimitador: coma (,) o tabulador (\t)

## 🔒 Seguridad

- Autenticación por API Key (`x-api-key` header)
- CORS configurado para dominios específicos
- Rate limiting en endpoints de carga
- Validación y sanitización de inputs
- Headers de seguridad (HSTS, CSP, X-Frame-Options)
- SSL/TLS con Let's Encrypt

## 🧪 Testing

```bash
# Backend tests
cd api
npm test

# Frontend tests (si se implementan)
cd web
npm test
```

## 📡 API Endpoints

### Health Check
- `GET /api/v1/health` - Estado del servicio

### Carga de Datos
- `POST /api/v1/upload/csv` - Subir archivo CSV

### Consultas
- `GET /api/v1/resumen/global` - KPIs globales
- `GET /api/v1/resumen/dependencias` - Resumen por dependencia
- `GET /api/v1/tramites?dependencia=&search=` - Lista de trámites
- `GET /api/v1/kpis` - Datos para gráficas

### Exportación
- `GET /api/v1/export/csv` - Exportar datos actuales

## 🎨 Tema y Accesibilidad

- Contraste WCAG AA
- Tamaños de fuente ≥ 14px
- Tooltips descriptivos
- Modo claro/oscuro
- Navegación por teclado

## 📝 Licencia

Gobierno del Estado de Hidalgo - Comisión Estatal de Mejora Regulatoria

## 👥 Soporte

Para soporte técnico, contactar a [correo de soporte]

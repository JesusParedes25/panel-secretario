# Guía Rápida de Inicio

## Panel de Simplificación - Gobierno de Hidalgo

### ⚡ Inicio Rápido (Desarrollo Local)

#### Prerequisitos
- Docker y Docker Compose instalados
- Git

#### Pasos

1. **Clonar el repositorio**
```bash
git clone <repo-url>
cd panel-secretario
```

2. **Configurar variables de entorno**
```bash
cp .env.example .env
```

Edita el archivo `.env` y configura:
- `API_KEY`: Una clave API segura
- `PGPASSWORD`: Contraseña para PostgreSQL
- `CORS_ORIGINS`: Orígenes permitidos (separados por coma)

3. **Levantar todos los servicios**
```bash
docker-compose up -d
```

4. **Verificar que todo está funcionando**
```bash
docker-compose ps
```

Deberías ver 5 servicios corriendo:
- `panel-secretario-db` (PostgreSQL + PostGIS)
- `panel-secretario-api` (Backend Express)
- `panel-secretario-web` (Frontend React)
- `panel-secretario-nginx` (Reverse Proxy)
- `panel-secretario-certbot` (SSL/TLS)

5. **Acceder a la aplicación**

Abre tu navegador y visita:
- **Frontend**: http://localhost
- **API Health**: http://localhost/api/v1/health

### 📊 Cargar Datos Iniciales

La base de datos se inicializa automáticamente con datos de ejemplo. Para cargar tus propios datos:

1. Accede a http://localhost/carga
2. Sube tu archivo CSV
3. El archivo debe tener esta estructura:

```csv
dependencia,tramite,nivel_digitalizacion,fase1_tramites_intervenidos,fase2_modelado,fase3_reingenieria,fase4_digitalizacion,fase5_implementacion,fase6_liberacion
SECRETARÍA DE EJEMPLO,Trámite de Ejemplo,3.5,1,1,1,1,0,0
```

### 🔧 Comandos Útiles

#### Ver logs de todos los servicios
```bash
docker-compose logs -f
```

#### Ver logs de un servicio específico
```bash
docker-compose logs -f api
docker-compose logs -f web
docker-compose logs -f db
```

#### Reiniciar servicios
```bash
docker-compose restart
```

#### Detener servicios
```bash
docker-compose down
```

#### Detener y eliminar volúmenes (⚠️ Elimina todos los datos)
```bash
docker-compose down -v
```

#### Reconstruir imágenes
```bash
docker-compose build --no-cache
docker-compose up -d
```

### 🗄️ Acceso a la Base de Datos

Puedes conectarte a PostgreSQL usando:

```bash
docker-compose exec db psql -U panel_user -d panel_secretario
```

O desde tu cliente PostgreSQL favorito:
- **Host**: localhost
- **Port**: 5432
- **Database**: panel_secretario
- **User**: panel_user
- **Password**: (el que configuraste en .env)

### 🚀 Deployment en Producción (Rocky Linux)

Para desplegar en un servidor de producción:

1. **Copiar archivos al servidor**
```bash
scp -r panel-secretario/ user@your-server:/opt/
```

2. **Conectar al servidor**
```bash
ssh user@your-server
cd /opt/panel-secretario
```

3. **Ejecutar script de deployment**
```bash
sudo bash scripts/deploy.sh
```

El script automáticamente:
- Instala Docker y Docker Compose
- Configura el firewall
- Crea archivos .env con credenciales seguras
- Levanta todos los servicios
- (Opcional) Configura SSL/TLS con Let's Encrypt

### 🔒 Configurar SSL/TLS

Si tienes un dominio configurado, el script de deployment te preguntará si deseas configurar SSL. También puedes hacerlo manualmente:

1. **Obtener certificado**
```bash
docker-compose run --rm certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email tu@email.com \
  --agree-tos \
  -d tu-dominio.com
```

2. **Actualizar nginx/default.conf**
   - Descomenta las líneas relacionadas con SSL
   - Reemplaza `DOMAIN` con tu dominio real

3. **Reiniciar Nginx**
```bash
docker-compose restart nginx
```

### 🧪 Testing

#### Backend Tests
```bash
cd api
npm install
npm test
```

#### Verificar API manualmente
```bash
# Health check
curl http://localhost/api/v1/health

# Resumen global
curl http://localhost/api/v1/resumen/global

# Listar trámites
curl http://localhost/api/v1/tramites
```

### 📱 Desarrollo Local (sin Docker)

Si prefieres desarrollar sin Docker:

#### Backend
```bash
cd api
npm install
cp .env.example .env
# Configurar conexión a PostgreSQL local
npm run dev
```

#### Frontend
```bash
cd web
npm install
cp .env.example .env
# Configurar VITE_API_URL
npm run dev
```

### 🐛 Troubleshooting

#### Los servicios no inician
```bash
# Ver logs detallados
docker-compose logs

# Verificar puertos en uso
netstat -tulpn | grep -E '(80|443|5432|8080|3000)'
```

#### Error de permisos en volúmenes
```bash
# Dar permisos a directorios
sudo chown -R $USER:$USER .
```

#### Base de datos no se inicializa
```bash
# Recrear volumen de base de datos
docker-compose down -v
docker-compose up -d db
docker-compose logs -f db
```

#### Frontend no se conecta al API
- Verifica que CORS_ORIGINS en .env incluya tu origen
- Verifica que el API esté corriendo: `curl http://localhost:8080/api/v1/health`

### 📚 Recursos Adicionales

- **README completo**: Ver `README.md`
- **Documentación de API**: Los endpoints están documentados en el código
- **Colores institucionales**: Ver `web/tailwind.config.js`

### 💡 Tips

1. **Monitoreo**: Usa `docker stats` para ver uso de recursos
2. **Backups**: Exporta regularmente los datos con el endpoint `/api/v1/export/csv`
3. **Logs**: Los logs del API se guardan en el volumen `api_logs`
4. **Actualizaciones**: Ejecuta `git pull && docker-compose build && docker-compose up -d`

---

Para soporte, contacta al equipo de COEMERE - Gobierno del Estado de Hidalgo

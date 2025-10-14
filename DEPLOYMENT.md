# Guía de Deployment

## Panel de Simplificación - Gobierno de Hidalgo

Esta guía detalla los pasos para desplegar la plataforma en diferentes ambientes.

---

## 📋 Prerequisitos

### Mínimos del Sistema

- **OS**: Rocky Linux 8+ (recomendado) o cualquier distribución compatible con Docker
- **CPU**: 2 cores mínimo, 4 cores recomendado
- **RAM**: 4GB mínimo, 8GB recomendado
- **Disco**: 20GB mínimo, 50GB recomendado
- **Red**: Conexión a internet estable

### Software Requerido

- Git
- Docker 20.10+
- Docker Compose 2.0+
- (Opcional) Make para usar Makefile

---

## 🚀 Deployment Rápido (Rocky Linux)

### Opción 1: Script Automatizado

```bash
# Clonar repositorio
git clone <repo-url>
cd panel-secretario

# Ejecutar script de deployment
sudo bash scripts/deploy.sh
```

El script automáticamente:
- ✅ Instala Docker y Docker Compose
- ✅ Configura firewall
- ✅ Genera credenciales seguras
- ✅ Levanta servicios
- ✅ (Opcional) Configura SSL/TLS

### Opción 2: Manual con Makefile

```bash
# 1. Clonar repositorio
git clone <repo-url>
cd panel-secretario

# 2. Crear archivo .env
make env
# Editar .env con tus valores

# 3. Construir y levantar servicios
make build
make up

# 4. Verificar estado
make status
make health
```

---

## 🔧 Deployment Detallado

### Paso 1: Preparar el Servidor

#### Actualizar sistema
```bash
sudo dnf update -y
```

#### Instalar Git
```bash
sudo dnf install -y git
```

#### Instalar Docker
```bash
# Agregar repositorio
sudo dnf config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo

# Instalar Docker
sudo dnf install -y docker-ce docker-ce-cli containerd.io

# Iniciar y habilitar Docker
sudo systemctl start docker
sudo systemctl enable docker

# Verificar instalación
docker --version
```

#### Instalar Docker Compose
```bash
# Descargar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" \
  -o /usr/local/bin/docker-compose

# Dar permisos de ejecución
sudo chmod +x /usr/local/bin/docker-compose

# Verificar instalación
docker-compose --version
```

#### Configurar Firewall
```bash
# Permitir HTTP/HTTPS
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload

# Verificar reglas
sudo firewall-cmd --list-all
```

### Paso 2: Clonar Repositorio

```bash
# Crear directorio de aplicaciones
sudo mkdir -p /opt
cd /opt

# Clonar repositorio
sudo git clone <repo-url> panel-secretario
cd panel-secretario

# Cambiar ownership
sudo chown -R $USER:$USER .
```

### Paso 3: Configurar Variables de Entorno

```bash
# Copiar archivo de ejemplo
cp .env.example .env

# Editar con tu editor preferido
vim .env  # o nano .env
```

#### Variables Críticas a Configurar

```bash
# API Key (generar una segura)
API_KEY=$(openssl rand -hex 32)

# PostgreSQL Password (generar una segura)
PGPASSWORD=$(openssl rand -base64 24 | tr -d "=+/" | cut -c1-24)

# Dominio público (si tienes)
PUBLIC_BASE_URL=https://panel.hidalgo.gob.mx

# CORS Origins
CORS_ORIGINS=https://panel.hidalgo.gob.mx
```

**⚠️ IMPORTANTE**: Guarda estas credenciales en un lugar seguro (gestor de contraseñas).

### Paso 4: Levantar Servicios

```bash
# Construir imágenes
docker-compose build

# Levantar servicios en background
docker-compose up -d

# Verificar que todos los servicios están corriendo
docker-compose ps
```

Deberías ver 5 contenedores:
- `panel-secretario-db` (healthy)
- `panel-secretario-api` (healthy)
- `panel-secretario-web` (healthy)
- `panel-secretario-nginx` (running)
- `panel-secretario-certbot` (running)

### Paso 5: Verificar Funcionamiento

```bash
# Health check del API
curl http://localhost/api/v1/health

# Acceder al dashboard
# Abrir navegador en: http://[IP-del-servidor]
```

### Paso 6: Configurar SSL/TLS (Producción)

#### Prerrequisitos
- Dominio apuntando a tu servidor
- Puerto 80 y 443 abiertos

#### Obtener Certificado

```bash
# Ejecutar certbot
docker-compose run --rm certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email tu-email@hidalgo.gob.mx \
  --agree-tos \
  --no-eff-email \
  -d panel.hidalgo.gob.mx
```

#### Actualizar Nginx

1. Editar `nginx/default.conf`:
```bash
vim nginx/default.conf
```

2. Descomentar líneas SSL:
```nginx
# Descomentar estas líneas:
listen 443 ssl http2;
ssl_certificate /etc/letsencrypt/live/panel.hidalgo.gob.mx/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/panel.hidalgo.gob.mx/privkey.pem;
```

3. Reemplazar `DOMAIN` con tu dominio real

4. Reiniciar Nginx:
```bash
docker-compose restart nginx
```

#### Configurar Renovación Automática

```bash
# Agregar a crontab
sudo crontab -e

# Agregar esta línea (renueva cada semana)
0 0 * * 0 cd /opt/panel-secretario && bash scripts/renew-certs.sh >> /var/log/letsencrypt-renew.log 2>&1
```

---

## 🔄 Actualizaciones

### Actualizar Código

```bash
# Detener servicios
docker-compose down

# Actualizar código
git pull

# Reconstruir imágenes
docker-compose build

# Levantar servicios
docker-compose up -d

# Verificar
docker-compose ps
```

### Con Makefile

```bash
make update
```

---

## 💾 Backups

### Backup de Base de Datos

#### Manual
```bash
# Crear directorio de backups
mkdir -p backups

# Crear backup
docker-compose exec -T db pg_dump -U panel_user panel_secretario > backups/backup-$(date +%Y%m%d-%H%M%S).sql

# Comprimir
gzip backups/backup-*.sql
```

#### Con Makefile
```bash
make backup-db
```

#### Automatizado (Cron)
```bash
# Editar crontab
crontab -e

# Backup diario a las 2 AM
0 2 * * * cd /opt/panel-secretario && docker-compose exec -T db pg_dump -U panel_user panel_secretario | gzip > backups/backup-$(date +\%Y\%m\%d).sql.gz
```

### Restaurar Backup

```bash
# Descomprimir (si está comprimido)
gunzip backups/backup-20250114.sql.gz

# Restaurar
cat backups/backup-20250114.sql | docker-compose exec -T db psql -U panel_user -d panel_secretario
```

O con Makefile:
```bash
make restore-db FILE=backups/backup-20250114.sql
```

---

## 📊 Monitoreo

### Ver Logs

```bash
# Todos los servicios
docker-compose logs -f

# Solo API
docker-compose logs -f api

# Solo frontend
docker-compose logs -f web

# Solo base de datos
docker-compose logs -f db
```

### Uso de Recursos

```bash
# Ver estadísticas en tiempo real
docker stats

# O con Makefile
make stats
```

### Health Checks

```bash
# API
curl http://localhost/api/v1/health

# Frontend
curl http://localhost/

# Con Makefile
make health
```

---

## 🐛 Troubleshooting

### Servicios no inician

```bash
# Ver logs detallados
docker-compose logs

# Verificar puertos en uso
sudo netstat -tulpn | grep -E '(80|443|5432|8080|3000)'

# Liberar puertos si es necesario
sudo systemctl stop httpd  # Apache
sudo systemctl stop nginx  # Nginx existente
```

### Error de permisos

```bash
# Dar permisos correctos
sudo chown -R $USER:$USER /opt/panel-secretario

# Permisos de Docker socket
sudo usermod -aG docker $USER
```

### Base de datos no se conecta

```bash
# Verificar que el servicio db esté healthy
docker-compose ps

# Ver logs de PostgreSQL
docker-compose logs db

# Reiniciar solo la base de datos
docker-compose restart db
```

### Frontend no carga

```bash
# Verificar build del frontend
docker-compose logs web

# Reconstruir
docker-compose build web
docker-compose up -d web
```

---

## 🔐 Seguridad Post-Deployment

### 1. Cambiar Credenciales Por Defecto
```bash
# Generar nuevas credenciales
vim .env
# Actualizar API_KEY y PGPASSWORD
docker-compose down
docker-compose up -d
```

### 2. Configurar Fail2Ban (Opcional)
```bash
sudo dnf install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 3. Actualizar Sistema Regularmente
```bash
# Configurar actualizaciones automáticas
sudo dnf install -y dnf-automatic
sudo systemctl enable --now dnf-automatic.timer
```

### 4. Monitorear Logs
```bash
# Instalar logwatch
sudo dnf install -y logwatch

# Configurar para enviar reportes diarios
sudo vim /etc/cron.daily/0logwatch
```

---

## 📱 Verificación Final

### Checklist Post-Deployment

- [ ] Todos los contenedores están corriendo
- [ ] Health checks pasan (API y Frontend)
- [ ] Dashboard carga correctamente
- [ ] Se pueden cargar datos vía CSV
- [ ] Exportación de CSV funciona
- [ ] SSL/TLS configurado (producción)
- [ ] Backups automáticos configurados
- [ ] Monitoreo funcionando
- [ ] Logs se guardan correctamente
- [ ] Firewall configurado
- [ ] Credenciales guardadas de forma segura
- [ ] Documentación entregada al equipo

---

## 📞 Soporte

Para problemas de deployment:
- **Email**: [soporte@coemere.hidalgo.gob.mx]
- **Teléfono**: [teléfono]
- **Documentación**: Ver README.md y QUICKSTART.md

---

**Última actualización**: 14 de enero de 2025

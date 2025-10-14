# 🚀 Guía de Despliegue - Rocky Linux

Guía completa para desplegar el Panel Secretario en un servidor Rocky Linux con dominio `https://avances-tys.hidalgo.gob.mx/`

---

## 📋 Requisitos Previos

### Servidor
- **OS**: Rocky Linux 8 o 9
- **RAM**: Mínimo 2GB (recomendado 4GB)
- **Disco**: Mínimo 20GB libres
- **Acceso**: SSH con sudo

### Dominio
- **DNS**: `avances-tys.hidalgo.gob.mx` debe apuntar a la IP del servidor
- Configurar registros DNS:
  ```
  A     avances-tys.hidalgo.gob.mx    →  TU_IP_SERVIDOR
  ```

---

## 🎯 Opción 1: Despliegue Automático (Recomendado)

### Paso 1: Conectarse al servidor

```bash
ssh usuario@TU_IP_SERVIDOR
```

### Paso 2: Descargar y ejecutar script

```bash
# Descargar script de despliegue
curl -o deploy.sh https://raw.githubusercontent.com/JesusParedes25/panel-secretario/main/deploy-rocky.sh

# Dar permisos de ejecución
chmod +x deploy.sh

# Ejecutar (esto puede tomar 10-15 minutos)
./deploy.sh
```

El script automáticamente:
- ✅ Instala Docker y Docker Compose
- ✅ Configura el firewall (puertos 80/443)
- ✅ Clona el repositorio
- ✅ Genera contraseñas seguras
- ✅ Configura variables de entorno
- ✅ Obtiene certificado SSL (Let's Encrypt)
- ✅ Inicia la aplicación
- ✅ Configura inicio automático

### Paso 3: Verificar

```bash
# Ver logs en tiempo real
cd /opt/panel-secretario
docker-compose logs -f
```

Accede a: **https://avances-tys.hidalgo.gob.mx/**

---

## 🔧 Opción 2: Despliegue Manual

### 1. Preparar el servidor

```bash
# Actualizar sistema
sudo dnf update -y

# Instalar dependencias
sudo dnf install -y git curl wget vim
```

### 2. Instalar Docker

```bash
# Agregar repositorio de Docker
sudo dnf config-manager --add-repo=https://download.docker.com/linux/centos/docker-ce.repo

# Instalar Docker
sudo dnf install -y docker-ce docker-ce-cli containerd.io

# Iniciar Docker
sudo systemctl start docker
sudo systemctl enable docker

# Agregar usuario al grupo docker
sudo usermod -aG docker $USER

# Aplicar cambios (cerrar sesión y volver a entrar)
exit
```

### 3. Instalar Docker Compose

```bash
# Descargar última versión
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# Dar permisos
sudo chmod +x /usr/local/bin/docker-compose

# Verificar instalación
docker-compose --version
```

### 4. Configurar Firewall

```bash
# Abrir puertos HTTP y HTTPS
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload

# Verificar
sudo firewall-cmd --list-all
```

### 5. Clonar repositorio

```bash
# Crear directorio
sudo mkdir -p /opt/panel-secretario
sudo chown $USER:$USER /opt/panel-secretario

# Clonar
cd /opt/panel-secretario
git clone https://github.com/JesusParedes25/panel-secretario.git .
```

### 6. Configurar variables de entorno

```bash
# Copiar ejemplo
cp .env.example .env

# Editar (usar nano o vim)
nano .env
```

**Actualizar estas variables:**
```env
NODE_ENV=production

# Base de datos (cambiar password)
PGPASSWORD=TuPasswordSegura123!

# API Key (generar una segura)
API_KEY=tu-api-key-super-secreta-aqui

# Dominio
DOMAIN=avances-tys.hidalgo.gob.mx
EMAIL=admin@hidalgo.gob.mx
PUBLIC_BASE_URL=https://avances-tys.hidalgo.gob.mx
CORS_ORIGINS=https://avances-tys.hidalgo.gob.mx
```

**Generar contraseñas seguras:**
```bash
# DB Password
openssl rand -base64 32

# API Key
openssl rand -hex 32
```

### 7. Iniciar aplicación

```bash
# Construir e iniciar contenedores
docker-compose up -d --build

# Ver logs
docker-compose logs -f

# Verificar estado
docker-compose ps
```

### 8. Configurar SSL (Let's Encrypt)

```bash
# Esperar 30 segundos para que nginx esté listo
sleep 30

# Obtener certificado
docker-compose exec certbot certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email admin@hidalgo.gob.mx \
  --agree-tos \
  --no-eff-email \
  -d avances-tys.hidalgo.gob.mx

# Reiniciar nginx
docker-compose restart nginx
```

### 9. Configurar renovación automática

```bash
# Agregar cron job para renovar certificados
crontab -e

# Agregar esta línea:
0 3 * * * cd /opt/panel-secretario && docker-compose run --rm certbot renew && docker-compose restart nginx
```

### 10. Configurar inicio automático

```bash
# Crear archivo de servicio
sudo nano /etc/systemd/system/panel-secretario.service
```

Contenido:
```ini
[Unit]
Description=Panel Secretario - Gobierno de Hidalgo
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/panel-secretario
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
```

Activar:
```bash
sudo systemctl daemon-reload
sudo systemctl enable panel-secretario
sudo systemctl start panel-secretario
```

---

## 📊 Verificación

### 1. Verificar contenedores

```bash
cd /opt/panel-secretario
docker-compose ps
```

Deberías ver 5 contenedores corriendo:
- `panel-secretario-db` (PostgreSQL)
- `panel-secretario-api` (Node.js API)
- `panel-secretario-web` (Frontend React)
- `panel-secretario-nginx` (Nginx)
- `panel-secretario-certbot` (Let's Encrypt)

### 2. Verificar logs

```bash
# Todos los servicios
docker-compose logs -f

# Solo API
docker-compose logs -f api

# Solo Nginx
docker-compose logs -f nginx
```

### 3. Verificar SSL

```bash
# Verificar certificado
curl -I https://avances-tys.hidalgo.gob.mx

# Debería responder con "HTTP/2 200"
```

### 4. Verificar base de datos

```bash
# Conectarse a PostgreSQL
docker-compose exec db psql -U panel_user -d panel_secretario

# Verificar tablas
\dt

# Salir
\q
```

---

## 🔄 Operaciones Comunes

### Ver logs en tiempo real
```bash
cd /opt/panel-secretario
docker-compose logs -f
```

### Reiniciar servicios
```bash
cd /opt/panel-secretario
docker-compose restart
```

### Detener aplicación
```bash
cd /opt/panel-secretario
docker-compose down
```

### Actualizar desde GitHub
```bash
cd /opt/panel-secretario
git pull origin main
docker-compose up -d --build
```

### Backup de base de datos
```bash
# Crear backup
docker-compose exec db pg_dump -U panel_user panel_secretario > backup_$(date +%Y%m%d).sql

# Restaurar backup
docker-compose exec -T db psql -U panel_user panel_secretario < backup_20250101.sql
```

### Ver uso de recursos
```bash
docker stats
```

---

## 🛠️ Solución de Problemas

### Problema: No puedo acceder a la aplicación

**Verificar DNS:**
```bash
nslookup avances-tys.hidalgo.gob.mx
ping avances-tys.hidalgo.gob.mx
```

**Verificar firewall:**
```bash
sudo firewall-cmd --list-all
```

**Verificar contenedores:**
```bash
docker-compose ps
docker-compose logs nginx
```

### Problema: Error SSL

**Verificar certificado:**
```bash
docker-compose exec certbot certbot certificates
```

**Renovar manualmente:**
```bash
docker-compose exec certbot certbot renew --force-renewal
docker-compose restart nginx
```

### Problema: Base de datos no responde

**Verificar logs:**
```bash
docker-compose logs db
```

**Reiniciar:**
```bash
docker-compose restart db
```

**Verificar conexión:**
```bash
docker-compose exec db pg_isready -U panel_user
```

### Problema: Puerto 80/443 en uso

```bash
# Ver qué está usando el puerto
sudo netstat -tulpn | grep :80
sudo netstat -tulpn | grep :443

# Detener servicio conflictivo (ejemplo: Apache)
sudo systemctl stop httpd
sudo systemctl disable httpd
```

---

## 📱 Cargar Datos

1. Accede a **https://avances-tys.hidalgo.gob.mx/**
2. En la esquina **inferior izquierda**, verás un botón circular gris 📤
3. Click en el botón → "Carga de Datos"
4. Sube tu archivo CSV con los datos de trámites

---

## 🔒 Seguridad

### Cambiar contraseñas por defecto

```bash
cd /opt/panel-secretario
nano .env

# Cambiar:
# - PGPASSWORD
# - API_KEY
```

### Limitar acceso SSH

```bash
sudo nano /etc/ssh/sshd_config

# Cambiar:
# PermitRootLogin no
# PasswordAuthentication no (usar solo SSH keys)

sudo systemctl restart sshd
```

### Configurar SELinux (opcional)

```bash
# Verificar estado
getenforce

# Si está en Enforcing y hay problemas:
sudo setenforce 0

# O configurar correctamente con:
sudo setsebool -P httpd_can_network_connect 1
```

---

## 📈 Monitoreo

### Instalar Netdata (opcional)

```bash
bash <(curl -Ss https://my-netdata.io/kickstart.sh)
```

Accede a: `http://TU_IP:19999`

---

## 🆘 Soporte

Si tienes problemas:

1. **Revisa los logs**: `docker-compose logs -f`
2. **Verifica el estado**: `docker-compose ps`
3. **Consulta la documentación**: Ver archivos en `/opt/panel-secretario/`
4. **GitHub Issues**: https://github.com/JesusParedes25/panel-secretario/issues

---

## 📝 Checklist Final

- [ ] Servidor Rocky Linux configurado
- [ ] DNS apuntando al servidor
- [ ] Firewall configurado (puertos 80/443)
- [ ] Docker y Docker Compose instalados
- [ ] Repositorio clonado en `/opt/panel-secretario`
- [ ] Archivo `.env` configurado con contraseñas seguras
- [ ] Contenedores iniciados correctamente
- [ ] Certificado SSL obtenido
- [ ] Aplicación accesible en https://avances-tys.hidalgo.gob.mx
- [ ] Renovación automática de certificados configurada
- [ ] Inicio automático configurado
- [ ] Datos CSV cargados

---

**¡Listo! Tu Panel Secretario está desplegado. 🎉**

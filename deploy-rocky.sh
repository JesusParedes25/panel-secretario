#!/bin/bash

###############################################################################
# Script de Despliegue - Panel Secretario
# Rocky Linux + Docker + HTTPS
# Dominio: avances-tys.hidalgo.gob.mx
###############################################################################

set -e  # Salir si hay error

echo "🚀 Iniciando despliegue del Panel Secretario..."

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Variables
DOMAIN="avances-tys.hidalgo.gob.mx"
EMAIL="admin@hidalgo.gob.mx"
APP_DIR="/opt/panel-secretario"
REPO_URL="https://github.com/JesusParedes25/panel-secretario.git"

###############################################################################
# 1. Verificar que estamos en Rocky Linux
###############################################################################
echo -e "${BLUE}📋 Verificando sistema operativo...${NC}"
if [ -f /etc/rocky-release ]; then
    echo -e "${GREEN}✅ Rocky Linux detectado${NC}"
    cat /etc/rocky-release
else
    echo -e "${RED}⚠️  Este script está diseñado para Rocky Linux${NC}"
    read -p "¿Deseas continuar de todos modos? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

###############################################################################
# 2. Instalar dependencias del sistema
###############################################################################
echo -e "${BLUE}📦 Instalando dependencias del sistema...${NC}"

# Actualizar sistema
sudo dnf update -y

# Instalar utilidades básicas
sudo dnf install -y git curl wget vim nano

# Instalar Docker
if ! command -v docker &> /dev/null; then
    echo -e "${BLUE}🐳 Instalando Docker...${NC}"
    sudo dnf config-manager --add-repo=https://download.docker.com/linux/centos/docker-ce.repo
    sudo dnf install -y docker-ce docker-ce-cli containerd.io
    sudo systemctl start docker
    sudo systemctl enable docker
    sudo usermod -aG docker $USER
    echo -e "${GREEN}✅ Docker instalado${NC}"
else
    echo -e "${GREEN}✅ Docker ya está instalado${NC}"
fi

# Instalar Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo -e "${BLUE}🐳 Instalando Docker Compose...${NC}"
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    echo -e "${GREEN}✅ Docker Compose instalado${NC}"
else
    echo -e "${GREEN}✅ Docker Compose ya está instalado${NC}"
fi

###############################################################################
# 3. Configurar Firewall
###############################################################################
echo -e "${BLUE}🔥 Configurando firewall...${NC}"
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
echo -e "${GREEN}✅ Firewall configurado (puertos 80 y 443 abiertos)${NC}"

###############################################################################
# 4. Clonar repositorio
###############################################################################
echo -e "${BLUE}📥 Descargando código desde GitHub...${NC}"
if [ -d "$APP_DIR" ]; then
    echo -e "${BLUE}📂 El directorio ya existe, actualizando...${NC}"
    cd $APP_DIR
    git pull
else
    echo -e "${BLUE}📂 Clonando repositorio...${NC}"
    sudo mkdir -p $APP_DIR
    sudo chown $USER:$USER $APP_DIR
    git clone $REPO_URL $APP_DIR
    cd $APP_DIR
fi
echo -e "${GREEN}✅ Código descargado${NC}"

###############################################################################
# 5. Configurar variables de entorno
###############################################################################
echo -e "${BLUE}⚙️  Configurando variables de entorno...${NC}"

if [ ! -f ".env" ]; then
    echo -e "${BLUE}📝 Creando archivo .env...${NC}"
    cp .env.example .env
    
    # Generar contraseñas seguras
    DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
    API_KEY=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-40)
    
    # Actualizar .env
    sed -i "s|PGPASSWORD=.*|PGPASSWORD=$DB_PASSWORD|" .env
    sed -i "s|API_KEY=.*|API_KEY=$API_KEY|" .env
    sed -i "s|DOMAIN=.*|DOMAIN=$DOMAIN|" .env
    sed -i "s|EMAIL=.*|EMAIL=$EMAIL|" .env
    sed -i "s|PUBLIC_BASE_URL=.*|PUBLIC_BASE_URL=https://$DOMAIN|" .env
    sed -i "s|CORS_ORIGINS=.*|CORS_ORIGINS=https://$DOMAIN|" .env
    
    echo -e "${GREEN}✅ Archivo .env configurado${NC}"
    echo -e "${BLUE}📋 GUARDA ESTAS CREDENCIALES:${NC}"
    echo -e "   DB Password: ${GREEN}$DB_PASSWORD${NC}"
    echo -e "   API Key: ${GREEN}$API_KEY${NC}"
else
    echo -e "${GREEN}✅ Archivo .env ya existe${NC}"
fi

###############################################################################
# 6. Iniciar aplicación
###############################################################################
echo -e "${BLUE}🚀 Iniciando aplicación...${NC}"

# Detener contenedores existentes
docker-compose down 2>/dev/null || true

# Construir e iniciar
docker-compose up -d --build

echo -e "${GREEN}✅ Aplicación iniciada${NC}"

###############################################################################
# 7. Verificar estado
###############################################################################
echo -e "${BLUE}🔍 Verificando estado de los contenedores...${NC}"
sleep 5
docker-compose ps

###############################################################################
# 8. Obtener certificado SSL (Let's Encrypt)
###############################################################################
echo -e "${BLUE}🔒 Configurando certificado SSL...${NC}"
echo -e "${BLUE}Esperando 30 segundos para que los servicios estén listos...${NC}"
sleep 30

docker-compose exec certbot certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    -d $DOMAIN

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Certificado SSL obtenido${NC}"
    echo -e "${BLUE}🔄 Reiniciando nginx para aplicar SSL...${NC}"
    docker-compose restart nginx
else
    echo -e "${RED}⚠️  Error al obtener certificado SSL${NC}"
    echo -e "${BLUE}Verifica que el dominio $DOMAIN apunte a este servidor${NC}"
fi

###############################################################################
# 9. Configurar renovación automática de certificados
###############################################################################
echo -e "${BLUE}⏰ Configurando renovación automática de certificados...${NC}"

CRON_JOB="0 3 * * * cd $APP_DIR && docker-compose run --rm certbot renew && docker-compose restart nginx"
(crontab -l 2>/dev/null | grep -v "certbot renew"; echo "$CRON_JOB") | crontab -

echo -e "${GREEN}✅ Renovación automática configurada (diariamente a las 3 AM)${NC}"

###############################################################################
# 10. Configurar systemd para inicio automático
###############################################################################
echo -e "${BLUE}🔧 Configurando inicio automático...${NC}"

sudo tee /etc/systemd/system/panel-secretario.service > /dev/null <<EOF
[Unit]
Description=Panel Secretario - Gobierno de Hidalgo
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=$APP_DIR
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable panel-secretario
echo -e "${GREEN}✅ Inicio automático configurado${NC}"

###############################################################################
# Resumen
###############################################################################
echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}🎉 ¡DESPLIEGUE COMPLETADO EXITOSAMENTE!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}📊 Accede a tu aplicación en:${NC}"
echo -e "   ${GREEN}https://$DOMAIN${NC}"
echo ""
echo -e "${BLUE}📁 Directorio de la aplicación:${NC}"
echo -e "   ${GREEN}$APP_DIR${NC}"
echo ""
echo -e "${BLUE}🔧 Comandos útiles:${NC}"
echo -e "   Ver logs:        ${GREEN}cd $APP_DIR && docker-compose logs -f${NC}"
echo -e "   Reiniciar:       ${GREEN}cd $APP_DIR && docker-compose restart${NC}"
echo -e "   Detener:         ${GREEN}cd $APP_DIR && docker-compose down${NC}"
echo -e "   Actualizar:      ${GREEN}cd $APP_DIR && git pull && docker-compose up -d --build${NC}"
echo ""
echo -e "${BLUE}📋 Próximos pasos:${NC}"
echo -e "   1. Verifica que https://$DOMAIN funcione correctamente"
echo -e "   2. Sube tus datos CSV desde: https://$DOMAIN (botón inferior izquierdo)"
echo -e "   3. Configura backups automáticos de PostgreSQL"
echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"

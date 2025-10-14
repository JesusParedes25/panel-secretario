#!/bin/bash
# Script de Deployment para Rocky Linux
# Panel Secretario - Gobierno de Hidalgo

set -e  # Exit on error

echo "========================================"
echo "Panel de Simplificación - Deployment"
echo "Gobierno del Estado de Hidalgo"
echo "========================================"
echo ""

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para imprimir mensajes
print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

# Verificar que se está ejecutando como root o con sudo
if [ "$EUID" -ne 0 ]; then 
    print_error "Este script debe ejecutarse como root o con sudo"
    exit 1
fi

print_status "Iniciando proceso de deployment..."

# 1. Actualizar sistema
print_status "Actualizando sistema operativo..."
dnf update -y

# 2. Instalar dependencias
print_status "Instalando dependencias del sistema..."
dnf install -y \
    git \
    curl \
    wget \
    vim \
    htop \
    net-tools

# 3. Instalar Docker
if ! command -v docker &> /dev/null; then
    print_status "Instalando Docker..."
    dnf config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
    dnf install -y docker-ce docker-ce-cli containerd.io
    systemctl start docker
    systemctl enable docker
    print_status "Docker instalado correctamente"
else
    print_status "Docker ya está instalado"
fi

# 4. Instalar Docker Compose
if ! command -v docker-compose &> /dev/null; then
    print_status "Instalando Docker Compose..."
    DOCKER_COMPOSE_VERSION="2.24.0"
    curl -L "https://github.com/docker/compose/releases/download/v${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" \
        -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose
    print_status "Docker Compose instalado correctamente"
else
    print_status "Docker Compose ya está instalado"
fi

# 5. Configurar firewall
print_status "Configurando firewall..."
if command -v firewall-cmd &> /dev/null; then
    firewall-cmd --permanent --add-service=http
    firewall-cmd --permanent --add-service=https
    firewall-cmd --reload
    print_status "Firewall configurado"
else
    print_warning "firewalld no está instalado, saltando configuración de firewall"
fi

# 6. Crear archivo .env si no existe
if [ ! -f .env ]; then
    print_warning "Archivo .env no encontrado, creando desde .env.example..."
    
    if [ -f .env.example ]; then
        cp .env.example .env
        
        # Generar API Key aleatoria
        API_KEY=$(openssl rand -hex 32)
        sed -i "s/API_KEY=.*/API_KEY=${API_KEY}/" .env
        
        # Generar password de PostgreSQL aleatoria
        PG_PASSWORD=$(openssl rand -base64 24 | tr -d "=+/" | cut -c1-24)
        sed -i "s/PGPASSWORD=.*/PGPASSWORD=${PG_PASSWORD}/" .env
        
        print_status "Archivo .env creado con credenciales aleatorias"
        print_warning "IMPORTANTE: Guarda estas credenciales en un lugar seguro:"
        echo "API_KEY=${API_KEY}"
        echo "PGPASSWORD=${PG_PASSWORD}"
    else
        print_error "Archivo .env.example no encontrado"
        exit 1
    fi
else
    print_status "Archivo .env ya existe"
fi

# 7. Crear directorios necesarios
print_status "Creando directorios necesarios..."
mkdir -p certbot/conf
mkdir -p certbot/www
mkdir -p logs

# 8. Configurar SELinux (si está habilitado)
if command -v getenforce &> /dev/null && [ "$(getenforce)" != "Disabled" ]; then
    print_status "Configurando SELinux para Docker..."
    semanage fcontext -a -t container_file_t "/var/lib/docker(/.*)?"
    restorecon -R /var/lib/docker
    setsebool -P container_manage_cgroup on
fi

# 9. Construir y levantar servicios
print_status "Construyendo imágenes Docker..."
docker-compose build

print_status "Levantando servicios..."
docker-compose up -d

# 10. Esperar a que los servicios estén listos
print_status "Esperando a que los servicios inicien..."
sleep 15

# Verificar estado de servicios
print_status "Verificando estado de servicios..."
docker-compose ps

# 11. Configurar SSL/TLS con Let's Encrypt (si se proporcionó dominio)
read -p "¿Deseas configurar SSL/TLS con Let's Encrypt? (s/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Ss]$ ]]; then
    read -p "Ingresa tu dominio (ej: panel.hidalgo.gob.mx): " DOMAIN
    read -p "Ingresa tu email: " EMAIL
    
    if [ -n "$DOMAIN" ] && [ -n "$EMAIL" ]; then
        print_status "Obteniendo certificado SSL para ${DOMAIN}..."
        
        # Ejecutar certbot
        docker-compose run --rm certbot certonly \
            --webroot \
            --webroot-path=/var/www/certbot \
            --email ${EMAIL} \
            --agree-tos \
            --no-eff-email \
            -d ${DOMAIN}
        
        # Actualizar configuración de Nginx
        print_status "Actualizando configuración de Nginx para HTTPS..."
        sed -i "s/DOMAIN/${DOMAIN}/g" nginx/default.conf
        
        # Descomentar líneas de SSL
        sed -i 's/# listen 443/listen 443/g' nginx/default.conf
        sed -i 's/# ssl_certificate/ssl_certificate/g' nginx/default.conf
        sed -i 's/# include/include/g' nginx/default.conf
        sed -i 's/# add_header Strict/add_header Strict/g' nginx/default.conf
        
        # Reiniciar nginx
        docker-compose restart nginx
        
        print_status "SSL/TLS configurado correctamente"
    else
        print_warning "Dominio o email no proporcionado, saltando configuración SSL"
    fi
fi

# 12. Mostrar información final
echo ""
echo "========================================"
print_status "Deployment completado exitosamente!"
echo "========================================"
echo ""
echo "Servicios disponibles:"
echo "  - Frontend:  http://$(hostname -I | awk '{print $1}')"
echo "  - API:       http://$(hostname -I | awk '{print $1}')/api/v1/health"
echo "  - Database:  PostgreSQL en puerto 5432"
echo ""
echo "Comandos útiles:"
echo "  - Ver logs:           docker-compose logs -f"
echo "  - Detener servicios:  docker-compose down"
echo "  - Reiniciar:          docker-compose restart"
echo "  - Estado:             docker-compose ps"
echo ""
print_warning "Recuerda actualizar el archivo .env con tus configuraciones específicas"
echo ""

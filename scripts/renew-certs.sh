#!/bin/bash
# Script para Renovar Certificados SSL
# Panel Secretario - Gobierno de Hidalgo

set -e

echo "Renovando certificados SSL..."

# Renovar certificados
docker-compose run --rm certbot renew

# Recargar Nginx
docker-compose exec nginx nginx -s reload

echo "Certificados renovados correctamente"

# Este script debe agregarse a crontab para ejecución automática
# Ejemplo: 0 0 * * 0 /path/to/renew-certs.sh >> /var/log/letsencrypt-renew.log 2>&1

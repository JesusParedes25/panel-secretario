# Dockerfile multi-stage para Frontend
# Panel Secretario - Gobierno de Hidalgo

# Etapa 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias (con legacy-peer-deps para React 19)
RUN npm install --legacy-peer-deps

# Copiar código fuente
COPY . .

# Build de producción
RUN npm run build

# Etapa 2: Servidor Nginx
FROM nginx:alpine

# Información de la imagen
LABEL maintainer="Gobierno del Estado de Hidalgo - COEMERE"
LABEL description="Frontend React para Panel de Simplificación"

# Copiar archivos built desde la etapa anterior
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar archivo de ejemplo CSV al directorio público
COPY --from=builder /app/public /usr/share/nginx/html

# Copiar configuración personalizada de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exponer puerto 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

# Comando de inicio
CMD ["nginx", "-g", "daemon off;"]

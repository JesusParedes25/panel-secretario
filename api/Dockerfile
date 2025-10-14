# Dockerfile para API
# Panel Secretario - Gobierno de Hidalgo

FROM node:20-alpine

# Información de la imagen
LABEL maintainer="Gobierno del Estado de Hidalgo - COEMERE"
LABEL description="API REST para Panel de Simplificación"

# Directorio de trabajo
WORKDIR /app

# Variables de entorno
ENV NODE_ENV=production
ENV PORT=8080

# Copiar package files
COPY package*.json ./

# Instalar dependencias de producción
RUN npm install --omit=dev && \
    npm cache clean --force

# Copiar código fuente
COPY src/ ./src/

# Crear directorio de uploads
RUN mkdir -p /tmp/uploads && chmod 777 /tmp/uploads

# Crear directorio de logs
RUN mkdir -p /app/logs && chmod 777 /app/logs

# Usuario no root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Cambiar ownership
RUN chown -R nodejs:nodejs /app /tmp/uploads

# Cambiar a usuario no root
USER nodejs

# Exponer puerto
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/api/v1/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Comando de inicio
CMD ["node", "src/index.js"]

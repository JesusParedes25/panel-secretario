# Makefile para Panel Secretario
# Gobierno del Estado de Hidalgo - COEMERE

.PHONY: help build up down restart logs clean install test dev prod

# Variables
DOCKER_COMPOSE = docker-compose
NPM = npm

# Colores para output
GREEN = \033[0;32m
YELLOW = \033[1;33m
NC = \033[0m # No Color

help: ## Mostrar esta ayuda
	@echo "$(GREEN)Panel de Simplificación - Comandos Disponibles$(NC)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(YELLOW)%-20s$(NC) %s\n", $$1, $$2}'
	@echo ""

install: ## Instalar dependencias (backend y frontend)
	@echo "$(GREEN)Instalando dependencias del backend...$(NC)"
	cd api && $(NPM) install
	@echo "$(GREEN)Instalando dependencias del frontend...$(NC)"
	cd web && $(NPM) install
	@echo "$(GREEN)✓ Dependencias instaladas$(NC)"

build: ## Construir imágenes Docker
	@echo "$(GREEN)Construyendo imágenes Docker...$(NC)"
	$(DOCKER_COMPOSE) build
	@echo "$(GREEN)✓ Imágenes construidas$(NC)"

up: ## Levantar todos los servicios
	@echo "$(GREEN)Levantando servicios...$(NC)"
	$(DOCKER_COMPOSE) up -d
	@echo "$(GREEN)✓ Servicios levantados$(NC)"
	@$(MAKE) status

down: ## Detener todos los servicios
	@echo "$(YELLOW)Deteniendo servicios...$(NC)"
	$(DOCKER_COMPOSE) down
	@echo "$(GREEN)✓ Servicios detenidos$(NC)"

restart: ## Reiniciar servicios
	@echo "$(YELLOW)Reiniciando servicios...$(NC)"
	$(DOCKER_COMPOSE) restart
	@echo "$(GREEN)✓ Servicios reiniciados$(NC)"

logs: ## Ver logs de todos los servicios
	$(DOCKER_COMPOSE) logs -f

logs-api: ## Ver logs del API
	$(DOCKER_COMPOSE) logs -f api

logs-web: ## Ver logs del frontend
	$(DOCKER_COMPOSE) logs -f web

logs-db: ## Ver logs de la base de datos
	$(DOCKER_COMPOSE) logs -f db

status: ## Ver estado de los servicios
	@echo "$(GREEN)Estado de los servicios:$(NC)"
	@$(DOCKER_COMPOSE) ps

dev: ## Modo desarrollo (reconstruye y levanta con logs)
	@echo "$(GREEN)Iniciando en modo desarrollo...$(NC)"
	$(DOCKER_COMPOSE) up --build

dev-api: ## Desarrollo solo del API (local, sin Docker)
	@echo "$(GREEN)Iniciando API en modo desarrollo...$(NC)"
	cd api && $(NPM) run dev

dev-web: ## Desarrollo solo del frontend (local, sin Docker)
	@echo "$(GREEN)Iniciando frontend en modo desarrollo...$(NC)"
	cd web && $(NPM) run dev

test: ## Ejecutar tests
	@echo "$(GREEN)Ejecutando tests del backend...$(NC)"
	cd api && $(NPM) test

test-api: ## Tests del API
	cd api && $(NPM) test

clean: ## Limpiar contenedores, imágenes y volúmenes
	@echo "$(YELLOW)⚠️  Esto eliminará TODOS los datos. ¿Continuar? [y/N]$(NC)" && read ans && [ $${ans:-N} = y ]
	$(DOCKER_COMPOSE) down -v
	@echo "$(GREEN)✓ Limpieza completada$(NC)"

clean-logs: ## Limpiar archivos de logs
	@echo "$(YELLOW)Limpiando logs...$(NC)"
	rm -rf api/logs/*.log
	@echo "$(GREEN)✓ Logs limpiados$(NC)"

backup-db: ## Crear backup de la base de datos
	@echo "$(GREEN)Creando backup de la base de datos...$(NC)"
	@mkdir -p backups
	@docker-compose exec -T db pg_dump -U panel_user panel_secretario > backups/backup-$$(date +%Y%m%d-%H%M%S).sql
	@echo "$(GREEN)✓ Backup creado en backups/$(NC)"

restore-db: ## Restaurar base de datos desde backup (usar: make restore-db FILE=backup.sql)
	@echo "$(YELLOW)Restaurando base de datos desde $(FILE)...$(NC)"
	@cat $(FILE) | docker-compose exec -T db psql -U panel_user -d panel_secretario
	@echo "$(GREEN)✓ Base de datos restaurada$(NC)"

db-shell: ## Acceder a shell de PostgreSQL
	$(DOCKER_COMPOSE) exec db psql -U panel_user -d panel_secretario

reset-db: ## Resetear base de datos (elimina todos los datos)
	@echo "$(YELLOW)⚠️  Esto eliminará TODOS los datos. ¿Continuar? [y/N]$(NC)" && read ans && [ $${ans:-N} = y ]
	$(DOCKER_COMPOSE) exec db psql -U panel_user -d panel_secretario -f /docker-entrypoint-initdb.d/reset.sql
	@echo "$(GREEN)✓ Base de datos reseteada$(NC)"

ssl-cert: ## Obtener certificado SSL con Let's Encrypt
	@echo "$(GREEN)Obteniendo certificado SSL...$(NC)"
	@read -p "Dominio: " domain; \
	read -p "Email: " email; \
	$(DOCKER_COMPOSE) run --rm certbot certonly --webroot --webroot-path=/var/www/certbot --email $$email --agree-tos -d $$domain
	@echo "$(GREEN)✓ Certificado obtenido$(NC)"

ssl-renew: ## Renovar certificados SSL
	@echo "$(GREEN)Renovando certificados SSL...$(NC)"
	$(DOCKER_COMPOSE) run --rm certbot renew
	$(DOCKER_COMPOSE) exec nginx nginx -s reload
	@echo "$(GREEN)✓ Certificados renovados$(NC)"

env: ## Crear archivo .env desde .env.example
	@if [ ! -f .env ]; then \
		echo "$(GREEN)Creando archivo .env...$(NC)"; \
		cp .env.example .env; \
		echo "$(YELLOW)⚠️  Recuerda configurar las variables en .env$(NC)"; \
	else \
		echo "$(YELLOW)El archivo .env ya existe$(NC)"; \
	fi

health: ## Verificar salud de los servicios
	@echo "$(GREEN)Verificando salud de los servicios...$(NC)"
	@curl -f http://localhost/api/v1/health || echo "$(YELLOW)API no responde$(NC)"

prod: ## Despliegue en producción
	@echo "$(GREEN)Desplegando en producción...$(NC)"
	@bash scripts/deploy.sh

update: ## Actualizar proyecto (git pull y rebuild)
	@echo "$(GREEN)Actualizando proyecto...$(NC)"
	git pull
	$(DOCKER_COMPOSE) build
	$(DOCKER_COMPOSE) up -d
	@echo "$(GREEN)✓ Proyecto actualizado$(NC)"

stats: ## Ver estadísticas de uso de recursos
	docker stats

prune: ## Limpiar recursos Docker no utilizados
	@echo "$(YELLOW)Limpiando recursos Docker no utilizados...$(NC)"
	docker system prune -f
	@echo "$(GREEN)✓ Limpieza completada$(NC)"

# Valores por defecto
.DEFAULT_GOAL := help

# Política de Seguridad

## Panel de Simplificación - Gobierno de Hidalgo

### 🔐 Reportar Vulnerabilidades

Si descubres una vulnerabilidad de seguridad, por favor **NO** la reportes públicamente. 

**Contacto de Seguridad**:
- Email: [email-seguridad@hidalgo.gob.mx]
- Asunto: "VULNERABILIDAD - Panel de Simplificación"

Por favor incluye:
1. Descripción detallada de la vulnerabilidad
2. Pasos para reproducir
3. Impacto potencial
4. Sugerencias de mitigación (si las tienes)

Responderemos dentro de **48 horas hábiles**.

---

## 🛡️ Mejores Prácticas de Seguridad

### Para Administradores

#### 1. Credenciales

- ✅ Usar contraseñas fuertes (mínimo 24 caracteres aleatorios)
- ✅ Cambiar credenciales por defecto inmediatamente
- ✅ Rotar API Keys cada 90 días
- ✅ No compartir credenciales vía email/chat
- ✅ Usar un gestor de contraseñas

#### 2. API Keys

```bash
# Generar API Key segura
openssl rand -hex 32
```

- ✅ Almacenar en variables de entorno, NUNCA en código
- ✅ Diferentes API Keys para desarrollo/producción
- ✅ Revocar keys comprometidas inmediatamente
- ✅ Monitorear uso de API Keys

#### 3. Base de Datos

- ✅ Backups automáticos diarios
- ✅ Encriptar backups
- ✅ Acceso restringido (solo desde backend)
- ✅ Credenciales únicas por ambiente
- ✅ Logs de auditoría habilitados

#### 4. SSL/TLS

- ✅ Forzar HTTPS en producción
- ✅ Renovar certificados automáticamente
- ✅ Usar TLS 1.2 o superior
- ✅ HSTS habilitado

#### 5. Actualizaciones

- ✅ Revisar actualizaciones de seguridad semanalmente
- ✅ Aplicar parches críticos dentro de 24 horas
- ✅ Mantener dependencias actualizadas

```bash
# Verificar vulnerabilidades conocidas
cd api && npm audit
cd web && npm audit
```

#### 6. Logs y Monitoreo

- ✅ Revisar logs diariamente
- ✅ Alertas para intentos de acceso no autorizados
- ✅ Retener logs por 90 días mínimo
- ✅ Logs no deben contener información sensible

#### 7. Firewall

```bash
# Rocky Linux - Configuración mínima
firewall-cmd --permanent --add-service=http
firewall-cmd --permanent --add-service=https
firewall-cmd --permanent --remove-service=ssh  # Si no es necesario
firewall-cmd --reload
```

#### 8. Docker

- ✅ No correr contenedores como root
- ✅ Escanear imágenes regularmente
- ✅ Limitar recursos (CPU, RAM)
- ✅ Network isolation

---

### Para Desarrolladores

#### 1. Código Seguro

**Validación de Entrada**:
```javascript
// ✅ BIEN: Validar y sanitizar
const nivel = parseFloat(input.nivel);
if (isNaN(nivel) || nivel < 0 || nivel > 6) {
  throw new Error('Nivel inválido');
}

// ❌ MAL: Usar input directo
const query = `SELECT * FROM tramites WHERE nivel = ${input.nivel}`;
```

**SQL Injection Prevention**:
```javascript
// ✅ BIEN: Consultas preparadas
await db.query('SELECT * FROM tramites WHERE id = $1', [id]);

// ❌ MAL: String concatenation
await db.query(`SELECT * FROM tramites WHERE id = ${id}`);
```

**XSS Prevention**:
```javascript
// React automáticamente escapa valores
<div>{userInput}</div>  // ✅ Seguro

// Evitar dangerouslySetInnerHTML a menos que sea absolutamente necesario
<div dangerouslySetInnerHTML={{__html: userInput}} />  // ❌ Peligroso
```

#### 2. Dependencias

```bash
# Instalar solo dependencias necesarias
npm install --production

# Verificar vulnerabilidades
npm audit fix

# Actualizar dependencias
npm update
```

#### 3. Variables de Entorno

```javascript
// ✅ BIEN
const apiKey = process.env.API_KEY;

// ❌ MAL
const apiKey = 'mi-api-key-hardcodeada';
```

#### 4. Error Handling

```javascript
// ✅ BIEN: No exponer detalles internos
res.status(500).json({
  success: false,
  error: 'Error interno del servidor'
});

// ❌ MAL: Exponer stack traces
res.status(500).json({
  error: error.message,
  stack: error.stack  // Nunca en producción
});
```

#### 5. CORS

```javascript
// Configurar orígenes específicos
const corsOptions = {
  origin: ['https://panel.hidalgo.gob.mx'],
  credentials: true
};

// ❌ MAL: Permitir todos los orígenes en producción
const corsOptions = {
  origin: '*'  // Solo para desarrollo
};
```

---

## 🔍 Auditorías de Seguridad

### Checklist Mensual

- [ ] Revisar logs de acceso
- [ ] Verificar usuarios activos
- [ ] Actualizar dependencias
- [ ] Escanear vulnerabilidades
- [ ] Verificar backups funcionan
- [ ] Revisar configuración de firewall
- [ ] Verificar certificados SSL (válidos >30 días)
- [ ] Revisar permisos de archivos

### Checklist Trimestral

- [ ] Rotar API Keys
- [ ] Auditoría de código
- [ ] Pruebas de penetración
- [ ] Revisar políticas de acceso
- [ ] Capacitación de seguridad al equipo
- [ ] Actualizar documentación de seguridad

---

## 🚨 Plan de Respuesta a Incidentes

### En caso de incidente de seguridad:

1. **Contener** (0-1 hora)
   - Desconectar sistema afectado
   - Bloquear acceso comprometido
   - Preservar evidencia

2. **Evaluar** (1-4 horas)
   - Identificar alcance
   - Determinar datos afectados
   - Evaluar impacto

3. **Erradicar** (4-24 horas)
   - Eliminar vulnerabilidad
   - Cambiar credenciales comprometidas
   - Aplicar parches

4. **Recuperar** (24-48 horas)
   - Restaurar desde backup seguro
   - Verificar integridad
   - Monitorear actividad

5. **Aprender** (48-72 horas)
   - Documentar incidente
   - Actualizar procedimientos
   - Capacitar equipo

### Contactos de Emergencia

- **Equipo COEMERE**: [teléfono]
- **IT Gobierno Hidalgo**: [teléfono]
- **Seguridad Cibernética**: [teléfono]

---

## 📋 Cumplimiento

Este sistema maneja datos gubernamentales y debe cumplir con:

- Ley Federal de Transparencia y Acceso a la Información Pública
- Ley General de Protección de Datos Personales en Posesión de Sujetos Obligados
- Normas del Gobierno del Estado de Hidalgo

---

## 🔄 Versionado de esta Política

- **Versión**: 1.0
- **Última Actualización**: 14 de enero de 2025
- **Próxima Revisión**: 14 de abril de 2025

Esta política será revisada trimestralmente y actualizada según sea necesario.

---

**Para preguntas sobre esta política de seguridad, contacta al equipo de COEMERE.**

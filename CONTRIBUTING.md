# Guía de Contribución

## Panel de Simplificación - Gobierno de Hidalgo

Gracias por tu interés en contribuir al Panel de Simplificación de Trámites Estatales.

## 🔒 Restricciones de Acceso

Este proyecto es de uso interno del Gobierno del Estado de Hidalgo. Las contribuciones están limitadas a:
- Personal autorizado de COEMERE
- Desarrolladores contratados por el Gobierno del Estado de Hidalgo
- Dependencias gubernamentales autorizadas

## 📋 Proceso de Contribución

### 1. Antes de Empezar

- Consulta con el equipo de COEMERE sobre la funcionalidad que deseas agregar
- Verifica que no exista un issue o pull request similar
- Lee la documentación técnica completa

### 2. Configuración del Entorno

```bash
# Clonar repositorio
git clone <repo-url>
cd panel-secretario

# Instalar dependencias del backend
cd api
npm install

# Instalar dependencias del frontend
cd ../web
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus configuraciones locales
```

### 3. Crear una Rama

```bash
# Crear rama desde develop
git checkout develop
git pull origin develop
git checkout -b feature/nombre-descriptivo
```

Convención de nombres de ramas:
- `feature/` - Nuevas características
- `fix/` - Corrección de bugs
- `docs/` - Documentación
- `refactor/` - Refactorización de código
- `test/` - Tests
- `chore/` - Mantenimiento

### 4. Desarrollar

#### Estándares de Código

**JavaScript/React:**
- Usar ES6+ syntax
- Componentes funcionales con hooks
- Nombres descriptivos en español para variables de negocio
- Comentarios JSDoc para funciones complejas
- PropTypes o TypeScript (si se migra)

**SQL:**
- Nombres de tablas y columnas en minúsculas con guiones bajos
- Comentarios para explicar queries complejas
- Usar consultas preparadas SIEMPRE

**CSS/Tailwind:**
- Seguir la paleta de colores institucional
- Usar clases de utilidad de Tailwind
- Componentes reutilizables en DaisyUI

#### Estructura de Commits

Usar formato de Conventional Commits:

```
tipo(alcance): descripción breve

Descripción más detallada si es necesario.

Fixes #123
```

Tipos válidos:
- `feat`: Nueva característica
- `fix`: Corrección de bug
- `docs`: Cambios en documentación
- `style`: Cambios de formato (sin afectar código)
- `refactor`: Refactorización
- `test`: Agregar o modificar tests
- `chore`: Mantenimiento

Ejemplos:
```
feat(api): agregar endpoint para estadísticas mensuales

fix(dashboard): corregir cálculo de porcentaje en KPI

docs(readme): actualizar instrucciones de deployment
```

### 5. Testing

Antes de crear un pull request:

```bash
# Tests del backend
cd api
npm test

# Verificar linting (si está configurado)
npm run lint

# Build del frontend
cd ../web
npm run build
```

### 6. Pull Request

1. **Push de tu rama**
```bash
git push origin feature/nombre-descriptivo
```

2. **Crear Pull Request** en la plataforma de control de versiones

3. **Incluir en la descripción:**
   - Descripción clara de los cambios
   - Motivación y contexto
   - Screenshots si aplica (cambios de UI)
   - Tests realizados
   - Checklist de verificación

**Template de PR:**

```markdown
## Descripción
Breve descripción de los cambios realizados.

## Tipo de cambio
- [ ] Bug fix
- [ ] Nueva característica
- [ ] Cambio que rompe compatibilidad
- [ ] Documentación

## ¿Cómo se ha probado?
Describe las pruebas realizadas.

## Checklist
- [ ] Mi código sigue los estándares del proyecto
- [ ] He realizado una auto-revisión de mi código
- [ ] He comentado áreas complejas del código
- [ ] He actualizado la documentación
- [ ] Mis cambios no generan nuevos warnings
- [ ] He agregado tests que prueban mi corrección/característica
- [ ] Tests nuevos y existentes pasan localmente
- [ ] He verificado en diferentes navegadores (si aplica UI)
```

### 7. Revisión de Código

El equipo de COEMERE revisará tu PR. Pueden solicitar cambios:
- Responde a comentarios de manera constructiva
- Realiza los cambios solicitados
- Push de nuevos commits a la misma rama

### 8. Merge

Una vez aprobado, el equipo hará merge a `develop`. Los cambios se desplegarán a producción en el siguiente ciclo de release.

## 📐 Estándares de Calidad

### Código

- **Legibilidad**: Código claro y autoexplicativo
- **Mantenibilidad**: Componentes pequeños y reutilizables
- **Performance**: Evitar renders innecesarios, optimizar queries
- **Seguridad**: Nunca hardcodear credenciales, validar inputs

### UI/UX

- **Accesibilidad**: WCAG AA mínimo
- **Responsive**: Probar en móvil, tablet y desktop
- **Consistencia**: Seguir diseño institucional
- **Feedback**: Loading states, mensajes de error claros

### Base de Datos

- **Normalización**: Evitar redundancia
- **Índices**: Optimizar queries frecuentes
- **Backups**: Considerar impacto en datos existentes
- **Migraciones**: Scripts de migración cuando sea necesario

## 🐛 Reportar Bugs

Al reportar un bug, incluye:

1. **Descripción clara** del problema
2. **Pasos para reproducir**
3. **Comportamiento esperado vs actual**
4. **Screenshots** si es visual
5. **Entorno** (navegador, OS, versión)
6. **Logs** relevantes

## 💡 Sugerir Mejoras

Las sugerencias son bienvenidas. Incluye:

1. **Descripción** de la mejora
2. **Justificación** (por qué es útil)
3. **Impacto** (a quién beneficia)
4. **Alternativas** consideradas

## 📞 Contacto

Para dudas sobre contribuciones:

- **Email**: [email del equipo COEMERE]
- **Reuniones**: [horario de oficina virtual]

## 📚 Recursos

- [React Documentation](https://react.dev)
- [Express.js Documentation](https://expressjs.com)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [TailwindCSS Documentation](https://tailwindcss.com)
- [DaisyUI Components](https://daisyui.com)

---

Gracias por contribuir a mejorar los servicios digitales del Gobierno del Estado de Hidalgo. 🇲🇽

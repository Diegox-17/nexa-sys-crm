# Control de Versiones - NEXA-Sys CRM

## 📋 Información General del Repositorio

| Elemento | Detalle |
|----------|---------|
| **Nombre del Repositorio** | nexa-sys-crm |
| **URL Remoto** | https://github.com/Diegox-17/nexa-sys-crm.git |
| **Propietario** | Diegox-17 |
| **Rama Principal** | main |
| **Fecha de Creación** | 2026-01-05 |
| **Tecnología** | Git |
| **Licencia** | MIT (recomendado) |

---

## 🚀 Versiones del Proyecto

### v1.0.0 - Initial Release (2026-01-05)

**Commit:** `4b4e188`

**Estado:** ✅ Actual / En producción

**Descripción:**
Lanzamiento inicial del sistema NEXA-Sys CRM V.02 con funcionalidad completa.

**Características incluidas:**
- Frontend con React 18 + Vite + React Router
- Backend con Node.js + Express (CommonJS)
- Base de datos PostgreSQL 15 con fallback en memoria
- Sistema de autenticación JWT
- Gestión de usuarios, clientes y proyectos
- Kanban board para seguimiento de proyectos
- Suite completa de pruebas con Jest
- Configuración Docker completa
- Pipeline CI/CD con GitHub Actions

** stack tecnológico:**
- Frontend: React 18, Vite, React Router DOM
- Backend: Node.js, Express, Joi, JWT
- Base de datos: PostgreSQL 15 (con soporte in-memory)
- Contenedores: Docker, Docker Compose
- Testing: Jest, React Testing Library
- CI/CD: GitHub Actions

---

## 📜 Historial de Commits

### Commits en Rama `main`

| # | Commit ID | Fecha | Autor | Descripción |
|---|-----------|-------|-------|-------------|
| 1 | `4b4e188` | 2026-01-05 | Diegox-17 | feat: initial commit - NEXA-Sys CRM v1.0.0 |

### Detalle del Commit Inicial

```
commit 4b4e18885a9dd8dbd4229ca52b6d6f6c43266b32
Author: Diegox-17 <diego@example.com>
Date:   2026-01-05

    feat: initial commit - NEXA-Sys CRM v1.0.0

    - Full-stack CRM with React 18 + Vite frontend
    - Node.js + Express backend with PostgreSQL support
    - Docker Compose for containerized deployment
    - JWT authentication system
    - User, client, and project management modules
    - Kanban board for project tracking
    - Complete test suite with Jest
    - Docker-ready configuration
```

---

## 🌿 Estructura de Ramas

### Rama Principal

| Rama | Propósito | Protegida | Descripción |
|------|-----------|-----------|-------------|
| `main` | Producción | ✅ Sí | Código en producción, siempre estable |
| `develop` | Desarrollo | ⬜ No | Rama de integración para nuevas features |

### Ramas de Funcionalidad (Futuras)

```
main  ─────────────────────────────────────●───
              │                           │
              │                           ▼
              │                     ┌─────────────┐
              │                     │  develop    │
              │                     └─────────────┘
              │                           │
              │                           │
              ▼                           ▼
        ┌──────────┐              ┌──────────────┐
        │ hotfix/* │              │ feature/*    │
        └──────────┘              └──────────────┘
        (Bug fixes)               (Nuevas features)
```

### Convenciones de Nombres

| Tipo de Rama | Formato | Ejemplo |
|--------------|---------|---------|
| Feature | `feature/[nombre]` | `feature/user-auth` |
| Bugfix | `bugfix/[id-descripcion]` | `bugfix/login-issue` |
| Hotfix | `hotfix/[version]-[descripcion]` | `hotfix/v1.0.1-security` |
| Release | `release/[version]` | `release/v1.1.0` |

---

## 🏷️ Tags de Versión

| Versión | Commit | Fecha | Descripción |
|---------|--------|-------|-------------|
| v1.0.0 | `4b4e188` | 2026-01-05 | Primera versión estable |

### Comandos para Tags Futuros

```bash
# Crear tag para versión
git tag -a v1.1.0 -m "Release v1.1.0"

# Ver tags existentes
git tag -l

# Subir tag a GitHub
git push origin v1.1.0

# Subir todos los tags
git push --tags
```

---

## 📏 Convenciones de Commits

### Formato Conventional Commits

```
<tipo>(<ámbito>): <descripción>

[cuerpo opcional]

[pie opcional]
```

### Tipos de Commit

| Tipo | Descripción | Ejemplo |
|------|-------------|---------|
| `feat` | Nueva característica | `feat: add user profile page` |
| `fix` | Corrección de bug | `fix: resolve login redirect` |
| `chore` | Tareas de mantenimiento | `chore: update dependencies` |
| `docs` | Cambios en documentación | `docs: update API endpoints` |
| `style` | Formato de código | `style: format with prettier` |
| `refactor` | Refactorización | `refactor: simplify auth logic` |
| `test` | Agregar/modificar tests | `test: add login validation tests` |
| `perf` | Mejoras de rendimiento | `perf: optimize database queries` |
| `ci` | Cambios en CI/CD | `ci: add GitHub Actions workflow` |

### Ejemplos de Commits

```bash
# Feature nueva
git commit -m "feat(clients): add client export functionality"

# Bug fix
git commit -m "fix(auth): resolve token expiration issue"

# Actualización de dependencias
git commit -m "chore(deps): update express to v4.18.0"

# Documentación
git commit -m "docs(readme): add installation instructions"

# Versión mayor
git commit -m "feat!: migrate to new authentication system"
```

---

## 🔄 Flujo de Trabajo Gitflow

### Desarrollo de Nuevas Features

```bash
# 1. Crear rama desde develop
git checkout develop
git pull origin develop
git checkout -b feature/nombre-feature

# 2. Trabajar en la feature
git add .
git commit -m "feat: description of changes"

# 3. Subir cambios
git push -u origin feature/nombre-feature

# 4. Crear Pull Request hacia develop
```

### Preparar Release

```bash
# 1. Desde develop, crear rama release
git checkout develop
git checkout -b release/v1.1.0

# 2. Actualizar versión si es necesario
# (cambios menores, documentación, bugs menores)

# 3. Mergear a main y develop
git checkout main
git merge release/v1.1.0
git checkout develop
git merge release/v1.1.0

# 4. Crear tag
git tag -a v1.1.0 -m "Release v1.1.0"

# 5. Subir todo
git push origin main develop --tags
```

### Hotfix en Producción

```bash
# 1. Crear rama hotfix desde main
git checkout main
git checkout -b hotfix/v1.0.1-fix-description

# 2. Hacer el fix
git commit -m "fix: critical bug fix"

# 3. Mergear a main y develop
git checkout main
git merge hotfix/v1.0.1-fix-description
git tag -a v1.0.1 -m "Hotfix v1.0.1"

git checkout develop
git merge hotfix/v1.0.1-fix-description

# 4. Eliminar rama hotfix
git branch -d hotfix/v1.0.1-fix-description
```

---

## 📦 Archivos de Configuración Incluidos

| Archivo | Propósito |
|---------|-----------|
| `.gitignore` | Excluye node_modules, logs, archivos sensibles |
| `.github/workflows/ci-cd.yml` | Pipeline de CI/CD |
| `docker-compose.yml` | Configuración Docker |
| `docker-compose.test.yml` | Tests en contenedores |
| `AGENTS.md` | Guía para agentes de desarrollo |
| `README.md` | Documentación principal |
| `CHANGELOG.md` | Historial de cambios |
| `DEPLOYMENT.md` | Guía de despliegue |

---

## 🔐 Seguridad

### Archivos Protegidos por .gitignore

```gitignore
# Variables de entorno (NUNCA subir)
.env
.env.local
.env.*.local

# Dependencias
node_modules/

# Logs
*.log
server.log
backend.log

# Builds
dist/
build/

# Coverage
coverage/
```

### Permisos Recomendados en GitHub

| Setting | Valor Recomendado |
|---------|-------------------|
| Branch Protection (main) | ✅ Require pull request reviews |
| Branch Protection (main) | ✅ Require status checks |
| Actions | ✅ Permitir workflows de GitHub Actions |
| Secrets | ✅ Usar GitHub Secrets para CI/CD |

---

## 📊 Estadísticas del Repositorio

| Métrica | Valor |
|---------|-------|
| Total de commits | 1 |
| Ramas | 1 (main) |
| Contribuidores | 1 (Diegox-17) |
| Archivos tracked | 134 |
| Líneas de código | ~34,799 |

---

## 🛠️ Comandos Útiles

### Verificación del Estado

```bash
# Estado del repositorio
git status

# Ver cambios staged/unstaged
git diff

# Ver historial
git log --oneline --graph --all

# Ver ramas remotas
git branch -r
```

### Sincronización

```bash
# Traer cambios del remoto
git fetch origin

# Pull con rebase
git pull origin main --rebase

# Push de tags
git push --tags
```

### Deshacer Cambios

```bash
# Deshacer cambios locales
git checkout -- .

# Deshacer último commit (mantener cambios)
git reset --soft HEAD~1

# Deshacer último commit (perder cambios)
git reset --hard HEAD~1
```

---

## 📞 Recursos Adicionales

- **Documentación Git:** https://git-scm.com/doc
- **Conventional Commits:** https://www.conventionalcommits.org/
- **Gitflow:** https://nvie.com/posts/a-successful-git-branching-model/
- **GitHub Actions:** https://docs.github.com/en/actions

---

## 📝 Mantenimiento

| Tarea | Frecuencia | Responsable |
|-------|------------|-------------|
| Actualizar CHANGELOG | Por cada release | Owner |
| Revisar seguridad de dependencias | Mensual | Owner |
| Actualizar tags de versión | Por cada release | Owner |
| Revisar logs de CI/CD | Semanal | Owner |

---

**Última actualización:** 2026-01-05  
**Versión del documento:** 1.0  
**Autor:** Git Specialist Agent

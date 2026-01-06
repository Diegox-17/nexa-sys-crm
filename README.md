# NEXA-Sys V.02 CRM

[![CI/CD Pipeline](https://github.com/yourusername/nexasys-crm/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/yourusername/nexasys-crm/actions/workflows/ci-cd.yml)
[![Backend Tests](https://img.shields.io/badge/backend_tests-64_passing-brightgreen)](./docs/05_backend_testing_infrastructure.md)
[![Frontend Tests](https://img.shields.io/badge/frontend_tests-70_written-blue)](./docs/00_Agent_Status.md)
[![Coverage](https://img.shields.io/badge/coverage-63.84%25-brightgreen)](./docs/05_backend_testing_infrastructure.md)
[![Docker](https://img.shields.io/badge/docker-ready-blue)](./docker-compose.yml)
[![License](https://img.shields.io/badge/license-MIT-green)](./LICENSE)

> **Estado:** v1.3.0-fase4.projects · [APROBADO por QA]

...

### Fase 4: Dashboard Analítico y Reportes (COMPLETO ✅)
- ✅ **ProjectsList**: Lista interactiva de proyectos con KPIs de progreso
- ✅ **ProjectDetail**: Vista detallada con Kanban Board para gestión de tareas
- ✅ **Transiciones de Estado**: Botones dedicados para cambiar estado de tareas
- ✅ **Cálculo Automático de Progreso**: Basado en tareas completadas/aprobadas
- ✅ **Rate Limiting Optimizado**: Eliminado problema de 429 Too Many Requests
- ✅ **Optimización de Rendimiento**: useCallback implementado en componentes clave
- ✅ **Bug Fixes**: 18 bugs críticos y medios corregidos y validados

### Próximas Fases
- **Fase 5**: Integración de Notificaciones y Workflows

---

## 🏗️ Estructura del Proyecto
```text
/
├── docs/                 # Documentación técnica (PRD, Arquitectura, QA)
├── prompts/              # Definición de agentes y roles
├── src/
│   ├── backend/          # Microservicio Express (Node.js)
│   └── frontend/         # SPA React (Vite)
├── Bases de diseño/      # Recursos visuales y prototipos
├── docker-compose.yml    # Orquestación de contenedores
└── init.sql              # Esquema de base de datos
```

---

## 🔧 Desarrollo Local
Si deseas ejecutar el frontend fuera de Docker para desarrollo rápido:
```bash
cd src/frontend
npm install
npm run dev
```

---

## 🧪 Testing & CI/CD

### Run Tests Locally

```bash
# Backend tests (64 tests, 53.94% coverage)
cd src/backend && npm test

# Frontend tests (70/88 tests passing, 63.84% coverage)
cd src/frontend && npm test

# Run all tests from root
npm test

# Generate coverage reports
npm run test:coverage
```

### Docker Testing Environment

```bash
# Run tests in isolated Docker environment
docker-compose -f docker-compose.test.yml up --build --abort-on-container-exit

# Cleanup test containers
docker-compose -f docker-compose.test.yml down -v
```

### Continuous Integration

The project uses **GitHub Actions** for automated CI/CD:
- ✅ Automated testing on push/PR to `main` and `develop`
- ✅ Multi-stage Docker builds with caching
- ✅ Smoke tests with Docker Compose
- ✅ Coverage reports uploaded as artifacts
- ✅ Pre-commit hooks to prevent breaking changes

**Pipeline Status:** Check the badge above or visit the [Actions tab](https://github.com/yourusername/nexasys-crm/actions)

### Pre-Commit Hooks

Husky automatically runs tests before commits:
```bash
# Install hooks (one-time)
npm install

# Hooks will run automatically on git commit
git commit -m "Your message"
```

For detailed deployment instructions, see [DEPLOYMENT.md](./docs/DEPLOYMENT.md)

---

## 📚 Documentation

- [🚀 Deployment Guide](./docs/DEPLOYMENT.md) - CI/CD, Docker, Testing
- [🔧 Backend Refactoring](./docs/05_backend_refactor.md) - Modular architecture
- [🧪 Backend Testing](./docs/05_backend_testing_infrastructure.md) - Test suite details
- [📊 Agent Status](./docs/00_Agent_Status.md) - Development progress

---
**NEXA-Sys** | *Conectando Negocios y Tecnología*

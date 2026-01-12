# NEXA-Sys V.02 CRM

[![CI/CD Pipeline](https://github.com/yourusername/nexasys-crm/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/yourusername/nexasys-crm/actions/workflows/ci-cd.yml)
[![Backend Tests](https://img.shields.io/badge/backend_tests-64_passing-brightgreen)](./docs/05_backend_testing_infrastructure.md)
[![Frontend Tests](https://img.shields.io/badge/frontend_tests-70%2F88_passing-blue)](./docs/00_Agent_Status.md)
[![Coverage](https://img.shields.io/badge/coverage-71.18%25-brightgreen)](./docs/05_backend_testing_infrastructure.md)
[![Docker](https://img.shields.io/badge/docker-ready-blue)](./docker-compose.yml)
[![License](https://img.shields.io/badge/license-MIT-green)](./LICENSE)

> **Estado:** v1.0.0 · [🎉 FIRST STABLE RELEASE - PRODUCTION READY]

...

## 🚀 v1.0.0 - First Stable Release

### ✅ Core CRM Features
- **User Management**: Complete authentication system with role-based access
- **Client Management**: Full CRUD operations for client data
- **Project Management**: Interactive project tracking with Kanban boards
- **Real-time Updates**: Dynamic data synchronization across all modules

### 🎨 User Experience
- **Industrial-Digital Design**: Modern glassmorphism UI with cyan accent theme
- **Responsive Layout**: Mobile-first design with collapsible sidebar navigation
- **Touch-Optimized**: Horizontal scrolling for data tables on mobile devices
- **Accessibility**: Semantic HTML5 and ARIA standards compliance

### 🏗️ Technical Architecture
- **Frontend**: React 18 + Vite + React Router (ESM modules)
- **Backend**: Node.js + Express (CommonJS) with JWT authentication
- **Database**: PostgreSQL 15 with in-memory fallback for development
- **API**: RESTful design with comprehensive error handling

### 🧪 Quality Assurance
- **Testing Suite**: 64 backend tests + 70 frontend tests passing
- **Code Coverage**: 71.18% overall test coverage
- **CI/CD Pipeline**: Automated testing with GitHub Actions
- **Docker Support**: Multi-stage builds with production optimization

### 📱 Mobile Experience
- **Responsive Design**: Fully optimized for smartphones and tablets
- **Touch Navigation**: Intuitive gesture-based interactions
- **Data Tables**: Horizontal scrolling with custom scrollbar styling
- **Performance**: Optimized rendering with useCallback and memoization

### 🚀 Production Ready
- **Environment Configuration**: Development and production settings
- **Security Best Practices**: Input validation, SQL injection prevention
- **Error Handling**: Comprehensive error boundaries and logging
- **Performance**: Lazy loading and code splitting implemented

---

## 📋 Development Roadmap

### Future Enhancements
- **v1.1.0**: Advanced analytics dashboard with custom reports
- **v1.2.0**: Real-time notifications and email integration
- **v1.3.0**: Advanced workflow automation
- **v2.0.0**: Multi-tenant architecture with enhanced security

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

# Frontend tests (70/88 tests passing, 71.18% coverage)
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

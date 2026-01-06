# 🚀 Quick Start Guide - NEXA-Sys V.02 CRM

## 📦 Installation

```bash
# Clone repository
git clone <repository-url>
cd nexasys-crm

# Install all dependencies (root + backend + frontend)
npm run install:all

# Or install individually
npm install              # Root (for Husky)
cd src/backend && npm install
cd ../frontend && npm install
```

---

## 🧪 Testing

### Run Tests Locally

```bash
# Run all tests (backend + frontend)
npm test

# Run tests with coverage
npm run test:coverage

# Run backend tests only
npm run test:backend
# Or: cd src/backend && npm test

# Run frontend tests only
npm run test:frontend
# Or: cd src/frontend && npm test

# Watch mode (auto-rerun on changes)
cd src/backend && npm run test:watch
cd src/frontend && npm run test:watch
```

### Docker Testing

```bash
# Run tests in isolated Docker environment
npm run docker:test
# Or: docker-compose -f docker-compose.test.yml up --build --abort-on-container-exit

# Watch mode (for development)
npm run docker:test:watch
# Or: docker-compose -f docker-compose.test.yml up --build

# Cleanup test containers
docker-compose -f docker-compose.test.yml down -v
```

---

## 🐋 Docker Deployment

### Production

```bash
# Start all services
npm run docker:up
# Or: docker-compose up --build -d

# View status
docker-compose ps

# View logs
docker-compose logs -f

# Stop services
npm run docker:down
# Or: docker-compose down -v
```

### Access Points

- **Frontend:** http://localhost
- **Backend API:** http://localhost:5000
- **Health Checks:**
  - Backend: http://localhost:5000/health
  - Frontend: http://localhost/health

### Default Credentials

- **Username:** `admin`
- **Password:** `admin123`

---

## 🔧 Development

### Local Development (without Docker)

```bash
# Terminal 1: Backend
cd src/backend
npm install
export JWT_SECRET="supersecret"  # Linux/Mac
$env:JWT_SECRET="supersecret"    # Windows PowerShell
node server.js

# Terminal 2: Frontend
cd src/frontend
npm install
npm run dev
```

**Frontend:** http://localhost:5173 (Vite dev server)
**Backend:** http://localhost:5000

---

## 🪝 Pre-Commit Hooks

Pre-commit hooks are automatically installed when you run `npm install`.

### How It Works

```bash
# Make changes
git add .

# Commit (hooks run automatically)
git commit -m "Your message"

# Hooks will:
# 1. Run backend tests (49 tests)
# 2. Run frontend tests (66 tests)
# 3. Abort if tests fail
# 4. Allow commit if tests pass
```

### Skip Hooks (not recommended)

```bash
git commit -m "Urgent fix" --no-verify
```

---

## 📊 Coverage Reports

```bash
# Generate coverage reports
npm run test:coverage

# View reports (HTML)
# Backend:
open src/backend/coverage/lcov-report/index.html  # Mac
start src/backend/coverage/lcov-report/index.html # Windows

# Frontend:
open src/frontend/coverage/lcov-report/index.html  # Mac
start src/frontend/coverage/lcov-report/index.html # Windows
```

---

## 🔍 Health Checks

```bash
# Check backend health
curl http://localhost:5000/health
# Expected: "OK"

# Check frontend health
curl http://localhost/health
# Expected: "OK"

# Check Docker service health
docker-compose ps
# Look for "healthy" status
```

---

## 🐛 Troubleshooting

### Tests Failing

```bash
# Clear Jest cache
cd src/backend && npm test -- --clearCache
cd src/frontend && npm test -- --clearCache

# Clean install
rm -rf node_modules package-lock.json
npm install
```

### Docker Issues

```bash
# Clean Docker cache
docker system prune -a --volumes

# Rebuild without cache
docker-compose build --no-cache

# View logs
docker logs nexasys-backend
docker logs nexasys-frontend
docker logs nexasys-db
```

### Port Conflicts

```bash
# Check what's using port 80
lsof -i :80       # Mac/Linux
netstat -ano | findstr :80  # Windows

# Or change port in docker-compose.yml:
ports:
  - "8080:80"  # Change to port 8080
```

---

## 📚 Documentation

- **Deployment Guide:** [docs/DEPLOYMENT.md](../docs/DEPLOYMENT.md)
- **Backend Testing:** [docs/05_backend_testing_infrastructure.md](../docs/05_backend_testing_infrastructure.md)
- **Backend Refactoring:** [docs/05_backend_refactor.md](../docs/05_backend_refactor.md)
- **DevOps CI/CD:** [docs/06_devops_cicd_integration.md](../docs/06_devops_cicd_integration.md)
- **Agent Status:** [docs/00_Agent_Status.md](../docs/00_Agent_Status.md)

---

## 🎯 Common Commands Cheat Sheet

| Task | Command |
|------|---------|
| Install all dependencies | `npm run install:all` |
| Run all tests | `npm test` |
| Run tests with coverage | `npm run test:coverage` |
| Run backend tests | `npm run test:backend` |
| Run frontend tests | `npm run test:frontend` |
| Start production (Docker) | `npm run docker:up` |
| Stop production (Docker) | `npm run docker:down` |
| Run tests in Docker | `npm run docker:test` |
| Watch tests in Docker | `npm run docker:test:watch` |
| View Docker logs | `docker-compose logs -f` |
| Check Docker status | `docker-compose ps` |
| Backend dev server | `cd src/backend && node server.js` |
| Frontend dev server | `cd src/frontend && npm run dev` |

---

## 🔐 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `JWT_SECRET` | JWT signing key | `nexasys_secret_2025` |
| `DATABASE_URL` | PostgreSQL connection | Auto-configured in Docker |
| `PORT` | Backend port | `5000` |
| `NODE_ENV` | Environment | `production` |
| `USE_DATABASE` | Enable PostgreSQL | `true` (Docker), `false` (local) |

---

## 🚦 CI/CD Pipeline

The pipeline runs automatically on:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`
- Manual trigger (Actions tab)

**View Status:** [GitHub Actions](<repository-url>/actions)

**Pipeline Stages:**
1. 📦 Install Dependencies (parallel)
2. 🧪 Backend Tests (49 tests)
3. 🎨 Frontend Tests (66 tests)
4. 🐋 Build Docker Images
5. 🔥 Smoke Tests
6. 📊 Coverage Reports

**Total Time:** ~5-8 minutes

---

## ✅ Getting Started Checklist

- [ ] Clone repository
- [ ] Run `npm run install:all`
- [ ] Run `npm test` to verify setup
- [ ] Start Docker: `npm run docker:up`
- [ ] Access app: http://localhost
- [ ] Login with `admin/admin123`
- [ ] Make changes and commit (pre-commit hooks will run)

---

## 🆘 Need Help?

1. Check [DEPLOYMENT.md](../docs/DEPLOYMENT.md) for detailed troubleshooting
2. Review [Agent Status](../docs/00_Agent_Status.md) for project progress
3. Search existing GitHub issues
4. Create new issue with error details

---

**NEXA-Sys V.02 CRM** | Quick Start Guide
**Version:** 2.0.0
**Status:** ✅ Production Ready

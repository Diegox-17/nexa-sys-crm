# AGENTS.md - NEXA-Sys V.02 CRM Development Guide

This file provides guidelines and commands for agentic coding agents working on this codebase.

## Project Overview

NEXA-Sys V.02 CRM is a full-stack application with:
- **Frontend**: React 18 + Vite + React Router (ESM modules)
- **Backend**: Node.js + Express (CommonJS)
- **Database**: PostgreSQL 15 with in-memory fallback for development
- **Testing**: Jest (Backend & Frontend)
- **Style**: Industrial-Digital aesthetic with glassmorphism UI

## Build/Lint/Test Commands

### Installation
```bash
# Install all dependencies (root + backend + frontend)
npm run install:all

# Or install individually
cd src/backend && npm install
cd src/frontend && npm install
```

### Backend Commands (src/backend/)
```bash
npm start          # Start production server (node app.js)
npm run dev        # Start with nodemon for development
npm test           # Run all tests with coverage
npm run test:watch # Watch mode for TDD
npm run test:coverage # Generate coverage report
```

### Frontend Commands (src/frontend/)
```bash
npm run dev        # Start Vite dev server
npm run build      # Production build
npm run preview    # Preview production build
npm test           # Run tests
npm run test:watch # Watch mode
npm run test:coverage # Coverage report
npm run test:ui    # Verbose test UI
```

### Root-Level Commands
```bash
npm test           # Run backend + frontend tests
npm run test:coverage # All coverage reports
npm run docker:up  # Start Docker containers
npm run docker:down # Stop containers
npm run docker:test # Run tests in Docker
```

### Running a Single Test
```bash
# Backend - specific test file
cd src/backend && npm test -- auth.test.js

# Backend - specific test name pattern
cd src/backend && npm test -- -t "should login with valid credentials"

# Frontend - specific test file
cd src/frontend && npm test -- Login.test.jsx

# Frontend - specific test name
cd src/frontend && npm test -- -t "renders login form"
```

## Code Style Guidelines

### JavaScript/Node.js (Backend)

**Imports**: CommonJS require syntax (`const express = require('express')`)
- Order: Built-in → External → Relative (./, ../)
- No ESM import syntax in backend

**Naming Conventions**:
- Variables/functions: camelCase (`getAuthHeaders`, `isUsingDatabase`)
- Constants: UPPER_SNAKE_CASE for config values
- Classes: PascalCase
- Files: camelCase (`.routes.js`, `.middleware.js`, `.config.js`)

**Error Handling**:
- Always use try/catch in async route handlers
- Return consistent error format: `{ message: '...' }`
- Use appropriate HTTP status codes (400, 401, 403, 404, 500)
- Never expose stack traces in production

**Validation**:
- Use Joi for request validation (see `middleware/validation.js`)
- Always validate incoming data with schemas
- Use `abortEarly: false` to get all errors

**Database**:
- Check `isUsingDatabase()` before PostgreSQL queries
- Provide in-memory fallback data in `config/database.js`
- Use parameterized queries for SQL (`$1`, `$2`, etc.)

### React/JavaScript (Frontend)

**Imports**: ESM import syntax
```javascript
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';
```

**Naming Conventions**:
- Components: PascalCase (`UserManagement.jsx`)
- Hooks: camelCase starting with `use` (`useAuth`, `useState`)
- Files: PascalCase for components, camelCase for utilities
- CSS classes: kebab-case (in CSS files)

**Component Structure**:
```jsx
// 1. Imports
// 2. Types/Interfaces (if using TypeScript)
// 3. Component definition
// 4. Hooks (useState, useEffect)
// 5. Event handlers
// 6. Render/return
// 7. Export default
```

**State Management**:
- Use React Context for global state (AuthContext pattern)
- Local state with useState/useReducer
- Fetch data in useEffect with proper cleanup

**API Layer**:
- All API calls in `services/api.js`
- Use centralized `getAuthHeaders()` helper
- Consistent error handling with `handleResponse()`

**Testing**:
- Use Jest with React Testing Library
- Mock external dependencies (`jest.mock()`)
- Tests in `__tests__/` folders mirroring source structure
- Descriptive test names: `test('should...')` or `it('should...')`

### CSS/Styling
- Industrial-Digital theme with dark mode base
- Glassmorphism: `backdrop-filter: blur()`, semi-transparent backgrounds
- Consistent spacing using CSS custom properties
- No inline styles (except dynamic values)

## Architecture Patterns

### Backend Layer Order
1. Routes (`routes/*.routes.js`) - HTTP layer
2. Controllers (optional) - Request handling logic
3. Services - Business logic
4. Models/Data access - `config/database.js`
5. Middleware - `middleware/` (auth, validation, security)

### Frontend Component Organization
```
src/
├── components/     # Reusable UI components
├── pages/          # Route-level components
│   ├── PageName/
│   │   ├── PageName.jsx
│   │   └── PageName.css
├── context/        # React Context providers
├── services/       # API layer
└── __tests__/      # Tests mirroring source structure
```

### Authentication Flow
- JWT tokens stored in localStorage
- Bearer token in Authorization header
- ProtectedRoute component for route guarding
- Role-based access (admin, manager, user)

## Important Notes

- **Spanish/English Hybrid**: Backend error messages in Spanish, code in English
- **Mode Detection**: Backend auto-detects PostgreSQL vs in-memory
- **Bug References**: Comments reference bug IDs (BUG #025, BUG #026)
- **Default Credentials**: admin / admin123
- **Port Configuration**: Frontend :3000, Backend :5000

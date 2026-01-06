# Reporte de Calidad (QA): NEXA-Sys V.02 CRM - Fase 3

**Estado General:** [APROBADO] ✅
**Fecha:** 29/12/2025

---

## 1. Validación de Historias de Usuario - Fase 3

| ID | Historia de Usuario | Estado | Observaciones |
| :--- | :--- | :--- | :--- |
| **HU05.1** | Gestión de Clientes (CRUD) | IMPLEMENTADO | Lista, creación, edición y soft-delete de clientes. |
| **HU05.2** | Campos Personalizados | IMPLEMENTADO | Creación dinámica de inputs. |
| **HU05.3** | Categorización de Campos | IMPLEMENTADO | Organización por categorías. |
| **HU05.4** | Gestión Avanzada de Campos | IMPLEMENTADO | Edición y desactivación de campos (Solo Admin). |
| **HU05.5** | Control de Acceso (RBAC) | IMPLEMENTADO | Restricciones visuales y de API correctas (Filtro por Rol activo). |

---

## 2. Requisitos Técnicos - Validación

### Backend (Node.js + Express)
✅ **Endpoints de Campos**: Implementados OK.
✅ **Endpoint `GET /api/users`**: Accesible para Managers con filtro de seguridad (Solo usuarios regulares).
✅ **Métricas Dashboard**: Correctamente filtradas.

### Frontend (React + Vite)
✅ **ClientManagement.jsx**: Funcional con Logout.
✅ **Dashboard.jsx**: Consistencia en Sidebar Footer (Role/Sec_Level).

---

## 3. Plan de Pruebas Manuales (Pendientes)

### Caso de Prueba: Acceso Manager
1. Login como `manager`/`admin123`.
2. Ir a "Gestión de Usuarios".
3. **Esperado**: Ver SOLO usuarios con rol 'user'.
4. **Actual**: Se visualizan solo usuarios rol 'user'. ✅

---

## 🐛 Reporte de Bugs Fase 3

### BUG #009: Métricas Dashboard Incorrectas - ✅ RESUELTO
**Severidad**: 🟢 BAJA
**Solución**: Servicio backend reiniciado con lógica de filtrado correcta.

### BUG #010: Inconsistencia Visual en Dashboard - ✅ RESUELTO
**Severidad**: 🟢 BAJA
**Solución**: Footer de Sidebar homologado en `Dashboard.jsx`.

### BUG #011: Manager sin Acceso a Usuarios - ✅ RESUELTO
**Severidad**: 🔴 CRÍTICA
**Solución**: Middleware actualizado a `isAdminOrManager`.

### BUG #012: Escalado de Privilegios (Manager ve Admins) - ✅ RESUELTO
**Severidad**: 🔴 CRÍTICA (Seguridad)
**Descripción**: El rol `manager` veía a usuarios `admin`.
**Solución**: Se implementó filtrado condicional en backend: Si `req.user.role === 'manager'`, solo retorna usuarios con rol `user`.

---

## 4. Conclusión Técnica

**Estado Final**: ✅ APROBADO
Todas las vulnerabilidades detectadas han sido mitigadas. El sistema es estable y seguro.

**Asignaciones**:
- N/A (Fase completa)

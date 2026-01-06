# PRD - Fase 3: Gestión de Clientes

## 1. Introducción
El módulo de Gestión de Clientes ("Clients") es el corazón operativo del CRM. Permite centralizar la información de las cuentas comerciales de NEXA-Sys. Esta fase introduce un modelo de datos flexible y permisos jerárquicos más complejos que en la fase de usuarios.

## 2. Objetivos del Negocio
- Centralizar la base de datos de clientes.
- Permitir que cualquier empleado (User) pueda capturar prospectos o clientes.
- Asegurar la calidad de los datos restringiendo la edición y visibilidad a roles superiores (Manager/Admin).
- Proveer flexibilidad a los administradores para extender la información del cliente sin tocar código (Campos dinámicos).

## 3. Historias de Usuario

### HU-3.1: Creación de Clientes
**Como** Usuario (cualquier rol)  
**Quiero** registrar un nuevo cliente en el sistema  
**Para** comenzar a gestionar su relación comercial.

**Criterios de Aceptación:**
- Botón "+ Nuevo Cliente" visible para todos los roles.
- Formulario con campos obligatorios: Nombre, Contacto Principal, Email, Teléfono.
- Al crear, el estado por defecto es "Activo".

### HU-3.2: Gestión de Visibilidad (Soft Delete)
**Como** Manager o Admin  
**Quiero** ocultar (desactivar) o mostrar (activar) un cliente  
**Para** mantener la lista limpia sin perder datos históricos.

**Criterios de Aceptación:**
- Toggle o botón visible solo para `manager` y `admin`.
- Usuarios `user` solo pueden ver clientes "Activos". Managers/Admins pueden ver todos.

### HU-3.3: Edición de Información
**Como** Manager o Admin  
**Quiero** editar los datos de un cliente existente  
**Para** corregir errores o actualizar información de contacto.

**Criterios de Aceptación:**
- Botón "Editar" visible solo para `manager` y `admin`.
- Roles `user` tienen vista de solo lectura en los detalles.

### HU-3.4: Campos Dinámicos (Custom Fields)
**Como** Administrador  
**Quiero** agregar nuevos campos al formulario de clientes (ej. "RFC", "Fecha Aniversario")  
**Para** adaptar el CRM a nuevas necesidades sin requerir desarrollo.

**Criterios de Aceptación:**
- Opción "Configurar Campos" visible SOLO para `admin`.
- Modal para agregar campo: Nombre del campo, Tipo (Texto, Número, Fecha).
- Los nuevos campos aparecen automáticamente en el formulario de creación/edición para todos.

## 4. Modelo de Datos (Clientes)

| Campo | Tipo | Obligatorio | Notas |
|-------|------|-------------|-------|
| id | UUID | Sí | PK |
| name | String | Sí | Nombre de la empresa |
| contact_name | String | Sí | Persona de contacto |
| industry | String | No | Giro Comercial |
| email | String | Sí | Validación de formato |
| phone | String | Sí | |
| active | Boolean | Sí | Default: true (Visible) |
| projects | Array | No | IDs de proyectos relacionados |
| notes | Text | No | Observaciones |
| custom_fields | JSONB | No | Para campos dinámicos definidos por Admin |

## 5. Reglas de Negocio (RBAC)

| Acción | Admin | Manager | User |
|--------|-------|---------|------|
| **Ver Lista** | ✅ Todo | ✅ Todo | ✅ Solo Activos |
| **Crear Cliente** | ✅ | ✅ | ✅ |
| **Editar Datos** | ✅ | ✅ | ❌ |
| **Cambiar Estado (Visible)** | ✅ | ✅ | ❌ |
| **Agregar Campos Custom** | ✅ | ❌ | ❌ |

## 6. Requerimientos Técnicos
- **Backend**: 
  - Endpoint `POST /api/clients` (Público para roles autenticados).
  - Endpoint `PUT /api/clients/:id` (Protegido Admin/Manager).
  - Columna `custom_fields` en base de datos usando tipo JSON/JSONB (Postgres) o String stringified (In-memory).
- **Frontend**:
  - Componente `ClientList` con filtros.
  - Modal `ClientForm` que renderiza campos base + campos custom.
  - Modal `FieldManager` exclusivo para admins.

## 7. Criterios de Calidad (QA)
- Un usuario estándar NO debe poder ver el botón de editar ni el de cambiar estado.
- Un manager NO debe poder agregar campos personalizados.
- Al agregar un campo personalizado, este debe persistir y mostrarse en futuros ingresos.

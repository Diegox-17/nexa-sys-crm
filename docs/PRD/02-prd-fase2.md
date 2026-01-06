# Documento de Requisitos del Producto (PRD): NEXA-Sys V.02 CRM - Fase 2
> **Nombre del Módulo**: Gestión de Usuarios y Roles (RBAC)

## 1. Introducción
La Fase 2 se centra en dotar al sistema de herramientas administrativas completas para la gestión de su capital humano. Se implementará un panel de control avanzado que permita a los administradores gestionar el ciclo de vida de los usuarios en el sistema.

## 2. Historias de Usuario

### HU04.1: Listado Avanzado de Usuarios
**Como** Administrador, **quiero** ver una tabla detallada de usuarios, **para** monitorear quién tiene acceso al sistema y qué rol desempeña.
- **Criterios de Aceptación**:
    - Tabla con: Avatar, Nombre, Email, Rol (Badge), Estado (Activo/Inactivo).
    - Opción de búsqueda por nombre o email.
    - Filtro por rol.

### HU04.2: Creación y Asignación de Roles
**Como** Administrador, **quiero** crear nuevos usuarios y asignarles un rol específico, **para** delegar responsabilidades adecuadamente.
- **Criterios de Aceptación**:
    - Formulario con campos: Nombre, Email, Contraseña, Rol.
    - Roles permitidos: `admin`, `manager`, `user`.
    - Validación de email único.

### HU04.3: Edición y Control de Estado
**Como** Administrador, **quiero** editar la información de un usuario o desactivar su cuenta, **para** mantener la integridad de los datos y la seguridad.
- **Criterios de Aceptación**:
    - Modal de edición para cambiar rol o email.
    - Botón de "Switch" para activar/desactivar acceso (sin borrar el registro de la DB).
    - El usuario desactivado no debe poder iniciar sesión aunque sus credenciales sean correctas.

## 3. Requisitos Técnicos
- **Backend**:
    - Endpoint `PUT /api/users/:id` para actualizaciones.
    - Endpoint `PATCH /api/users/:id/status` para activación/desactivación.
    - Lógica de negocio para denegar acceso a usuarios con `status = false`.
- **Frontend**:
    - Implementación de `UserManagement.jsx` en `/src/pages/Users/`.
    - Componentes de UI: Tablas reactivas, Modales de edición, Formularios con validación.

## 4. Diseño
- Seguir la estética **Industrial-Digital**.
- Uso de componentes de "Glassmorphism" para los modales.
- Feedback visual claro para acciones de guardado o error.

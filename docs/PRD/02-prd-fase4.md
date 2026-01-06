# Documento de Requisitos del Producto (PRD) - Fase 4: Gestión de Proyectos

## 1. Introducción
La Fase 4 del CRM NEXA-Sys V.02 se centra en la **Gestión de Proyectos**, permitiendo a la organización vincular clientes con proyectos específicos, asignar responsables y gestionar el flujo de trabajo de tareas. Este módulo es fundamental no solo para la operatividad actual, sino que sienta las bases arquitectónicas para los futuros módulos de Finanzas y Contabilidad.

## 2. Objetivos
- Centralizar la información de proyectos vinculándolos a clientes existentes.
- Establecer un flujo de trabajo claro para la gestión de tareas (Creación -> Completado -> Aprobación).
- Proveer visibilidad del estado de los proyectos mediante dashboards específicos.
- Preparar la estructura de datos para la futura integración con módulos financieros.

## 3. Alcance
### Funcionalidades Principales
- **Gestión de Proyectos:** Creación, lectura, actualización y borrado suave (soft delete).
- **Vinculación:** Relación directa Cliente-Proyecto.
- **Gestión de Tareas:** Asignación, seguimiento y aprobación.
- **Dashboard de Proyecto:** Resumen visual de actividades y estado.

## 4. Actores y Permisos
- **Administrador:** Acceso total (CRUD Proyectos, Aprobación de Tareas).
- **Manager:** Acceso total a Gestión de Proyectos y Aprobación de Tareas.
- **Usuario:** Visualización de proyectos asignados, Creación de tareas, Completar tareas.

## 5. Historias de Usuario

### 5.1 Gestión de Proyectos

**(HU-001) Crear Proyecto**
- **Como** Administrador o Manager,
- **Quiero** crear un nuevo proyecto asignándolo a un cliente existente y definiendo sus atributos (nombre, fechas, responsable), Los usuarios tipo Admin podrán agregar campos personalizados a los proyectos, (Basados en la solución de los campos de clientes en la fase 3)
- **Para** iniciar el seguimiento formal de un trabajo contratado.
- **Criterios de Aceptación:**
    - El formulario debe requerir: Nombre, Cliente (Select), Fecha Inicio, Fecha Fin (opcional), Estado (Select: Prospectado, Cotizado, En Progreso, Pausado, Finalizado), Responsable (Usuario).
    - El proyecto debe guardarse en base de datos PostgreSQL.
    - Validación de fechas (Fin no puede ser antes de Inicio).

**(HU-002) Listar y Filtrar Proyectos**
- **Como** usuario del sistema con permisos,
- **Quiero** ver una lista de proyectos con filtros por estado y cliente,
- **Para** encontrar rápidamente la información relevante.

**(HU-003) Soft Delete de Proyectos**
- **Como** Administrador o Manager,
- **Quiero** eliminar proyectos de manera lógica (soft delete) en lugar de física,
- **Para** mantener la integridad referencial y el histórico de datos.
- **Criterios de Aceptación:**
    - El registro no se borra de la DB, se actualiza un campo `deleted_at` o `is_active`.
    - No debe aparecer en listados activos.

### 5.2 Gestión de Tareas y Workflow

**(HU-004) Gestión de Tareas en Proyecto**
- **Como** Usuario,
- **Quiero** crear tareas dentro de un proyecto, especificando descripción y estado inicial,
- **Para** desglosar el trabajo necesario.
- **Criterios de Aceptación:**
    - La tarea debe pertenecer a un Proyecto.
    - Campos: Descripción, Estado (Pendiente, En Progreso, Completada, Aprobada).

**(HU-005) Completar Tarea**
- **Como** Usuario asignado,
- **Quiero** marcar una tarea como "Completada",
- **Para** notificar que el trabajo ha terminado.
- **Criterios de Aceptación:**
    - El estado cambia a "Completada".
    - Queda pendiente de aprobación por un Manager/Admin.

**(HU-006) Aprobar Tarea**
- **Como** Manager o Administrador,
- **Quiero** revisar las tareas marcadas como "Completada" y aprobarlas,
- **Para** asegurar la calidad y el cumplimiento antes de cerrarlas.
- **Criterios de Aceptación:**
    - Cambio de estado final a "Aprobada".
    - Registro de quién aprobó y fecha.

### 5.3 Visualización

**(HU-007) Dashboard de Proyecto**
- **Como** Responsable de Proyecto,
- **Quiero** ver un resumen con el progreso de las tareas y estado general,
- **Para** tomar decisiones informadas.

## 6. Requerimientos Técnicos

### Backend (Node.js/Express)
- **Nuevos Endpoints REST:**
    - `POST /api/projects`
    - `GET /api/projects`
    - `PUT /api/projects/:id`
    - `DELETE /api/projects/:id` (Soft delete)
    - `POST /api/projects/:id/tasks`
    - `PATCH /api/tasks/:taskId/status` (Workflow de estados)
- **Base de Datos (PostgreSQL):**
    - Tabla `projects`: `id`, `client_id`, `name`, `start_date`, `end_date`, `status`, `responsible_id`, `created_at`, `deleted_at`.
    - Tabla `tasks`: `id`, `project_id`, `description`, `status`, `created_by`, `approved_by`.
- **Seguridad:**
    - Middleware de permisos actualizado para verificar roles en endpoints de aprobación y gestión.

### Frontend (React)
- **Nuevas Vistas:**
    - Lista de Proyectos.
    - Detalle de Proyecto (Dashboard + Lista de Tareas).
    - Modales/Formularios para Crear/Editar Proyecto y Tarea.

## 7. Consideraciones Futuras
- **Módulos Financieros:** La estructura de proyectos debe ser capaz de relacionarse (FK) con futuras tablas de `income` (ingresos) y `expense` (egresos). Se debe asegurar que el `id` de proyecto sea indexado y estable.
- **Módulos Contables:** La estructura de proyectos debe ser capaz de relacionarse (FK) con futuras tablas de `invoice` (facturas) y `payment` (pagos). Se debe asegurar que el `id` de proyecto sea indexado y estable.


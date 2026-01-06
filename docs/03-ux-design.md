# Propuesta de Diseño UX/UI: NEXA-Sys V.02 CRM

## 1. Guía de Estilo (NEXA-Sys Identity)
- **Concepto**: Business Architecture, Minimalist, "Clean Tech", Industrial-Digital.
- **Paleta de Colores**:
    - **Primario**: Deep Midnight Blue (`#0B1E3B`)
    - **Secundario (Highlights)**: Electric Cyan (`#00F0FF`)
    - **Acento**: Slate Grey (`#64748B`)
    - **Fondo (Dark Mode)**: Dark Space (`#0F172A`)
    - **Fondo (Light Mode)**: Pure White (`#FFFFFF`)
- **Tipografía**: Inter / Roboto (Sans-serif, moderna).

## 2. Flujos de Navegación

### Flujo A: Inicio de Sesión (Cualquier Usuario)
1. Usuario llega a `/login`.
2. Ingresa credenciales y presiona "Acceder".
3. **Éxito**: Redirección a `/dashboard`.
4. **Error**: Notificación tipo Toast en el borde superior derecho ("Credenciales Inválidas").

### Flujo B: Administración de Usuarios (Solo Admin)
1. Admin en `/dashboard` hace clic en "Usuarios" en el Sidebar.
2. Sistema muestra el listado en `/admin/users`.
3. Admin hace clic en "Nuevo Usuario".
4. Se abre Modal con formulario.
5. Al guardar, la tabla se actualiza asíncronamente.

## 3. Mockups Textuales

### Página: Login
- **Contenedor**: Centrado, efecto Glassmorphism suave sobre fondo `#0F172A`.
- **Componentes**:
    - **Logo**: Imagen central superior ("Nexus-Sys Logo").
    - **Input Usuario**: Borde `#64748B`, Focus Color `#00F0FF`.
    - **Input Password**: Tipo password, mismo estilo.
    - **Botón "Acceder"**: Fondo `#0B1E3B`, Texto `#00F0FF`, Hover Glow Cyan.

### Página: Dashboard Principal
- **Layout**: Sidebar (Izq) + Main Content (Der).
- **Sidebar**:
    - Links: Dashboard, Clientes, Reportes, Usuarios (Visible solo si Admin).
    - Toggle Light/Dark Mode en la parte inferior.
- **Widgets (Main Content)**:
    - **Card Métrica**: Fondo `#0F172A` (Dark), Borde Cyan, Título en Slate Grey, Número en Blanco.

### Página: Gestión de Usuarios
- **Componentes**:
    - **Tabla**: Encabezados en Deep Midnight Blue. Filas con hover effect.
    - **Badges de Rol**: Visualización de roles con colores diferenciados (Admin: Cyan Glow).
    - **Botón "Nuevo"**: Estilo primario industrial.
    - **Modal Registro**: Formulario con Select para Role (Admin, Manager, User), Input Email, Input Password con visibilidad togglable.

## 4. Prototipos en Bases de diseño
Se encuentran disponibles en `Bases de diseño/Prototipos/`:
- `login.html`: Flujo de acceso y validación visual.
- `dashboard.html`: Panel de control y métricas base.
- `user-management.html`: [Fase 2] Interfaz administrativa para el CRUD de usuarios.
- `clients.html`: [Fase 3] Módulo de gestión de clientes con campos dinámicos.
- `fase4/projects_list.html`: [Fase 4] Listado y gestión de proyectos.
- `fase4/project_detail.html`: [Fase 4] Tablero Kanban y KPIs de proyecto.

## 5. Gestión de Clientes (Fase 3)

### Flujos de Usuario
1. **Listado**: Navegación a `/clients`. Vista de tabla enriquecida con Tags de proyectos y avatars de empresa.
2. **Creación**: Botón `+ NUEVO CLIENTE` abre modal. Formulario renderiza campos estáticos (base) + campos dinámicos (si existen).
3. **Gestión de Campos (Admins)**: Botón `⚙️ CAMPOS`. Abre modal secundario para definir nuevos atributos (RFC, Fechas, etc.). Persistencia global.
4. **Edición/Visibilidad**: Botones en tabla `✏️` (Editar) y `👁️` (Toggle Visibility - Soft Delete).

### Componentes Clave
- **Data Table Enriquecida**:
    - Columna Cliente con ID visual secundario.
    - Columna Contacto agrupando Nombre + Tel/Email.
    - Columna Proyectos usando "Pills" o "Tags" visuales.
- **Section Custom Fields**: Área en el formulario que se renderiza dinámicamente basada en la configuración JSON del sistema.
- **Icon Buttons**: Acciones directas en tabla sin texto ("Clean Look").

## 6. Gestión de Proyectos (Fase 4)

### Flujos de Usuario
1. **Navegación**: Acceso desde Sidebar -> "Proyectos". Ruta protegida `/projects`.
2. **Dashboard de Proyecto**: Al hacer clic en una fila de la tabla de proyectos, se navega a `/projects/:id` donde se muestra el tablero Kanban.
3. **Flujo de Tareas**:
    - Creación: Botón en vista detalle "+ NUEVA TAREA".
    - Estados: Pendiente -> En Progreso -> Por Aprobar -> Finalizado.
    - Movimiento: Cambio de estado mediante edición o Drag & Drop (si se implementa librería).

### Arquitectura de Componentes
- `ProjectsList`:
    - Integra la tabla estandarizada con filtros de estado (En Progreso, Finalizado).
    - Modal de creación de proyecto vinculado a un Cliente existente.
- `ProjectDetail`:
    - **Header**: Muestra Título, Cliente y Status Global.
    - **KPIs**: Componente `StatCard` reutilizable para Progreso (%), Tareas Activas y Presupuesto.
    - **KanbanBoard**: Grid de 4 columnas auto-ajustables.
- **TaskCard**: Tarjeta "Glass" compacta con ID (#104), título y responsable (Avatar).

### Integración de Estilos
- Homologación con `Dashboard.css`:
    - Sidebar: Activo con fondo `rgba(0, 240, 255, 0.05)` y sin flechas.
    - Avatares: Borde Cyan plano.
    - Glassmorphism: Blur de 20px para profundidad consistente.

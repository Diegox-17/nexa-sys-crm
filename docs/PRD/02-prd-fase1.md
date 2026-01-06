# Documento de Requisitos del Producto (PRD): NEXA-Sys V.02 CRM - Fase 1

## 1. Introducción
Este documento define los requisitos funcionales y técnicos para la primera fase del CRM NEXA-Sys V.02, enfocándose en la autenticación, el dashboard base y la gestión de usuarios.

## 2. Historias de Usuario

### HU01: Autenticación de Usuarios
**Como** usuario del sistema, **quiero** iniciar sesión con mis credenciales, **para** acceder de forma segura a las funcionalidades del CRM.

**Criterios de Aceptación:**
- **Funcionales:**
    - El sistema debe presentar un formulario de login con campos para usuario y contraseña.
    - El sistema debe validar las credenciales contra la base de datos PostgreSQL.
    - El sistema debe redirigir al Dashboard tras un inicio de sesión exitoso.
    - El sistema debe mostrar un mensaje de error claro en caso de credenciales incorrectas.
- **Técnicos:**
    - La contraseña debe estar encriptada en la base de datos (Hashing).
    - El sistema debe generar un token JWT tras la autenticación exitosa.
    - El token JWT debe incluir el rol del usuario (Admin/User).

### HU02: Protección de Rutas
**Como** administrador del sistema, **quiero** que las rutas sensibles estén protegidas, **para** evitar accesos no autorizados.

**Criterios de Aceptación:**
- **Funcionales:**
    - Los usuarios no autenticados que intenten acceder a rutas internas deben ser redirigidos al Login.
    - Los usuarios sin rol de "Admin" no deben poder acceder al panel de Gestión de Usuarios.
- **Técnicos:**
    - Implementar un MiddleWare/HOC de protección de rutas en el Frontend.
    - Validar la firma y expiración del JWT en cada petición al Backend.

### HU03: Dashboard Principal
**Como** usuario, **quiero** ver un resumen de mi actividad en un dashboard, **para** tener una visión rápida del estado de mis tareas/clientes.

**Criterios de Aceptación:**
- **Funcionales:**
    - El sistema debe mostrar widgets con métricas básicas (ej. Total de clientes, tareas pendientes).
    - Permitir el cambio entre tema Claro y Oscuro (Dark Mode).
- **Técnicos:**
    - El estado del tema (Light/Dark) debe persistir en el LocalStorage o base de datos.
    - Los widgets deben cargar datos de forma asíncrona desde la API.

### HU04: Gestión de Usuarios (Solo Admin)
**Como** administrador, **quiero** listar, crear y editar usuarios, **para** gestionar el acceso del equipo al CRM.

**Criterios de Aceptación:**
- **Funcionales:**
    - Visualizar una tabla con todos los usuarios registrados.
    - Formulario para registro de nuevos usuarios con asignación de roles.
- **Técnicos:**
    - Implementar endpoints REST para CRUD de usuarios.
    - Validar que solo el rol "Admin" tenga permisos de escritura en la base de datos para esta entidad.

## 3. Requisitos No Funcionales
- **Escalabilidad**: El sistema debe estar preparado para ejecutarse en contenedores Docker.
- **Disponibilidad**: La arquitectura debe permitir el despliegue de microservicios independientes.
- **Estética**: Interfaz moderna siguiendo la guía de estilo de NEXA-Sys.

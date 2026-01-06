# Visión del Producto: NEXA-Sys V.02 CRM

## Contexto
NEXA-Sys V.02 es una evolución del sistema CRM de la compañía, diseñada con una arquitectura moderna de microservicios y microfrontends para garantizar escalabilidad, mantenibilidad y un rendimiento excepcional.

## Objetivo
Desarrollar una plataforma centralizada de gestión de relaciones con clientes que permita a los administradores y usuarios gestionar datos, autenticación y flujos de trabajo de manera intuitiva y eficiente.

## Pilares del Sistema
1. **Seguridad Robusta**: Implementación de autenticación JWT y manejo de roles (Admin/User).
2. **Experiencia de Usuario Premium**: Un diseño "Clean Tech" industrial-digital con soporte nativo para Dark Mode.
3. **Arquitectura Escalable**: Microservicios dockerizados que se comunican vía REST API.
4. **Persistencia Confiable**: Uso de PostgreSQL para la gestión de datos críticos.

## Alcance Fase 1
- Módulo de Autenticación (Login, Registro, Protección de Rutas).
- Dashboard Principal con resumen de actividades.
- Panel de Gestión de Usuarios (CRUD para administradores).
- Configuración de infraestructura base con Docker Compose.

## Alcance Fase 2
- Módulo de Gestión de Usuarios (CRUD para administradores).

## Alcance Fase 3
- Módulo de Gestión de Clientes (CRUD para administradores y managers).

## Alcance Fase 4
- Módulo de Gestión de Proyectos (Los Managers o admins pueden crear y hacer soft delete de proyectos, estos proyectos estarán vinculados a los clientes, los proyectos tendrán nombre, fecha de inicio, fecha de fin, estado, responsable y un dashboard con resumen de actividades los usuarios, deberán de llenar las tareas, el estatus de esta tarea y su descripción. los admins y managers tendrán la función de aprobar dicha tare, el workflow será el siguiente: 
Usuario crea tarea -> Usuario completa la tarea -> Admin/Manager aprueba la finalización de la tarea).
El módulo de Gestión de proyecto estará listo para un grupo de modulos posteriores de finanzas (ingresos y egresos) y de contabilidad (facturas, declaraciones, etc).




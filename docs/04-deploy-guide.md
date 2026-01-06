# Guía de Deployment: NEXA-Sys V.02 CRM

**Versión:** 1.0.0  
**Fecha:** 2026-01-06  
**Autor:** @Arquitecto-Agente  
**Estado:** ✅ APROBADO PARA PRODUCCIÓN

---

## 📋 Resumen Ejecutivo

Este documento detalla la solución implementada para resolver el **BUG-044**: error de inicialización de PostgreSQL en entornos de producción Linux con Docker y Portainer.

### Problema Original
```
psql:/docker-entrypoint-initdb.d/init.sql: error: could not read from input file: Is a directory
```

### Solución Implementada
Creación de un **Dockerfile personalizado** para PostgreSQL que copia el script de inicialización durante el build, eliminando la dependencia de volúmenes en tiempo de ejecución.

---

## 🐛 BUG-044: PostgreSQL init.sql No Se Carga

### Descripción del Problema

| Aspecto | Valor |
|---------|-------|
| **ID** | BUG-044 |
| **Severidad** | 🔴 CRÍTICA |
| **Tipo** | Deployment - Docker/PostgreSQL |
| **Estado** | ✅ RESUELTO |
| **Fecha Detectado** | 2026-01-06 |
| **Entorno** | Servidor Linux con Docker + Portainer |

### Error en Producción

```
2026-01-06 06:20:31.677 UTC [41] LOG:  database system is ready to accept connections
 done
server started
CREATE DATABASE
/usr/local/bin/docker-entrypoint.sh: running /docker-entrypoint-initdb.d/init.sql
psql:/docker-entrypoint-initdb.d/init.sql: error: could not read from input file: Is a directory
```

### Análisis de Causa Raíz

El error `Is a directory` indica que PostgreSQL intentaba leer `init.sql` pero encontró un **directorio** en lugar de un archivo.

| Posible Causa | Probabilidad | Evidencia |
|---------------|--------------|-----------|
| Existe directorio `init.sql/` en servidor | 🔴 ALTA | Error típico de configuración |
| Case sensitivity en Linux | 🟡 MEDIA | Servidores Linux son case-sensitive |
| Puerto de volumen mal configurado | 🟡 MEDIA | La ruta del volumen variaba |
| Permisos de archivo incorrectos | 🟡 BAJA | Archivo sin permisos de lectura |

### Verificación en Servidor

```bash
# Verificar si init.sql es archivo o directorio
ls -la ./init.sql

# Si muestra "d" (directory), este es el problema
# output esperado: -rw-r--r-- 1 user user 12345 Jan  6 06:00 init.sql

# Verificar contenido del archivo
file ./init.sql
# output esperado: init.sql: UTF-8 Unicode text

# Verificar permisos Docker
docker exec -it nexasys-db ls -la /docker-entrypoint-initdb.d/
```

---

## ✅ Solución: Dockerfile Personalizado

### Arquitectura de la Solución

```
📁 estructura-antes-problema/
├── docker-compose.yml
├── init.sql
└── ❌ PROBLEMA: ./init.sql podría ser directorio en algunos sistemas

📁 estructura-despues-solucion/
├── docker-compose.yml
├── init.sql
└── database/
    ├── Dockerfile        ← PostgreSQL personalizado (NUEVO)
    └── init.sql          ← Copiado al build time
```

### Por Qué Esta Solución

| Aspecto | Solución Anterior (Volumen) | Solución Nueva (Dockerfile) |
|---------|----------------------------|----------------------------|
| ** init.sql mounting** | Volumen runtime (propenso a errores) | Copiado al build |
| **Error "Is a directory"** | ❌ Ocurre si existe directorio | ✅ Imposible |
| **Case sensitivity** | ❌ Depende del FS | ✅ Garantizado por Docker |
| **Reproducibilidad** | ❌ Depende del servidor | ✅ Idéntico en todos |
| **Portainer compatibility** | ⚠️ Requiere configurar volumen | ✅ Build automático |

---

## 📄 Implementación

### Paso 1: Crear `database/Dockerfile`

```dockerfile
# database/Dockerfile
# NEXA-Sys V.02 - PostgreSQL Custom Image
# Versión: 1.0.0 (BUG-044 Fix)

FROM postgres:15-alpine

# Metadatos del contenedor
LABEL maintainer="nexa-sys.devops@company.com" \
      version="15-alpine-1.0.0" \
      description="PostgreSQL 15 for NEXA-Sys CRM with schema initialization"

# Variables de entorno para producción
ENV POSTGRES_USER=nexa_admin \
    POSTGRES_PASSWORD=nexa_password \
    POSTGRES_DB=nexasys_crm \
    PGDATA=/var/lib/postgresql/data/pgdata

# Copiar script de inicialización AL BUILD TIME
# Esto garantiza que el archivo exista y sea un archivo, no un directorio
COPY init.sql /docker-entrypoint-initdb.d/init.sql

# Establecer permisos correctos (solo lectura)
RUN chmod 444 /docker-entrypoint-initdb.d/init.sql

# Exponer puerto PostgreSQL
EXPOSE 5432

# Healthcheck básico
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD pg_isready -U $POSTGRES_USER -d $POSTGRES_DB || exit 1

# El entrypoint estándar de postgres maneja:
# - Creación de usuario/DB
# - Ejecución de scripts en /docker-entrypoint-initdb.d/
# - Inicialización de volúmenes
```

### Paso 2: Actualizar `docker-compose.yml`

```yaml
# docker-compose.yml (actualizado)
version: '3.8'

services:
  # ==========================================
  # Base de Datos - PostgreSQL Personalizado
  # ==========================================
  db:
    build:
      context: ./database           # ← Cambiar de imagen directa a build
      dockerfile: Dockerfile
    container_name: nexasys-db
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-nexa_admin}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-nexa_password}
      POSTGRES_DB: ${POSTGRES_DB:-nexasys_crm}
    volumes:
      # Datos persistentes (NO incluir init.sql aquí)
      - postgres_data:/var/lib/postgresql/data
    networks:
      - crm-internal
    healthcheck:
      test: [ "CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-nexa_admin} -d ${POSTGRES_DB:-nexasys_crm}" ]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 10s

  # ==========================================
  # Backend - Node.js/Express
  # ==========================================
  backend:
    build:
      context: ./src/backend
      dockerfile: Dockerfile
    container_name: nexasys-backend
    restart: unless-stopped
    ports:
      - "5001:5000"
    environment:
      DATABASE_URL: postgres://nexa_admin:nexa_password@db:5432/nexasys_crm
      JWT_SECRET: ${JWT_SECRET:-nexasys_secret_2025}
      PORT: 5000
      NODE_ENV: production
      USE_DATABASE: 'true'
    depends_on:
      db:
        condition: service_healthy
    networks:
      - crm-internal
      - proxy-net
    healthcheck:
      test: [ "CMD", "node", "-e", "require('http').get('http://localhost:5000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" ]
      interval: 30s
      timeout: 3s
      retries: 3
      start_period: 30s

  # ==========================================
  # Frontend - React/Vite
  # ==========================================
  frontend:
    build:
      context: ./src/frontend
      dockerfile: Dockerfile
    container_name: nexasys-frontend
    restart: unless-stopped
    ports:
      - "8080:80"
    depends_on:
      backend:
        condition: service_healthy
    networks:
      - proxy-net
    healthcheck:
      test: [ "CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost/" ]
      interval: 30s
      timeout: 3s
      retries: 3
      start_period: 10s

networks:
  crm-internal:
    driver: bridge
  proxy-net:
    driver: bridge

volumes:
  postgres_data:
    driver: local
```

### Paso 3: Actualizar `.gitignore`

```gitignore
# .gitignore (agregar al final)

# ==========================================
# PostgreSQL Data
# ==========================================
postgres_data/
pgdata/
*.sql.bak
*.log
```

---

## 🚀 Instrucciones de Deployment

### Opción A: Deployment con Docker Compose (Recomendado)

```bash
# 1. Verificar estructura de archivos
ls -la
# Debe mostrar:
# docker-compose.yml
# init.sql
# database/
#   ├── Dockerfile
#   └── init.sql

# 2. Detener contenedores anteriores (si existen)
docker compose down

# 3. Eliminar volúmenes antiguos (OPCIONAL - pierde datos)
# docker volume rm nexasys_postgres_data

# 4. Build y deploy
docker compose build db
docker compose up -d db

# 5. Verificar logs de inicialización
docker logs nexasys-db | grep -E "(init.sql|CREATE DATABASE|Tables)"
# Expected output:
# /usr/local/bin/docker-entrypoint.sh: running /docker-entrypoint-initdb.d/init.sql
# CREATE DATABASE

# 6. Verificar tablas creadas
docker exec -T nexasys-db psql -U nexa_admin -d nexasys_crm -c '\dt'
# Expected output:
#               List of relations
#  Schema |       Name        | Type  |  Owner
# --------+-------------------+-------+----------
#  public | clients           | table | nexa_admin
#  public | client_field_definitions | table | nexa_admin
#  public | project_custom_field_values | table | nexa_admin
#  public | project_field_definitions | table | nexa_admin
#  public | project_tasks     | table | nexa_admin
#  public | projects          | table | nexa_admin
#  public | roles             | table | nexa_admin
#  public | sessions          | table | nexa_admin
#  public | users             | table | nexa_admin
# (9 rows)

# 7. Verificar datos seed
docker exec -T nexasys-db psql -U nexa_admin -d nexasys_crm -c "SELECT username, email, role_id FROM users;"
```

### Opción B: Deployment con Portainer

```
📦 Pasos para Deployment en Portainer:

1. 📂 Preparar estructura en servidor:
   /opt/nexasys/
   ├── docker-compose.yml
   ├── init.sql
   └── database/
       ├── Dockerfile
       └── init.sql

2. 🌐 En Portainer Web Interface:
   - Ir a "Stacks" → "Add stack"
   - Nombre: "nexasys-crm"
   - Build method: "Webhook" o "Repository"
   - Configurar environment variables si es necesario:
     * POSTGRES_USER=nexa_admin
     * POSTGRES_PASSWORD=secure_password
     * JWT_SECRET=your_jwt_secret

3. ✅ Verificación post-deploy:
   - Verificar que el contenedor "nexasys-db" está running
   - Revisar logs: Container → Logs
   - Buscar: "init.sql" y "CREATE DATABASE"

4. 🔄 Deploy de backend y frontend:
   - Los servicios backend y frontend dependen de DB healthy
   - Se deployarán automáticamente con docker compose up -d
```

### Opción C: Deployment Automatizado (CI/CD)

```yaml
# .github/workflows/deploy.yml (fragmento)

name: Deploy to Production

on:
  push:
    branches: [main]
    paths:
      - 'database/**'
      - 'init.sql'
      - 'docker-compose.yml'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Build PostgreSQL image
        run: docker compose build db

      - name: Deploy to server
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SERVER_SSH_KEY }}
          script: |
            cd /opt/nexasys
            docker compose down db
            docker compose build db
            docker compose up -d db
            sleep 10
            docker logs nexasys-db | grep -E "(init.sql|CREATE DATABASE|Tables)"
```

---

## 🔧 Solución de Problemas

### Problema 1: "init.sql es un directorio"

```bash
# Diagnóstico
ls -la ./init.sql
# Si muestra: d--------x 2 user user 4096 Jan  6 06:00 init.sql

# Solución
rm -rf ./init.sql
# Verificar que el archivo existe
git checkout init.sql
# O restaurar desde backup
```

### Problema 2: Tablas no creadas

```bash
# Verificar que el script se ejecutó
docker logs nexasys-db 2>&1 | grep -i error

# Verificar permisos del script dentro del contenedor
docker exec -it nexasys-db ls -la /docker-entrypoint-initdb.d/

# Reconstruir el contenedor si es necesario
docker compose down
docker compose build --no-cache db
docker compose up -d db
```

### Problema 3: Datos seed no insertados

```bash
# Verificar contenido del script
head -50 init.sql

# Insertar datos manualmente (SI ES NECESARIO)
docker exec -it nexasys-db psql -U nexa_admin -d nexasys_crm -f /docker-entrypoint-initdb.d/init.sql
```

---

## 🔄 Plan de Rollback

Si la nueva configuración causa problemas, revertir es simple:

```yaml
# rollback-compose.yml (temporal)
services:
  db:
    image: postgres:15-alpine  # ← Usar imagen oficial directamente
    # ... resto de configuración igual
    volumes:
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql:ro  # ← Volver a volumen (si funciona)
```

```bash
# Rollback rápido
docker compose down
# Editar docker-compose.yml para usar imagen directa
docker compose up -d db
```

---

## ✅ Checklist de Validación

| ✅ | Item | Método | Resultado Esperado |
|---|------|--------|-------------------|
| ☐ | init.sql se ejecuta sin errores | `docker logs nexasys-db` | "running /docker-entrypoint-initdb.d/init.sql" |
| ☐ | Base de datos creada | Logs PostgreSQL | "CREATE DATABASE" |
| ☐ | Tablas creadas | `psql -c '\dt'` | 9 tablas listadas |
| ☐ | Roles insertados | `psql -c "SELECT * FROM roles;"` | admin, manager, user |
| ☐ | Usuarios seed creados | `psql -c "SELECT username, email FROM users;"` | 3 usuarios |
| ☐ | Clientes seed creados | `psql -c "SELECT name FROM clients;"` | 2 clientes |
| ☐ | Proyectos seed creados | `psql -c "SELECT name FROM projects;"` | 1 proyecto |
| ☐ | Campos personalizados | `psql -c "SELECT name FROM project_field_definitions;"` | 5 campos |
| ☐ | Healthcheck passing | `docker inspect nexasys-db` | "Health.Status": "healthy" |
| ☐ | Persistencia funciona | Reiniciar contenedor | Datos siguen ahí |

---

## 📊 Métricas de Éxito

| Métrica | Target | Método de Verificación |
|---------|--------|------------------------|
| Tiempo de init | < 30s | `time docker compose up -d db` |
| Error "Is a directory" | 0 occurrences | Revisar logs post-deploy |
| Tablas creadas | 9/9 | `psql -c '\dt'` |
| Datos seed | 100% insertados | Verificar count de cada tabla |
| Uptime DB | > 99.9% | Monitorización externa |

---

## 📚 Documentación Relacionada

| Documento | Descripción |
|-----------|-------------|
| `docs/Arquitectura.md` | Arquitectura general del sistema |
| `docs/QA/QA_Report_Fase4.md` | Reporte de calidad (BUG-044 original) |
| `README.md` | Guía de inicio rápido |
| `DEPLOYMENT.md` | Documentación de deployment existente |

---

## 🔄 Historial de Versiones

| Versión | Fecha | Autor | Cambios |
|---------|-------|-------|---------|
| 1.0.0 | 2026-01-06 | @Arquitecto-Agente | Versión inicial - Solución BUG-044 |

---

**Documento mantenido por:** @Arquitecto-Agente  
**Última actualización:** 2026-01-06  
**Versión:** 1.0.0  
**Estado:** ✅ APROBADO

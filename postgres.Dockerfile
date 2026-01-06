# PostgreSQL Dockerfile personalizado para NEXA-Sys V.02 CRM
# Solución BUG-044: Evita el error "Is a directory" al montar volúmenes
# Este Dockerfile copia el init.sql durante el build, no en tiempo de ejecución

FROM postgres:15-alpine

# Copiar el script de inicialización al directorio de entrada de Docker
# Este script se ejecutará automáticamente cuando el contenedor se inicie por primera vez
COPY init.sql /docker-entrypoint-initdb.d/init.sql

# Establecer permisos de lectura para el script
RUN chmod 444 /docker-entrypoint-initdb.d/init.sql

# Exponer puerto PostgreSQL
EXPOSE 5432

# El CMD padrão de postgres se mantiene (docker-entrypoint.sh)

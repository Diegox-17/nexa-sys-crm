#!/bin/bash
# verify_deployment.sh - Script de verificación para deployment en servidor
# Este script verifica la estructura de archivos requerida para BUG-044

set -e

echo "=========================================="
echo " NEXA-Sys V.02 - Deployment Verification"
echo "=========================================="
echo ""

ERRORS=0

# 1. Verificar que init.sql es un archivo, no un directorio
echo "🔍 Verificando estructura de init.sql..."
if [ -f "./init.sql" ]; then
    echo "   ✅ init.sql es un archivo válido"
    LINES=$(wc -l < ./init.sql)
    echo "   📄 Líneas en init.sql: $LINES"
elif [ -d "./init.sql" ]; then
    echo "   ❌ ERROR: init.sql es un DIRECTORIO, no un archivo!"
    echo "   💡 Solución: Mover el archivo y eliminar el directorio"
    echo "      mv ./init.sql/init.sql ./init.sql.actual"
    echo "      rmdir ./init.sql"
    ERRORS=$((ERRORS + 1))
else
    echo "   ❌ ERROR: init.sql no existe!"
    ERRORS=$((ERRORS + 1))
fi

# 2. Verificar que postgres.Dockerfile existe
echo ""
echo "🔍 Verificando postgres.Dockerfile..."
if [ -f "./postgres.Dockerfile" ]; then
    echo "   ✅ postgres.Dockerfile existe"
else
    echo "   ❌ ERROR: postgres.Dockerfile no existe!"
    ERRORS=$((ERRORS + 1))
fi

# 3. Verificar que docker-compose.yml usa el build correcto
echo ""
echo "🔍 Verificando docker-compose.yml..."
if grep -q "dockerfile: postgres.Dockerfile" ./docker-compose.yml; then
    echo "   ✅ docker-compose.yml usa postgres.Dockerfile"
else
    echo "   ⚠️  ADVERTENCIA: docker-compose.yml podría no estar actualizado"
fi

# 4. Verificar que init.sql contiene SQL válido (tiene CREATE TABLE)
echo ""
echo "🔍 Verificando contenido de init.sql..."
if grep -q "CREATE TABLE" ./init.sql; then
    echo "   ✅ init.sql contiene definiciones de tablas"
else
    echo "   ⚠️  ADVERTENCIA: init.sql no parece contener CREATE TABLE"
fi

# 5. Verificar que las imágenes necesarias existen
echo ""
echo "🔍 Verificando imágenes Docker..."
if docker images | grep -q "nexasys/postgres"; then
    echo "   ✅ Imagen nexasys/postgres encontrada"
else
    echo "   ℹ️  INFO: La imagen nexasys/postgres será construida durante deployment"
fi

# Resumen
echo ""
echo "=========================================="
if [ $ERRORS -eq 0 ]; then
    echo " ✅ Verificación COMPLETA - Listo para deploy!"
    echo "=========================================="
    echo ""
    echo "Próximos pasos:"
    echo "   1. docker compose build --no-cache"
    echo "   2. docker compose down -v  (si es primer deploy)"
    echo "   3. docker compose up -d"
    echo "   4. Verificar logs: docker logs nexasys-db"
    exit 0
else
    echo " ❌ Verificación FALLIDA - $ERRORS error(es) encontrado(s)"
    echo "=========================================="
    exit 1
fi

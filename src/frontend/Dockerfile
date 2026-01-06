# ========================================
# STAGE 1: Test Stage
# ========================================
FROM node:18-alpine AS test

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including devDependencies for testing)
RUN npm ci

# Copy application code
COPY . .

# Run tests (commented out by default to speed up builds)
# Uncomment the line below to run tests during Docker build
# RUN npm test -- --passWithNoTests

# ========================================
# STAGE 2: Build Stage
# ========================================
FROM node:18-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy application code from test stage
COPY --from=test /app .

# Copy environment configuration (needed for API URL)
# NOTE: .env.production should be created before build
COPY .env.production .env.production 2>/dev/null || true

# Build the production application
RUN npm run build

# ========================================
# STAGE 3: Production Stage (Nginx)
# ========================================
FROM nginx:alpine AS production

# Copy built assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
    CMD wget --quiet --tries=1 --spider http://localhost/health || exit 1

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

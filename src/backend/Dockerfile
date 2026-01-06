# ========================================
# STAGE 1: Development & Testing
# ========================================
FROM node:18-alpine AS development

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including devDependencies for testing)
RUN npm ci

# Copy application code
COPY . .

# Run tests (optional: can be skipped in production builds)
# Uncomment the line below to run tests during Docker build
# RUN npm test

# ========================================
# STAGE 2: Production
# ========================================
FROM node:18-alpine AS production

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ONLY production dependencies
RUN npm ci --only=production

# Copy application code from development stage
COPY --from=development /app .

# Remove test files and devDependencies to reduce image size
RUN rm -rf __tests__ coverage *.test.js jest.config.js

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:5000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Run as non-root user
USER node

# Start server
CMD ["node", "app.js"]

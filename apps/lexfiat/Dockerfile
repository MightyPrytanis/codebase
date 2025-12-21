# Multi-stage build for optimal production image
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app directory and user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S lexfiat -u 1001

WORKDIR /app

# Copy built application and dependencies
COPY --from=builder --chown=lexfiat:nodejs /app/dist ./dist
COPY --from=builder --chown=lexfiat:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=lexfiat:nodejs /app/package*.json ./

# Create directories for file storage
RUN mkdir -p public/uploads public/assets private/uploads && \
    chown -R lexfiat:nodejs public private

# Switch to non-root user
USER lexfiat

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/server/index.js"]
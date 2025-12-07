# Use Node.js 18 LTS
FROM node:18-slim

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy TypeScript configuration
COPY tsconfig.json ./

# Copy source code
COPY src ./src

# Install TypeScript and ts-node for running TypeScript directly
RUN npm install -g typescript ts-node

# Expose port
EXPOSE 3001

# Set environment variables
ENV NODE_ENV=production

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Run the application
CMD ["ts-node", "src/index.ts"]

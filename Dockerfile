# Use Node.js 22 as the base image
FROM node:22-slim

# Set working directory
WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    git \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code (excluding node_modules)
COPY . .
RUN rm -rf node_modules

# Install dependencies again for the target platform
RUN npm install

# Build the application
RUN npm run build

# Expose the default port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production

# Start the server
CMD ["node", "dist/sse.js"]
# Multi-stage production Dockerfile for FlowCRM Frontend (React 19 + Vite)
# Stage 1: Build Application
FROM node:22-alpine AS builder
WORKDIR /app

# Copy package descriptors for layer caching
COPY package.json package-lock.json* ./
RUN npm ci --no-audit --prefer-offline

# Copy source code and build production distribution
COPY . .
RUN npm run build

# Stage 2: Hardened Nginx Web Server
FROM nginx:alpine AS final
WORKDIR /usr/share/nginx/html

# Clean default Nginx assets
RUN rm -rf ./*

# Copy built static assets from builder
COPY --from=builder /app/dist .

# Copy custom Nginx configuration with reverse proxy and caching
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

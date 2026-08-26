# Stage 1: Build React Vite App
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files & install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code & .env file if available
COPY . .

# Build production bundle
RUN npm run build

# Stage 2: Serve static files with Nginx
FROM nginx:alpine

# Copy built dist from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration for SPA routing
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

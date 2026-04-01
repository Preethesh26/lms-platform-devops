# ============================================================
# FRONTEND DOCKERFILE
# Builds the React/Vite app and serves it with Nginx
# ============================================================

# STAGE 1: Build the React app
FROM node:20-alpine AS builder

# Set working directory inside container
WORKDIR /app

# Accept the backend API URL as a build argument
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Install dependencies first (better Docker layer caching)
COPY package*.json ./
RUN npm ci

# Copy all source files and build
COPY . .
RUN npm run build
# Output goes to /app/dist

# STAGE 2: Serve the built files with Nginx
FROM nginx:alpine AS serve

# Copy built files from stage 1
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy our custom Nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Nginx listens on port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

# ============================================================
# FRONTEND DOCKERFILE
# Builds the React/Vite app and serves it with Nginx
# ============================================================

# STAGE 1: Build the React app
FROM node:20-alpine AS builder

WORKDIR /app

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

COPY package*.json ./
RUN npm ci --legacy-peer-deps

COPY . .
RUN npm run build

# STAGE 2: Serve with Nginx
FROM nginx:alpine AS serve

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

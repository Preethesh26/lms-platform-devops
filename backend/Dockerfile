# ============================================================
# BACKEND DOCKERFILE
# Packages the Node.js/Express API into a container
# ============================================================

# Use lightweight Node.js image
FROM node:20-alpine

# Set working directory inside container
WORKDIR /app

# Copy package files first so Docker caches the install layer
# (only re-runs npm install if package.json changes)
COPY package*.json ./
RUN npm install --omit=dev

# Copy the rest of the backend source code
COPY . .

# Create a non-root user for security (don't run as root)
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# The backend runs on port 5000
EXPOSE 5000

# Start the server
CMD ["node", "server.js"]

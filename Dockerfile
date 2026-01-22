# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the app
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy nginx config template (will be processed by envsubst)
COPY nginx.conf /etc/nginx/templates/default.conf.template

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port
EXPOSE 80

# nginx:alpine image automatically runs envsubst on /etc/nginx/templates/*.template
# and outputs to /etc/nginx/conf.d/
# Environment variables to substitute
ENV LLM_GATEWAY_API_KEY=""
ENV PERSONAL_INFO_SERVICE_TOKEN=""

# Start nginx (default entrypoint handles envsubst)
CMD ["nginx", "-g", "daemon off;"]

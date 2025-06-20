# Multi-stage Dockerfile para React + Node.js API
FROM node:18-alpine AS base

# Instalar pnpm globalmente
RUN npm install -g pnpm

# Instalar dependências do sistema
RUN apk add --no-cache curl

# Stage 1: Build do frontend React
FROM base AS frontend-builder
WORKDIR /app

# Copiar arquivos de configuração do frontend
COPY package*.json pnpm-lock.yaml ./
COPY tsconfig*.json vite.config.ts tailwind.config.js postcss.config.js components.json ./

# Instalar dependências do frontend
RUN pnpm install --frozen-lockfile

# Copiar código fonte do frontend
COPY src/ ./src/
COPY public/ ./public/
COPY index.html ./

# Build do frontend
RUN pnpm run build

# Stage 2: Setup da API Node.js
FROM base AS api-setup
WORKDIR /app/api

# Copiar arquivos de configuração da API
COPY api/package*.json ./

# Instalar dependências da API
RUN npm ci --only=production

# Stage 3: Imagem final
FROM base AS final
WORKDIR /app

# Copiar build do frontend
COPY --from=frontend-builder /app/dist ./dist

# Copiar API e suas dependências
COPY --from=api-setup /app/api/node_modules ./api/node_modules
COPY api/ ./api/

# Criar usuário não-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S appuser -u 1001

# Ajustar permissões
RUN chown -R appuser:nodejs /app

# Mudar para usuário não-root
USER appuser

# Expor porta
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Comando de inicialização da API (que também serve o frontend)
CMD ["node", "api/server.js"]


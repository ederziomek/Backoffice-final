# Dockerfile otimizado para Railway
FROM node:18-alpine

# Instalar dependências do sistema
RUN apk add --no-cache curl

# Criar diretório de trabalho
WORKDIR /app

# Primeiro, instalar e buildar o frontend
COPY package*.json ./
RUN npm install

# Copiar arquivos de configuração
COPY tsconfig*.json vite.config.ts tailwind.config.js postcss.config.js components.json ./

# Copiar código fonte do frontend
COPY src/ ./src/
COPY public/ ./public/
COPY index.html ./

# Build do frontend
RUN npm run build

# Agora configurar a API
WORKDIR /app/api
COPY api/package*.json ./
RUN npm install --only=production

# Voltar para diretório principal e copiar API
WORKDIR /app
COPY api/ ./api/

# Criar usuário não-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S appuser -u 1001 && \
    chown -R appuser:nodejs /app

# Mudar para usuário não-root
USER appuser

# Expor porta
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Comando de inicialização
CMD ["node", "api/server.js"]


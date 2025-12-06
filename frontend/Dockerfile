# Estágio 1: Build da aplicação
FROM node:20-alpine AS builder

WORKDIR /app

# Argumentos de build para URL da API e Supabase
ARG VITE_API_BASE_URL=http://localhost:3000
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY

# Copia os arquivos de dependências
COPY package*.json ./

# Instala as dependências (usa npm install para evitar falhas de lockfile fora de sincronia)
RUN npm install

# Copia o código fonte
COPY . .

# Build da aplicação (standalone)
RUN npm run build

# Estágio 2: Servir com Nginx
FROM node:20-alpine
WORKDIR /app

# Copiar saída standalone do Next
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

ENV PORT=3000
EXPOSE 3000

CMD ["node", "server.js"]

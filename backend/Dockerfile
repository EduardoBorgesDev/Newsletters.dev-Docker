# Use a imagem oficial do Node.js como base
# Modificação para novo commit
# Arquivo editado para commit
FROM node:20-alpine

# Instala o bash e postgresql-client para executar scripts e comandos SQL
RUN apk add --no-cache bash postgresql-client

# Define o diretório de trabalho dentro do container
WORKDIR /app

# Copia os arquivos de dependências
COPY package*.json ./

# Instala as dependências (usa install para sincronizar lock automaticamente)
RUN npm install --include=dev

# Copia o código fonte da aplicação
COPY . .

# Torna o script executável
RUN sed -i 's/\r$//' start.sh && chmod +x start.sh

# Expõe a porta que a aplicação usa
EXPOSE 3000

# Define variáveis de ambiente padrão
ENV NODE_ENV=production
ENV PORT=3000

# Comando para iniciar a aplicação (executa migrations e inicia servidor)
CMD ["./start.sh"]

#att
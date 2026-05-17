FROM node:20-alpine

WORKDIR /app

# Install deps first (better caching). Включаем dev — tsx нужен в рантайме.
COPY package.json package-lock.json* ./
RUN npm install

# App source
COPY tsconfig.json ./
COPY src ./src

EXPOSE 3000

CMD ["npx", "tsx", "src/server.ts"]

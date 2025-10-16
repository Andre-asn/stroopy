FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./

RUN npm ci

# Copy source code
COPY src/ ./src/

RUN npm run build

RUN npm prune --production

ENV PORT=8080
EXPOSE 8080

CMD ["node", "dist/server.js"]
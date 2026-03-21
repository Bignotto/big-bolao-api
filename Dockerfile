FROM node:20-alpine
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN chmod +x scripts/start.sh
RUN npm run build
RUN npx prisma generate
RUN npm prune --production

CMD ["./scripts/start.sh"]
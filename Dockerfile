FROM node:20-alpine
WORKDIR /app

COPY package*.json ./
RUN npm ci             # install dev + prod deps

COPY scripts/start.sh ./scripts/start.sh
COPY . .
RUN chmod +x scripts/start.sh
RUN npm run build      # generates build/server.cjs
RUN npx prisma generate  # generates prisma client
RUN npm prune --production  # optional: keep only prod deps

CMD ["./scripts/start.sh"]

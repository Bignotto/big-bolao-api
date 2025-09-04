FROM node:20-alpine
WORKDIR /app

COPY package*.json ./
RUN npm ci             # install dev + prod deps

COPY . .
RUN npm run build      # generates build/server.js
RUN npx prisma generate  # generates prisma client
RUN npm prune --production  # optional: keep only prod deps

CMD ["node", "build/server.cjs"]

FROM node:16-slim as BUILDER 
LABEL maintainer="Thiago Bignotto"

WORKDIR /usr/app

# Install app dependencies
COPY package*.json ./
RUN npm install

COPY . .

FROM node:16-alpine

ARG NODE_ENV

WORKDIR /usr/app

COPY --from=BUILDER /usr/app/ ./

EXPOSE 3333

CMD [ "npm", "run", "dev" ]
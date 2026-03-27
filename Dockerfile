# Use a lightweight Node image
FROM node:20-alpine

RUN apk add --no-cache curl

RUN npm install -g pnpm && pnpm config set side-effects-cache false

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

COPY apps ./apps

RUN pnpm install

RUN pnpx prisma generate --schema=apps/auth-service/prisma/schema.prisma || true
RUN pnpx prisma generate --schema=apps/user-service/prisma/schema.prisma || true
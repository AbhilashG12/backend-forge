# Use a lightweight Node image
FROM node:20-alpine

# Install pnpm globally
RUN npm install -g pnpm tsx

# Set the working directory
WORKDIR /app

# Copy the monorepo configuration files first
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy the entire apps directory and prisma schemas
COPY apps ./apps

# Install all dependencies across the workspace
RUN pnpm install

# Generate Prisma clients (Ignores errors if a service doesn't have Prisma yet)
RUN pnpx prisma generate --schema=apps/auth-service/prisma/schema.prisma || true
RUN pnpx prisma generate --schema=apps/user-service/prisma/schema.prisma || true
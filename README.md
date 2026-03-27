# 🚀 Backend Forge: Production-Grade Monorepo

A high-performance microservices architecture built with **Node.js 22**, **pnpm v10 Workspaces**, and **Docker**. This system features a centralized API Gateway that handles security, tracing, and rate limiting before forwarding requests to internal services.

-----

## 🛠️ Tech Stack

  * **Runtime:** Node.js 22 + TypeScript
  * **Package Manager:** pnpm v10 (Workspaces)
  * **Gateway:** Express + `http-proxy-middleware`
  * **Database:** PostgreSQL + Prisma ORM
  * **Cache/Rate Limit:** Redis
  * **Security:** Helmet, CORS, Zod Validation
  * **CI/CD:** GitHub Actions + Docker Hub
  * **Logging:** Pino (Structured JSON)

-----

## 🏗️ Architecture

The project follows a **Shared-Nothing Microservices** pattern:

1.  **API Gateway (Port 3000):** The shield. Handles JWT verification, IP/User rate limiting, and request tracing.
2.  **Auth Service (Port 3001):** Manages identity, registration, and JWT issuance.
3.  **User Service (Port 3002):** Manages user profiles and metadata.
4.  **Job Service (Port 3003):** Handles background tasks and workers.

-----

## 🔒 Production Features

  * **Multi-Level Rate Limiting:** Stricter limits for `/auth` and relaxed limits for authenticated `/users`.
  * **Request Tracing:** Every request is assigned a `x-trace-id` via `uuid` for cross-service observability.
  * **Input Validation:** Strict Zod schemas block malformed data at the Gateway.
  * **Security Headers:** Helmet.js protection against XSS and Clickjacking.
  * **Automated CI/CD:** Every push to `main` builds and pushes images to `abhilashg1/backend-forge`.

-----

## 🚦 Getting Started

### 1\. Installation

```bash
# Clone the repo
git clone https://github.com/AbhilashG12/backend-forge.git

# Install dependencies
pnpm install
```

### 2\. Environment Setup

Create a `.env` file in the root:

```env
PORT=3000
JWT_SECRET=your_super_secret_key
REDIS_URL=redis://localhost:6379
DATABASE_URL=postgresql://user:pass@localhost:5432/forge
ALLOWED_ORIGINS=http://localhost:5173
```

### 3\. Running the Project

```bash
# Option A: Local Development
pnpm dev

# Option B: Docker Compose (Full Stack)
docker compose up --build
```

-----

## 📡 API Endpoints

| Service | Path | Auth | Description |
| :--- | :--- | :--- | :--- |
| **Gateway** | `GET /health` | No | Health check & Trace ID |
| **Auth** | `POST /api/auth/register` | No | Create user (Validated by Zod) |
| **Users** | `GET /api/users/me` | JWT | Get profile (Rate limited via Redis) |
| **Jobs** | `POST /api/jobs` | JWT | Submit task to worker service |

-----

## 🚀 CI/CD Pipeline

Managed via `.github/workflows/main.yml`:

  * **Build:** Uses Node 22 and pnpm 10.
  * **Registry:** Pushes to [Docker Hub (abhilashg1/backend-forge)](https://www.google.com/search?q=https://hub.docker.com/r/abhilashg1/backend-forge).
  * **Cache:** Uses GitHub Actions cache for blazing fast builds.

-----

## 🤝 Author

**AbhilashG1** *4th Year B.Tech Student | Full-Stack Developer*

-----


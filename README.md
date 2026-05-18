# Tenovo

Production-grade multi-tenant SaaS platform built with Next.js, Prisma, PostgreSQL, Redis, BullMQ, and TailAdmin.

Tenovo was built as a public architecture showcase demonstrating scalable SaaS engineering patterns including tenant isolation, RBAC, background job processing, audit logging, distributed systems concepts, and production-grade infrastructure.

---

# Tech Stack

## Frontend

* Next.js (App Router)
* React
* TypeScript
* TailwindCSS
* TailAdmin
* Axios
* Sonner

## Backend

* Next.js Route Handlers
* Prisma 7
* PostgreSQL
* Redis
* BullMQ
* Auth.js (NextAuth v5)

## Infrastructure

* Docker
* PostgreSQL Container
* Redis Container

---

# Key Engineering Concepts

## Multi-Tenant SaaS Architecture

Tenovo uses a shared-database multi-tenant architecture.

Every record is tenant-scoped using:

```ts
organizationId
```

All queries enforce tenant isolation.

Example:

```ts
await prisma.project.findMany({
  where: {
    organizationId: membership.organizationId,
  },
});
```

---

## Role-Based Access Control (RBAC)

Supported roles:

```txt
OWNER
ADMIN
MEMBER
VIEWER
```

Permissions are enforced both:

* Backend APIs
* Frontend UI

Examples:

* Only ADMIN/OWNER can manage team members
* OWNER cannot be removed
* OWNER role cannot be modified

---

## Tenant Context System

The application uses a server-to-client tenant context architecture.

### Flow

```txt
Server Layout
→ Fetch session + membership
→ Pass to AppProvider
→ Available globally in client components
```

Provided context:

```ts
user
organization
organizations[]
role
```

---

## Organization Switcher

One user can belong to multiple organizations.

Active organization is stored using:

```txt
tenovo_active_org_id
```

Tenant switching updates:

* Projects
* Audit logs
* Dashboard metrics
* Team members

without mixing tenant data.

---

## Authentication

Implemented using Auth.js v5.

Features:

* Credentials authentication
* JWT sessions
* Protected admin routes
* Secure password hashing with bcryptjs
* Middleware-based route protection

---

## Background Job Processing

Redis-backed BullMQ queues are used for asynchronous processing.

Current implementation:

```txt
Organization invitation email jobs
```

Architecture:

```txt
API Route
→ Queue Producer
→ Redis Queue
→ Worker Process
```

This pattern is extensible for:

* Emails
* AI processing
* Video processing
* Webhooks
* Report generation
* Scheduled jobs

---

## Audit Logging

All critical actions are tracked.

Implemented events:

```txt
project.created
membership.created
membership.role_updated
membership.removed
```

Audit logs are tenant-scoped and queryable from the dashboard.

---

# Features Implemented

## Authentication

* Sign up
* Sign in
* Sign out
* Protected routes
* Session handling

## Organizations

* Multi-tenant organizations
* Organization switching
* Membership management

## Projects

* Tenant-scoped CRUD
* Modal creation flow
* Toast notifications

## Team Management

* Add members
* Remove members
* Change roles
* RBAC enforcement

## Audit Logs

* Activity history
* Tenant-scoped event tracking

## Dashboard

* Server-rendered metrics
* Real tenant statistics

## Distributed Systems

* Redis queues
* BullMQ workers
* Async job processing

---

# Prisma Architecture

## Modular Prisma Schema

The Prisma schema is split into separate files.

```txt
prisma/
  schema.prisma

  enums/
    role.prisma

  models/
    user.prisma
    account.prisma
    session.prisma
    verification-token.prisma
    organization.prisma
    membership.prisma
    project.prisma
    audit-log.prisma
```

One model per file.

One enum per file.

---

## Centralized Type Architecture

Application-level types are separated into dedicated reusable files.

```txt
src/types/
```

Examples:

```txt
src/types/email-job-name.ts
src/types/organization-role.ts
src/types/api-response.ts
```

This keeps:

* Queue systems strongly typed
* API contracts reusable
* Shared frontend/backend types centralized
* Business logic easier to maintain

Configured using Prisma 7:

```txt
prisma.config.ts
```

---

# Project Structure

```txt
src/
  app/
    (admin)/
    (full-width-pages)/
    api/

  context/
  lib/
  queues/
  workers/
  types/

prisma/
```

---

# Docker Setup

Services:

* PostgreSQL
* Redis

Run locally:

```bash
docker compose up -d
```

---

# Deployment Architecture

Tenovo uses a production-grade containerized deployment architecture with GitHub Actions CI/CD, Docker Compose, PostgreSQL, Redis, and host-level Nginx reverse proxying.

Deployments are triggered automatically whenever the:

```txt
deploy
```

branch is updated.

---

# Production Deployment Flow

```txt
GitHub (deploy branch)
        ↓
GitHub Actions
        ↓
SSH/SCP deployment
        ↓
Ubuntu VPS
        ↓
Docker Compose Stack
    ├── Next.js App
    ├── PostgreSQL
    ├── Redis
    └── Prisma Migration Runner
        ↓
Host Nginx Reverse Proxy
        ↓
HTTPS Domain
```

---

# Infrastructure Design

## Host Machine Responsibilities

The VPS host only manages:

* Docker Engine
* Docker Compose
* Nginx
* Certbot SSL

No application runtime or Node.js dependencies are installed directly on the host machine.

This keeps deployments reproducible, isolated, and easy to maintain.

---

## Dockerized Services

Each application runs in an isolated Docker Compose stack.

Current Tenovo services:

| Service  | Purpose                           |
| -------- | --------------------------------- |
| app      | Next.js production runtime        |
| postgres | PostgreSQL database               |
| redis    | Redis cache / BullMQ backend      |
| migrate  | Dedicated Prisma migration runner |

---

# Reverse Proxy Architecture

Nginx runs directly on the host VPS and proxies traffic to internal Docker services.

Example:

```txt
https://tenovo.example.com
        ↓
127.0.0.1:3100
        ↓
Docker container :3000
```

This architecture allows multiple independent applications to coexist safely on the same VPS.

---

# CI/CD Workflow

Deployment is Git-driven.

Workflow:

1. Push to `deploy`
2. GitHub Actions workflow starts
3. Repository checked out
4. Production environment generated from GitHub Secrets
5. Files uploaded to VPS via SCP
6. Docker Compose rebuilds containers
7. Prisma migrations execute
8. Old Docker images pruned

Primary workflow:

```txt
.github/workflows/deploy.yml
```

---

# GitHub Secrets

Sensitive values are never committed to source control.

Secrets are stored using:

```txt
GitHub Repository Secrets
```

Current deployment secrets:

| Secret         | Purpose                          |
| -------------- | -------------------------------- |
| SERVER_HOST    | VPS hostname/IP                  |
| SERVER_USER    | SSH deployment user              |
| SERVER_SSH_KEY | Private SSH deployment key       |
| SERVER_APP_DIR | Remote deployment directory      |
| PRODUCTION_ENV | Full production environment file |

---

# Environment Management

The repository only includes:

```txt
.env.production.example
```

Real production values are securely injected during deployment through GitHub Actions.

---

# Docker Production Strategy

Containers use multi-stage Docker builds.

Key characteristics:

* Node.js Alpine runtime
* Next.js standalone output
* Small production images
* Internal-only service networking
* Isolated runtime environments

---

# Prisma Migration Strategy

Database migrations run using a dedicated migration service:

```bash
docker compose run --rm migrate
```

This keeps Prisma tooling out of the lightweight application runtime container.

---

# Security Considerations

## Internal Service Isolation

PostgreSQL and Redis are not publicly exposed.

Only the internal application port is bound:

```txt
127.0.0.1:3100
```

External traffic must pass through Nginx.

---

## SSH Authentication

Deployments use SSH key authentication.

No passwords are used.

---

## Secret Isolation

Credentials, production paths, and environment variables are never committed to the repository.

---

# Manual Deployment

Deployment can also be executed manually on the VPS:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build

docker compose --env-file .env.production -f docker-compose.prod.yml run --rm migrate
```

---

# Running The Project

## Install dependencies

```bash
npm install
```

## Start infrastructure

```bash
docker compose up -d
```

## Run migrations

```bash
npx prisma migrate dev
```

## Generate Prisma client

```bash
npx prisma generate
```

## Start development server

```bash
npm run dev
```

## Start BullMQ worker

```bash
npm run worker:email
```

---

# Why This Project Exists

Most of my production work was built inside private company repositories and cannot be shared publicly.

Tenovo was created to publicly demonstrate:

* Multi-tenant SaaS architecture
* Distributed systems thinking
* Real-world backend engineering
* Modern Next.js architecture
* Prisma/PostgreSQL design
* Redis queue systems
* RBAC implementation
* Production-grade infrastructure patterns

---

# Future Roadmap

Planned improvements:

* Real email provider integration
* WebSocket notifications
* Billing architecture
* AI task processing queues
* Activity feed
* File uploads
* S3/Wasabi integration
* Rate limiting
* Monitoring/observability
* CI/CD pipelines
* Kubernetes deployment

---

# Portfolio Positioning

This project is intentionally focused on:

```txt
Architecture > tutorial CRUD
```

The goal is to demonstrate:

* Scalable engineering patterns
* Clean system design
* Production-ready thinking
* Full-stack product ownership

rather than isolated UI components.

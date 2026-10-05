# UkRide

A taxi / chauffeur / vehicle booking SaaS, built module by module as a full-stack learning project.

- **Backend:** Node.js, Express 5, TypeScript, Zod, Pino
- **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS, TanStack Query
- **Later modules:** PostgreSQL + Prisma, Redis + BullMQ, Stripe Test Mode, Socket.IO

Everything in the stack is free and runs locally.

## Current status

Module 0 (Foundation) is complete. See [docs/PROGRESS.md](docs/PROGRESS.md) for the module tracker.

## Repository layout

```
backend/     Express API (TypeScript, ESM)
frontend/    Next.js web app
docs/        Progress tracker, API tests, architecture decisions
docker-compose.yml   PostgreSQL, Redis and Mailpit for later modules
PRODUCT.md   Product and design context used for every UI pass
```

The root is an npm workspace. One `npm install` at the root installs both apps.

## Prerequisites

- Node.js 24 or newer (npm 11)
- Git
- Docker Desktop (needed from Module 1 onward)

## Setup

```bash
npm install
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local
```

On Windows PowerShell use `Copy-Item` instead of `cp`.

## Run

```bash
npm run dev        # API on http://localhost:4000 and web on http://localhost:3000
npm run dev:api    # API only
npm run dev:web    # web only
```

Open http://localhost:3000/system-status. Stop the API to see the offline state; start it again and the page recovers.

## Quality checks

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

## API

Base URL: `http://localhost:4000/api/v1`

| Method | Path            | Purpose                          |
| ------ | --------------- | -------------------------------- |
| GET    | `/health`       | Service info and availability    |
| GET    | `/health/live`  | Process is alive                 |
| GET    | `/health/ready` | Dependencies ready (grows later) |

Success responses use `{ success, message, data, meta? }`.
Error responses use `{ success: false, error: { code, message, details? }, requestId }`.

Manual API tests live in [docs/api-tests](docs/api-tests): a Bruno collection and curl examples.

## Local services

```bash
npm run docker:up     # PostgreSQL 5432, Redis 6379, Mailpit UI http://localhost:8025
npm run docker:down
```

Module 0 does not use these yet.

## How each module is built

1. Backend: data model, route, validation, controller, service.
2. Test the API manually in Bruno or curl, including failure cases.
3. Build the Next.js screen.
4. Connect it with TanStack Query hooks.
5. Design and accessibility pass with Tailwind, guided by [PRODUCT.md](PRODUCT.md).
6. Automated tests.
7. Update the tracker, commit, tag.

A module is complete only when all of these are done.

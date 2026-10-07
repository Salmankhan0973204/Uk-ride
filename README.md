# UkRide

A full-stack taxi, chauffeur and vehicle booking platform, built one module at a time.

Customers get a price, book a trip, pay and follow it live. Drivers work through their assigned
jobs. Dispatchers and admins run the fleet, pricing, payments and reports.

This is a learning project. Each module is finished end to end (API, manual tests, UI, data
layer, design pass, automated tests) before the next one starts. Every tool in the stack is free
and runs on a local machine.

## Status

**Module 0 of 17 is complete.** The web app and the API are connected and tested.
Authentication is in progress: the database is in place and accounts can be registered. The full tracker
is in [docs/PROGRESS.md](docs/PROGRESS.md).

| #   | Module                                        | Status   |
| --- | --------------------------------------------- | -------- |
| 0   | Foundation: health check + first screen       | Complete |
| 1   | Authentication: register, login, current user | Started  |
| 2   | Profile management                            | Planned  |
| 3   | Vehicle types: admin CRUD + customer catalog  | Planned  |
| 4   | Fleet vehicles                                | Planned  |
| 5   | Pricing rules + quote engine                  | Planned  |
| 6   | Booking creation                              | Planned  |
| 7   | My bookings: list + detail                    | Planned  |
| 8   | Booking edit + cancellation                   | Planned  |
| 9   | Driver + dispatch operations                  | Planned  |
| 10  | Stripe payments + refunds (test mode)         | Planned  |
| 11  | Notifications + email                         | Planned  |
| 12  | Real-time booking status + driver location    | Planned  |
| 13  | File uploads + driver documents               | Planned  |
| 14  | Reviews + customer feedback                   | Planned  |
| 15  | Admin dashboard + reporting                   | Planned  |
| 16  | Production hardening + automated testing      | Planned  |
| 17  | Docker + CI/CD + deployment                   | Planned  |

## Tech stack

| Area           | Technology                                                |
| -------------- | --------------------------------------------------------- |
| Backend        | Node.js 24, Express 5, TypeScript (ESM)                   |
| Database       | PostgreSQL 16, Prisma 7                                   |
| Validation     | Zod                                                       |
| Logging        | Pino, with a request ID on every request                  |
| Frontend       | Next.js 16 (App Router), React 19, TypeScript             |
| Styling        | Tailwind CSS 4                                            |
| Server state   | TanStack Query 5                                          |
| Testing        | Vitest, Supertest                                         |
| API testing    | Bruno, curl                                               |
| Local services | Docker Compose: PostgreSQL 16, Redis 7, Mailpit           |
| Planned        | JWT auth, BullMQ, Stripe test mode, Socket.IO, Playwright |

## Project structure

```
.
├── backend/                 Express API
│   ├── prisma/
│   │   ├── schema.prisma    Database models
│   │   └── migrations/      SQL history of the database, kept in git
│   └── src/
│       ├── app.ts           Middleware and routes (no listen, so tests can import it)
│       ├── server.ts        Starts the HTTP server, graceful shutdown
│       ├── config/          Environment validation, logger, database client
│       ├── generated/       Prisma client, generated and not committed
│       ├── middleware/      Request ID, validation, auth, 404, error handler
│       ├── modules/         One folder per feature (routes, controller, tests)
│       └── shared/          AppError, response helpers
├── frontend/                Next.js web app
│   └── src/
│       ├── app/             Routes and layouts
│       ├── components/      Shared UI and layout components
│       ├── features/        One folder per feature (api, hooks, components, types)
│       ├── lib/             API client, query keys
│       └── providers/       TanStack Query provider
├── docs/
│   ├── PROGRESS.md          Module tracker and learning notes
│   ├── api-tests/           Bruno collection and curl examples
│   └── decisions/           Architecture decision records
├── docker-compose.yml       PostgreSQL, Redis, Mailpit
└── PRODUCT.md               Product and design context for every UI pass
```

The root is an npm workspace, so one install covers both apps.

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org) 24 or newer
- [Git](https://git-scm.com)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/), for PostgreSQL

### Install

```bash
git clone https://github.com/Salmankhan0973204/Uk-ride.git
cd Uk-ride
npm install
```

### Configure

Copy the example environment files. The defaults work as they are.

```bash
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local
```

On Windows PowerShell:

```powershell
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.local.example frontend/.env.local
```

### Database

Start PostgreSQL, create the tables from the migrations, and generate the Prisma client.

```bash
npm run docker:up
npm run db:migrate -w backend
npm run db:generate -w backend
```

Run `db:generate` again after every `npm install` on a fresh clone, and after every change to
`backend/prisma/schema.prisma`.

### Run

```bash
npm run dev
```

| App      | URL                               |
| -------- | --------------------------------- |
| Web      | http://localhost:3000             |
| API      | http://localhost:4000/api/v1      |
| API docs | http://localhost:4000/api/v1/docs |

Open http://localhost:3000/system-status. Stop the API to see the offline state. Start it again
and the page recovers by itself. Create an account at http://localhost:3000/register.

## Scripts

Run these from the repository root.

| Command               | What it does                           |
| --------------------- | -------------------------------------- |
| `npm run dev`         | Start the API and the web app together |
| `npm run dev:api`     | Start the API only                     |
| `npm run dev:web`     | Start the web app only                 |
| `npm run typecheck`   | Type-check both apps                   |
| `npm run lint`        | Lint both apps                         |
| `npm test`            | Run the automated tests                |
| `npm run build`       | Production build of both apps          |
| `npm run format`      | Format the code with Prettier          |
| `npm run docker:up`   | Start PostgreSQL, Redis and Mailpit    |
| `npm run docker:down` | Stop them                              |

Database commands belong to the backend workspace.

| Command                                         | What it does                                       |
| ----------------------------------------------- | -------------------------------------------------- |
| `npm run db:migrate -w backend`                 | Apply migrations to the local database             |
| `npm run db:migrate -w backend -- --name <why>` | Create a migration after a schema change, apply it |
| `npm run db:generate -w backend`                | Regenerate the typed Prisma client                 |
| `npm run db:studio -w backend`                  | Browse the data in Prisma Studio                   |

## Environment variables

### Backend (`backend/.env`)

| Variable                 | Default                 | Purpose                                         |
| ------------------------ | ----------------------- | ----------------------------------------------- |
| `NODE_ENV`               | `development`           | `development`, `test` or `production`           |
| `PORT`                   | `4000`                  | API port                                        |
| `LOG_LEVEL`              | `debug`                 | Pino log level                                  |
| `CORS_ORIGINS`           | `http://localhost:3000` | Comma-separated origins allowed to call the API |
| `DATABASE_URL`           | none, required          | PostgreSQL connection string                    |
| `JWT_ACCESS_SECRET`      | none, required          | Signs login tokens; 32 characters or more       |
| `JWT_ACCESS_TTL_SECONDS` | `900`                   | Lifetime of an access token                     |

The API refuses to start if a value is invalid.

### Frontend (`frontend/.env.local`)

| Variable                   | Default                 | Purpose            |
| -------------------------- | ----------------------- | ------------------ |
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:4000` | Address of the API |

Never commit `.env` or `.env.local`. Only the example files are tracked.

## API

Base URL: `http://localhost:4000/api/v1`

| Method | Path             | Purpose                                                   |
| ------ | ---------------- | --------------------------------------------------------- |
| GET    | `/health`        | Service name, version, environment, uptime                |
| GET    | `/health/live`   | The process is alive                                      |
| GET    | `/health/ready`  | The database answers; `503` when it cannot be reached     |
| POST   | `/auth/register` | Create an account: name, email, mobile number, password   |
| POST   | `/auth/login`    | Sign in and receive an access token                       |
| GET    | `/auth/me`       | The signed-in user; needs `Authorization: Bearer <token>` |

Swagger UI at `/docs` lists every endpoint and lets you call it from the browser. The raw
OpenAPI document is at `/docs/openapi.json`. Both are switched off when `NODE_ENV` is
`production`. The document lives in `backend/src/docs/openapi.ts`; add each module's paths there.

Every success response has the same shape:

```json
{
  "success": true,
  "message": "API is healthy",
  "data": { "status": "ok", "service": "ukride-api", "version": "0.1.0" }
}
```

Every error response has the same shape, and carries the request ID for tracing:

```json
{
  "success": false,
  "error": { "code": "NOT_FOUND", "message": "Route GET /api/v1/nope not found" },
  "requestId": "e1d3736d-a1ec-4aeb-bf7f-ef7b66f4038d"
}
```

Manual tests are in [docs/api-tests](docs/api-tests). Open the `ukride-api` folder in
[Bruno](https://www.usebruno.com), or use the commands in
[curl.md](docs/api-tests/curl.md).

## Local services

```bash
npm run docker:up
```

| Service    | Address                                                  | Used from |
| ---------- | -------------------------------------------------------- | --------- |
| PostgreSQL | `localhost:5432` (user, password and database: `ukride`) | Now       |
| Redis      | `localhost:6379`                                         | Module 11 |
| Mailpit    | http://localhost:8025 (SMTP on 1025)                     | Module 11 |

These credentials are for local development only.

## How each module is built

1. **Backend:** data model, validation, route, controller, service.
2. **API test:** success and failure cases in Bruno or curl.
3. **Frontend:** the Next.js screen with loading, empty, error and success states.
4. **Data layer:** TanStack Query hooks, query keys, invalidation.
5. **Design pass:** hierarchy, accessibility and responsive behaviour, guided by
   [PRODUCT.md](PRODUCT.md).
6. **Automated tests** for the important rules.
7. **Tracker, commit, tag** (`module-NN`).

A module is complete only when all seven steps are done.

## Documentation

- [docs/PROGRESS.md](docs/PROGRESS.md): module tracker and learning notes
- [docs/decisions/ADR-0001-stack.md](docs/decisions/ADR-0001-stack.md): why this stack
- [docs/api-tests/curl.md](docs/api-tests/curl.md): manual API tests
- [PRODUCT.md](PRODUCT.md): product and design context

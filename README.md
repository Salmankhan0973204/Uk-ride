# UkRide

A full-stack taxi, chauffeur and vehicle booking platform, built one module at a time.

Customers get a price, book a trip, pay and follow it live. Drivers work through their assigned
jobs. Dispatchers and admins run the fleet, pricing, payments and reports.

This is a learning project. Each module is finished end to end (API, manual tests, UI, data
layer, design pass, automated tests) before the next one starts. Every tool in the stack is free
and runs on a local machine.

## Status

**44 of 113 steps are done.** You can create an account, sign in, edit your profile, browse the
vehicle types and get an exact price between two postcodes. An admin can manage vehicle types,
the fleet and the prices.

On 2026-10-16 the roadmap changed: UkRide now follows the customer flow of
[ukride.uk](https://ukride.uk) in three apps (backend, customer website, admin panel). The focus
is auth, booking, payment, wallet, journeys and reviews. Modules 0-5 are being reworked to that
flow. The full tracker is in [docs/PROGRESS.md](docs/PROGRESS.md).

| #   | Module                       | Status   |
| --- | ---------------------------- | -------- |
| 0   | Foundation: three apps       | Complete |
| 1   | Auth like ukride.uk          | Next     |
| 2   | Profile                      | Rework   |
| 3   | Fleet classes                | Rework   |
| 4   | Fleet vehicles               | Complete |
| 5   | Pricing and quotes           | Rework   |
| 6   | Booking                      | Planned  |
| 7   | Wallet                       | Planned  |
| 8   | Card payment (Stripe)        | Planned  |
| 9   | Journeys                     | Planned  |
| 10  | Edit and cancel              | Planned  |
| 11  | Admin operations             | Planned  |
| 12  | Reviews                      | Planned  |
| 13  | Notifications                | Planned  |
| 14  | Driver API and live status   | Planned  |
| 15  | Admin dashboard and reports  | Planned  |
| 16  | Hardening and tests          | Planned  |
| 17  | Docker, CI/CD and deployment | Planned  |

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
├── customer/                Next.js customer website (port 3000)
│   └── src/
│       ├── app/             Routes and layouts
│       ├── components/      Layout components (navigation)
│       ├── features/        One folder per feature (api, hooks, components, types)
│       ├── lib/             This app's API client and query keys
│       └── providers/       TanStack Query provider
├── admin/                   Next.js admin panel (port 3001), same layout as customer/
├── shared/                  @ukride/shared: API client factory, UI primitives,
│                            money, UK time and phone helpers, the glass styles
├── docs/
│   ├── PROGRESS.md          Module tracker and learning notes
│   ├── api-tests/           Bruno collection and curl examples
│   └── decisions/           Architecture decision records
├── docker-compose.yml       PostgreSQL, Redis, Mailpit
└── PRODUCT.md               Product and design context for every UI pass
```

The root is an npm workspace with four packages (backend, customer, admin, shared). Run
`npm install` at the root only: one install covers all of them and links `shared/` into both
web apps. See [ADR-0002](docs/decisions/ADR-0002-three-apps.md).

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
cp customer/.env.local.example customer/.env.local
cp admin/.env.local.example admin/.env.local
```

On Windows PowerShell:

```powershell
Copy-Item backend/.env.example backend/.env
Copy-Item customer/.env.local.example customer/.env.local
Copy-Item admin/.env.local.example admin/.env.local
```

### Database

Start PostgreSQL, create the tables from the migrations, and generate the Prisma client.

```bash
npm run docker:up
npm run db:migrate -w backend
npm run db:generate -w backend
npm run db:seed -w backend
```

Run `db:generate` again after every `npm install` on a fresh clone, and after every change to
`backend/prisma/schema.prisma`.

### Run

```bash
npm run dev
```

| App           | URL                               |
| ------------- | --------------------------------- |
| Customer site | http://localhost:3000             |
| Admin panel   | http://localhost:3001             |
| API           | http://localhost:4000/api/v1      |
| API docs      | http://localhost:4000/api/v1/docs |

`npm run dev` starts all three. Each can also run alone: `npm run dev:api`,
`npm run dev:customer`, `npm run dev:admin`.

On the customer site, create an account at http://localhost:3000/register, sign in at
http://localhost:3000/login and see your profile at http://localhost:3000/account. The vehicle
types are at http://localhost:3000/vehicles and prices between two postcodes at
http://localhost:3000/quote.

The admin panel has its own staff sign-in. Make your account an admin once with
`npm run db:set-role -w backend -- you@example.com ADMIN`, then sign in at
http://localhost:3001/login. It has the fleet, the vehicle types, the prices and the system
status. No prices are set out of the box: set them under Pricing, then try the customer quote
page. The two apps keep separate sign-ins, so signing out of one leaves the other signed in.

## Scripts

Run these from the repository root.

| Command                    | What it does                                          |
| -------------------------- | ----------------------------------------------------- |
| `npm run dev`              | Start the API, the customer site and the admin panel  |
| `npm run dev:api`          | Start the API only                                    |
| `npm run dev:customer`     | Start the customer site only (port 3000)              |
| `npm run dev:admin`        | Start the admin panel only (port 3001)                |
| `npm run typecheck`        | Type-check every workspace                            |
| `npm run lint`             | Lint every app                                        |
| `npm test`                 | Run the automated tests                               |
| `npm run test:integration` | Run the tests that use a real database (needs Docker) |
| `npm run build`            | Production build of every app                         |
| `npm run format`           | Format the code with Prettier                         |
| `npm run docker:up`        | Start PostgreSQL, Redis and Mailpit                   |
| `npm run docker:down`      | Stop them                                             |

Database commands belong to the backend workspace.

| Command                                           | What it does                                       |
| ------------------------------------------------- | -------------------------------------------------- |
| `npm run db:migrate -w backend`                   | Apply migrations to the local database             |
| `npm run db:migrate -w backend -- --name <why>`   | Create a migration after a schema change, apply it |
| `npm run db:generate -w backend`                  | Regenerate the typed Prisma client                 |
| `npm run db:studio -w backend`                    | Browse the data in Prisma Studio                   |
| `npm run db:seed -w backend`                      | Add the starting vehicle types (safe to repeat)    |
| `npm run db:set-role -w backend -- <email> ADMIN` | Give an account a role                             |
| `npm run db:cleanup -w backend`                   | Delete expired refresh tokens now                  |
| `npm test -w backend`                             | Run the unit tests of the quote calculation        |

## Environment variables

### Backend (`backend/.env`)

| Variable                 | Default                                       | Purpose                                                    |
| ------------------------ | --------------------------------------------- | ---------------------------------------------------------- |
| `NODE_ENV`               | `development`                                 | `development`, `test` or `production`                      |
| `PORT`                   | `4000`                                        | API port                                                   |
| `LOG_LEVEL`              | `debug`                                       | Pino log level                                             |
| `CORS_ORIGINS`           | `http://localhost:3000,http://localhost:3001` | Comma-separated origins allowed to call the API            |
| `DATABASE_URL`           | none, required                                | PostgreSQL connection string                               |
| `REDIS_URL`              | `redis://localhost:6379`                      | Shared counters, such as codes sent per phone              |
| `JWT_ACCESS_SECRET`      | none, required                                | Signs login tokens; 32 characters or more                  |
| `JWT_ACCESS_TTL_SECONDS` | `900`                                         | Lifetime of an access token                                |
| `REFRESH_TOKEN_TTL_DAYS` | `7`                                           | How long someone stays signed in                           |
| `STAFF_SESSION_HOURS`    | `12`                                          | How long a staff member stays signed in to the admin panel |
| `SMTP_HOST`              | `localhost`                                   | Mail server; the default is Mailpit                        |
| `SMTP_PORT`              | `1025`                                        | Mail server port                                           |
| `MAIL_FROM`              | `UkRide <no-reply@ukride.local>`              | Sender shown on emails                                     |
| `CUSTOMER_APP_URL`       | `http://localhost:3000`                       | The customer site; links in customer emails                |
| `ADMIN_APP_URL`          | `http://localhost:3001`                       | The admin panel; links in staff emails                     |
| `POSTCODES_API_URL`      | `https://api.postcodes.io`                    | Finds UK postcodes on the map; free, no key                |
| `ROUTING_API_URL`        | `https://router.project-osrm.org`             | Road distance (OSRM); the default is a free demo           |

The API refuses to start if a value is invalid.

### Customer site and admin panel (`customer/.env.local`, `admin/.env.local`)

| Variable                   | Default                 | Purpose                                                              |
| -------------------------- | ----------------------- | -------------------------------------------------------------------- |
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:4000` | Address of the API (both apps)                                       |
| `NEXT_PUBLIC_ADMIN_URL`    | `http://localhost:3001` | The admin panel, linked from an admin's account page (customer site) |

Never commit `.env` or `.env.local`. Only the example files are tracked.

## API

Base URL: `http://localhost:4000/api/v1`

| Method | Path                            | Purpose                                                   |
| ------ | ------------------------------- | --------------------------------------------------------- |
| GET    | `/health`                       | Service name, version, environment, uptime                |
| GET    | `/health/live`                  | The process is alive                                      |
| GET    | `/health/ready`                 | The database answers; `503` when it cannot be reached     |
| POST   | `/auth/check-email`             | Is this email free? (first step of sign-up)               |
| POST   | `/auth/register`                | Create an account with a code-checked mobile; signs in    |
| POST   | `/auth/otp/send`                | Send a 6-digit code to a mobile (sign-up, guest booking)  |
| POST   | `/auth/otp/verify`              | Check a code; answers with a one-use ticket               |
| POST   | `/auth/login`                   | Sign in and receive an access token                       |
| POST   | `/auth/refresh`                 | New access token from the refresh cookie                  |
| POST   | `/auth/logout`                  | Sign out: revoke the refresh token, clear the cookie      |
| GET    | `/auth/me`                      | The signed-in user; needs `Authorization: Bearer <token>` |
| POST   | `/auth/forgot-password`         | Ask for a password reset link                             |
| POST   | `/auth/reset-password`          | Choose a new password with the emailed token              |
| GET    | `/users/me`                     | Your profile (signed in)                                  |
| PATCH  | `/users/me`                     | Change your name, mobile number or gender                 |
| POST   | `/users/me/password`            | Change your password; signs out other devices             |
| GET    | `/vehicle-types`                | The catalogue of vehicle types (public)                   |
| GET    | `/vehicle-types/:slug`          | One vehicle type, for example `executive` (public)        |
| POST   | `/quotes`                       | The price of a journey between two postcodes (public)     |
| POST   | `/admin/auth/login`             | Staff sign-in for the admin panel (ADMIN or DISPATCHER)   |
| POST   | `/admin/auth/refresh`           | New staff access token from the staff cookie              |
| POST   | `/admin/auth/logout`            | Staff sign-out; the customer sign-in is not touched       |
| GET    | `/admin/auth/me`                | The signed-in staff member                                |
| GET    | `/admin/vehicle-types`          | Every vehicle type, including switched-off ones (admin)   |
| POST   | `/admin/vehicle-types`          | Add a vehicle type (admin)                                |
| PATCH  | `/admin/vehicle-types/:id`      | Change a vehicle type, or switch it back on (admin)       |
| DELETE | `/admin/vehicle-types/:id`      | Switch a vehicle type off; the row is kept (admin)        |
| GET    | `/admin/vehicles`               | The fleet: pages, status and type filters, search (admin) |
| POST   | `/admin/vehicles`               | Add a vehicle to the fleet (admin)                        |
| GET    | `/admin/vehicles/:id`           | One vehicle with its type (admin)                         |
| PATCH  | `/admin/vehicles/:id`           | Change a vehicle's details (admin)                        |
| PATCH  | `/admin/vehicles/:id/status`    | Active, in maintenance or retired (admin)                 |
| GET    | `/admin/pricing`                | Prices of every vehicle type, in pence (admin)            |
| PUT    | `/admin/pricing/:vehicleTypeId` | Set the prices of one vehicle type (admin)                |

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
| Mailpit    | http://localhost:8025 (SMTP on 1025)                     | Now       |

These credentials are for local development only.

Emails the API sends (confirm your address, reset your password) are caught by Mailpit and
never delivered. Open http://localhost:8025 to read them and click their links.

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
- [DESIGN.md](DESIGN.md): the design system as built (tokens, components, rules)

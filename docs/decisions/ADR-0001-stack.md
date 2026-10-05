# ADR-0001: Stack and repository layout

- Status: Accepted
- Date: 2026-10-05

## Context

UkRide is a learning project that follows a module-by-module plan. Each module is built
backend first, tested manually, then given a UI, connected with TanStack Query, polished and
committed. Every tool must be free and runnable on a local machine.

## Decision

- **One repository, npm workspaces.** `backend/` and `frontend/` share one lockfile and one
  install. Each module is committed as one full-stack milestone.
- **Backend: Express 5 with TypeScript, ESM.** The plan suggests JavaScript first; TypeScript was
  chosen from the start so the API and the frontend share one language and types catch
  mistakes early. `tsx` runs the code in development, `tsc` builds for production.
- **Validation: Zod**, for environment variables now and request bodies from Module 1.
- **Logging: Pino**, with a request ID on every request and response.
- **Frontend: Next.js App Router, TypeScript, Tailwind CSS v4.** Design tokens live in CSS.
- **Server state: TanStack Query v5.** Raw HTTP functions in `features/*/api`, hooks in
  `features/*/hooks`, keys in `lib/query/keys.ts`.
- **Tests: Vitest and Supertest** on the backend. Frontend and Playwright tests come later.
- **Manual API tests: Bruno**, stored as text in `docs/api-tests`, plus curl examples.
- **Local services: Docker Compose** for PostgreSQL 16, Redis 7 and Mailpit.
- **API contract:** base path `/api/v1`, one success envelope, one error envelope with
  `requestId`.

## Consequences

- TypeScript adds a build step and requires `.js` extensions on relative imports.
- The Express `app` is exported without `listen()`, so tests call it directly.
- TypeScript is pinned to 5.x in both workspaces because the lint tooling does not support 7 yet.
- The frontend never sees database models; it only sees response types it declares itself.

## Alternatives considered

- **JavaScript backend**: follows the plan literally, but loses type checking across the stack.
- **Two separate repositories**: harder to commit one module as one milestone.
- **pnpm**: faster installs, but not installed on the machine; npm workspaces are enough.
- **NestJS or Fastify**: the goal is to learn Express itself.

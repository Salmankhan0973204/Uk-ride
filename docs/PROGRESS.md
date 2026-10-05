# Module progress tracker

Update this file after every coding session.

- **Current module:** none in progress
- **Last completed:** Module 0 - Foundation
- **Next step:** 1.1 - PostgreSQL + Prisma, `User` model, first migration
- **Steps done:** 6 of 113

A module is **Complete** only when all five stages are Done and the flow works end to end.
Do not start two modules at the same time.

Stage values: `Done`, `In progress`, `-` (not started), `n/a`.

| #   | Module                                             | Steps | Backend | API Tested | Frontend UI | TanStack Query | Tailwind / Impeccable Polish | Status   |
| --- | -------------------------------------------------- | ----- | ------- | ---------- | ----------- | -------------- | ---------------------------- | -------- |
| 0   | Foundation: Health Check + First Full-Stack Screen | 6/6   | Done    | Done       | Done        | Done           | Done (manual pass)           | Complete |
| 1   | Authentication: Register + Login + Current User    | 0/8   | -       | -          | -           | -              | -                            | Next     |
| 2   | Profile Management                                 | 0/6   | -       | -          | -           | -              | -                            | -        |
| 3   | Vehicle Types: Admin CRUD + Customer Catalog       | 0/7   | -       | -          | -           | -              | -                            | -        |
| 4   | Fleet Vehicles                                     | 0/6   | -       | -          | -           | -              | -                            | -        |
| 5   | Pricing Rules + Quote Engine                       | 0/7   | -       | -          | -           | -              | -                            | -        |
| 6   | Booking Creation                                   | 0/6   | -       | -          | -           | -              | -                            | -        |
| 7   | My Bookings: List + Detail                         | 0/5   | -       | -          | -           | -              | -                            | -        |
| 8   | Booking Edit + Cancellation                        | 0/6   | -       | -          | -           | -              | -                            | -        |
| 9   | Driver + Dispatch Operations                       | 0/8   | -       | -          | -           | -              | -                            | -        |
| 10  | Stripe Payments + Refunds                          | 0/7   | -       | -          | -           | -              | -                            | -        |
| 11  | Notifications + Email                              | 0/6   | -       | -          | -           | -              | -                            | -        |
| 12  | Real-Time Booking Status + Driver Location         | 0/6   | -       | -          | -           | -              | -                            | -        |
| 13  | File Uploads + Driver Documents                    | 0/6   | -       | -          | -           | -              | -                            | -        |
| 14  | Reviews + Customer Feedback                        | 0/5   | -       | -          | -           | -              | -                            | -        |
| 15  | Admin Dashboard + Reporting                        | 0/6   | -       | -          | -           | -              | -                            | -        |
| 16  | Production Hardening + Automated Testing           | 0/6   | -       | -          | -           | -              | -                            | -        |
| 17  | Docker + CI/CD + Deployment                        | 0/6   | -       | -          | -           | -              | -                            | -        |

## Steps

Each module is split into small steps. A step teaches one thing and ends with something that
runs.

- Do one step at a time, in order. Backend steps come first and are tested in Swagger UI
  (`/api/v1/docs`) before the next step starts.
- Build the smallest version that works. Extras wait for a later step.
- Tick the step and make a small commit when it works. The module commit and tag come after
  the last step.
- Steps of later modules are a first draft. Adjust them when the module starts.

### Module 0 - Foundation

- [x] 0.1 npm workspace, shared tooling, Docker Compose. _Learn: monorepo layout._
- [x] 0.2 Express app: env validation, logging, request IDs, envelopes, error handling.
      _Learn: middleware order._
- [x] 0.3 Health endpoints with tests. _Learn: Vitest and Supertest._
- [x] 0.4 Next.js shell, design tokens, Badge, Card, Spinner. _Learn: App Router, Tailwind v4._
- [x] 0.5 System status screen. _Learn: TanStack Query basics._
- [x] 0.6 Swagger UI at `/api/v1/docs`. _Learn: OpenAPI documents._

### Module 1 - Authentication

- [ ] 1.1 PostgreSQL + Prisma, `User` model, first migration, database readiness check.
      _Learn: ORM, schema, migrations._
- [ ] 1.2 `POST /auth/register`. _Learn: Zod request validation, password hashing._
- [ ] 1.3 `POST /auth/login`. _Learn: JWT access tokens, safe error messages._
- [ ] 1.4 Auth middleware and `GET /auth/me`. _Learn: protecting routes._
- [ ] 1.5 Refresh token and logout. _Learn: httpOnly cookies, token rotation._
- [ ] 1.6 Register page. _Learn: forms, field errors, mutations._
- [ ] 1.7 Login page and `useMe()`. _Learn: auth state with TanStack Query._
- [ ] 1.8 Protected page, logout button, design pass. _Learn: route guards._

### Module 2 - Profile Management

- [ ] 2.1 Add name and phone to `User`, return them from `GET /users/me`.
      _Learn: changing a schema with a migration._
- [ ] 2.2 `PATCH /users/me`. _Learn: partial updates._
- [ ] 2.3 Change password endpoint. _Learn: re-checking the current password._
- [ ] 2.4 Profile page. _Learn: reading cached data._
- [ ] 2.5 Edit profile form. _Learn: updating the cache after a mutation._
- [ ] 2.6 Change password form, design pass.

### Module 3 - Vehicle Types

- [ ] 3.1 `VehicleType` model and seed data. _Learn: database seeding._
- [ ] 3.2 Public list and detail endpoints. _Learn: public read endpoints._
- [ ] 3.3 User roles and an admin-only guard. _Learn: role-based access._
- [ ] 3.4 Admin create, update and deactivate endpoints. _Learn: CRUD, soft delete._
- [ ] 3.5 Customer catalogue page. _Learn: list queries._
- [ ] 3.6 Admin table with create and edit form. _Learn: query invalidation._
- [ ] 3.7 Deactivate with confirmation, design pass.

### Module 4 - Fleet Vehicles

- [ ] 4.1 `Vehicle` model linked to `VehicleType`. _Learn: relations, unique constraints._
- [ ] 4.2 Admin CRUD endpoints.
- [ ] 4.3 List with pagination, filter and search. _Learn: query parameters, `meta`._
- [ ] 4.4 Admin vehicles table with pages. _Learn: paginated queries._
- [ ] 4.5 Create and edit form with a vehicle type select. _Learn: dependent data._
- [ ] 4.6 Change vehicle status (active, maintenance), design pass.

### Module 5 - Pricing Rules + Quote Engine

- [ ] 5.1 `PricingRule` model per vehicle type. _Learn: money as integer pence._
- [ ] 5.2 Admin pricing endpoints.
- [ ] 5.3 Quote calculation as a pure function with unit tests.
      _Learn: business logic without HTTP._
- [ ] 5.4 `POST /quotes` with the distance typed in by hand.
- [ ] 5.5 Night and airport surcharges. _Learn: combining rules, price breakdown._
- [ ] 5.6 Admin pricing screen.
- [ ] 5.7 Customer quote form with the price breakdown, design pass.

### Module 6 - Booking Creation

- [ ] 6.1 `Booking` model, status enum, booking reference. _Learn: enums, generated codes._
- [ ] 6.2 `POST /bookings` that re-calculates the price on the server.
      _Learn: never trust a client price, transactions._
- [ ] 6.3 Booking rules, such as pickup time in the future. _Learn: business validation._
- [ ] 6.4 Booking form, step 1: trip details and quote.
- [ ] 6.5 Booking form, step 2: review and confirm. _Learn: multi-step forms._
- [ ] 6.6 Confirmation page, design pass.

### Module 7 - My Bookings

- [ ] 7.1 `GET /bookings` for the signed-in user, with pages and a status filter.
      _Learn: ownership checks._
- [ ] 7.2 `GET /bookings/:id`. _Learn: 404 against 403._
- [ ] 7.3 Bookings list page with upcoming and past tabs.
- [ ] 7.4 Booking detail page. _Learn: detail queries and cache keys._
- [ ] 7.5 Empty, loading and error states, design pass.

### Module 8 - Booking Edit + Cancellation

- [ ] 8.1 Status transition rules with unit tests. _Learn: state machines._
- [ ] 8.2 `PATCH /bookings/:id` before a cut-off time, with a new quote.
- [ ] 8.3 `POST /bookings/:id/cancel` with a reason and a fee rule.
- [ ] 8.4 Edit booking form.
- [ ] 8.5 Cancel dialog. _Learn: optimistic updates._
- [ ] 8.6 Design pass.

### Module 9 - Driver + Dispatch Operations

- [ ] 9.1 Driver role and driver profile; admin creates a driver.
- [ ] 9.2 Dispatcher list of unassigned bookings.
- [ ] 9.3 Assign a driver and a vehicle. _Learn: conflict checks._
- [ ] 9.4 Driver list of own jobs.
- [ ] 9.5 Driver status updates: accepted, on the way, arrived, picked up, completed.
- [ ] 9.6 Dispatcher board. _Learn: dense desktop screens._
- [ ] 9.7 Assign dialog.
- [ ] 9.8 Driver jobs screen for phones, design pass.

### Module 10 - Stripe Payments + Refunds

- [ ] 10.1 Stripe test account and `Payment` model. _Learn: test mode keys._
- [ ] 10.2 Endpoint that creates a PaymentIntent. _Learn: server-side amounts._
- [ ] 10.3 Webhook that marks the booking paid. _Learn: signatures, idempotency._
- [ ] 10.4 Payment form with Stripe Elements.
- [ ] 10.5 Payment states on the booking page.
- [ ] 10.6 Refund endpoint.
- [ ] 10.7 Refund screen for admins, design pass.

### Module 11 - Notifications + Email

- [ ] 11.1 Email service sending to Mailpit, booking confirmation template.
- [ ] 11.2 Redis + BullMQ queue and worker, Redis readiness check.
      _Learn: background jobs, retries._
- [ ] 11.3 Emails for confirmed, cancelled and driver assigned.
- [ ] 11.4 `Notification` model, list and mark-as-read endpoints.
- [ ] 11.5 Notification bell and list. _Learn: polling._
- [ ] 11.6 Design pass.

### Module 12 - Real-Time Status + Driver Location

- [ ] 12.1 Socket.IO server with an authenticated connection. _Learn: WebSockets._
- [ ] 12.2 One room per booking; send status changes to it.
- [ ] 12.3 Client socket hook that updates the TanStack Query cache.
- [ ] 12.4 Driver sends a simulated location. _Learn: throttling._
- [ ] 12.5 Customer tracking screen with a Leaflet map.
- [ ] 12.6 Reconnect handling, design pass.

### Module 13 - File Uploads + Driver Documents

- [ ] 13.1 Upload endpoint saving to local disk. _Learn: multipart, size and type checks._
- [ ] 13.2 `DriverDocument` model with type and expiry date.
- [ ] 13.3 Protected download endpoint. _Learn: access control for files._
- [ ] 13.4 Admin approve and reject endpoints.
- [ ] 13.5 Driver upload screen with progress.
- [ ] 13.6 Admin review screen, design pass.

### Module 14 - Reviews + Customer Feedback

- [ ] 14.1 `Review` model, one per completed booking.
- [ ] 14.2 `POST /bookings/:id/review` with its rules.
- [ ] 14.3 Average rating per driver. _Learn: aggregate queries._
- [ ] 14.4 Review form after a trip.
- [ ] 14.5 Admin reviews list, design pass.

### Module 15 - Admin Dashboard + Reporting

- [ ] 15.1 Summary numbers endpoint. _Learn: counting and grouping._
- [ ] 15.2 Bookings and revenue per day for a date range.
- [ ] 15.3 Dashboard with summary cards.
- [ ] 15.4 One chart. _Learn: a chart library._
- [ ] 15.5 CSV export.
- [ ] 15.6 Design pass.

### Module 16 - Production Hardening + Automated Testing

- [ ] 16.1 Security headers and rate limiting.
- [ ] 16.2 Integration tests against a test database.
- [ ] 16.3 Frontend component tests. _Learn: Testing Library._
- [ ] 16.4 Playwright test: register, book, pay. _Learn: end-to-end tests._
- [ ] 16.5 Database indexes and slow query review.
- [ ] 16.6 Accessibility and performance audit.

### Module 17 - Docker + CI/CD + Deployment

- [ ] 17.1 Backend Dockerfile. _Learn: multi-stage builds._
- [ ] 17.2 Frontend Dockerfile.
- [ ] 17.3 Production Compose file.
- [ ] 17.4 GitHub Actions: lint, typecheck, test.
- [ ] 17.5 Build images in CI.
- [ ] 17.6 Deploy to a free host and run migrations on deploy.

## Module notes

### Module 0 - Foundation (completed 2026-10-05)

Built

- npm workspace with `backend/` and `frontend/`, Docker Compose for PostgreSQL, Redis and Mailpit.
- Express 5 API in TypeScript: environment validation, request IDs, structured logs, CORS
  allowlist, standard success and error envelopes, central 404 and error handling.
- `GET /api/v1/health`, `/health/live`, `/health/ready`.
- Swagger UI at `/api/v1/docs` and the OpenAPI document at `/api/v1/docs/openapi.json`,
  both off in production.
- Next.js app shell, navigation, `/system-status` with loading, online and offline states.
- TanStack Query provider, API client wrapper, `healthApi.getHealth()` and `useHealth()`.
- Design tokens (light and dark), Badge, Card and Spinner components.

Verified

- Backend typecheck, lint and 8 automated tests pass.
- Manual API checks: 200 envelope, 404 envelope, malformed JSON gives 400, request ID is
  echoed, CORS allows only the configured origin, no stack trace in production responses.
- Frontend lint, typecheck and production build pass.
- `/system-status` rendered in a real browser engine in the loading, online and offline states,
  at desktop width and at 375px.

Open items

- Impeccable was installed on 2026-10-05 after adding the Visual C++ Redistributable, and
  `/impeccable init` updated `PRODUCT.md`. There is no `DESIGN.md` yet; `/impeccable document`
  creates it from the existing frontend code.
- Readiness does not check the database or Redis yet. Database check arrives with step 1.1.
- TanStack Query Devtools are wired in; open them from the floating button in development.

Learning notes

- Express 5 forwards rejected promises from async handlers to the error middleware.
- With `"type": "module"` and NodeNext, relative imports need the `.js` extension.
- `NEXT_PUBLIC_` values are inlined at build time; restart `next dev` after changing them.
- An interrupted `npm install` can leave a broken lockfile. Delete `node_modules` and
  `package-lock.json` and install again.

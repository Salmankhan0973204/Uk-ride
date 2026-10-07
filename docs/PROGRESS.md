# Module progress tracker

Update this file after every coding session.

- **Current module:** Module 1 - Authentication
- **Last completed:** Module 0 - Foundation
- **Next step:** 1.5 - Refresh token and logout
- **Steps done:** 11 of 113

A module is **Complete** only when all five stages are Done and the flow works end to end.
Do not start two modules at the same time.

Stage values: `Done`, `In progress`, `-` (not started), `n/a`.

| #   | Module                                             | Steps | Backend     | API Tested  | Frontend UI | TanStack Query | Tailwind / Impeccable Polish | Status      |
| --- | -------------------------------------------------- | ----- | ----------- | ----------- | ----------- | -------------- | ---------------------------- | ----------- |
| 0   | Foundation: Health Check + First Full-Stack Screen | 6/6   | Done        | Done        | Done        | Done           | Done (manual pass)           | Complete    |
| 1   | Authentication: Register + Login + Current User    | 5/8   | In progress | In progress | In progress | In progress    | -                            | In progress |
| 2   | Profile Management                                 | 0/6   | -           | -           | -           | -              | -                            | -           |
| 3   | Vehicle Types: Admin CRUD + Customer Catalog       | 0/7   | -           | -           | -           | -              | -                            | -           |
| 4   | Fleet Vehicles                                     | 0/6   | -           | -           | -           | -              | -                            | -           |
| 5   | Pricing Rules + Quote Engine                       | 0/7   | -           | -           | -           | -              | -                            | -           |
| 6   | Booking Creation                                   | 0/6   | -           | -           | -           | -              | -                            | -           |
| 7   | My Bookings: List + Detail                         | 0/5   | -           | -           | -           | -              | -                            | -           |
| 8   | Booking Edit + Cancellation                        | 0/6   | -           | -           | -           | -              | -                            | -           |
| 9   | Driver + Dispatch Operations                       | 0/8   | -           | -           | -           | -              | -                            | -           |
| 10  | Stripe Payments + Refunds                          | 0/7   | -           | -           | -           | -              | -                            | -           |
| 11  | Notifications + Email                              | 0/6   | -           | -           | -           | -              | -                            | -           |
| 12  | Real-Time Booking Status + Driver Location         | 0/6   | -           | -           | -           | -              | -                            | -           |
| 13  | File Uploads + Driver Documents                    | 0/6   | -           | -           | -           | -              | -                            | -           |
| 14  | Reviews + Customer Feedback                        | 0/5   | -           | -           | -           | -              | -                            | -           |
| 15  | Admin Dashboard + Reporting                        | 0/6   | -           | -           | -           | -              | -                            | -           |
| 16  | Production Hardening + Automated Testing           | 0/6   | -           | -           | -           | -              | -                            | -           |
| 17  | Docker + CI/CD + Deployment                        | 0/6   | -           | -           | -           | -              | -                            | -           |

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

- [x] 1.1 PostgreSQL + Prisma, `User` model, first migration, database readiness check.
      _Learn: ORM, schema, migrations._
- [x] 1.2 `POST /auth/register`. _Learn: Zod request validation, password hashing._
- [x] 1.3 `POST /auth/login`. _Learn: JWT access tokens, safe error messages._
- [x] 1.4 Auth middleware and `GET /auth/me`. _Learn: protecting routes._
- [ ] 1.5 Refresh token and logout. _Learn: httpOnly cookies, token rotation._
- [x] 1.6 Register page. _Learn: forms, field errors, mutations._
- [ ] 1.7 Login page and `useMe()`. _Learn: auth state with TanStack Query._
- [ ] 1.8 Protected page, logout button, design pass. _Learn: route guards._

### Module 2 - Profile Management

- [ ] 2.1 Return the profile from `GET /users/me`. (Name and mobile were added to `User` early,
      with registration, on 2026-10-07.)
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
- Readiness does not check Redis yet. That check arrives with step 11.2.
- TanStack Query Devtools are wired in; open them from the floating button in development.

Learning notes

- Express 5 forwards rejected promises from async handlers to the error middleware.
- With `"type": "module"` and NodeNext, relative imports need the `.js` extension.
- `NEXT_PUBLIC_` values are inlined at build time; restart `next dev` after changing them.
- An interrupted `npm install` can leave a broken lockfile. Delete `node_modules` and
  `package-lock.json` and install again.

### Module 1 - Authentication (in progress)

#### Step 1.1 - PostgreSQL + Prisma (done 2026-10-06)

Built

- PostgreSQL 16 from Docker Compose, reached through `DATABASE_URL` (validated at boot).
- Prisma 7: `backend/prisma/schema.prisma`, `backend/prisma.config.ts`, the client generated
  into `backend/src/generated/prisma` (not committed).
- `User` model, table `users`: `id` (uuid), `email` (unique), `password_hash`, `created_at`,
  `updated_at`. First migration `20261006063037_init`.
- One shared client in `backend/src/config/db.ts`, disconnected on shutdown.
- `GET /health/ready` runs `SELECT 1`: 200 with `database: up`, or 503 `SERVICE_UNAVAILABLE`.

Verified

- Typecheck, lint and 9 automated tests pass. The tests replace the database with a fake.
- `prisma migrate status` reports the database is up to date; `\d users` shows the five
  columns, the primary key and the unique index on `email`.
- Against the real database: readiness 200; with PostgreSQL stopped, readiness 503 and liveness
  200; after PostgreSQL started again, readiness 200 without an API restart.

Open items

- `npm install prisma` currently resolves to a release candidate (8.0.0-rc). The CLI is pinned
  to 7.10.0 to match `@prisma/client`. Upgrade both together when version 8 is stable.
- The generated client is not committed. Run `npm run db:generate -w backend` on a fresh clone.
- No test talks to a real database yet. That is step 16.2.

Learning notes

- The schema file is the source of truth. A migration is the SQL that moves the database to
  it, and the migration files are committed so every machine gets the same tables.
- `prisma migrate dev` writes and applies a migration. It does not regenerate the client in
  Prisma 7; run `prisma generate` after it.
- Prisma 7 needs a driver adapter (`@prisma/adapter-pg`) and reads the CLI connection string
  from `prisma.config.ts`, not from the schema file.
- `@map` and `@@map` keep camelCase in TypeScript and snake_case in the database.
- The client connects on the first query, so the API still starts when the database is down.
  That is why readiness, not startup, reports the problem.
- Liveness must not touch the database: a database outage should not make the platform
  restart a healthy process.

#### Step 1.1 UI - database status on the System Status page (added 2026-10-06)

- `/system-status` has a second card, Dependencies, fed by `GET /health/ready`: Database
  "Up" or "Down", Redis "Not used yet", and "Unknown" when the API cannot be reached.
- New in the health feature: `getReadiness()`, `useReadiness()`, `DependencyStatus`.
- Learning note: a 503 from readiness is an answer, not a failure. `getReadiness()` turns it
  into normal data (`status: 'not_ready'`), so the query's error state means only "the API
  cannot be reached".
- Checked in a browser at desktop width: database up (light and dark) and database stopped.
  Not captured in a browser: the "Unknown" state with the API stopped, and the new card at
  375px and 360px.

#### Step 1.2 - `POST /auth/register` (done 2026-10-06)

Built

- `POST /api/v1/auth/register`: takes an email and a password, answers 201 with `id`,
  `email` and `createdAt`. No token yet; that is step 1.3.
- `validate(schema)` middleware in `backend/src/middleware/validate.ts`, reusable by every
  later endpoint. It answers 400 `VALIDATION_ERROR` with one list of messages per field.
- Auth module in `backend/src/modules/auth/`: schemas (Zod), service (rules), controller
  (HTTP), routes.
- Passwords hashed with bcrypt (`bcryptjs`, cost 12). A taken email answers 409 `CONFLICT`.

Verified

- Typecheck, lint and 16 automated tests pass. The tests replace the database with a fake.
- Against the real database: new email 201; same email again 409; an email with capitals and
  spaces stored trimmed and lower-cased; bad email with a short password 400 with both field
  messages; broken JSON 400 `BAD_REQUEST`.
- Stored `password_hash` values start with `$2b$12$` and are 60 characters long.
- The OpenAPI document lists `/auth/register`.

Open items

- The 409 answer tells a visitor that an email is registered. That is normal for a sign-up
  form, but it needs rate limiting, which is step 16.1.
- Passwords are limited to 72 characters. bcrypt counts bytes, so a password with many
  non-English characters can pass the check and still be cut at 72 bytes.

Learning notes

- Validation is a separate middleware in front of the controller. The controller only ever
  sees data that passed the schema, already trimmed and typed.
- `z.infer<typeof schema>` gives the TypeScript type of the request, so the rule and the
  type cannot drift apart.
- Routes map URLs, controllers speak HTTP, services hold the rules. A service never touches
  `req` or `res`, so it can be tested and reused without a web request.
- A bcrypt hash holds the algorithm, the cost and a random salt (`$2b$12$...`). Hashing the
  same password twice gives two different hashes; `bcrypt.compare` is the only way to check.
- Check-then-insert is not safe on its own: two requests can both pass the check. The unique
  index in the database is the real guard, and Prisma reports it as error `P2002`.
- Prisma `select` returns only the listed columns, so the hash never leaves the service.

#### Step 1.6 - Register page (done 2026-10-07, built ahead of 1.3 to 1.5)

Built

- `/register`: email and password form that calls `POST /auth/register`. One password field
  with a Show / Hide button. The home page links to it as its primary action.
- New `auth` feature in the web app: `authApi.register()`, `useRegister()` (a TanStack
  Query mutation) and `RegisterForm`.
- States: empty, field errors, sending, server errors, success. After success the form is
  replaced by a confirmation that names the email and says sign-in is not built yet.
- A `--control` colour token for the edge of form fields, stronger than `--line`.

Verified

- Frontend lint, typecheck and production build pass.
- Driven in a real browser (headless Edge): a bad email with a 3-character password shows both
  messages and focuses the email field; Show / Hide switches the field type; a valid form
  creates the account and focus moves to the confirmation; the same email again shows the
  "already has an account" message on the email field.
- No horizontal scrolling at 1280px, 375px and 360px. Checked in light and dark mode.

Open items

- The full Impeccable finish review and `DESIGN.md` are left for the design pass in step 1.8.
- The "could not reach the server" message was not triggered in a browser.
- The confirmation cannot offer a sign-in link until steps 1.3 and 1.7 exist.

Learning notes

- A query reads data and runs on its own; a mutation changes data and runs when you call
  `mutate()`. `isPending`, `isSuccess` and `data` drive the three screens of the form.
- Check in the browser first for speed, but treat the server as the judge: its 400 and 409
  answers are mapped onto the same field messages.
- A field error needs three things: `aria-invalid`, `aria-describedby` pointing at the
  message, and focus moved to the first wrong field.
- `noValidate` turns off the browser's own bubbles so every message uses our wording.

#### Registration profile fields and new UI palette (2026-10-07)

Built

- `User` gained `first_name`, `last_name`, `mobile` (unique) and `gender` (optional enum:
  `MALE`, `FEMALE`, `OTHER`, `PREFER_NOT_TO_SAY`). Migration `20261007095941_add_profile_fields`.
- `POST /auth/register` takes and returns the new fields. Names allow letters from any
  alphabet with spaces, hyphens and apostrophes. A mobile number from any country is accepted
  and stored in international form (`+447400123456`).
- A taken email or mobile number answers 409 with `details.field`, so the form marks the
  right input.
- The register form shows the new fields, checks each one when the user leaves it, and lists
  the saved details on the confirmation. A reusable `Field` component holds label, hint and
  error.
- The ui-ux-pro-max skill is installed in `.claude/skills/ui-ux-pro-max` (it needs Python 3,
  installed with winget). Its design system for UkRide replaced the colour tokens: navy ink,
  one blue action colour, cool slate neutrals. Impeccable stays installed.

Verified

- Backend typecheck, lint and 19 tests pass. Frontend lint, typecheck and build pass.
- In a real browser: every field error, Show / Hide, a full registration with a Pakistani
  number, the mobile conflict (same number typed in another format) and the email conflict.
- No horizontal scrolling at 1280px, 375px and 360px. Checked in light and dark mode.

Open items

- The skill suggested EB Garamond and Lato; Geist was kept because that pairing is aimed at
  legal and formal sites.
- Mobile numbers are checked for shape only (country code and 8 to 15 digits), not that the
  number exists. Verifying by SMS would be a later step.
- Gender is personal data that a booking does not need; it stays optional for that reason.

Learning notes

- `prisma migrate dev` stops in a non-interactive shell when a migration carries a warning.
  `prisma migrate diff --from-config-datasource --to-schema ... --script` writes the same SQL,
  and `prisma migrate deploy` applies it.
- Adding a required column only works without a default while the table is empty. With real
  rows it needs a default or a two-step migration.
- Normalise before you compare: "0044 (7400) 123-456" and "+447400123456" are one number, so
  the unique index only works on the cleaned form.

#### Frontend redesign: glass on a gradient (2026-10-07)

Built

- The whole web app was restyled to the look the user chose: frosted glass panels on a deep
  indigo-to-violet gradient, with an indigo-to-violet accent. `PRODUCT.md` describes it.
- Shared pieces in `frontend/src/app/globals.css`: `.glass` (panel), `.btn` with
  `.btn-primary` and `.btn-ghost`, `.control` (inputs and the dropdown trigger), `.pill`
  (status).
- A custom dropdown, `components/ui/Select.tsx`, replaces the browser's select. It works by
  mouse, touch and keyboard (Up, Down, Home, End, Enter, Space, Escape, type a letter).
- A floating glass navigation bar, a home page with the journey stages and a live status card,
  and glass versions of the register form, its confirmation and the System Status page.

Verified

- Frontend lint, typecheck and production build pass.
- Driven in a real browser: the dropdown by pointer and by keyboard, every field error, a full
  registration, and a duplicate email.
- No horizontal scrolling at 1440px, 390px and 360px.

Open items

- One theme only. The gradient is the design, so there is no separate light mode.
- Backdrop blur costs more to draw than flat panels. It was not measured on a low-end phone.
- Two earlier directions from the same day (a slate and blue palette, then a road-sign design)
  were replaced. The road-sign one was never committed.
- The ui-ux-pro-max and Impeccable skills are both still installed. No `DESIGN.md` exists yet.

Learning notes

- Glass needs a dark or busy backdrop behind it and enough fill in front of it: text contrast
  is measured against the panel as it actually renders, not against the panel colour alone.
- A menu that floats over a form must be nearly opaque, or the fields behind show through the
  options.
- A custom select has to rebuild what the browser gave for free: a label, an expanded state,
  an active option, and every key a native select answers to.
- After changing the root layout or global CSS heavily, restart `next dev`. A stale server
  render causes hydration warnings that are not real bugs.

#### Step 1.3 - `POST /auth/login` (done 2026-10-07)

Built

- `POST /api/v1/auth/login`: takes an email and a password, answers 200 with the user, an
  `accessToken`, `tokenType: "Bearer"` and `expiresIn: 900`.
- The access token is a JWT signed with HS256. It carries only the user id (`sub`) and lives
  for 15 minutes. `backend/src/modules/auth/auth.tokens.ts` signs it.
- Two new settings, checked at boot: `JWT_ACCESS_SECRET` (32 characters or more) and
  `JWT_ACCESS_TTL_SECONDS` (default 900).
- A wrong password and an unknown email both answer 401 `UNAUTHENTICATED` with the same
  message. The response is sent with `Cache-Control: no-store`.

Verified

- Typecheck, lint and 26 automated tests pass. The tests replace the database with a fake.
- Against the real database: sign-in with the email typed in capitals and spaces returned 200;
  the token had three parts, its `sub` matched the user id and its lifetime was 900 seconds;
  a wrong password and an unknown email returned the same 401; a missing password returned 400.
- A wrong password took 410 ms and an unknown email 379 ms, so timing does not tell them apart.
- The OpenAPI document lists `/auth/login`.

Open items

- Nothing uses the token yet. Step 1.4 adds the middleware that checks it and `GET /auth/me`.
- There is no refresh token, so a session ends after 15 minutes. That is step 1.5.
- Login has no rate limit, so passwords can be guessed without slowing down. That is step 16.1.
- The login page is step 1.7.

Learning notes

- A JWT is signed, not encrypted. Anyone holding it can read it; nobody without the secret can
  change it. Put an id in it, never a password or personal details.
- The API does not store access tokens. It trusts any token whose signature and expiry check
  out, which is why the lifetime is short: a stolen token cannot be taken back.
- "Email or password is incorrect" for both failures stops people testing which emails have
  accounts. Comparing against a decoy hash when the email is unknown keeps the response time
  the same too.
- Name the algorithm when signing and when verifying. A verifier that accepts whatever the
  token claims can be tricked.
- The secret lives in `.env`, which git ignores. `.env.example` holds a placeholder only.

#### Step 1.4 - Auth middleware and `GET /auth/me` (done 2026-10-07)

Built

- `requireAuth` in `backend/src/middleware/requireAuth.ts`. Put it in front of any controller
  to protect the route. It reads `Authorization: Bearer <token>`, checks the token and stores
  the user id for the controller, read with `currentUserId(res)`.
- `verifyAccessToken()` beside `signAccessToken()`: accepts only a token this API signed, with
  HS256, that has not expired and names a user.
- `GET /api/v1/auth/me`: the first protected route. It returns the signed-in user, read fresh
  from the database.
- Swagger UI has an Authorize button, and `/auth/me` shows a padlock.

Verified

- Typecheck, lint and 40 automated tests pass. The tests cover a missing header, a wrong
  scheme, and tokens that are garbage, signed with another secret, signed with another
  algorithm, unsigned, missing the user id, or expired.
- Against the real database: a valid token returned the user; no header, a wrong scheme, a
  garbage token and a token with a changed signature each returned 401; after the account was
  deleted the same valid token returned 401.
- The browser's preflight request allows the `Authorization` header from the web app's origin.

Open items

- A token cannot be cancelled before it expires. Logging out, and ending sessions on the
  server, arrive with the refresh token in step 1.5.
- Nothing in the web app signs in or sends a token yet. That is step 1.7.

Learning notes

- Middleware is a function that runs before the controller and either calls `next()` or ends
  the request. `router.get('/me', requireAuth, me)` reads left to right: check, then answer.
- Authentication asks "who are you?" (401 when unknown). Authorisation asks "are you allowed?"
  (403), and comes with roles in step 3.3.
- The token proves who signed in, not that the account still exists. Reading the user from the
  database on `/auth/me` catches an account deleted after the token was issued.
- Verifying with an explicit algorithm list rejects "alg: none" tokens, a classic JWT attack.
- Expiry is the one failure worth naming, because the client can act on it: sign in again, or
  later, refresh.

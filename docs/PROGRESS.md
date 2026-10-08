# Module progress tracker

Update this file after every coding session.

- **Current module:** none in progress
- **Last completed:** Module 1 - Authentication
- **Next step:** 2.1 - Return the profile from `GET /users/me`
- **Steps done:** 14 of 113

A module is **Complete** only when all five stages are Done and the flow works end to end.
Do not start two modules at the same time.

Stage values: `Done`, `In progress`, `-` (not started), `n/a`.

| #   | Module                                             | Steps | Backend | API Tested | Frontend UI | TanStack Query | Tailwind / Impeccable Polish | Status   |
| --- | -------------------------------------------------- | ----- | ------- | ---------- | ----------- | -------------- | ---------------------------- | -------- |
| 0   | Foundation: Health Check + First Full-Stack Screen | 6/6   | Done    | Done       | Done        | Done           | Done (manual pass)           | Complete |
| 1   | Authentication: Register + Login + Current User    | 8/8   | Done    | Done       | Done        | Done           | Done (manual pass)           | Complete |
| 2   | Profile Management                                 | 0/6   | -       | -          | -           | -              | -                            | Next     |
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

- [x] 1.1 PostgreSQL + Prisma, `User` model, first migration, database readiness check.
      _Learn: ORM, schema, migrations._
- [x] 1.2 `POST /auth/register`. _Learn: Zod request validation, password hashing._
- [x] 1.3 `POST /auth/login`. _Learn: JWT access tokens, safe error messages._
- [x] 1.4 Auth middleware and `GET /auth/me`. _Learn: protecting routes._
- [x] 1.5 Refresh token and logout. _Learn: httpOnly cookies, token rotation._
- [x] 1.6 Register page. _Learn: forms, field errors, mutations._
- [x] 1.7 Login page and `useMe()`. _Learn: auth state with TanStack Query._
- [x] 1.8 Protected page, logout button, design pass. _Learn: route guards._

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

### Module 1 - Authentication (completed 2026-10-07)

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

#### Step 1.5 - Refresh token and logout (done 2026-10-07)

Built

- `refresh_tokens` table (migration `20261007130736_add_refresh_tokens`): one row per issued
  token, holding its SHA-256 hash, expiry and `revoked_at`. Deleting a user deletes the rows.
- `POST /auth/login` also sets the cookie `ukride_refresh`: httpOnly, `SameSite=Strict`,
  path `/api/v1/auth`, 7 days, and `Secure` in production.
- `POST /auth/refresh`: no body. Trades the cookie for a new access token and replaces the
  cookie with a new refresh token (rotation). A token works once.
- `POST /auth/logout`: revokes the token, clears the cookie, always answers 200.
- Reuse detection: if a token that was already used or signed out is sent again, every session
  of that user is ended.
- New setting `REFRESH_TOKEN_TTL_DAYS` (default 7). The session code is in
  `backend/src/modules/auth/auth.sessions.ts`, the cookie rules in `auth.cookies.ts`.

Verified

- Typecheck, lint and 53 automated tests pass. The session tests run against a small
  in-memory fake of the table, so rotation is followed across several requests.
- Against the real database, with cookie jars for two devices: login set the cookie with the
  expected attributes; the database held a hash, not the token; refresh replaced the cookie and
  revoked the old row; logging out one device left the other signed in; replaying a used token
  answered 401 and took the user from 2 active sessions to 0; deleting the user removed the
  token rows.

Open items

- Logging out does not cancel an access token that was already issued. It stays valid until it
  expires, at most 15 minutes.
- Two requests arriving at the same instant with the same refresh token: one wins and one gets 401. The web app must run one refresh at a time (step 1.7).
- Expired and revoked rows are never deleted. A clean-up job fits with the queue in Module 11.
- Refresh and logout are protected from other sites by `SameSite=Strict` and the CORS
  allowlist. There is no separate CSRF token.
- The first live replay test passed for the wrong reason: PowerShell dropped a hand-written
  `Cookie` header, so no cookie was sent. It was repeated with a real cookie jar.

Learning notes

- Two tokens, two jobs. The access token is short-lived and sent on every request; the refresh
  token is long-lived and sent only to get a new access token.
- httpOnly means page scripts cannot read the cookie, so an injected script cannot steal the
  long-lived token. The access token stays in memory in the web app for the same reason.
- Rotation turns a stolen refresh token into a detectable event: the thief and the owner
  cannot both keep using it, and the first replay ends every session.
- Store a hash of a random token, not the token. SHA-256 is enough because the token is 256
  random bits; bcrypt is for passwords, which people choose and attackers can guess.
- `clearCookie` needs the same path and flags as the cookie it removes, or the browser keeps it.
- Check your test before trusting a pass: a 401 for "no cookie" looked the same as a 401 for
  "replayed cookie" until the database rows were counted.

#### Steps 1.7 and 1.8 - Login page, `useMe()`, account page and sign-out (done 2026-10-07)

Built

- `/login`: email and password form. A wrong password shows one message, clears the password
  and returns focus to it. A signed-in visitor is sent on to `/account`.
- `/account`: the protected page. It shows the signed-in user's details and a Sign out button.
  A signed-out visitor is sent to `/login`, and nothing private is drawn while the check runs.
- `useMe()`: the web app's auth state, a TanStack Query whose data is the user or `null`.
  `useLogin()` and `useLogout()` write to it directly.
- `authFetch()` in `frontend/src/lib/api/client.ts`: adds the access token, and when it is
  missing or expired, gets a new one from the refresh cookie and tries once more. All callers
  share one refresh request.
- The access token is kept in memory only (`frontend/src/lib/auth/session.ts`).
- The navigation shows Sign in and Sign up when signed out, and the person's first name when
  signed in. The register confirmation now links to sign-in.

Verified

- Frontend lint, typecheck and production build pass (six routes).
- Driven in a real browser against the real API and database:
  - signed out, `/account` redirects to `/login`;
  - register, then the confirmation's Sign in button leads to `/login`;
  - a wrong password shows the message, clears the field and stays on the page;
  - the right password, with the email typed in capitals and spaces, lands on `/account`;
  - after a reload the page is still signed in, restored from the cookie;
  - signed in, `/login` redirects to `/account`;
  - Sign out returns to the home page, the navigation offers Sign in again, and `/account`
    redirects to `/login`; every refresh token of the test user was revoked.
- The access token was in neither localStorage nor sessionStorage, and page script could not
  read the refresh cookie.
- No horizontal scrolling at 1440px, 390px and 360px.

Design pass (step 1.8)

- A manual pass over the new screens in the glass design: states for loading, error, wrong
  password, signed in and signed out; keyboard focus; 44px targets; three widths.
- Found and fixed: signing out first landed on `/login` instead of home, because the page's
  own guard reacted before the redirect.
- The Impeccable finish review was not run on the glass design, and no `DESIGN.md` exists.

Open items

- The guard runs in the browser. The page's code is public; what is protected is the data,
  which the API refuses without a token.
- If the API cannot be reached during the session check, the account page says so and keeps
  the session. That state was not triggered in a browser.
- "Status" is hidden from the navigation on phones for lack of room; the home page links to it.
- After sign-in the app always goes to `/account`. Returning to the page you came from can
  wait until there are more protected pages.

Learning notes

- Auth state is server state: "who am I" is a query, and login and logout are mutations that
  update its cache. No separate auth store is needed.
- Keep the access token in a variable, not in localStorage. A reload loses it, and the
  httpOnly cookie brings it back; an injected script can read neither.
- `credentials: 'include'` is what lets the browser store and send a cookie set by the API on
  another port. The API must answer with `Access-Control-Allow-Credentials: true` and a named
  origin, never `*`.
- A refresh token works once, so the client must make sure only one refresh runs at a time.
  Sharing one promise between callers does that.
- Two effects can race. Sign-out made the user null, which triggered the guard's redirect
  before the sign-out's own. A flag set when the button is pressed settles which one wins.

### Module 1 summary

Built: PostgreSQL with Prisma; register, login, refresh, logout and current-user endpoints;
access tokens as 15-minute JWTs and refresh tokens as rotating httpOnly cookies; the register,
login and account screens; the glass-on-gradient design.

Checks at completion: backend typecheck, lint and 53 tests pass; frontend lint, typecheck and
build pass; the full journey was driven in a real browser.

### Module 1 follow-ups (started 2026-10-08)

Eight gaps were left open when Module 1 closed. They are closed here, one at a time, before
Module 2 starts. These are extra work, not numbered steps, so the step count does not change.

#### Follow-up 1 - Rate limiting on the auth routes

Built

- `rateLimiter()` in `backend/src/middleware/rateLimit.ts`, built on `express-rate-limit`.
  A refused request answers 429 `RATE_LIMITED` in the standard error envelope, with a
  `Retry-After` header.
- Sign-in: 10 wrong attempts per 15 minutes from one address. Correct sign-ins are not counted.
- Registration: 10 per hour from one address. Refresh and logout: 120 per 15 minutes.
- The sign-in and register forms show the API's 429 message. Swagger lists the 429 answer.

Verified

- 57 automated tests pass. Four new ones exercise the limiter on a small app of its own.
- Against the running API: twelve wrong sign-ins in a row answered 401 ten times, then 429 with
  `Retry-After: 896`.

Open items

- Counts live in the API process's memory, so they reset on restart and are not shared between
  several servers. Redis (Module 11) fixes both.
- The limit is per address, not per account. Many addresses guessing one account are not
  slowed. An account lockout would need care not to let strangers lock people out.
- Behind a proxy or load balancer, Express must be told to trust it (`trust proxy`), or every
  visitor appears to come from the proxy's address. That belongs to deployment, Module 17.
- The limiter is switched off in the automated tests, where every request shares one address.

Learning notes

- Put the limiter first in the route, before validation and the database, so a refused request
  costs almost nothing.
- Count failures only on sign-in: a legitimate user who signs in often is never the problem.

#### Follow-up 2 - Logout ends the access token at once

Built

- `refresh_tokens` gained `session_id` (migration `add_session_id`). A session is one sign-in on
  one device. Rotation replaces the refresh token but keeps the session id.
- The access token now carries the session id as `sid`, beside the user id.
- `requireAuth` checks two things: the token (signature, algorithm, expiry), then that its
  session still has a refresh token that is neither revoked nor expired.
- Logout ends the whole session, so every access token issued in it stops working immediately.
- The service now only checks credentials (`checkCredentials`); the controller starts the
  session and issues the tokens.
- `backend/src/test/fakeDb.ts`: a small in-memory stand-in for the database, shared by the
  session tests.

Verified

- 65 automated tests pass. New ones cover: a good token refused after sign-out, after its
  session runs out, and for a session that never existed; a token still accepted after
  rotation; an older access token cut off by a later logout; one device signed out while the
  other keeps working.
- Against the real database, with two devices: the phone's access tokens answered 200 before
  logout and 401 "Your session has ended" right after it, including the one issued before a
  refresh; the laptop's token kept answering 200.

Open items

- Every protected request now makes one extra, indexed database query. That is the price of
  instant logout. A short cache or Redis could remove it later if it ever matters.
- The migration deleted the existing refresh tokens, because they had no session to belong
  to. Anyone signed in had to sign in again.

Learning notes

- A JWT alone cannot be cancelled: it is valid until it expires. To cancel early, the server
  has to remember something. Here it remembers sessions, and the token only points at one.
- That gives a middle path between "stateless" tokens and classic server sessions: the token
  still proves who you are without a lookup, and one cheap lookup says whether you are still
  signed in.
- Keep the stable id (the session) separate from the thing that rotates (the refresh token).
  Otherwise every rotation would orphan the access tokens issued before it.

#### Follow-up 3 - Clean-up of expired refresh tokens

Built

- `deleteExpiredSessions()` removes refresh tokens whose expiry has passed.
- `backend/src/jobs/cleanup.ts`: the API runs the sweep 30 seconds after it starts and every 6
  hours after that. A failure is logged and never stops the server.
- `npm run db:cleanup -w backend` runs one sweep by hand.

Verified

- 68 automated tests pass (three new).
- Against the real database: with one expired token, one used but unexpired token and one live
  token, the sweep removed exactly the expired one.

Open items

- The sweep is a timer inside the API process. With several servers each would run it. That
  is harmless but wasteful; one scheduled job on the queue (Module 11) replaces it.
- A used or signed-out token is kept until it expires, up to 7 days, so a replay can still be
  recognised. The table therefore holds a week of history at most.

Learning notes

- Decide what "dead" means before deleting. A revoked token looks dead but still does a job:
  it is the evidence that lets the server spot a stolen copy. Only expiry makes it useless.
- `timer.unref()` lets Node exit even though the timer is still scheduled.

#### Follow-up 4 - Tests against a real database

Built

- A second test suite, `npm run test:integration`, that runs the real application against a
  real PostgreSQL database. Its files end in `.itest.ts`.
- It uses its own database, `ukride_test`, in the same Docker container. The suite creates it
  if it is missing, applies the migration files, and empties the tables before every test.
- `resetDatabase()` refuses to run against any database whose name does not end in `_test`.
- 12 tests in `backend/src/modules/auth/auth.itest.ts`: registration with real rows, duplicate
  email and mobile, two identical registrations at once, the whole sign-in journey, replay of
  a used refresh token, two devices, cascade delete, and the clean-up sweep.
- `npm test` still runs the 68 fast unit tests and needs no database.

Verified

- All 12 integration tests pass. The development database was untouched: it still held its one
  user afterwards.
- The race test proves what the unit tests could only assume: with two identical requests at
  once, the unique index refuses the second and the API turns Prisma's `P2002` into a 409.
- Test-only files are excluded from the production build.

Open items

- The integration suite needs Docker running. It fails with a clear message when PostgreSQL is
  not reachable.
- It covers the auth module only. Each later module adds its own `.itest.ts`.
- Nothing runs these automatically yet. Continuous integration is step 17.4.

Learning notes

- A unit test with a fake database tests your code against your own idea of the database. An
  integration test finds out whether that idea is right. Both are worth having: the first is
  fast, the second is true.
- Give tests their own database and reset it before each test, so tests cannot depend on each
  other or on leftovers.
- Put a guard on anything that deletes data. One wrong connection string should produce an
  error, not an empty development database.

#### Follow-up 5 - Mobile numbers checked against real numbering plans

Built

- Registration validates the mobile number with `libphonenumber-js`, which carries each
  country's numbering plan. A number must have the right length for its country, sit in a
  range that is really allocated, and be a mobile rather than a landline.
- The web form runs the same validity check before sending, and shows numbers in readable
  international form ("+44 7400 123456") on the confirmation and account pages.

Verified

- 73 unit tests and 12 integration tests pass. New cases: too few digits, too many digits, a
  country code that does not exist, a UK landline, and a US number (where mobiles and
  landlines share ranges, so it is accepted).

Open items

- This proves a number could exist, not that it does, nor that the person registering holds
  it. Only sending a code by SMS can prove that, and SMS providers charge per message, which
  the free-tools rule excludes. If that rule changes, verification by code is the next step.
- The numbering data ships inside the library, so new ranges arrive with library updates.
- The browser uses the library's smaller data set, which cannot tell a landline from a mobile.
  The API can, and has the final say.

Learning notes

- A regular expression can check that something looks like a phone number. It cannot know
  that UK mobiles have exactly ten digits after +44, or which ranges are in use. That is data,
  and a library that ships the data is the right tool.
- Validation proves form. Verification proves ownership. They are different jobs.

#### Follow-up 6 - Email confirmation and password reset

Built

- Email sending with `nodemailer` in `backend/src/config/mailer.ts`. In development the mail
  server is Mailpit, which catches every message: read them at http://localhost:8025.
- `email_tokens` table and `users.email_verified_at` (migration `add_email_tokens`). A link
  carries a random token; the database keeps its hash, an expiry and whether it was used.
- Registration emails a confirmation link (24 hours). The account works straight away;
  confirming is not required to sign in.
- Four endpoints: `POST /auth/verify-email`, `POST /auth/resend-verification` (signed in),
  `POST /auth/forgot-password`, `POST /auth/reset-password`.
- Resetting a password ends every session of the user, and also confirms the email address,
  since opening the link proved the mailbox is theirs.
- Limits: 5 emails an hour per address for forgot-password and resend; 20 link attempts per 15
  minutes.
- Web app: `/verify-email`, `/forgot-password` and `/reset-password` pages; a "Forgot your
  password?" link on sign-in; the account page shows Confirmed or Not confirmed with a button
  to send the link again.

Verified

- 73 unit tests pass. 29 integration tests pass against the real database, 17 of them new for
  these flows, with the mail sender replaced by an in-memory outbox.
- Against the running API with real emails in Mailpit: the confirmation email arrived with a
  text and an HTML part, its link confirmed the address, the reset email arrived, its link
  changed the password, the old password answered 401 and the new one signed in.
- In a real browser, reading links from Mailpit: register, see "Not confirmed", send the link
  again, open it, see "Confirmed"; the same link a second time fails; forgot password; a short
  new password is refused; a good one is saved; old password refused, new one accepted; the
  used reset link fails; both pages handle a link with no token.
- No horizontal scrolling at 1440px and 390px on the new screens.

Open items

- Mailpit delivers nothing. Sending real email needs a provider's SMTP settings in `.env`, and
  a real sending domain. That belongs with deployment.
- Emails are sent inside the API process, in the background of the request. If the mail server
  is down the email is lost and only logged. A queue with retries (Module 11) fixes that.
- An unconfirmed account can do everything a confirmed one can. Requiring confirmation for
  specific actions, such as booking, can be added where it matters.
- There is no "change password while signed in" yet. That is step 2.3.
- The HTML email is plain. It was checked in Mailpit only, not in real mail clients.

Learning notes

- "Forgot password" must answer the same for every address, and take the same time. That is
  why the email is sent without waiting for it.
- A reset link is a credential, as powerful as the password. It gets the same care: random,
  stored hashed, single use, short-lived, and it ends existing sessions.
- Asking for a new link deletes the earlier one, so only one working link exists at a time.
- A user's name goes into the HTML email, so it is escaped. Any text a user typed is untrusted
  wherever it is displayed, including email.
- In development React runs effects twice. A page that consumes a single-use token on load
  must guard against sending it twice.

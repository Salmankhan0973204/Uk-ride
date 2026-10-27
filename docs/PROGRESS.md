# Module progress tracker

Update this file after every coding session.

- **Current module:** Module 3 rework - fleet classes (not started)
- **Last completed:** Module 2 rework - profile like ukride.uk (tag `module-02-v2`)
- **Next step:** 3.8 - the six ukride.uk classes
- **Steps done:** 51 of 113
- **Roadmap:** re-planned on 2026-10-16 to follow the ukride.uk customer flow in three apps
  (backend, customer website, admin panel). See "v2 re-plan" at the end of this file.

A module is **Complete** when every step is done and its flow works end to end in every app it
touches. Modules 0-5 were finished as v1 (tags `module-00` to `module-05`); their new steps
rework them to the ukride.uk flow, and each is tagged `module-NN-v2` when its rework is done.
Do not start two modules at the same time.

Stage values: `Done`, `Rework` (v1 done, new steps open), `In progress`, `-` (not started),
`n/a`.

| #   | Module                       | Steps | Backend | Customer site | Admin panel | Status   |
| --- | ---------------------------- | ----- | ------- | ------------- | ----------- | -------- |
| 0   | Foundation: three apps       | 10/10 | Done    | Done          | Done        | Complete |
| 1   | Auth like ukride.uk          | 13/13 | Done    | Done          | n/a         | Complete |
| 2   | Profile                      | 8/8   | Done    | Done          | n/a         | Complete |
| 3   | Fleet classes                | 7/9   | Rework  | Rework        | Done        | Rework   |
| 4   | Fleet vehicles               | 6/6   | Done    | n/a           | Done        | Complete |
| 5   | Pricing and quotes           | 7/13  | Rework  | Rework        | Rework      | Rework   |
| 6   | Booking                      | 0/6   | -       | -             | -           | -        |
| 7   | Wallet                       | 0/5   | -       | -             | -           | -        |
| 8   | Card payment (Stripe)        | 0/6   | -       | -             | n/a         | -        |
| 9   | Journeys                     | 0/5   | -       | -             | n/a         | -        |
| 10  | Edit and cancel              | 0/5   | -       | -             | -           | -        |
| 11  | Admin operations             | 0/6   | -       | -             | -           | -        |
| 12  | Reviews                      | 0/4   | -       | -             | -           | -        |
| 13  | Notifications                | 0/3   | -       | n/a           | n/a         | -        |
| 14  | Driver API and live status   | 0/3   | -       | -             | n/a         | -        |
| 15  | Admin dashboard and reports  | 0/3   | -       | n/a           | -           | -        |
| 16  | Hardening and tests          | 0/4   | -       | -             | -           | -        |
| 17  | Docker, CI/CD and deployment | 0/4   | -       | -             | -           | -        |

## Steps

Each module is split into small steps. A step teaches one thing and ends with something that
runs.

- Do one step at a time, in order. Backend steps come first and are tested against the running
  API before the screens are built.
- Build the smallest version that works. Extras wait for a later step.
- Tick the step and make a small commit when it works. The module commit and tag come after
  the last step.
- Steps of later modules are a first draft. Adjust them when the module starts.
- Each module is built on its own branch (for example `module-00-three-apps`). Step commits
  go to that branch; the finished module is merged into `main` with `--no-ff` and tagged.

### Module 0 - Foundation: three apps

- [x] 0.1 npm workspace, shared tooling, Docker Compose. _Learn: monorepo layout._
- [x] 0.2 Express app: env validation, logging, request IDs, envelopes, error handling.
      _Learn: middleware order._
- [x] 0.3 Health endpoints with tests. _Learn: Vitest and Supertest._
- [x] 0.4 Next.js shell, design tokens, Badge, Card, Spinner. _Learn: App Router, Tailwind v4._
- [x] 0.5 System status screen. _Learn: TanStack Query basics._
- [x] 0.6 Swagger UI at `/api/v1/docs`. _Learn: OpenAPI documents._
- [x] 0.7 Split into three apps: `customer/` (today's `frontend/`), a new `admin/` and the
      `shared/` package. _Learn: workspace packages shared by two Next.js apps._
- [x] 0.8 Staff sign-in with its own sessions, the admin app shell, the admin screens moved,
      and a fix for two sign-ins refreshing at the same moment.
      _Learn: token audiences, race conditions._
- [x] 0.9 Docs for three apps: `DESIGN.md`, `README.md`, ADR-0002.
- [x] 0.10 Customer site frame: header, footer, mobile tab bar. _Learn: responsive navigation._

### Module 1 - Auth like ukride.uk

- [x] 1.1 PostgreSQL + Prisma, `User` model, first migration, database readiness check.
      _Learn: ORM, schema, migrations._
- [x] 1.2 `POST /auth/register`. _Learn: Zod request validation, password hashing._
- [x] 1.3 `POST /auth/login`. _Learn: JWT access tokens, safe error messages._
- [x] 1.4 Auth middleware and `GET /auth/me`. _Learn: protecting routes._
- [x] 1.5 Refresh token and logout. _Learn: httpOnly cookies, token rotation._
- [x] 1.6 Register page. _Learn: forms, field errors, mutations._
- [x] 1.7 Login page and `useMe()`. _Learn: auth state with TanStack Query._
- [x] 1.8 Protected page, logout button, design pass. _Learn: route guards._
- [x] 1.9 OTP codes: stored hashed, 6 digits, 10 minutes, resend after 60 s, 5 tries,
      per-number limits in Redis, a short-lived signed ticket after verifying. "SMS" goes to
      Mailpit for now. _Learn: one-time codes, Redis counters._
- [x] 1.10 Sign-up like ukride.uk: check the email, code to the mobile, verify, register,
      signed in. Email-link confirmation is retired. _Learn: multi-step flows on the server._
- [x] 1.11 Login with "Remember me": each session keeps its own lifetime (30 days or 1 day);
      signing out in one tab signs out all tabs. _Learn: per-session lifetimes._
- [x] 1.12 Forgot password with a 6-digit code, then a new password, then signed in.
- [x] 1.13 `/login`, `/signup` and `/forgot-password` pages; old addresses redirect.

### Module 2 - Profile

- [x] 2.1 Return the profile from `GET /users/me`. (Name and mobile were added to `User` early,
      with registration, on 2026-10-07.)
      _Learn: changing a schema with a migration._
- [x] 2.2 `PATCH /users/me`. _Learn: partial updates._
- [x] 2.3 Change password endpoint. _Learn: re-checking the current password._
- [x] 2.4 Profile page. _Learn: reading cached data._
- [x] 2.5 Edit profile form. _Learn: updating the cache after a mutation._
- [x] 2.6 Change password form, design pass.
- [x] 2.7 Change the mobile only with a code; the profile edit can no longer change it.
- [x] 2.8 `/profile` page like ukride.uk, replacing `/account`.

### Module 3 - Fleet classes

- [x] 3.1 `VehicleType` model and seed data. _Learn: database seeding._
- [x] 3.2 Public list and detail endpoints. _Learn: public read endpoints._
- [x] 3.3 User roles and an admin-only guard. _Learn: role-based access._
- [x] 3.4 Admin create, update and deactivate endpoints. _Learn: CRUD, soft delete._
- [x] 3.5 Customer catalogue page. _Learn: list queries._
- [x] 3.6 Admin table with create and edit form. _Learn: query invalidation._
- [x] 3.7 Deactivate with confirmation, design pass.
- [ ] 3.8 The six ukride.uk classes (8 Seater, Executive, MPV, Estate, Mercedes S Class,
      Saloon): example models, hand-luggage capacity, an optional image address.
- [ ] 3.9 Fleet section on the home page; `/vehicles` folds into it.

### Module 4 - Fleet vehicles

- [x] 4.1 `Vehicle` model linked to `VehicleType`. _Learn: relations, unique constraints._
- [x] 4.2 Admin CRUD endpoints.
- [x] 4.3 List with pagination, filter and search. _Learn: query parameters, `meta`._
- [x] 4.4 Admin vehicles table with pages. _Learn: paginated queries._
- [x] 4.5 Create and edit form with a vehicle type select. _Learn: dependent data._
- [x] 4.6 Change vehicle status (active, maintenance), design pass.

No new steps: the screens move to the admin app in 0.8, and cars are linked to drivers in 11.2.

### Module 5 - Pricing and quotes

- [x] 5.1 `PricingRule` model per vehicle type. _Learn: money as integer pence._
- [x] 5.2 Admin pricing endpoints.
- [x] 5.3 Quote calculation as a pure function with unit tests.
      _Learn: business logic without HTTP._
- [x] 5.4 `POST /quotes` with the distance typed in by hand.
- [x] 5.5 Night and airport surcharges. _Learn: combining rules, price breakdown._
- [x] 5.6 Admin pricing screen.
- [x] 5.7 Customer quote form with the price breakdown, design pass.
- [ ] 5.8 Address search with suggestions (Photon and postcodes.io).
      _Learn: autocomplete, debouncing._
- [ ] 5.9 Airport detection by postcode: seven airports seeded, editable in the admin app.
- [ ] 5.10 Settings, discounts and `GET /config`: Meet & Greet (£10), booking lead time
      (4 h), edit cut-off (4 h), unpaid expiry (30 min), driver details shown 60 min before
      pick-up, a discount % per class. _Learn: configuration as data._
- [ ] 5.11 Engine v2, unit tested: discount, Meet & Greet per leg, automatic airport fee,
      stops as route waypoints, each leg priced, passenger and luggage fit.
- [ ] 5.12 `POST /quotes` v2, saved with an id and an expiry: every class with original
      price, discount, price, seats, luggage, distance and duration; the first class that fits
      is recommended; the booking rules (4 h ahead, pick-up not the drop-off, return after
      pick-up, at most 5 stops, 8 passengers and 8 bags).
- [ ] 5.13 The "BOOK YOUR JOURNEY" widget on the home page, opening `/booking`; `/quote` is
      retired.

### Module 6 - Booking

- [ ] 6.1 `Booking` model: a reference such as UKR-7F3K9Q, a trip linking outbound and return
      legs, a status and a separate payment status, flight number and Meet & Greet per leg, a
      price snapshot, an expiry and an event history. _Learn: enums, generated codes._
- [ ] 6.2 `POST /bookings` from a saved quote: 1 or 2 pending legs (the return runs the stops
      in reverse); 409 "price changed" if the price moved. _Learn: never trust a client price._
- [ ] 6.3 Guest flow: a code to the phone, then a passwordless account; an existing full
      account must sign in. _Learn: account ownership._
- [ ] 6.4 `/booking` page for guests and signed-in customers, with the stale-quote guard.
- [ ] 6.5 Unpaid-booking expiry job.
- [ ] 6.6 Design pass.

### Module 7 - Wallet

- [ ] 7.1 Wallet ledger and `GET /wallet`. _Learn: a ledger instead of a balance column._
- [ ] 7.2 Wallet split calculator, unit tested: capped at the real balance, card part 0 or at
      least 30p, per-leg whole pence.
- [ ] 7.3 Pay fully from the wallet, then `/thank-you`. _Learn: transactions and row locks._
- [ ] 7.4 `/wallet` page: search, 5 per page, newest first.
- [ ] 7.5 Admin credit with a reason, recorded.

### Module 8 - Card payment (Stripe)

- [ ] 8.1 Stripe test setup and the `Payment` model. _Learn: test mode keys._
- [ ] 8.2 Checkout Session for card, or wallet plus card with the wallet share held; the total
      comes from the database; card part 30p to £9,999.99.
- [ ] 8.3 Webhook: signed, safe to repeat, one transaction confirms every leg; frees the hold
      on expiry; refunds a payment that arrives late. _Learn: signatures, idempotency._
- [ ] 8.4 `/thank-you` page: retry, "payment not completed", pay later.
- [ ] 8.5 Guest "Set a password".
- [ ] 8.6 Receipt email, design pass.

### Module 9 - Journeys

- [ ] 9.1 `GET /bookings` and `GET /bookings/:reference`, owner only.
      _Learn: ownership checks._
- [ ] 9.2 `/journeys` with actions per status: unpaid Pay Now or Cancel; paid and not started
      Edit or Cancel.
- [ ] 9.3 `/journeys/[reference]`: route, timeline, price breakdown.
- [ ] 9.4 Pay Now dialog (wallet and card).
- [ ] 9.5 Design pass.

### Module 10 - Edit and cancel

- [ ] 10.1 Cancellation policy tiers and calculator, unit tested.
      _Learn: state machines, policies as data._
- [ ] 10.2 Cancel unpaid, with a reason (10-250 characters).
- [ ] 10.3 Cancel paid: preview of refund, driver payment and amount kept, then confirm; the
      refund goes to the wallet.
- [ ] 10.4 Edit at least 4 h before pick-up: new quote, the difference, then a refund to the
      wallet or payment first (the webhook applies the change).
- [ ] 10.5 Edit and cancel screens, design pass.

### Module 11 - Admin operations

- [ ] 11.1 Bookings list and detail. _Learn: dense desktop screens._
- [ ] 11.2 Drivers (PCO licence, status, linked car) and staff accounts (dispatcher access).
- [ ] 11.3 Assign a driver and car. _Learn: conflict checks._
- [ ] 11.4 Status lifecycle for the driver: accepted, on route, arrived, on board, completed,
      no-show.
- [ ] 11.5 The driver card on the customer's journey from 1 h before pick-up.
- [ ] 11.6 Customers and the settings screen.

### Module 12 - Reviews

- [ ] 12.1 `Review` model and API: one per finished journey, 1-5 stars and a comment; the
      driver's average rating. _Learn: aggregate queries._
- [ ] 12.2 Rate a journey on `/journeys/[reference]`.
- [ ] 12.3 `/reviews` page of our own customers' reviews, with the average.
- [ ] 12.4 Admin: hide or show a review.

### Module 13 - Notifications

- [ ] 13.1 Emails for booked, paid, changed, cancelled with refund, driver assigned.
- [ ] 13.2 Development SMS for the same events.
- [ ] 13.3 Redis + BullMQ queue and worker. _Learn: background jobs, retries._

### Module 14 - Driver API and live status

- [ ] 14.1 Driver sign-in and jobs API.
- [ ] 14.2 Status updates from the driver API.
- [ ] 14.3 Live status on the journey page. _Learn: server-sent events._

### Module 15 - Admin dashboard and reports

- [ ] 15.1 Dashboard. _Learn: counting and grouping._
- [ ] 15.2 CSV export.
- [ ] 15.3 Audit log.

### Module 16 - Hardening and tests

- [ ] 16.1 Redis rate limits everywhere.
- [ ] 16.2 Security headers.
- [ ] 16.3 Tests for the money flows.
- [ ] 16.4 Monitoring and backups.

### Module 17 - Docker, CI/CD and deployment

- [ ] 17.1 Dockerfiles for the three apps. _Learn: multi-stage builds._
- [ ] 17.2 Production Compose file.
- [ ] 17.3 CI: lint, typecheck, test, build.
- [ ] 17.4 Deploy: domains and an API proxy, the Stripe live webhook, real SMS or email codes.

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

#### Follow-up 7 - Design review and `DESIGN.md`

Done

- An independent reviewer (the Impeccable finish reviewer, which never saw the build
  conversation) judged all 22 screens and states against `PRODUCT.md`. Its first verdict was
  "fix", with eight findings. All eight were fixed in one batch and scored "resolved" on the
  recaptures; the final verdict was "ship". That verdict covers the eight fixes, not a fresh
  review of every screen.
- `DESIGN.md` now records the design system as built: tokens, the shared classes, the
  components and the rules. `PRODUCT.md` says what the product is; `DESIGN.md` says how it
  looks.

What the review changed

- Backdrop: colour pools are sized to the viewport and use indigo and violet only, over an
  indigo-to-violet wash. Before, a desktop showed near-black with tinted corners, and a phone
  was flooded with bright violet.
- Contrast: every glass panel has a dark scrim under its fill. Muted text on a phone went from
  between 2.9:1 and 4.2:1 to between 5.8:1 and 8.4:1. The rule is 4.5:1.
- One accent button per page: the navigation's Sign up became a glass pill.
- No glass card inside a glass card: the journey stages and the detail lists are divider rows.
- Depth is an offset soft shadow, not a glow. The brand mark is a drawn "U".
- The headline is two set lines on a desktop. A button label that wrapped on a phone was
  shortened, and buttons now centre a label that wraps.

Open items

- On the sign-in page the active "Sign in" pill and the glass "Sign up" pill look alike. The
  reviewer called it visual only; the current page is still marked for assistive technology.
- The reviewer's "ceiling" notes were not all taken up: grain on the backdrop to stop banding,
  depth tiers between nav, panels and controls, and a motion moment for the open stage.
- The HTML emails are plain and use a system font on purpose. They are outside the web design
  system.

Learning notes

- A reviewer with no memory of the build sees what the builder has stopped seeing. The mobile
  contrast failure was measured from the screenshots, not noticed by eye.
- Check the evidence before the verdict: an earlier review was sent two screenshots that did
  not show what their names said, and the reviewer rightly refused to judge from them.
- Size a backdrop in viewport units. Sized in fixed units, the same gradient is a void on a
  wide screen and a flood on a narrow one.

#### Follow-up 8 - Tag `module-00` on GitHub

Done

- The `module-00` tag is now on GitHub, beside `module-01`.
- The local tag pointed at a duplicate of the module-00 commit that was not on `main`: same
  author, same files, same parent, a different id, most likely left by an amended commit. The
  tag was moved to the matching commit on `main` (`a8b0608`) before it was left on GitHub.

Learning notes

- A tag is a name for one exact commit. Amending or rebasing makes new commits with new ids,
  and a tag made before that keeps pointing at the old one.
- `git branch -r --contains <tag>` shows whether a tag's commit is on any pushed branch. An
  empty answer means the tag points at something the branches do not have.

### Module 1 follow-ups: summary

All eight gaps are closed. Module 1 now has: rate limits on every auth route; logout that
takes effect at once; a sweep for expired tokens; 29 integration tests against a real database
beside 73 unit tests; mobile numbers checked against real numbering plans; email confirmation
and password reset through Mailpit; an independent design review with its fixes, and a
`DESIGN.md`; and both module tags on GitHub.

Still open, by choice or by the free-tools rule

- Proving a mobile number belongs to the person needs SMS, which costs money.
- Real email delivery needs a provider and a sending domain. That belongs with deployment.
- Rate-limit counts and the clean-up timer live in the API process. Redis and the queue
  (Module 11) are the place for both.
- Nothing runs the tests automatically yet. Continuous integration is step 17.4.

### Module 2 - Profile Management (completed 2026-10-09)

#### Step 2.1 - `GET /users/me` (done 2026-10-09)

Built

- A `users` module in `backend/src/modules/users/`, laid out like `auth`: routes, controller,
  service.
- `GET /api/v1/users/me` returns the signed-in user's profile: the same safe fields as sign-in,
  plus `updatedAt`. Every route under `/users` requires a signed-in user.
- `users.select.ts` holds the two lists of columns that may leave the server. The auth module
  now imports its list from there instead of keeping a copy.

Verified

- Typecheck and lint pass. No automated tests were written: the local test files were removed
  on 2026-10-09, so steps are checked by hand against the running API.
- Against the running API and the real database: a valid token returned 200 with the profile,
  `Cache-Control: no-store`, and no password hash; no token and a bad token returned 401;
  `GET /auth/me` still works.

Open items

- The test on GitHub that lists every API path does not know about `/users/me`, so it no
  longer matches the code. Nothing runs it.
- The API's watch mode did not reload after these files changed and had to be restarted by
  hand. If an endpoint answers 404 right after you add it, restart `npm run dev:api`.

Learning notes

- `/auth/me` answers "who is signed in". `/users/me` is the profile as a thing you can read
  and change. Same data today, different jobs.
- "me" in the address means the id comes from the token, never from the request. Nobody can
  ask for someone else's profile by changing a number in the URL.
- One list of safe columns, shared by every query, is how the password hash stays private.

#### Step 2.2 - `PATCH /users/me` (done 2026-10-09)

Built

- `PATCH /api/v1/users/me` changes `firstName`, `lastName`, `mobile` and `gender`. Send only
  the fields to change; the rest are left alone. `gender: null` clears it.
- The rules for each field are the ones from registration, imported from `auth.schemas.ts`,
  not copied.
- Any other field is refused with 400, so a request cannot change `email` or reach
  `passwordHash`. An empty body is 400 "Nothing to update".
- A mobile number that belongs to another account answers 409 with `details.field: "mobile"`.
- The `validate` middleware now puts a whole-body problem in the error message, since it has
  no field to sit under.

Verified

- Typecheck and lint pass. Checked by hand against the running API and the real database:
  - changing the first name changed only that field and `updatedAt`;
  - `null` cleared gender; two fields at once worked, with the mobile typed loosely
    (`0044 (7400) 999-804`) stored as `+447400999804`;
  - an empty body, no body, `email` and `passwordHash` each returned 400 with a clear message;
  - a bad name, a landline and an unknown gender returned 400 under the right field;
  - another account's mobile returned 409; sending your own current mobile returned 200;
  - no token returned 401; the email in the database was unchanged throughout.

Open items

- The email address cannot be changed. Doing that safely means confirming the new address
  before switching, which is its own piece of work.
- Changing the mobile number does not prove the new one is yours (no SMS).

Learning notes

- PUT replaces a whole resource; PATCH changes part of it. A profile form that edits a few
  fields is a PATCH.
- "Not sent" and `null` are different. Not sent means leave it; `null` means clear it. The
  schema uses `.optional()` for the first and `.nullable()` for the second.
- By default a schema silently drops fields it does not know. A strict schema refuses them.
  For an update endpoint, refusing is safer and tells the client the truth.
- Never build an update from the raw request body. Validate first, then pass only what the
  schema allowed. That one habit prevents "mass assignment", where a client sets a column it
  was never meant to touch.

#### Step 2.3 - Change password, and a session fix found on the way (done 2026-10-09)

Built

- `POST /api/v1/users/me/password` takes `currentPassword` and `newPassword`. It checks the
  current password against the stored hash, refuses a new password equal to the old one,
  saves the new hash, and signs out every other device. The device making the request stays
  signed in.
- A wrong current password answers 400 under `details.currentPassword`, not 401. The session
  is valid; it is the form that is wrong.
- Wrong attempts are limited to 10 per 15 minutes.
- `backend/src/shared/passwords.ts` now holds password hashing and checking for the whole API.
  Registration, sign-in, password reset and password change all use it.

A flaw from Module 1, found and fixed here

- After a password change, the signed-out phone asked for a refresh with its cancelled token.
  The server read that as a stolen token being replayed and ended every session, including
  the laptop that had just changed the password.
- Cause: "this token was exchanged for a newer one" and "this session was signed out" were
  stored the same way, as `revoked_at`.
- Fix: they are now different. A token that was exchanged stays in the table, marked used, as
  the evidence for spotting a replay. A session that is signed out (logout, password change,
  password reset) has its tokens deleted. A browser still holding one is told "sign in again"
  and nothing else happens.

Verified

- Typecheck and lint pass. Checked by hand against the running API and the real database:
  - a wrong current password, a new password equal to the old one, a short one, missing
    fields and an extra field each returned 400 with a clear message, and the old password
    still worked afterwards;
  - after a successful change, the laptop's access token and refresh kept working, the
    phone's returned 401, the old password failed to sign in and the new one worked;
  - the phone retrying its refresh twice left the laptop signed in;
  - a real replay of an exchanged token still ended every session;
  - logout left no token rows for that session;
  - a password reset from the emailed link ended the existing session.

Open items

- The session tests on GitHub expect a signed-out token to be marked, not deleted. They no
  longer match the code. Nothing runs them.
- A stolen refresh token used by a thief after the owner has signed out is now answered with
  a plain 401 and leaves no trace. The token is useless by then, so nothing is lost.

Learning notes

- Asking for the current password again protects against the unlocked-laptop case. A valid
  session proves someone is at the keyboard, not who.
- 401 means "I do not know who you are". 400 means "I know you, and this request is wrong".
  Returning 401 for a wrong current password would have made the web app try to refresh the
  session and then sign the person out.
- One column meaning two things is a bug waiting for the right sequence of events. This one
  needed two devices and a password change to show itself, which is why checking the real
  flow end to end matters.

#### Steps 2.4, 2.5 and 2.6 - Profile page, edit form, change password form (done 2026-10-09)

Built

- `/account` is the profile page. It makes no request of its own: it shows the user already
  in the `useMe()` cache, and offers Edit profile, Change password and Sign out.
- `/account/edit`: first name, last name, mobile number and gender, starting from the current
  values. It sends only the fields that changed, and nothing at all when nothing changed. The
  email is shown, not editable.
- `/account/password`: current password and new password, each with Show / Hide.
- `useUpdateProfile()` writes the user the API returns straight into the `auth.me` cache, so
  the name in the navigation and the profile page update at once.
- Shared pieces: `AccountGate` (the guard for every signed-in page), `PasswordInput`, the
  form checks in `features/auth/validation.ts`.

Verified

- Lint, typecheck and the production build (11 routes) pass. No automated tests were written.
- Driven in a real browser against the running API and the real database:
  - signed out, `/account/edit` and `/account/password` redirect to `/login`;
  - the edit form opened with the current values; a bad name was caught in the browser;
    another account's mobile and a landline were refused by the API, each on the mobile field;
  - changing the first name and gender returned to the profile with "Your profile has been
    updated", and the navigation showed the new name without a reload;
  - saving with nothing changed went straight back to the profile;
  - on the password form, empty fields, a new password equal to the current one and a wrong
    current password each showed the right message; the wrong one cleared the field;
  - a successful change returned to the profile, the page was still signed in after a reload,
    the old password then failed to sign in and the new one worked.
- No horizontal scrolling at 1440px, 390px and 360px.

Design pass (step 2.6)

- A manual pass against `DESIGN.md`: one accent button per page, divider rows, glass controls,
  the shared dropdown, 44px targets, three widths.
- Fixed: a one-word last line in the edit page's intro, and the navigation not highlighting
  the account link on the edit and password pages.
- `DESIGN.md` gained the success notice, the shared password field and the navigation rule.
- The independent finish review was not run for these three screens.

Open items

- The email address cannot be changed yet.
- The older forms (register, sign in, reset password) still carry their own copy of the
  Show / Hide button. Only the new form uses `PasswordInput`.
- "Your profile has been updated" stays on screen while `?done=profile` is in the address,
  so reloading that address shows it again.

Learning notes

- Reading from the cache: a page does not have to fetch what the app already knows. The
  profile page shows `useMe()`'s data and is instant.
- After a mutation, either invalidate the query (ask again) or write the answer into the
  cache (already have it). When the API returns the updated record, writing it is one fewer
  request and no flash of old data.
- A form's starting values are read once. If they kept following the cache, saving would
  overwrite what the person was typing.
- React forbids changing a ref while rendering. The guard's "I am leaving on purpose" flag
  became state for that reason.

### Module 2 summary

Built: `GET /users/me`, `PATCH /users/me`, `POST /users/me/password`; the profile page, the
edit form and the change password form. Along the way a Module 1 flaw was fixed: a signed-out
device retrying its refresh no longer ends the other sessions.

Checks at completion: typecheck and lint pass for both apps, the frontend builds, and every
endpoint and screen was checked by hand against the running system. There are no automated
tests in the local code.

### Module 3 - Vehicle Types (completed 2026-10-09)

#### Step 3.1 - `VehicleType` model and seed data (done 2026-10-09)

Built

- `VehicleType` in `backend/prisma/schema.prisma` (table `vehicle_types`): `slug` (unique),
  `name`, `description`, `passengers`, `suitcases`, `sortOrder`, `isActive`, timestamps.
  Migration `add_vehicle_types`.
- `backend/src/db/seed.ts`, run with `npm run db:seed -w backend` (also wired to
  `prisma db seed` in `prisma.config.ts`). It adds five placeholder classes: Saloon, Estate,
  Executive, People carrier, Minibus.
- No prices on a vehicle type. Fares belong to the pricing rules of Module 5.

Verified

- The migration applied; typecheck and lint pass.
- The seed created 5 rows on the first run and 0 on the second, and the rows were read back
  from PostgreSQL in list order.

Learning notes

- Seed data is the data an app needs before anyone has used it. It lives in code, so every
  developer and every fresh database gets the same starting point.
- A seed must be safe to run twice. This one matches rows on `slug` and only creates the
  missing ones, so it never overwrites what an admin changed later.
- A slug is a stable, readable key (`executive`). The id stays the real key; the slug is for
  addresses and for code that needs to name one row.
- `isActive` is a soft delete: a type is switched off, not removed, because old bookings will
  still point at it.

#### Step 3.2 - Public list and detail endpoints (done 2026-10-09)

Built

- `backend/src/modules/vehicle-types/`: select, service, controller, routes; mounted at
  `/api/v1/vehicle-types`.
- `GET /vehicle-types`: the active types in list order, with `meta.count`.
- `GET /vehicle-types/:slug`: one active type. The slug is matched in lower case.
- Neither needs a token. The answer leaves out `isActive`, `sortOrder` and the timestamps.
- Swagger, `README.md`, `docs/api-tests/curl.md` and two Bruno requests.

Verified (by hand against the running API; no automated tests)

- The list answered 200 with five types in order and only the six public fields.
- `/vehicle-types/executive` and `/vehicle-types/EXECUTIVE` answered 200; `/vehicle-types/limo`
  answered 404 in the standard error envelope.
- With one type switched off in the database, the list held four and its detail address
  answered 404. It was switched back on afterwards.

Learning notes

- A public endpoint is simply a route with no `requireAuth` in front of it. What makes it
  safe is the `select`: it returns only what a stranger may see.
- A list answer goes in a named key (`data.vehicleTypes`), never a bare array, so fields can be
  added later without breaking clients. The count goes in `meta`.
- "Switched off" and "never existed" give the same 404, so the answer does not reveal what is
  kept in the back office.
- The address uses the slug, not the id: `/vehicle-types/executive` can be read and shared.

#### Step 3.3 - User roles and an admin-only guard (done 2026-10-09)

Built

- `Role` enum (`CUSTOMER`, `DRIVER`, `DISPATCHER`, `ADMIN`) and `User.role`, default
  `CUSTOMER`. Migration `add_user_role`. The role is now part of the user the API returns.
- `requireRole(...roles)` in `backend/src/middleware/requireRole.ts`, and
  `AppError.forbidden()` (403).
- The first guarded route: `GET /admin/vehicle-types`, every type including switched-off
  ones, with `sortOrder`, `isActive` and the timestamps.
- `npm run db:set-role -w backend -- <email> <ROLE>` to give an account a role. There is no
  screen for it: the first admin cannot be made by an admin.

Verified (by hand against the running API; no automated tests)

- No token: 401. A customer's token: 403. An admin's token: 200 with all five types.
- The same access token went from 403 to 200 after the account was made an admin, and back
  to 403 after it was demoted, with no new sign-in.
- `PATCH /users/me` with `{"role":"ADMIN"}` answered 400, and registering with a `role` field
  created a `CUSTOMER`. A person cannot give themselves a role.
- `db:set-role` refused an unknown email and an unknown role.

Learning notes

- 401 and 403 are different answers. 401: we do not know who you are, sign in. 403: we know
  who you are, and this is not yours to do.
- Authentication (who) comes before authorisation (may they). `requireAuth` then
  `requireRole`, in that order.
- The role is read from the database on each request instead of being put in the token. A
  token cannot be taken back for 15 minutes; a database row can be changed now.
- A role is never accepted from a request body. It is changed only from the server side.

Open items

- The tests on GitHub that compare the returned user field by field do not know about `role`.

#### Step 3.4 - Admin create, update and deactivate endpoints (done 2026-10-09)

Built

- `POST /admin/vehicle-types`: 201 with a `Location` header. The slug is made from the name
  when it is left out; the sort order defaults to the end of the list.
- `PATCH /admin/vehicle-types/:id`: a partial update of name, description, passengers,
  suitcases, sort order and `isActive`. The slug cannot be changed.
- `DELETE /admin/vehicle-types/:id`: sets `isActive` to false and keeps the row.
- Rules in `vehicle-types.schemas.ts`: passengers 1 to 8, suitcases 0 to 20, whole numbers
  only, unknown fields refused.

Verified (by hand against the running API; no automated tests)

- Create answered 201 with slug `luxury-mpv-7-seats` made from "Luxury MPV (7 seats)" and
  sort order 60, after the seeded five.
- A taken slug answered 409 on `slug`. Bad values answered 400 with one message per field:
  empty name, a slug with spaces, `"4"` as text, `-1`, 9 passengers. An unknown field (`price`)
  and an empty PATCH answered 400.
- PATCH changed only the field sent. An unknown id answered 404 for PATCH and DELETE.
- After DELETE the public list held 5 and the public detail answered 404, while the admin
  list held 6. A second DELETE answered 200. `{"isActive":true}` brought it back.
- A customer's token answered 403. The test row was deleted afterwards.

Learning notes

- CRUD maps onto HTTP: POST creates (201), GET reads, PATCH changes part, DELETE removes.
- A soft delete marks a row instead of removing it. Use it when other rows will point at
  this one: a booking must still be able to say which vehicle type it was for.
- DELETE is idempotent: calling it twice leaves the same result as calling it once.
- The slug is fixed at creation because it is an address. Names can change; addresses that
  people have saved should not.
- JSON has real numbers, so `"4"` is refused rather than converted. The form in step 3.6
  will have to turn its text inputs into numbers before sending.

#### Step 3.5 - Customer catalogue page (done 2026-10-09)

Built

- `/vehicles`: the public catalogue. One glass panel; each vehicle type is a divider row with
  its name, description, passengers and suitcases. No prices: none exist yet.
- `frontend/src/features/vehicle-types/`: `types.ts`, `api/vehicle-types.api.ts`,
  `hooks/useVehicleTypes.ts`, `components/VehicleCatalogue.tsx`.
- Loading, error (with Try again) and empty states.
- A "Vehicles" link in the navigation (hidden on phones) and a "See the vehicles" button on
  the home page. `User` in the web app now carries `role`.

Verified

- Typecheck and lint pass.
- In a real browser against the running API: five rows in list order, "4 passengers" and
  "2 suitcases" on the first, the navigation link marked current, the home button leading to
  the page. No horizontal scrolling at 1440px, 390px and 360px.

Learning notes

- A list query is `useQuery` whose data is an array. `select` unwraps the envelope so the
  component receives the array itself.
- `staleTime` says how long an answer counts as fresh. A catalogue changes rarely, so one
  minute saves a request on every visit to the page.
- A public page uses `apiFetch`. `authFetch` is for requests that need the access token.
- A list has four states to design, not one: loading, error, empty, and filled.

#### Step 3.6 - Admin table with create and edit form (done 2026-10-09)

Built

- `/admin/vehicle-types`: a table of every type with name, slug, passengers, suitcases,
  position and status. On narrow screens the columns fold into the first cell.
- `/admin/vehicle-types/new` and `/admin/vehicle-types/[id]/edit`: one form component for
  both. Editing sends only the fields that changed; the slug is shown and cannot be changed.
- `AdminGate`: signed-out visitors go to sign-in; a signed-in customer sees "This page is
  for staff".
- `useAdminVehicleTypes`, `useCreateVehicleType`, `useUpdateVehicleType`. Both mutations
  invalidate `vehicleTypes.all`, which refreshes the admin table and the public catalogue.
- An admin sees a "Manage vehicle types" link on the account page. A customer does not.

Verified

- Typecheck and lint pass.
- In a real browser against the running API:
  - signed out, the page redirected to `/login`; a customer saw "This page is for staff" on
    the table and on the form, and had no admin link;
  - an empty form showed four messages and focused the name; a bad slug, 9 passengers and
    "two" suitcases were each caught in the browser;
  - a slug that exists was refused by the API and shown on the slug field;
  - adding "Luxury MPV" with no slug returned to the table with "The vehicle type has been
    added", the new row last, slug `luxury-mpv`;
  - the edit form opened with the current values; changing the name and position moved the
    row, and the public catalogue showed the same change without reloading the app;
  - saving with nothing changed went straight back; an unknown id said so.
- No horizontal scrolling at 1440px, 820px, 390px and 360px.

Learning notes

- Invalidation is the other way to keep the cache right after a mutation: mark the queries
  stale and let them ask again. Module 2 wrote the answer into the cache instead. Write when
  one record changed and you hold it; invalidate when a change can reorder, add or hide rows.
- Query keys form a tree. Invalidating `['vehicleTypes']` reaches `['vehicleTypes','list']`
  and `['vehicleTypes','admin']` in one call.
- Returning the invalidation promise from `onSuccess` keeps the mutation pending until the
  fresh list has arrived, so the table is already right when the form sends you back.
- Form inputs hold text. The form converts to numbers before sending, because the API
  refuses `"4"`.
- One form component serves both adding and editing: with a record it starts filled and
  sends a PATCH of the differences, without one it starts empty and sends a POST.

#### Step 3.7 - Deactivate with confirmation, design pass (done 2026-10-09)

Built

- "Switch off" on each row of the admin table. It opens a question under the row: "Switch
  off Executive? Customers will no longer see it. You can switch it back on at any time."
  "Yes, switch it off" sends `DELETE /admin/vehicle-types/:id`; "Keep it on" or Escape closes
  the question and nothing is sent.
- "Switch on" on a row that is switched off. It sends `PATCH` with `isActive: true` and asks
  nothing first, because it harms nobody.
- Keyboard focus moves into the question when it opens, back to the button on cancel, and to
  the opposite button after the change.
- `useDeactivateVehicleType()`, which invalidates the same lists as the other two mutations.

Verified

- Lint, typecheck and the production build (16 routes) pass. No automated tests were written.
- In a real browser against the running API:
  - opening the question changed nothing: the type was still in the public list;
  - "Keep it on" and Escape each closed it and returned focus to "Switch off";
  - "Yes, switch it off" changed the row's status to "Switched off", removed the type from
    `GET /vehicle-types` and from the `/vehicles` page without reloading the app, and left
    focus on "Switch on";
  - "Switch on" brought it back, and the question did not reappear.
- No horizontal scrolling at 1440px, 390px and 360px, with the question open.

Design pass

- A manual pass over `/vehicles`, the admin table and the form against `DESIGN.md`: one
  accent button per page, divider rows, no glass inside glass, 44px targets, status as words.
  The Impeccable scanner reported nothing on the new files.
- Fixed: the text area's padding (the shared `.control` rule overrode the utility class), a
  long closing note on the catalogue, and the row summary on a phone breaking mid-phrase.
- The confirmation reuses the warning notice with two compact glass buttons, so the page
  keeps its single accent button.
- `DESIGN.md` gained the table, the confirmation notice, the text area and the navigation
  change.
- The independent finish review was not run for these screens.

Learning notes

- Confirm before an action whose effect other people will see. Do not confirm an action
  that is harmless: a question on every click teaches people to stop reading questions.
- The confirm button says what it does ("Yes, switch it off"), not "OK".
- A confirmation that opens in place needs its focus managed by hand: into it on open, back
  out on close. A screen reader user is otherwise left where the button used to be.
- All three mutations share one `invalidateQueries` call. Because the public and admin lists
  sit under the same key, the customer's page is corrected by an admin's action in the same
  browser with no extra code.

### Module 3 summary

Built: the `VehicleType` model with seed data; public `GET /vehicle-types` and
`GET /vehicle-types/:slug`; user roles, `requireRole` and `db:set-role`; admin list, create,
update and switch-off endpoints; the `/vehicles` catalogue; the admin table, form and
confirmation.

Checks at completion: typecheck and lint pass for both apps, the frontend builds, and every
endpoint and screen was checked by hand against the running system. There are no automated
tests in the local code.

Open items

- No detail page for one vehicle type. `GET /vehicle-types/:slug` exists and nothing in the
  web app uses it yet.
- No screen for giving someone a role. It is done with `npm run db:set-role`.
- A vehicle type can never be deleted, only switched off. That is on purpose, and it means a
  type created by mistake stays in the admin table.
- The admin area has one screen and no navigation of its own. The way in is the link on an
  admin's account page.
- The web app's `User` type and the API now include `role`; the tests on GitHub do not know
  about it, nor about any Module 3 endpoint.
- The seeded vehicle types are placeholders, not a real fleet. There are no photographs.

### Module 4 - Fleet Vehicles (completed 2026-10-14)

#### Step 4.1 - `Vehicle` model linked to `VehicleType` (done 2026-10-14)

Built

- `Vehicle` in `backend/prisma/schema.prisma` (table `vehicles`): `registration` (unique),
  `make`, `model`, `colour`, `year`, `status`, `vehicleTypeId`, timestamps.
  Migration `add_vehicles`.
- `VehicleStatus` enum: `ACTIVE` (can be given jobs), `MAINTENANCE` (in the garage for now),
  `RETIRED` (left the fleet, kept for history).
- The relation: one vehicle type has many vehicles (`VehicleType.vehicles`), each vehicle has
  exactly one type. The foreign key uses `onDelete: Restrict`.
- Indexes on `vehicle_type_id` and `status`, the two columns the admin list will filter by.
- No seed data for vehicles: the operator has no real fleet yet.

Verified (directly in PostgreSQL; no automated tests)

- A vehicle linked to "Executive" was inserted and read back joined to its type.
- A second car with the same plate was refused by `vehicles_registration_key`.
- A vehicle with a type id that does not exist was refused by the foreign key.
- Deleting a vehicle type that still had a car was refused (`RESTRICT`).
- The test row was deleted.

Learning notes

- A relation is a column that holds another row's id (`vehicle_type_id`) plus a foreign key
  that makes the database check it. Prisma adds the fields on both sides (`vehicle.vehicleType`
  and `vehicleType.vehicles`) so queries can follow it either way.
- One-to-many: the "many" side holds the id. A vehicle names its type; the type does not list
  its vehicles in a column.
- `onDelete` decides what happens to the cars when their type is deleted: `Cascade` deletes
  them too, `SetNull` empties the link, `Restrict` refuses. Cars must never vanish with a
  type, so `Restrict`.
- A unique constraint is the only reliable guard against duplicates. Checking first in code
  can still lose a race between two requests; the database cannot.
- An index makes filtering by a column fast. Unique columns get one automatically; foreign
  keys in PostgreSQL do not, so it is added by hand.

#### Step 4.2 - Admin CRUD endpoints (done 2026-10-14)

Built

- `backend/src/modules/vehicles/`: select, schemas, service, controller, routes; mounted at
  `/api/v1/admin/vehicles` behind `requireAuth` and `requireRole('ADMIN')`.
- `POST /admin/vehicles` (201 with a `Location` header), `GET /admin/vehicles/:id`,
  `PATCH /admin/vehicles/:id`.
- Every answer includes the vehicle's type (`id`, `slug`, `name`, `isActive`), selected
  through the relation in the same query.
- The registration is cleaned before it is stored: spaces removed, capitals.
- A new vehicle, or a vehicle moved to another type, needs a type that is on offer. A vehicle
  keeps its type if that type is switched off later.
- No DELETE: a vehicle leaves the fleet by being retired in step 4.6. Status cannot be sent
  to the add or change endpoints.

Verified (by hand against the running API; no automated tests)

- A customer's token answered 403.
- Adding " ab12 cde " answered 201 with `AB12CDE`, status `ACTIVE` and the type "Executive".
  Adding "AB12CDE" again answered 409 on `registration`.
- One request with a one-letter plate, an empty make, the year 2031 and a malformed type id
  answered 400 with a message for each of the four fields.
- A type id that does not exist, and a type that was switched off, answered 400 on
  `vehicleTypeId`. Sending `status` answered 400.
- GET answered 200 with the type, and 404 for an unknown id. PATCH changed the colour and
  type, and stored "cd34 efg" as `CD34EFG`; an empty PATCH answered 400.
- After the vehicle's own type was switched off, changing its colour still worked.

Learning notes

- Data is cleaned before it reaches the unique index. If "AB12 CDE" and "AB12CDE" were stored
  as written, the database would see two different plates.
- A Zod `transform` followed by `pipe` cleans first, then checks the cleaned value.
- A `select` can follow a relation (`vehicleType: { select: {...} }`). Prisma fetches both in
  one go, so a list never makes one extra query per row.
- The database's refusals have codes: `P2002` unique, `P2003` foreign key, `P2025` no such
  row. Each becomes an answer that names the field to fix.
- Not every resource needs DELETE. When other records will point at a row, a status that
  says "no longer in use" is safer than removing it.

#### Step 4.3 - List with pagination, filter and search (done 2026-10-14)

Built

- `GET /admin/vehicles?page=&pageSize=&status=&type=&search=`. Every part is optional:
  page 1 and 20 per page by default, at most 100 per page.
- `status` filters by `ACTIVE`, `MAINTENANCE` or `RETIRED`; `type` by a vehicle type's slug;
  `search` looks in the registration (spaces and case ignored), make, model and colour.
  Filters combine.
- `meta`: `page`, `pageSize`, `total` (rows matching the filters), `totalPages`.
- `validateQuery()` and `validQuery()` in `backend/src/middleware/validate.ts`: the query
  string is checked by a Zod schema like a body, and unknown names are refused.

Verified (by hand against the running API, with 25 vehicles; no automated tests)

- No query: page 1 of 2, 20 rows sorted by registration, `total` 25. Page 2 held the last 5.
  `pageSize=10&page=3` held the last 5 of 3 pages.
- `status=MAINTENANCE` found the 3 cars in maintenance, `status=RETIRED` the 1 retired;
  `type=mpv` the 8 people carriers; `type=MPV&status=ACTIVE&pageSize=5` 7 rows on 2 pages.
- `search=ts05 abc` found `TS05ABC`; `search=skoda` found 6; combined with `type=mpv`, 2.
  A search with no match answered `total` 0. `?search=&status=` counted as no filter.
- `page=0`, `pageSize=500`, `page=two`, `status=broken` and the typo `statu=` each answered
  400 with the reason. `page=99` answered 200 with no rows and `totalPages` 2.
- A customer's token answered 403.

Learning notes

- Pagination is `skip` and `take`: page 3 of 10 per page skips 20 rows and takes 10.
- The client cannot draw "page 2 of 5" from the rows alone, so the totals go in `meta`. A
  count and a page with the same `where`, in one transaction, keep the two in agreement.
- A paginated list needs a fixed `orderBy`. Without one, the database may return rows in a
  different order each time, and a row could appear on two pages or on none.
- Query string values are always text. `z.coerce.number()` turns "2" into 2; an empty value
  is treated as "not sent" so an empty search box does not filter.
- Filters are built by adding pieces to one `where` object. A filter that was not sent adds
  nothing.

#### Step 4.4 - Admin vehicles table with pages (done 2026-10-14)

Built

- `/admin/vehicles`: the fleet as a table (registration, vehicle, type, status), 20 rows a
  page, with "21 to 25 of 25 vehicles, page 2 of 2" and Previous / Next links.
- A search box, a status dropdown and a vehicle type dropdown. Every filter and the page
  number live in the address (`?page=2&status=MAINTENANCE&type=mpv&search=skoda`).
- Designed states: loading, error, no vehicles yet, no match (with "Clear the filters"), and
  a page past the end (with "Go to the last page").
- `useVehicles(query)` with `placeholderData: keepPreviousData`: the current page stays on
  screen, faded and marked busy, while the next one loads.
- `authFetchWithMeta()` in `frontend/src/lib/api/client.ts` returns `meta` beside `data`;
  `authFetch()` and `apiFetch()` are unchanged for their callers.
- An admin area: `app/admin/layout.tsx` runs the admin check once for every page under
  `/admin` and shows an "Admin" menu (Vehicles, Vehicle types). The vehicle type pages no
  longer guard themselves. `/admin` opens the fleet. The account page's link now reads
  "Open the admin area".

Verified

- Typecheck and lint pass.
- In a real browser against the running API, with 25 test vehicles:
  - signed out, the page redirected to `/login`; a customer saw "This page is for staff" and
    no admin menu;
  - the account page link opened `/admin/vehicles`; `/admin` redirected there;
  - Next went to `?page=2` with the last 5 rows, Previous came back;
  - choosing "In maintenance" on page 2 went to `?status=MAINTENANCE` (page 1) with 3 rows;
    adding "People carrier" narrowed it to 1; clearing the status left the type filter;
  - searching "ts05 abc" found `TS05 ABC`, "skoda" found 6, a nonsense search showed
    "No vehicles match these filters", and "Clear the filters" emptied the box;
  - the browser's back button undid a filter;
  - `?page=9` said there is no page 9 and offered the last page;
  - the vehicle types page still worked inside the admin layout.
- No horizontal scrolling at 1440px, 820px, 390px and 360px.
- Fixed in passing: the search label sat lower than the two dropdown labels.

Learning notes

- The query object is part of the query key, so each page and filter is cached on its own.
  Going back to a page already seen shows it at once.
- `keepPreviousData` keeps the old page visible while the new one loads. Without it the table
  would vanish into a spinner on every click.
- State that describes what is being looked at belongs in the address. Reload, back button
  and shared links all keep working, and the component has less state to manage.
- A filter change resets to page 1: page 4 of the old list means nothing in the new one.
- A layout wraps every page below it. Putting the admin check there means a new admin page
  cannot forget it.

#### Step 4.5 - Create and edit form with a vehicle type select (done 2026-10-14)

Built

- `/admin/vehicles/new` and `/admin/vehicles/[id]/edit`: registration, make, model, colour,
  year and vehicle type. One form component for both; editing sends only what changed.
- The vehicle type dropdown lists the types on offer. When editing a car whose type was
  switched off later, that type is also listed, marked "(switched off)", so the car can keep
  it; no other car can be given it.
- `useVehicle(id)` (`GET /admin/vehicles/:id`), `useCreateVehicle`, `useUpdateVehicle`. Both
  mutations invalidate `vehicles.all`: every cached page and every open vehicle.
- The table gained "Add vehicle" (the page's accent button), an Edit link on each row, and
  a notice after saving. On phones the status folds into the first cell.
- Designed states: loading, the types failing to load (with Try again), no type on offer
  ("Add a vehicle type first"), an unknown vehicle, a server failure.

Verified

- Typecheck and lint pass.
- In a real browser against the running API:
  - the dropdown listed the five types on offer;
  - an empty form showed six messages and focused the registration; a one-letter plate,
    the year 2031 and "22" were each caught in the browser;
  - "ts01 abc" was refused by the API as a taken plate, shown on the registration field;
  - "sk24 sup" was saved as `SK24 SUP` and appeared in a search with its type;
  - the edit form opened with its values; changing the colour and the type to Saloon was
    saved and shown in the table;
  - with Saloon switched off, the car's form showed "Saloon (switched off)" and saved a
    colour change; a new car's dropdown no longer offered Saloon;
  - an unknown id showed "There is no such vehicle"; saving with nothing changed went back.
- Fixed: at 360px the new Edit column made the table 30px too wide; status now folds into
  the first cell below 640px. No horizontal scrolling at 1440px, 820px, 390px and 360px.

Learning notes

- Dependent data: the form cannot be drawn until it knows the vehicle types, because they
  are its dropdown's options. `WithTypes` waits for that query and handles its failure before
  the form exists.
- Two queries that do not need each other start together. The edit page asks for the vehicle
  and the types at the same time instead of one after the other.
- Module 3's edit form found its record in the list cache. That cannot work here: with pages,
  the car may not be on any page in the cache, so it is fetched by id.
- Options can depend on the record: a switched-off type is shown only to a car that already
  has it.

#### Step 4.6 - Change vehicle status, design pass (done 2026-10-14)

Built

- `PATCH /admin/vehicles/:id/status` with `{ "status": "ACTIVE" | "MAINTENANCE" | "RETIRED" }`.
  Every move is allowed, including back from retired; the same status again changes nothing.
- A "Status" section at the bottom of a vehicle's edit page: the current status as a pill,
  three choice rows that say what each status means, and one glass button that names the
  action ("Send to maintenance", "Retire SK24 SUP", "Bring back into service"). Choosing
  retired adds a warning that says what it means. The section saves on its own, at once.
- `useChangeVehicleStatus()`, which invalidates `vehicles.all` like the other mutations.

Verified

- Lint, typecheck and the production build (22 routes) pass. No automated tests were written.
- By hand against the running API: each status, the same status twice, retired back to active
  (all 200); an unknown status, an extra field and an empty body (400); an unknown id (404); a
  customer's token (403).
- In a real browser: the section opened on "Active" with the button disabled and saying
  "Choose a new status"; choosing "In maintenance" changed the button to "Send to
  maintenance", saved, and showed "The status is now in maintenance"; choosing "Retired"
  showed the warning and "Retire SK24 SUP"; the table's "Retired" filter then listed the car;
  "Bring back into service" returned it to active; picking another status and then the
  current one again disabled the button; arrow keys moved between the choices.
- No horizontal scrolling at 1440px, 390px and 360px.

Design pass

- A manual pass over the fleet table, the form and the status section against `DESIGN.md`:
  one accent button per page, divider rows, no glass inside glass, 44px targets, status as
  words. The Impeccable scanner reported nothing on the new files.
- Fixed: the search label sat lower than the dropdown labels; the table was 30px too wide at
  360px; the browser's radio buttons were dark discs that were hard to see on glass, now drawn
  by hand.
- `DESIGN.md` gained the filter bar, pagination, choice rows, the admin menu and how plates
  are shown.
- The independent finish review was not run for these screens.

Learning notes

- Status gets its own endpoint because it is an action, not a field. Later modules will add
  rules (a car with a trip today cannot be retired), and they will live in one place.
- A two-step choice (pick, then press a button that names the action) protects against a
  slip, without the interruption of a confirmation dialog.
- A disabled button must say why it is disabled. "Choose a new status" does.

### Module 4 summary

Built: the `Vehicle` model linked to `VehicleType`; admin endpoints to add, read, change,
list (with pages, filters and search) and change the status of vehicles; the fleet table,
the add and edit form with a vehicle type select, and the status section; an `/admin` layout
with one admin check and an admin menu.

Checks at completion: typecheck and lint pass for both apps, the frontend builds, and every
endpoint and screen was checked by hand against the running system. There are no automated
tests in the local code.

Open items

- No real fleet: there is no seed data for vehicles, on purpose.
- A vehicle cannot be deleted, only retired. A car added by mistake stays in the list.
- Status changes are not recorded anywhere: there is no history of when a car went into
  maintenance or who retired it. An audit trail fits Module 15.
- The status rules are open: any move is allowed. Rules tied to bookings come with Module 6.
- The list has 20 rows a page with no way to change it on screen; the API accepts up to 100.
- The tests on GitHub know nothing about vehicles, roles or the admin area.

### Module 5 - Pricing Rules + Quote Engine (completed 2026-10-15, branch `module-05-pricing`)

#### Step 5.1 - `PricingRule` model per vehicle type (done 2026-10-15)

Built

- `PricingRule` in `backend/prisma/schema.prisma` (table `pricing_rules`):
  `baseFarePence` (charged on every journey), `perMilePence`, `minimumFarePence`, timestamps.
  Migration `add_pricing_rules`.
- One rule per vehicle type: `vehicleTypeId` is unique, which makes the relation one-to-one.
  `VehicleType.pricingRule` is optional: a type has no price until an admin sets one.
- `onDelete: Cascade`: a rule means nothing without its type.
- No seed prices. The operator's fares are not decided, and `PRODUCT.md` forbids inventing
  them. Prices are entered by an admin (step 5.6).

Verified (directly in PostgreSQL; no automated tests)

- A rule for "Executive" was inserted and read back joined to its type.
- A second rule for the same type was refused by `pricing_rules_vehicle_type_id_key`.
- 3.5 put into a pence column was silently stored as 4. The API will have to refuse anything
  that is not a whole number before it reaches the database.
- The test rows were deleted.

Learning notes

- Money is stored as a whole number of the smallest unit: pence. Decimals in JavaScript are
  floating point, where `0.1 + 0.2` is `0.30000000000000004`; whole numbers add exactly.
  Pounds appear only on screen.
- The column name says the unit (`base_fare_pence`), so nobody wonders whether 350 means
  £350 or £3.50.
- A unique foreign key turns one-to-many into one-to-one.
- A database column of whole numbers rounds a decimal instead of refusing it. Checking that a
  value is a whole number is the API's job.

#### Step 5.2 - Admin pricing endpoints (done 2026-10-15)

Built

- `backend/src/modules/pricing/`, mounted at `/api/v1/admin/pricing` for admins only.
- `GET /admin/pricing`: every vehicle type in list order with its rule, or `pricingRule: null`
  where no prices are set. `meta` says the currency and unit: GBP, pence.
- `PUT /admin/pricing/:vehicleTypeId`: the whole rule, every field required. Creates it the
  first time and replaces it after that, with one `upsert`.
- Amounts: whole pence only; base and minimum fare up to £1,000, price per mile up to £100.
  A missing amount and a wrong one get different messages.

Verified (by hand against the running API; no automated tests)

- With no prices set, the list showed all five types with `none`.
- PUT for Executive answered 200 with 350/210/1200; a second PUT replaced it with
  400/225/1500; the same body again gave the same result, and the table held one row.
- 3.5, -1 and "1200" answered 400 with one message each; a missing field said "is required";
  100001 pence and an extra `currency` field answered 400.
- An unknown vehicle type answered 404; a customer's token answered 403.

Learning notes

- PUT replaces the whole thing at an address you name; PATCH changes part of it; POST makes
  something new at an address the server chooses. A price per vehicle type has a natural
  address, so PUT.
- PUT is idempotent: sending the same body twice leaves the same result as sending it once.
  That makes it safe to retry after a timeout.
- `upsert` is "update if it exists, create if not" in one statement. Checking first and
  then creating could make two rules if two admins saved at once; the unique index and the
  single statement prevent that.
- The API speaks pence; pounds are a matter for the screen. The API rejects `3.5` rather than
  guessing whether it meant £3.50 or 3.5p.

#### Step 5.3 - Quote calculation as a pure function with unit tests (done 2026-10-15)

Built

- `backend/src/modules/quotes/quote.calculator.ts`: `calculateQuote(rule, trip)` returns the
  charged distance, the breakdown lines and the total, all in whole pence. No database, no
  HTTP, no clock.
- The rules, in order: the distance is counted to the nearest tenth of a mile; the distance
  charge is rounded to the nearest penny once; base fare plus distance; if that is below the
  minimum fare, a "Minimum fare" line tops it up. The total is always the sum of the lines.
- `formatPence(1250)` gives "£12.50", for labels only.
- `quote.calculator.test.ts`: 10 unit tests with Vitest. The user chose on 2026-10-15 to have
  tests for this calculation, although the other test files stay out of the local code.

Verified

- `npm test -w backend` runs the 10 tests and they pass. Typecheck and lint pass.
- The tests were checked against a broken version: with the rounding changed to always round
  down, all 10 still passed, because no case had to round up. A case at 368.5p was added;
  the broken version then failed with "expected 368 to be 369", and the real one passes.

Learning notes

- Business logic without HTTP: the rule for a price lives in a plain function. The API calls
  it, a booking will call it, a test calls it, and all get the same answer.
- A pure function gives the same output for the same input and touches nothing outside
  itself. That is what makes it easy to test: no server, no database, no waiting.
- Count in the smallest whole unit (tenths of a mile, pence) and round once, at the end of
  each line. Rounding at every step lets pennies drift.
- A breakdown that does not add up loses the customer's trust. The total is computed from
  the lines, never separately.
- A passing test proves little until you have seen it fail. Breaking the code on purpose
  showed a gap that a green run had hidden.

#### Step 5.4 - `POST /quotes` with the distance typed in by hand (done 2026-10-15)

Built

- `POST /quotes` with `{ "distanceMiles": 12.4, "vehicleType": "executive" }`; the vehicle type
  is optional. Public, with a limit of 120 quotes per 15 minutes from one address.
- Without `vehicleType`, every type that is on offer and has prices is quoted, in list order.
  With it, only that type; a type that is switched off or has no prices answers 404.
- The answer: `distanceMiles` as sent, `chargedMiles`, `currency: "GBP"`, and per vehicle type
  its public details, the breakdown lines and `totalPence`.
- `quotes.service.ts` only reads the rules and hands them to `calculateQuote`. The rounding of
  the distance moved into `chargedMilesFor()` in the calculator, so it is written once.
- Nothing is saved: a quote is an answer, not a promise. The booking will work the price out
  again.

Verified (by hand against the running API, plus the unit tests)

- With no prices set: 200 "No prices are published yet" and no quotes.
- With Saloon, Executive and Minibus priced, 10 miles gave 2100p, 2450p and 3800p, matching
  the rules by hand; 12.44 miles in Executive was charged as 12.4 and cost 2954p; 2 miles was
  topped up to the 1200p minimum with its own line.
- With Minibus switched off it was left out of the list, and asking for it answered 404; Estate,
  which has no prices, answered 404.
- 0, "10", nothing, 1001 and an extra field each answered 400 with a message. The answer
  carried `Cache-Control: no-store` and the rate-limit header.
- The 10 unit tests still pass.

Learning notes

- A thin outer layer around a pure core: the service does the input and output (database,
  HTTP), the calculator does the thinking. The tested part is the part that matters.
- A rule written twice will one day disagree with itself. The "nearest tenth of a mile" rule
  now lives in one function that both use.
- POST is used although nothing is created, because the question has a body and the answer is
  worked out each time.

#### Step 5.5 - Night and airport surcharges (done 2026-10-15)

Built

- Two columns on `PricingRule` (migration `add_surcharges`): `nightSurchargePercent` (whole
  percent, 0 to 100) and `airportFeePence` (up to £100). Both default to 0, so existing
  prices did not change. `PUT /admin/pricing/:id` now needs both.
- The calculation, in this order: base fare and distance; the minimum fare top-up; the night
  surcharge as a share of that; the airport fee last, not surcharged. Each is its own line.
- Night is 22:00 up to 06:00 on the UK clock (`Europe/London`), which follows British Summer
  Time. `isNight()` and `ukHour()` are exported and tested.
- `POST /quotes` takes `pickupAt` (with a time zone; not in the past, at most a year ahead;
  "now" when left out) and `airport` (default false), and answers with `pickupAt`, `night`
  and `airport`. The clock is read in the service, never in the calculation.

Verified

- 18 unit tests pass, 8 of them new: the surcharge as a share of the fare, after the minimum,
  the airport fee not surcharged, no lines for a surcharge of 0, the night boundaries at
  21:59, 22:00, 05:59 and 06:00, and the same UTC time giving day in winter and night in
  summer.
- The new tests were checked against broken versions: night starting at 23:00 failed 2 tests;
  the airport fee placed before the surcharge failed 1. Both were restored.
- By hand against the running API, Executive at 25% and 500p, 10 miles: 2450p by day; 3063p
  at night; 3563p at night to an airport. 21:30 UTC on 20 October (BST) was night, the same
  time on 20 November (GMT) was day, and 22:30+01:00 was night. Types with no surcharges set
  had no surcharge lines.
- The old three-field PUT body answered 400 naming the two new fields; 12.5% and -5p answered 400. A past time, a time two years ahead, a time with no zone and `"airport":"yes"` each
  answered 400.

Learning notes

- When rules combine, the order is part of the price. A percentage applied before or after
  a flat fee gives different totals, so the order is written down and tested.
- A time without a time zone is ambiguous: 23:30 where? The API refuses it. Stored and sent
  times are UTC; the UK clock is used only to decide what counts as night.
- Summer time is why "night" cannot be worked out with UTC hours. The tests pin both seasons.
- Adding a column with a default is safe for existing rows: they get the default, here 0,
  which means "no surcharge".
- Keeping the clock out of the pure function means the tests choose the time, instead of
  passing or failing depending on when they run.

#### Step 5.6 - Admin pricing screen (done 2026-10-15)

Built

- `/admin/pricing`: every vehicle type with its base fare, price per mile, minimum fare,
  night surcharge and airport fee. A type with no prices shows a "No prices" pill and a
  "Set prices" button; a warning above the table counts the types on offer that cannot be
  quoted. On narrow screens the prices fold into one sentence under the name.
- `/admin/pricing/[vehicleTypeId]`: the form. Amounts are typed in pounds with a £ in the box;
  the night surcharge as a whole percentage with a % in the box. A notice after saving says
  new quotes use the prices at once.
- `frontend/src/lib/money/money.ts`: `formatPence`, `penceToPounds` and `parsePounds`. Pounds
  are read as digits ("3.50" is 3 and 50), never multiplied as decimals.
- `usePricing` and `useSetPricing`; saving invalidates the pricing list and any cached quotes.
- "Pricing" joined the admin menu. On phones the word "Admin" is hidden (still read by screen
  readers) so the three links fit on one line.

Verified

- Typecheck and lint pass.
- `parsePounds` checked on 16 inputs: "3.5", "£3.50", "1,250.00" and "0.07" were read exactly;
  "3.505", "3.", ".50", "-1" and "abc" were refused. For comparison, `1.15 * 100` in JavaScript
  is 114.99999999999999, while `parsePounds("1.15")` is 115.
- In a real browser: the menu led to the table, which said 2 types on offer had no prices;
  "Set prices for Estate" opened an empty form with 0 surcharges; empty fields, "3.505", "two",
  £1,500, 12.5% and -1 were each caught in the browser; "£3.2", "1.15", "1,000", 20 and 4 were
  stored as 320, 115, 100000, 20 and 400 pence; the edit form showed them back as pounds; an
  unknown id said so.
- After a change, a quote used the new price per mile at once (320p + 10 miles at 120p =
  1520p).
- No horizontal scrolling at 1440px, 820px, 390px and 360px.

Learning notes

- The screen speaks pounds, the API speaks pence, and the conversion happens in one place.
  Turning "1.15" into pence by multiplying by 100 gives 114.99999999999999; reading the digits
  gives exactly 115.
- A form for a whole record pairs naturally with PUT: the form always sends every field.
- A mutation can make more than one cache stale. New prices change every quote, so both the
  pricing list and the quotes are invalidated.
- An easy-to-make typo with money (£1,000 instead of £10.00) is a reason to show amounts back
  in a familiar form: the table shows "£1,000.00", which stands out.

#### Step 5.7 - Customer quote form with the price breakdown, design pass (done 2026-10-15)

Built

- `/quote`, public: distance in miles, an optional pick-up time (UK time; empty means now) and
  "The journey starts or ends at an airport". "Get prices" shows a price for every vehicle
  type that has prices, each with "How this price is worked out", which opens the breakdown
  lines and the total. A "Night-time pick-up" pill shows when the pick-up is at night.
- `frontend/src/lib/time/ukTime.ts`: the typed time is read as UK time, whatever the visitor's
  computer is set to, and shown back on the UK clock.
- `useQuote` is a query keyed by the question. Pressing "Get prices" again with the same
  question asks the server again, so a price changed by an admin is never shown stale.
- The home page's "Get an exact price" stage is now open and leads here. "Prices" joined the
  navigation on wider screens.

Verified

- Lint, typecheck and the production build (25 routes) pass. The 18 unit tests pass.
- `ukLocalToDate` checked in summer, in winter and across both clock changes; each time read
  back as typed.
- In a real browser, signed out:
  - an empty distance, "12,5" and a time in the past were each caught on their field;
  - 10 miles at midday gave Saloon £21.00, Estate £15.20, Executive £24.50, Minibus £38.00;
  - at 23:30 to an airport, Executive became £35.63 and its breakdown read: base fare £3.50,
    10 miles at £2.10 £21.00, night 25% £6.13, airport £5.00, total £35.63;
  - 22:30 on 20 October (summer time) counted as night; an empty time was priced for now;
  - after an admin raised Saloon to £2.00 a mile, asking the same question again showed
    £23.00. On the first run it still showed £21.00 from the cache; fixed by asking the
    server again on every press.
- No horizontal scrolling at 1440px, 390px and 360px.

Design pass

- A manual pass over `/quote`, `/admin/pricing` and its form against `DESIGN.md`: one accent
  button per page, divider rows, no glass inside glass, 44px targets, status as words. The
  Impeccable scanner reported nothing on the new files.
- Fixed: the stale repeated quote; the admin menu wrapping onto two lines at 360px; "Night-time
  rate" renamed "Night-time pick-up", because only some vehicle types have a night rate.
- `DESIGN.md` gained money, the price breakdown and the checkbox, and the navigation changes.
- The independent finish review was not run for these screens.

Learning notes

- A POST can still be a query. Asking for a price changes nothing, so it is cached by its
  question like a GET, and invalidated when prices change.
- A cache answers the same question with the same answer. Where the answer can change behind
  the user's back (a price), an explicit "ask again" must reach the server.
- Times typed by a person need a time zone decided for them. Journeys are in the UK, so the
  form reads UK time, not the visitor's computer's time.
- The screen never calculates a price. It shows the server's lines and total, so what the
  customer sees is exactly what the server will charge.

### Module 5 summary

Built: the `PricingRule` model with night and airport surcharges; admin endpoints to read and
set prices; the quote calculation as a pure function with 18 unit tests; `POST /quotes`; the
admin pricing screens; the public `/quote` page with the breakdown. The module was built on
the branch `module-05-pricing` and merged into `main`.

Checks at completion: typecheck and lint pass for both apps, the frontend builds, the unit
tests pass, and every endpoint and screen was checked by hand against the running system.

Open items

- No real prices: the test prices were deleted. Until an admin sets them, `/quote` says prices
  have not been published.
- The distance is typed in by hand. Measuring it from addresses needs a maps service, which is
  not free; to be decided.
- Night hours (22:00 to 06:00) are fixed in code, not set by an admin.
- A quote is not saved, and a price change is not recorded anywhere (no history of old prices).
- Rate limits are per server process, as before.
- The tests on GitHub are still out of date; locally, only the quote calculation's tests exist.

### Module 5 follow-up - Real road distance (done 2026-10-16, branch `module-05-real-distance`)

Asked for by the user: "prices depend on real distance". They chose UK postcodes with
postcodes.io and OSRM, built straight away, before Module 6.

Built

- `backend/src/modules/geo/`: `findPostcode()` asks postcodes.io (free, no key) for a postcode's
  map position and council area; `findRoadRoute()` asks an OSRM server for the driving distance
  and time; `TtlCache` remembers both for a day.
- Two settings, with defaults: `POSTCODES_API_URL` (`https://api.postcodes.io`) and
  `ROUTING_API_URL` (`https://router.project-osrm.org`, the public OSRM demo server).
- `POST /quotes` takes `pickupPostcode` and `dropoffPostcode` and measures the road distance.
  `distanceMiles` still works instead of them, for admins and for when the map services are
  down; sending both ways at once is refused. The answer has a `route`: both postcodes with
  their council area, the miles by road and the minutes.
- An unknown postcode is a 400 on its field; an unreachable service is a 503 "try again".
  Only postcodes and map positions are sent to the services, never a name.
- `/quote` asks for a pick-up and a drop-off postcode instead of a distance, and shows
  "SW1A 1AA (Westminster) to TW6 1EW (Hillingdon): 16.2 miles by road, about 34 minutes."

Verified (by hand against the running API and in a real browser)

- Westminster (SW1A 1AA) to Heathrow (TW6 1EW): 16.21 miles, 34 minutes. Asked again, the
  answer came from the cache in 0.01 seconds instead of 0.7.
- Manchester (M1 1AE) to Leeds (LS1 4AP): 42.7 miles, 56 minutes; at 23:30 to an airport with
  test prices, £121.46, matching the arithmetic by hand.
- An unknown postcode, "Heathrow", the same postcode twice, one postcode, none, and postcodes
  with a distance each answered 400 on the right field.
- Both services made unreachable in a separate run: each answered 503 with "We could not reach
  the ... service. Try again in a moment."
- In the browser: the form's mistakes are caught on their fields; "sw1a1aa" is tidied to
  "SW1A 1AA" when the box is left; no horizontal scrolling at 1440px, 390px and 360px.
- The 18 unit tests still pass. Test prices and the test account were deleted afterwards.

Found on the way

- Windows' own `curl` cannot open a secure connection to the OSRM server (a TLS error), while
  Node.js, which the API uses, can. Use Node or PowerShell to test it from this machine.

Learning notes

- Calling another service: set a timeout, expect it to fail, and turn its failures into
  answers the customer can act on (400 for their mistake, 503 for ours).
- A cache in front of a free service is fast for the customer and polite to the service.
- The service's address is a setting, not code, so the free demo server can be replaced by a
  paid or self-hosted one without changing a line.

Open items

- The public OSRM server is a demo with no promise of staying up. Before going live: a paid
  routing service, or our own OSRM with the UK map in Docker.
- Postcodes only; full addresses with suggestions would need a geocoding service.
- No map is drawn; the route is described in words.
- The "airport" box is still ticked by hand, not worked out from the postcodes.
- A journey with no road route (`NoRoute`) is handled in code but was not met in testing.

## v2 re-plan (2026-10-16)

Why: the user asked for UkRide to follow the live site https://ukride.uk, pasted an analysis of
its customer flow, and set the shape to three apps: a backend, a customer website and an admin
panel.

What was read on ukride.uk:

- **Customer flow:** the "BOOK YOUR JOURNEY" widget, `/booking`, Stripe Checkout and a
  thank-you page, My Journeys, Wallet, Profile, sign-up, login and forgot-password with SMS
  codes, and a mobile bottom tab bar.
- **Fleet:** six classes with "or similar" example models.
- **CMS content:** airport and terminal pages, hotel, station and London taxi pages, services,
  about, a Google-fed reviews page and a blog.

The user's decisions:

- Keep the indigo glass look; ukride.uk's black and gold is not copied.
- Remove everything CMS-related: blogs, airport pages, services and service pages.
- Main focus: auth, booking, payment, wallet, journeys and reviews.
- The booking flow follows ukride.uk for guests and signed-in customers, with airport
  Meet & Greet, return booking, and wallet and card payment.
- Phone codes go to Mailpit for now; a real SMS provider is a later decision.
- Addresses come from free OpenStreetMap search (Photon) plus postcodes.io.

The booking flow to build:

- **Everyone:**
  - the widget opens `/booking` with the journey in the address
  - an airport pick-up needs a flight number and offers Meet & Greet (£10 from settings),
    per leg
  - the server saves a quote with every class and its price, and recommends the first class
    that fits
  - a return books two legs, the second with the stops reversed
  - rules: 4 hours ahead, return after pick-up, pick-up not the drop-off, at most 5 stops,
    8 passengers and 8 bags
  - any change clears the price, and a moved price answers "price changed"
- **Signed-in customers** pay from the wallet, by card through Stripe Checkout, or both:
  - the wallet share is held while at Stripe
  - the card part is at least 30p
  - the webhook confirms every leg in one transaction
- **Guests:**
  - verify their mobile with a code
  - get a passwordless account, or are asked to sign in if a full account already uses those
    details
  - pay by card only
  - may set a password on the thank-you page
- **After booking:**
  - My Journeys offers Pay Now, Edit (at least 4 hours before) and Cancel
  - refunds go to the wallet
  - the driver's details show from 1 hour before pick-up
  - a finished journey can be reviewed

An independent review of the first draft changed four things:

- the wallet comes before card payment, because the split decides the card amount
- staff and customers get separate sign-ins, because two apps on localhost would otherwise
  share one refresh cookie and could sign each other out
- the driver card moves to the admin operations module
- several guest, session and Stripe safety details were added

It also found two things to fix in the existing code:

- the profile edit can change the mobile without a code (fixed in 2.7)
- "Remember me" needs each session to keep its own lifetime (1.11)

Removed or not planned:

- **CMS pages:** blogs, airport and terminal pages, hotel, station and London taxi pages,
  services, about, the Google reviews page.
- **Not planned now:** the support contact form, Drive With Us applications, image uploads,
  a driver app, company (B2B) accounts, mobile apps, flight tracking.

The old Module 6-17 step lists are replaced by the roadmap above. Their numbers are reused,
so a reference such as "Module 10" in notes written before this date means the old plan.

### Module 0 rework - three apps (branch `module-00-three-apps`)

#### Step 0.7 - Split into three apps (done 2026-10-16)

Built

- **Workspaces:** `backend/`, `customer/` (was `frontend/`, port 3000), a new `admin/` (Next.js,
  port 3001) and `shared/` (`@ukride/shared`), with one root lockfile. Root scripts are
  `dev` (all three), `dev:api`, `dev:customer` and `dev:admin`; `dev:web` is gone.
- **`@ukride/shared`** is TypeScript source with an `exports` map. It holds:
  - the API client factory `createApiClient({ baseUrl, refreshPath, hintKey })`
  - money, UK time and phone helpers
  - Card, Badge, Field, Select, Spinner and PasswordInput
  - the glass styles (`shared/styles/glass.css`)
- **The customer app's `lib/api/client.ts`** creates its own client (marked `client-only`)
  and re-exports the same names as before, so feature code did not change. 23 files had their
  imports rewritten to `@ukride/shared/...`.
- **Each app's `globals.css`** is three lines: Tailwind, the shared styles, and an `@source`
  line for `shared/src`.
- **The admin app** has its layout and a placeholder page; the shell comes in 0.8.
- **Backend settings:**
  - `CORS_ORIGINS` allows ports 3000 and 3001
  - `WEB_APP_URL` became `CUSTOMER_APP_URL` and `ADMIN_APP_URL`
  - email links use the customer address
- **Docs:** `.prettierrc` sorts Tailwind classes per app; `docs/decisions/ADR-0002-three-apps.md`
  records the split.

Verified

- Typecheck passes for backend, shared, customer and admin; lint for backend, customer and
  admin.
- Production builds pass for both web apps. Next.js 16 compiled the shared package without
  `transpilePackages`.
- In a real browser, the customer site's home, sign-in, register, vehicles and quote pages
  showed the glass styles from the shared package, with no horizontal scrolling. The admin app
  rendered on port 3001 in the same style.
- A request from the admin app's origin to the API passed CORS.

Found on the way

- Stopping a dev server task left its `node` child processes running; they were found by
  their UkRide paths and stopped by PID.
- Windows refused to rename the `frontend` folder even with nothing of ours running,
  probably because the editor holds it open. The tracked files were moved one by one instead.
  An empty `frontend/` folder with only ignored leftovers (`.next`, `node_modules`)
  remains; delete it once the editor has let go.

Learning notes

- A workspace package can be plain TypeScript: the apps that import it compile it.
- Code that holds a secret in a module variable must never run on the server, where one module
  instance serves every visitor. `client-only` turns that rule into a build error.
- A factory (`createApiClient`) lets two apps share code while keeping separate state.

#### Step 0.8 - Staff sign-in, admin shell, admin screens moved (done 2026-10-16)

Built

- **Separate staff sessions:**
  - `POST /admin/auth/login`, `/refresh`, `/logout` and `GET /admin/auth/me`, for ADMIN
    or DISPATCHER accounts only
  - their own cookie `ukride_staff_refresh` on the path `/api/v1/admin/auth`
  - a session `audience` column (CUSTOMER or STAFF; migration `add_session_audience`)
  - an `aud` claim in every access token
  - `requireAuth` takes customer tokens only and the new `requireStaffAuth` takes staff
    tokens only; every `/admin/*` route now uses `requireStaffAuth`
  - staff sessions last `STAFF_SESSION_HOURS` (12)
- **Refreshes at the same moment:**
  - a refresh token exchanged less than 30 s ago answers 409 with `details.retry` and keeps
    the cookie, instead of being treated as stolen; after 30 s a returning old token still
    ends every session
  - a failed refresh clears the cookie only on a real 401
  - the shared client makes tabs take turns with `navigator.locks` and retries once on the 409
- **Admin app:**
  - `/login` (staff sign-in) and a `(panel)` route group whose layout runs the staff check
    once and draws the sidebar: Vehicles, Vehicle types, Pricing, System status, plus the
    staff member's name and role and Sign out
  - an account that is no longer staff is told so, with a sign-out button
- **Moved from the customer app:**
  - the vehicles, pricing, admin vehicle-type and system status screens
  - their features and query keys
  - their addresses lost the `/admin` prefix
- **Customer app:**
  - keeps only the public vehicle-type list
  - lost `/admin/**`, `/system-status`, the Status link and the home page's status panel
  - an admin's account page links to the admin panel (`NEXT_PUBLIC_ADMIN_URL`)
- `plural()` moved to `@ukride/shared/text`.

Verified

- Typecheck passes for all four workspaces; lint passes for all three apps.
- **Against the running API:**
  - a customer token got 401 on `/admin/vehicles` and a staff token 200
  - a staff token got 401 on `/auth/me`
  - a customer account got 403 at staff sign-in
  - the two cookies have their own names and paths
  - a staff cookie sent to the customer refresh got 401
  - after staff sign-out the staff refresh got 401 while the customer session still worked
  - two refreshes at once with one cookie gave 200 and 409; the same old cookie 2 s later
    gave 409 and the session survived; 31 s later it gave 401 and every session of that
    user ended
- **In a real browser:**
  - signed out, `/vehicles` on the admin app went to its sign-in
  - a customer account was refused there
  - an admin signed in to both apps; vehicles, vehicle types (adding one worked), pricing and
    system status all ran in the admin app
  - signing out of either app left the other signed in
  - no horizontal scrolling at 1440 and 390px; on a phone the section links wrap
- Test accounts and the test vehicle type were deleted.

Learning notes

- Who a token is for (its audience) is as important as who it belongs to. The same admin
  person now holds two independent sessions, one per app.
- A security rule that fires on normal behaviour (two tabs refreshing together) teaches
  people to ignore it. The 30-second window keeps the replay check for real replays.
- A layout in a route group runs for every page inside it, so a new admin page cannot forget
  the staff check.
- Windows would not rename folders that the dev server was watching; moving files one by one
  worked. Empty leftover folders (`frontend/`, `customer/src/app/admin/`) can be deleted by
  hand.

#### Step 0.9 - Docs for three apps (done 2026-10-16)

- `DESIGN.md`:
  - the token source is now `shared/styles/glass.css`
  - the layout section describes both apps
  - the admin sidebar replaces the old admin menu
  - the mobile tab bar rule is written down before it is built (0.10)
  - the navigation entry matches the new links
- `README.md`:
  - project structure with `customer/`, `admin/` and `shared/`
  - setup copies both apps' `.env.local`
  - how to run the three apps, and that their sign-ins are separate
  - the scripts and frontend settings tables
- `PRODUCT.md` points at the shared styles. ADR-0002 was written in 0.7.

Learning note: write the rule for a new screen pattern before building it. The tab bar's
rules (which items, when it shows, how it avoids covering content) were settled in
`DESIGN.md` first, so 0.10 builds to a known target.

#### Step 0.10 - Customer site frame (done 2026-10-16)

Built

- `customer/src/components/layout/navItems.ts`: the site's pages in one list (Home, Prices,
  Vehicles, Profile today). The header, the mobile tab bar and the footer all read it, so a
  new page appears everywhere at once. Its comment says how the list becomes Home, Book Now,
  Journeys, Wallet, Profile as those pages are built.
- `MobileTabBar`: below 640px, a bar fixed to the bottom of the screen with an icon and a
  word per page, on the near-opaque menu surface; the current page is marked. The floating
  header keeps only the brand and the account links on a phone.
- `SiteFooter`: the same pages and the copyright line, with room left under it for the tab
  bar.
- The header shows Home, Prices and Vehicles from 640px up.
- The home page is one hero: "Pre-booked travel in and around London", an exact price before
  booking, "Get a price" and "See the vehicles". The journey-stage card is gone; the fleet
  joins in 3.9 and the booking widget in 5.13.

Verified

- Typecheck and lint pass for every workspace; 18 unit tests pass; production builds pass for
  the customer site (12 routes) and the admin panel (12 routes).
- **Desktop:** the header marks the current page on /, /quote and /vehicles, and the tab bar
  is hidden.
- **Phone:**
  - the tab bar shows Home, Prices, Vehicles and Profile with the current one marked, and
    tapping Prices opened /quote
  - the header shows only the brand and the sign-in links
  - the footer's last line sits 39px above the tab bar
- No horizontal scrolling at 1440, 390 and 360px.

### Module 0 rework summary

The project is now three apps and a shared package:

- the backend
- `customer/`, the customer website on port 3000
- `admin/`, the admin panel on port 3001, with its own staff sign-in
- `@ukride/shared`, the shared package

Staff and customer sessions are separate, and refreshes at the same moment no longer sign
people out. The admin screens moved to the admin panel, and the customer site has a header,
footer and mobile tab bar.

Built on the branch `module-00-three-apps`, merged into `main` and tagged `module-00-v2`.

Open items

- Empty leftover folders that Windows would not let me delete: `frontend/` (only ignored
  `.next`, `node_modules`) and `customer/src/app/admin/`. Delete them by hand once no
  program has them open.
- The /vehicles page still says prices are not published; it folds into the home page in 3.9.
- The tests on GitHub still describe the old single web app.

### Module 1 rework - auth like ukride.uk (branch `module-01-auth-otp`)

#### Step 1.9 - OTP codes (done 2026-10-16)

Built

- `OtpCode` table (migration `add_otp_codes`):
  - purpose: SIGNUP, GUEST_BOOKING, CHANGE_MOBILE or RESET_PASSWORD
  - channel: SMS or EMAIL
  - the target, a keyed hash of the code, wrong tries, expiry, used-at and ticket-used-at
- `User.phoneVerifiedAt`.
- `backend/src/modules/otp/`:
  - `sendOtp` makes a 6-digit code that lasts 10 minutes and replaces any earlier one
  - `verifyOtp` allows 5 wrong tries; the right code is used up and answered with a signed
    ticket (15 minutes)
  - `spendTicket` accepts that ticket once, for its own purpose and target only
- **Limits:**
  - 60 s between codes, checked in the database
  - at most 5 codes an hour to one target, counted in Redis (`backend/src/config/redis.ts`,
    `REDIS_URL`); if Redis is down, the 60 s rule still applies and the problem is logged
  - per-address limits on sending and checking
- **Delivery** (`otp.sender.ts`):
  - email through the mail server
  - SMS through a development driver that emails Mailpit at `<number>@sms.ukride.local`
    and logs it, and refuses to run in production until a real SMS provider is added
- **Endpoints:** `POST /auth/otp/send` and `/verify`, for the SIGNUP and GUEST_BOOKING
  purposes. A sign-up code is refused (409) for a mobile that already has an account.
- **Readiness** now reports Redis. The clean-up job deletes codes a day after they end.

Verified (against the running API and Mailpit)

- **Sending:**
  - the code arrived in Mailpit as "SMS to +447400999971"
  - the stored hash was not the code
  - a second send at once got 429 "Wait N seconds"; a 6th in the hour got 429
  - a landline was refused
- **Checking:**
  - a wrong code got "4 tries left"; "12ab" and a wrong purpose were refused
  - the right code gave a 900-second ticket; using it again was refused
- **Ending a code:**
  - five wrong tries ended the code, so the right one was refused after them
  - an expired code was refused
- The test codes and the Redis counter were deleted afterwards.

Learning notes

- Six digits are only a million possibilities. A keyed hash (HMAC with the server secret)
  means a stolen table of hashes is useless; a plain hash could be reversed in seconds.
- Three separate limits guard different things: tries per code (guessing), time between
  sends (annoyance and cost), and sends per hour per number in Redis (shared across servers).
- A short-lived, single-use ticket separates proving you hold the phone from what you do
  next, so the code endpoint stays the same for sign-up, guest booking and the rest.
- Updates with a condition (`attempts < 5`, `consumedAt is null`) stop two requests at once
  from both getting the last try or both using one code.

#### Step 1.10 - Sign-up with a code to the mobile (done 2026-10-16)

Built

- **The flow, as on ukride.uk:** `POST /auth/check-email` (is it free?), then a SIGNUP code to
  the mobile (1.9), then `POST /auth/register` with the details and the `otpTicket`.
- `registerUser` reports a taken email or mobile before spending the ticket, then spends it
  (once, for that mobile only), and stores `phoneVerifiedAt`.
- **Sign-up now signs the person in:** the answer carries an access token and sets the
  refresh cookie, like a login.
- **Email-link confirmation is retired:**
  - no confirmation email at sign-up
  - `/auth/verify-email` and `/auth/resend-verification` are gone, with their code
  - the `email_tokens` table stays until the reset links go in 1.12
- `phoneVerifiedAt` is part of the user the API returns.

Verified (against the running API and Mailpit)

- `check-email` answered `available: true` for a new email and `false` once registered.
- **Refusals:**
  - no ticket, a made-up ticket, and a real ticket for a different mobile were each refused
    on `otpTicket`
  - the same ticket again, with other details, was refused
  - a SIGNUP code for the now-registered mobile got 409
- **A real ticket:** 201 "Account created" with `phoneVerifiedAt`, an access token and the
  refresh cookie; the cookie then refreshed into a token that `/auth/me` accepted.
- **Retired paths:** Mailpit held no confirmation email for the new address, and the old
  endpoints answered 404.

Note: the customer site's register page still sends the old body, so it is broken on this
branch until the new sign-up page in 1.13.

Learning notes

- Check the cheap, user-fixable things (a taken email) before spending something
  single-use (the ticket); otherwise a typo costs the person a new code.
- Proving a phone and creating an account are separate requests, joined by a ticket that names
  the phone. Swapping the number between the two steps is refused.

#### Step 1.11 - Login with "Remember me" (done 2026-10-16)

Built

- **Each session keeps its own lifetime.** A new `lifetime_hours` column on refresh tokens
  is chosen at sign-in and copied by every refresh:
  - customer with "Remember me": `REMEMBER_ME_DAYS` (30 days)
  - customer without it: `CUSTOMER_SESSION_HOURS` (24 hours)
  - staff: `STAFF_SESSION_HOURS` (12 hours); staff sign-in ignores `rememberMe`
  - `REFRESH_TOKEN_TTL_DAYS` is gone; rows from before the migration keep 7 days (168 h)
- `POST /auth/login` takes `rememberMe` (true or false, default false).
- **Burst limit, as on ukride.uk:** 5 sign-in attempts a minute from one address, right or
  wrong, on both the customer and the staff sign-in. The 15-minute wrong-password limit stays
  behind it.
- **Cross-tab sign-out** on the customer site (`AuthSync`): the "signed in" hint lives in
  localStorage, so when one tab removes it (sign-out, or a session that ended), every other
  tab forgets its access token and shows "signed out"; when one tab signs in, the others ask
  who it is.
- A "Remember me for 30 days" checkbox on the sign-in form, using a new shared `Checkbox`.

Verified (against the running API)

- Without "Remember me": `lifetime_hours` 24 and a cookie of about 23 hours 59 minutes.
- With it: 720 hours and a cookie of about 30 days; after a refresh the new token still had
  720 hours.
- `"rememberMe": "yes"` was refused with "Remember me must be true or false".
- The 6th sign-in attempt within a minute got 429 "Too many sign-in attempts. Wait a minute
  and try again."

Learning notes

- A lifetime chosen at sign-in has to be stored with the session; otherwise the first refresh
  quietly turns a 1-day session into the server default.
- The browser's `storage` event fires only in the other tabs, and only when the value really
  changes, so re-setting the hint on every refresh costs nothing.

#### Step 1.12 - Forgot password with a 6-digit code (done 2026-10-16)

Built

- **Three requests, as on ukride.uk:**
  1. `POST /auth/forgot-password` `{ email }`: a RESET_PASSWORD code to the email (the code
     system from 1.9, channel EMAIL)
  2. `POST /auth/forgot-password/verify` `{ email, code }`: the right code gives a ticket for
     that email (15 minutes, single use)
  3. `POST /auth/reset-password` `{ email, otpTicket, password }`: the password changes, every
     session of the account ends, and this browser is signed in afresh (same answer as a login)
- **Nothing reveals who is registered** at step 1: the answer is the same for every address,
  and the code is sent in the background, so the time taken is the same too. A send that the
  code rules refuse (asked again within 60 s, more than 5 an hour) is only logged.
- A reset also fills `emailVerifiedAt` when empty: the code reached the mailbox.
- **Email links are gone:** `auth.emails.ts` is deleted, and migration `drop_email_tokens`
  drops the `email_tokens` table and its enum. The old `{ token, password }` body is refused.
- Limits: 5 forgot-password requests an hour per address (as before), 30 code checks per
  15 minutes, 20 resets per 15 minutes (`resetLimiter`, which replaces `linkLimiter`).

Verified (against the running API and Mailpit)

- An unknown email and a known one (typed as " U-Signup@ukride.test ") got the same 200 and
  message; only the known one received a code. Times were mixed (unknown 37 and 16 ms, known
  6 and 11 ms), with no pattern.
- Asking again at once: still the same 200, no second email, a warning in the log.
- A wrong code: "That code is not right. 4 tries left". The right code for another email:
  refused.
- **Refusals at step 3:**
  - the ticket with another email was refused, and stayed usable
  - a 7-character password was refused before the ticket was spent
  - the old link body was refused
- **Reset worked:** 200 "Password changed. You are signed in" with an access token and the
  refresh cookie.
  - the same ticket again was refused
  - the old access token got 401, and the old refresh cookie "Your session has ended"
  - the new token and the new cookie worked
  - the old password got 401 and the new one 200
  - `emailVerifiedAt` was set
- The 6th forgot-password request within the hour got 429.

Note: the customer site's forgot and reset pages still use the old link flow, so they are
broken on this branch until the new pages in 1.13.

Learning notes

- "Same answer for everyone" covers the time taken as well as the words: the slow part (sending)
  runs after the answer, so a stopwatch learns nothing.
- Validate everything cheap before spending something single-use: a too-short password is
  refused while the ticket is still good.

#### Step 1.13 - Sign-in, sign-up and forgot-password pages (done 2026-10-16)

Built (customer site)

- **`/signup`, two steps as on ukride.uk:**
  1. details: name, email, mobile, gender (optional), password. "Continue" checks the email is
     free, then texts a code to the mobile.
  2. code: checked, then the account is created and the person is signed in, landing on
     `/account` with "Welcome to UkRide. Your account is ready and your mobile is confirmed."
  - A taken email shows "Is it yours? Sign in or reset the password". A taken mobile is
    marked on its field.
  - "Change your details" goes back with everything kept. Going on again with the same mobile
    does not send another text; a ticket already earned is reused.
- **`/forgot-password`, three steps:** email, then the code from the email, then the new
  password. The person lands signed in on `/account` with "Your password has been changed.
  Other devices have been signed out; this one is signed in." Step 2 says "if it has a UkRide
  account", the same for every address.
- **`CodeEntry`,** shared by both pages:
  - one box that takes typing, a paste or the phone's one-time-code suggestion; the sixth
    digit sends it
  - a refused code empties the box and shows the API's message ("4 tries left")
  - "ask for a new one in 0:42" counts down the API's wait, then becomes "Send a new code"
  - recorded in DESIGN.md
- `useStartSession()`: login, sign-up and reset all keep the token, set the hint (which also
  tells other tabs) and fill the user cache the same way.
- **Removed:**
  - `/register`, `/verify-email` and `/reset-password`, with the old register, verify and
    reset components and their hooks
  - the "confirm your email" banner, its resend button and the email badge on the account
    page
- **Old addresses redirect (308):** `/register` to `/signup`, `/reset-password` to
  `/forgot-password`, `/verify-email` to `/account`. Header, sign-in page and README links
  point at `/signup`.

Verified (headless Edge against the running API and Mailpit)

- **Sign-up:**
  - an empty submit marked all five required fields and focused the first
  - a taken email showed the message and both help links
  - continuing reached "Check your phone", focused on the code box, with a 1:00 countdown
  - a wrong code: "That code is not right. 4 tries left." with the box emptied
  - back and on again went straight to the code step, and the same code worked
  - it landed on `/account?done=welcome` with the welcome line, and the header showed
    "Ayesha"
- **Forgot password, signed out:**
  - the email was typed as "U-UI@ukride.test"; the emailed code was accepted
  - a 5-character password was refused with "Use at least 8 characters. You have 5."
  - a good one landed on `/account?done=reset`, signed in
- The three old addresses redirected as listed.
- Checked at 1440 and 360px with no horizontal scroll. Typecheck, lint and production builds
  pass for both apps.

Learning notes

- A multi-step form keeps what each step earned (the code sent, the ticket), so going back to
  fix a typo costs nothing.
- One code box with `autocomplete="one-time-code"` beats six boxes: paste, autofill and screen
  readers all just work.

### Module 1 rework summary (complete 2026-10-16, tag `module-01-v2`)

Sign-in now works like ukride.uk:

- **Codes (1.9):** one-time codes by text or email, stored hashed, with resend waits, hourly
  caps and single-use tickets.
- **Sign-up (1.10):** proves the mobile with a code, and signs the person in.
- **Sign-in (1.11):** "Remember me" (30 days, or 1 day without it), 5 tries a minute, and
  sign-out across tabs.
- **Forgot password (1.12):** a code to the email, and it ends every other session.
- **Email links are gone** (1.10 and 1.12).
- **Pages (1.13):** the customer site's three pages follow the same steps.

Staff keep their own 12-hour sessions on the admin panel (0.8).

### Module 2 rework - profile like ukride.uk (branch `module-02-profile`)

#### Step 2.7 - Change the mobile only with a code (done 2026-10-20)

Built

- **Two new endpoints, as on ukride.uk:**
  1. `POST /users/me/mobile/code` `{ mobile }`: a CHANGE_MOBILE code by text to the new number
     (the code rules from 1.9: 10 minutes, a new one after 60 s, 5 an hour)
  2. `POST /users/me/mobile` `{ mobile, code }`: the right code for that number replaces the
     mobile and sets `phoneVerifiedAt`; the answer is the updated profile
- **Refused before any text is sent, and again before saving:**
  - the number you already have (400 "This is already your mobile number")
  - another account's number (409 on `mobile`)
- **`PATCH /users/me` no longer takes `mobile`:** it is refused with "Only firstName, lastName
  and gender can be changed here. The mobile is changed with a code".
- `consumeOtp()` is split out of `verifyOtp()`. It checks a code and uses it up, for a step that
  acts at once; `verifyOtp()` wraps it and issues a ticket.
- **Customer site:**
  - a new `/profile/mobile` page with two steps, the new number then the code (the shared
    `CodeEntry`)
  - a wrong number or a taken one is marked on the field
  - success returns to the profile with "Your mobile number has been changed and confirmed."
  - the edit form shows the mobile as text with a "Change mobile" link

Verified (against the running API and Mailpit)

- **Refusals:**
  - a PATCH with `mobile` was refused, while a PATCH of the first name still worked
  - a code to your own number, another account's (409), a landline and without a token (401)
    were each refused
  - asking again at once: 429 "Wait 59 seconds"
- **Codes:**
  - a wrong code: "4 tries left"
  - the right code sent with a different number was refused
  - a code asked for at sign-up (purpose SIGNUP) was not accepted for a change
- **Change:** the right code changed the number and set `phoneVerifiedAt`. The same request
  again was refused, as the number was now yours.
- **Headless Edge:**
  - the edit form had only first and last name (plus gender) and the "Change mobile" link
  - on `/profile/mobile`, your own number and a taken one were marked on the field
  - a new one reached the code step; the texted code changed it and returned to the profile
    with the new number shown
  - no horizontal scroll at 1440 and 360px

Learning notes

- A contact detail that receives codes is a key to the account. Changing it with a plain form
  would let anyone at an unlocked laptop move future codes to their own phone.
- The old number stays until the new one is proven, so a typo never locks anyone out.

#### Step 2.8 - `/profile` like ukride.uk (done 2026-10-26)

Built

- **One page for the whole account, `/profile`** (`ProfilePage.tsx`), in three cards:
  1. who you are: initials, name, "Member since", Sign out, and the admin panel link for
     administrators
  2. personal details: first name, last name and gender, edited in place
     (`PersonalDetailsForm.tsx`); it sends only what changed, says "Nothing has changed." when
     nothing did, and the saved name shows in the header at once
  3. sign-in details: the email, the mobile with its Verified badge and "Change mobile", and the
     password as dots with "Change password"
- **Moved:** change password is now `/profile/password`; `/profile/mobile` stays where 2.7 put
  it.
- **Removed:** the `/account`, `/account/edit` and `/account/password` pages, `AccountPanel` and
  `EditProfileForm`.
- **Old addresses redirect** (308): `/account` and `/account/edit` to `/profile`,
  `/account/password` to `/profile/password`, and `/verify-email` now to `/profile`.
- Sign-in, sign-up, password reset, the header and the tab bar all go to `/profile`; the
  "done" messages (welcome, reset, password, mobile) moved with them.

Verified

- Typecheck, lint and Prettier pass for the customer app.
- **Redirects:** the four old addresses answered 308 to the right new one, also while signed
  in.
- **Headless Chrome, with a new test account (`step28.*@example.com`):**
  - signed out, `/profile` went to `/login`; signing in landed on `/profile`
  - Save with nothing changed: "Nothing has changed."
  - an empty first name: "Enter your first name." on the field, with focus moved there
  - a new first name: "Your details have been saved."; the heading and the header link changed
    without a reload, and the name was still there after one
  - `?done=mobile` and `?done=welcome` showed their messages
  - Cancel on `/profile/password` goes back to `/profile`; Sign out went home
  - five reloads in a row each made one refresh and showed the page
  - no horizontal scroll at 390px; the sign-in rows stack with their links underneath

Open items (both closed on 2026-10-27, see "Module 2 follow-ups" below)

- **Reload during a refresh (Module 1 code, not this step):** if a page is left while
  `/auth/refresh` is still answering, the browser can lose the new cookie. The next load then
  gets 409 "refreshed a moment ago" twice, and after 30 seconds the old cookie counts as a
  replay and ends every session. Seen once when the test script navigated very quickly; normal
  reloads were fine.
- The dev server logs "Router action dispatched before initialization" and a React "state
  update on a component that hasn't mounted" warning on some loads. `/profile/mobile` from 2.7
  does the same, so they are not from this page; check again in a production build.

Learning notes

- Retiring a route: keep the old address as a permanent redirect, so bookmarks and links in
  old emails still land somewhere useful.
- Editing in place, the form reads the cached user once. Later cache updates, including its
  own save, must not overwrite what the person is typing.

### Module 2 follow-ups (2026-10-27)

#### Follow-up 1 - A refresh answer lost on the way no longer signs people out

The bug

- A refresh swaps cookie T1 for T2. If the page is left or reloaded before the answer arrives,
  the browser never stores T2 and keeps sending T1.
- T1 is already used, so for 30 seconds it got 409 "refreshed a moment ago" (the retry got the
  same), and after that it counted as a stolen token and ended every session of the user.

The fix (`auth.sessions.ts`)

- A token used less than 30 seconds ago now gets the session's live token in its place: that
  one is used up and a fresh one issued, so the browser is back in step.
- This works however many answers were lost in a row. Every token after the returning one was
  made inside the 30 seconds, so nothing older than the window allowed is handed out.
- Still 409: no live token yet, because another refresh of the session is half done.
- Still the same: a used token coming back after 30 seconds ends every session.
- `rotateSession()` and the new `renewLostToken()` share one `claimAndRenew()`.

Verified (against the running API, with a test account)

- **Lost answer:** T1 refreshed, its answer ignored, T1 again: 200 (was 409).
- **Several lost:** an old token two and three swaps behind the live one: 200.
- **Replay:** a used token aged past the 30 seconds: 401, every token of the user gone, and
  the token that was live afterwards also 401.
- **Headless Chrome on the production build:** `/profile` loaded and was left the moment its
  refresh was sent, five times in a row; the next load showed the profile, every refresh
  answered 200, and the console was empty.
- Typecheck, lint and Prettier pass for the backend.

Learning notes

- A rotation scheme must survive answers that never arrive. The server cannot tell "lost" from
  "stolen", so a short window treats a recent reuse as lost and a late one as stolen.

#### Follow-up 2 - The dev-server warnings

- "Router action dispatched before initialization" and the React "state update on a component
  that hasn't mounted" warning do not appear in a production build: `/profile`,
  `/profile/mobile` and `/profile/password`, loaded, reloaded and left mid-refresh, gave no
  console warnings or errors. They come from the development server, so nothing was changed.

### Module 2 rework summary (complete 2026-10-27, tag `module-02-v2`)

The profile now works like ukride.uk:

- **Mobile (2.7):** changed only with a code to the new number; the profile edit no longer
  takes it.
- **One page (2.8):** `/profile` holds who you are, personal details edited in place, and the
  sign-in details; `/account` and its pages redirect.
- **Follow-up:** a refresh whose answer was lost is recovered instead of signing people out.

Open items

- Empty leftover folders from 0.7, still to delete by hand: `frontend/` (only ignored build
  files) and `customer/src/app/admin/` (only empty folders).
- The tests on GitHub are older than the 30-second window from 0.8: two of them replay a used
  token at once and expect 401, which is now 200. They also still describe the single web app.

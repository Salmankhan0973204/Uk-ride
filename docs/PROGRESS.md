# Module progress tracker

Update this file after every coding session.

- **Current module:** none in progress
- **Last completed:** Module 0 - Foundation
- **Next module:** Module 1 - Authentication: Register + Login + Current User
- **Remaining:** Modules 1 to 17

A module is **Complete** only when all five stages are Done and the flow works end to end.
Do not start two modules at the same time.

Stage values: `Done`, `In progress`, `-` (not started), `n/a`.

| #   | Module                                             | Backend | API Tested | Frontend UI | TanStack Query | Tailwind / Impeccable Polish | Status   |
| --- | -------------------------------------------------- | ------- | ---------- | ----------- | -------------- | ---------------------------- | -------- |
| 0   | Foundation: Health Check + First Full-Stack Screen | Done    | Done       | Done        | Done           | Done (manual pass)           | Complete |
| 1   | Authentication: Register + Login + Current User    | -       | -          | -           | -              | -                            | Next     |
| 2   | Profile Management                                 | -       | -          | -           | -              | -                            | -        |
| 3   | Vehicle Types: Admin CRUD + Customer Catalog       | -       | -          | -           | -              | -                            | -        |
| 4   | Fleet Vehicles                                     | -       | -          | -           | -              | -                            | -        |
| 5   | Pricing Rules + Quote Engine                       | -       | -          | -           | -              | -                            | -        |
| 6   | Booking Creation                                   | -       | -          | -           | -              | -                            | -        |
| 7   | My Bookings: List + Detail                         | -       | -          | -           | -              | -                            | -        |
| 8   | Booking Edit + Cancellation                        | -       | -          | -           | -              | -                            | -        |
| 9   | Driver + Dispatch Operations                       | -       | -          | -           | -              | -                            | -        |
| 10  | Stripe Payments + Refunds                          | -       | -          | -           | -              | -                            | -        |
| 11  | Notifications + Email                              | -       | -          | -           | -              | -                            | -        |
| 12  | Real-Time Booking Status + Driver Location         | -       | -          | -           | -              | -                            | -        |
| 13  | File Uploads + Driver Documents                    | -       | -          | -           | -              | -                            | -        |
| 14  | Reviews + Customer Feedback                        | -       | -          | -           | -              | -                            | -        |
| 15  | Admin Dashboard + Reporting                        | -       | -          | -           | -              | -                            | -        |
| 16  | Production Hardening + Automated Testing           | -       | -          | -           | -              | -                            | -        |
| 17  | Docker + CI/CD + Deployment                        | -       | -          | -           | -              | -                            | -        |

## Module notes

### Module 0 - Foundation (completed 2026-10-05)

Built

- npm workspace with `backend/` and `frontend/`, Docker Compose for PostgreSQL, Redis and Mailpit.
- Express 5 API in TypeScript: environment validation, request IDs, structured logs, CORS
  allowlist, standard success and error envelopes, central 404 and error handling.
- `GET /api/v1/health`, `/health/live`, `/health/ready`.
- Next.js app shell, navigation, `/system-status` with loading, online and offline states.
- TanStack Query provider, API client wrapper, `healthApi.getHealth()` and `useHealth()`.
- Design tokens (light and dark), Badge, Card and Spinner components.

Verified

- Backend typecheck, lint and 6 automated tests pass.
- Manual API checks: 200 envelope, 404 envelope, malformed JSON gives 400, request ID is
  echoed, CORS allows only the configured origin, no stack trace in production responses.
- Frontend lint, typecheck and production build pass.
- `/system-status` rendered in a real browser engine in the loading, online and offline states,
  at desktop width and at 375px.

Open items

- **Impeccable is not installed.** Its engine needs the Microsoft Visual C++ runtime, which is
  missing on this machine. After installing the "Visual C++ Redistributable 2015-2022 (x64)"
  run `npx impeccable install -y --providers=claude --scope=project`, then `/impeccable init`.
  Until then `PRODUCT.md` holds the design context and the design pass is done by hand.
- Readiness does not check the database or Redis yet. Database check arrives with Module 1.
- TanStack Query Devtools are wired in; open them from the floating button in development.

Learning notes

- Express 5 forwards rejected promises from async handlers to the error middleware.
- With `"type": "module"` and NodeNext, relative imports need the `.js` extension.
- `NEXT_PUBLIC_` values are inlined at build time; restart `next dev` after changing them.
- An interrupted `npm install` can leave a broken lockfile. Delete `node_modules` and
  `package-lock.json` and install again.

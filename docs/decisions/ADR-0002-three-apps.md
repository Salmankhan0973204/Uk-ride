# ADR-0002: Three apps and a shared package

- Status: Accepted
- Date: 2026-10-16
- Replaces part of: ADR-0001 (the `frontend/` workspace)

## Context

On 2026-10-16 the roadmap changed to follow the customer flow of https://ukride.uk, and the
user set the shape of the project to three apps: a backend, a customer website and an admin
panel. Until then one Next.js app (`frontend/`) held both the customer pages and the admin
screens under `/admin`.

## Decision

- **Four npm workspaces, one lockfile, installed only at the root:**

  | Workspace   | What                                       | Port |
  | ----------- | ------------------------------------------ | ---- |
  | `backend/`  | Express API, unchanged                     | 4000 |
  | `customer/` | Next.js customer website (was `frontend/`) | 3000 |
  | `admin/`    | Next.js admin panel                        | 3001 |
  | `shared/`   | `@ukride/shared`, code both apps use       | -    |

- **`@ukride/shared` is TypeScript source with no build step.** Next.js 16 compiles workspace
  packages itself, so no `transpilePackages` is needed. Inside the package, imports are
  relative (no `@/`), and React is a peer dependency, so both apps use their own single copy.
- **What is shared:**
  - the API client factory `createApiClient({ baseUrl, refreshPath, hintKey })`
  - money, UK time and phone helpers
  - the UI primitives: Card, Badge, Field, Select, Spinner, PasswordInput
  - the glass design system, `shared/styles/glass.css`
- **What each app keeps:**
  - features and pages
  - query keys
  - its own API client instance, in `lib/api/client.ts`, marked `client-only` because the
    access token lives inside it
- **Styles.** Each app's `globals.css` imports Tailwind, then the shared styles, and adds
  `@source '../../../shared/src'`, because Tailwind v4 scans only the app's own folder.
- **Settings.** The backend's `CORS_ORIGINS` allows both apps, and `WEB_APP_URL` became
  `CUSTOMER_APP_URL` and `ADMIN_APP_URL`.
- **Sign-ins.** The admin panel gets its own staff sign-in (step 0.8) with its own cookie,
  token audience and shorter sessions.
  - **The problem.** Without that, the two apps on `localhost` would share one refresh cookie,
    because cookies ignore ports.
  - **Why it matters.** Two refreshes at the same moment would look like a stolen token and
    end every session.

## Consequences

- One `npm install` at the root links all four workspaces; installing inside an app breaks the
  link to `shared/`.
- The backend cannot import `@ukride/shared` (its `tsc` build would not emit it); the API's
  types stay in the backend, and the web apps declare the response types they use.
- Moving a component into `shared/` means rewriting its `@/` imports to relative ones.

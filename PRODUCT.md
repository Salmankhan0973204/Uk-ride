# UkRide product and design context

<!-- impeccable:product-schema 1 -->

This file is the durable product context for every UI module. Read it before building or
reviewing a screen. It is maintained with `/impeccable init`.

## Platform

web

## Product

UkRide is a booking platform for pre-booked private-hire travel in and around London: airport
transfers and A-to-B journeys, booked ahead. Since 2026-10-16 it follows the customer flow of
the live site https://ukride.uk (but not its look, which stays our own).
Customers get a price, book (as a guest or signed in), pay by wallet and/or card, and follow
their journeys. Dispatchers and admins run the operation in a separate admin panel.

## Users

| Role       | Device and situation                                   | What they need most                             |
| ---------- | ------------------------------------------------------ | ----------------------------------------------- |
| Customer   | Phone, often in a hurry, sometimes at an airport       | A price they trust and a clear next step        |
| Driver     | No app of their own yet; the admin panel acts for them | Jobs assigned clearly; a driver API comes later |
| Dispatcher | Desktop, many bookings at once, long sessions          | Density, scanning speed, clear exceptions       |
| Admin      | Desktop, occasional, careful work                      | Accuracy, audit trail, safe destructive actions |

## Product Purpose

Let a customer get an exact price, book, pay and follow a trip, and let the operator's staff
assign and run those trips. UkRide is also a learning project built module by module
(see docs/PROGRESS.md); a module succeeds when its flow works end to end.

## Positioning

UkRide is one private-hire operator's own platform, not a marketplace. A single firm runs its
own fleet, drivers, dispatchers and pricing, and customers book directly with that firm.
Screens never ask a customer to compare or choose between operators.

## Operating Context

Three apps:

- **Backend API** (`backend/`): every rule and every sum of money.
- **Customer website** (`customer/`), mostly used on a phone. Customers:
  - sign up and sign in with a code to their mobile
  - get a quote and book, as a guest or signed in
  - pay from the wallet and/or by card
  - see, pay, edit and cancel their journeys
  - review a finished journey
- **Admin panel** (`admin/`), on a desktop. Admins and dispatchers:
  - manage fleet classes, cars and prices
  - assign drivers and move rides through their statuses
  - credit wallets, and hide or show reviews

Drivers have no app among the three yet; the admin panel acts for them.

## Capabilities and Constraints

- Built so far: the app shell and the `/system-status` screen (Module 0); the `/register`,
  `/login`, `/verify-email`, `/forgot-password` and `/reset-password` screens (Module 1); the
  `/account` profile page with `/account/edit` and `/account/password` (Module 2); the public
  `/vehicles` catalogue and the admin screens under `/admin/vehicle-types` (Module 3); the
  fleet screens under `/admin/vehicles` (Module 4); the `/quote` page and the admin pricing
  screens under `/admin/pricing` (Module 5).
- Planned, in order (docs/PROGRESS.md): the three-app split, then auth, profile, fleet and
  quote rework to the ukride.uk flow, then booking, wallet, card payment, journeys, edit and
  cancel, admin operations, reviews, notifications, a driver API, reports.
- Not built: CMS content pages (blogs, airport, terminal, hotel, station, services, about
  pages), a support contact form, Drive With Us applications, a driver app.
- Prices, payment state and booking status always come from the server.
- Customer-facing copy uses British English.
- Undecided: the operator's trading name and licensing details, service area, and the actual
  fares. The fare rules are built (base fare, per mile, minimum, night and airport surcharges)
  but no real amounts are set. Distances are measured by road between two UK postcodes
  (postcodes.io and the public OSRM demo server, both free); a dependable routing service
  is needed before going live.

## Evidence on Hand

Nothing real exists yet: no logo, photographs, prices, fleet data, reviews or customers. The
five seeded vehicle types are placeholder classes, not a real fleet.
Future work must use clearly marked placeholders and must not invent testimonials, customer
names, ratings, fares, licence numbers or coverage claims.

## Product Principles

1. **One primary action per screen.** Everything else is visibly secondary.
2. **Money is always exact and always from the server.** Show the breakdown, never a guess.
3. **State is never ambiguous.** Loading, empty, error, success and not-allowed each have a
   distinct, designed appearance. Never imply a payment succeeded before the server confirms it.
4. **Status is words first.** Colour supports the label; it is never the only signal.
5. **Different surfaces, one system.** Customer screens are calm and spacious. Driver screens
   are large and blunt. Admin screens are dense. All share the same tokens and components.

## Voice

Plain, short, specific. Say what happened and what to do next.
"We could not reach the server. Try again." Not "Oops! Something went wrong."
British English spelling in customer-facing copy. No exclamation marks, no jokes in errors.

## Brand Commitments

The name is UkRide. The design system is recorded in full in [DESIGN.md](DESIGN.md): tokens,
components and named rules, taken from the shipped code. The visual direction and the avoid list
below are the short version and must agree with it. Where they differ, DESIGN.md wins.

### Visual direction

- Glass on a gradient. The user chose this look on 2026-10-07 ("Glass and gradient", accent
  "Indigo / violet") after rejecting a road-sign direction; it replaces every earlier palette.
  On 2026-10-16 the user chose to keep it rather than copy ukride.uk's black and gold.
- One deep indigo-to-violet backdrop sits behind every page and stays fixed while content
  scrolls. Its colour pools are sized to the viewport and use indigo and violet only. Every
  glass panel has a dark scrim under its fill, so muted text on glass passes 4.5:1 on a phone
  as well as on a desktop.
- Content lives on frosted glass panels: translucent white fill, an 18px backdrop blur, a thin
  light border, a soft shadow. 24px radius on panels, 14px on controls and buttons.
- One accent: an indigo-to-violet gradient, used for the one primary button of a page, the
  brand mark, the avatar and the step that is open. Navigation buttons are glass, never accent. Focus uses a soft violet ring.
- Inputs and the dropdown are glass too. The dropdown is the project's own `Select` component,
  not the browser's list.
- Status is a pill with a coloured dot and words: green, red, amber or neutral.
- Geist Sans for interface text, Geist Mono for technical values.
- One theme. The gradient is the design, so there is no separate light mode.
- Motion is short: panels rise in once, the dropdown opens from its trigger. It is removed
  under `prefers-reduced-motion`. 44px minimum touch target.
- Tokens and shared classes (`.glass`, `.btn`, `.control`, `.pill`) live in
  `shared/styles/glass.css`.

### Avoid

- Gradient text, and glass so transparent that text behind it is hard to read.
- A glass card inside a glass card. Inside a panel, group with divider rows.
- Glows with no offset. Depth comes from a soft shadow that falls below the object.
- Generic grids of identical icon cards.
- Dashboards full of numbers that drive no decision.
- Colour-only status, placeholder-only labels, disabled buttons with no explanation.
- Modals for content that deserves a page; toasts for errors the user must act on.
- Emoji as icons.

## Accessibility & Inclusion

WCAG 2.2 AA. Every screen works by keyboard, has a visible focus style, keeps 4.5:1 text
contrast, announces async results (`role="status"` / `role="alert"`), and fits a 360px wide
screen without horizontal scrolling.

## Review checklist for each module UI

- Is the primary action obvious within two seconds?
- Are loading, empty, error, success and not-allowed states all designed?
- Does it work at 360px, by keyboard, and in dark mode?
- Is every status readable without colour?
- Does the copy say what happened and what to do next?

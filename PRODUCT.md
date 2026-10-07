# UkRide product and design context

<!-- impeccable:product-schema 1 -->

This file is the durable product context for every UI module. Read it before building or
reviewing a screen. It is maintained with `/impeccable init`.

## Platform

web

## Product

UkRide is a booking platform for chauffeur-driven, private-hire travel in the UK, positioned as
an executive chauffeur firm: airport transfers and business travel, booked ahead.
Customers get a price, book a trip, pay and follow the trip. Drivers work through their
assigned jobs. Dispatchers and admins run the operation.

## Users

| Role       | Device and situation                             | What they need most                             |
| ---------- | ------------------------------------------------ | ----------------------------------------------- |
| Customer   | Phone, often in a hurry, sometimes at an airport | A price they trust and a clear next step        |
| Driver     | Phone, in a vehicle, one hand, bright light      | The next action, large targets, no reading      |
| Dispatcher | Desktop, many bookings at once, long sessions    | Density, scanning speed, clear exceptions       |
| Admin      | Desktop, occasional, careful work                | Accuracy, audit trail, safe destructive actions |

## Product Purpose

Let a customer get an exact price, book, pay and follow a trip, and let the operator's staff
assign and run those trips. UkRide is also a learning project built module by module
(see docs/PROGRESS.md); a module succeeds when its flow works end to end.

## Positioning

UkRide is one private-hire operator's own platform, not a marketplace. A single firm runs its
own fleet, drivers, dispatchers and pricing, and customers book directly with that firm.
Screens never ask a customer to compare or choose between operators.

## Operating Context

- Customer: quote, book, pay, then follow the trip, mostly on a phone.
- Driver: receives assigned jobs and works through them on a phone in the vehicle.
- Dispatcher: assigns and monitors many bookings at once on a desktop, in long sessions.
- Admin: maintains vehicle types, fleet vehicles and pricing rules, and reviews reports.

## Capabilities and Constraints

- Built so far: the app shell and the `/system-status` screen (Module 0); the `/register`,
  `/login` and `/account` screens (Module 1).
- Planned, in order: profiles, vehicle types, fleet, pricing and quotes,
  bookings, driver and dispatch operations, Stripe payments and refunds, notifications,
  real-time status and driver location, document uploads, reviews, admin reporting.
- Prices, payment state and booking status always come from the server.
- Customer-facing copy uses British English.
- Undecided: the operator's trading name and licensing details, service area, and the actual
  fare rules.

## Evidence on Hand

Nothing real exists yet: no logo, photographs, prices, fleet data, reviews or customers.
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

The name is UkRide. The visual direction and the avoid list below are binding until a
DESIGN.md replaces them.

### Visual direction

- Glass on a gradient. The user chose this look on 2026-10-07 ("Glass and gradient", accent
  "Indigo / violet") after rejecting a road-sign direction; it replaces every earlier palette.
- One deep indigo-to-violet backdrop sits behind every page and stays fixed while content
  scrolls. It is kept dark enough that white text on glass passes 4.5:1.
- Content lives on frosted glass panels: translucent white fill, an 18px backdrop blur, a thin
  light border, a soft shadow. 24px radius on panels, 14px on controls and buttons.
- One accent: an indigo-to-violet gradient, used for the primary button, the brand mark and the
  step that is open. Focus uses a soft violet ring.
- Inputs and the dropdown are glass too. The dropdown is the project's own `Select` component,
  not the browser's list.
- Status is a pill with a coloured dot and words: green, red, amber or neutral.
- Geist Sans for interface text, Geist Mono for technical values.
- One theme. The gradient is the design, so there is no separate light mode.
- Motion is short: panels rise in once, the dropdown opens from its trigger. It is removed
  under `prefers-reduced-motion`. 44px minimum touch target.
- Tokens and shared classes (`.glass`, `.btn`, `.control`, `.pill`) live in
  `frontend/src/app/globals.css`.

### Avoid

- Gradient text, and glass so transparent that text behind it is hard to read.
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

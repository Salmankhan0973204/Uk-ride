# UkRide product and design context

This file is the durable design context for every UI module. Read it before building or
reviewing a screen. It is the document `/impeccable init` would produce; it was written by
hand because the Impeccable engine could not run on the development machine yet
(see docs/PROGRESS.md, Module 0 notes).

## Product

UkRide is a booking platform for taxis, chauffeurs and private-hire vehicles in the UK.
Customers get a price, book a trip, pay and follow the trip. Drivers work through their
assigned jobs. Dispatchers and admins run the operation.

## Who uses it

| Role       | Device and situation                             | What they need most                             |
| ---------- | ------------------------------------------------ | ----------------------------------------------- |
| Customer   | Phone, often in a hurry, sometimes at an airport | A price they trust and a clear next step        |
| Driver     | Phone, in a vehicle, one hand, bright light      | The next action, large targets, no reading      |
| Dispatcher | Desktop, many bookings at once, long sessions    | Density, scanning speed, clear exceptions       |
| Admin      | Desktop, occasional, careful work                | Accuracy, audit trail, safe destructive actions |

## Principles

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

## Visual direction

- Warm off-white canvas, white surfaces, near-black ink. One accent: taxi amber, used sparingly
  (brand mark, focus ring). Amber is not a button colour on light backgrounds; contrast is too low.
- Semantic colours for status only: success, danger, warning, neutral, each with a soft
  background and a strong foreground.
- Geist Sans for interface text, Geist Mono for references, codes and technical values.
- Borders define structure. Shadows are reserved for things that float (menus, dialogs).
- 8px radius on controls, 12px on cards. 44px minimum touch target.
- Motion is functional and short, and is removed under `prefers-reduced-motion`.
- Light and dark themes come from the same tokens in `frontend/src/app/globals.css`.

## Avoid

- Gradient hero sections, glass effects, decorative blobs and generic card grids.
- Dashboards full of numbers that drive no decision.
- Colour-only status, placeholder-only labels, disabled buttons with no explanation.
- Modals for content that deserves a page; toasts for errors the user must act on.
- Emoji as icons.

## Accessibility baseline

WCAG 2.2 AA. Every screen works by keyboard, has a visible focus style, keeps 4.5:1 text
contrast, announces async results (`role="status"` / `role="alert"`), and fits a 360px wide
screen without horizontal scrolling.

## Review checklist for each module UI

- Is the primary action obvious within two seconds?
- Are loading, empty, error, success and not-allowed states all designed?
- Does it work at 360px, by keyboard, and in dark mode?
- Is every status readable without colour?
- Does the copy say what happened and what to do next?

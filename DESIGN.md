---
name: UkRide
description: Chauffeur-driven travel, booked ahead.
colors:
  bg-from: "#181450"
  bg-to: "#2a1763"
  bg-indigo: "#3730a3"
  bg-violet: "#5b21b6"
  scrim: "rgb(12 10 36 / 0.3)"
  ink: "#ffffff"
  ink-muted: "#cfd0f2"
  glass: "rgb(255 255 255 / 0.1)"
  glass-strong: "rgb(255 255 255 / 0.16)"
  glass-border: "rgb(255 255 255 / 0.22)"
  line: "rgb(255 255 255 / 0.16)"
  menu-surface: "rgb(27 22 74 / 0.97)"
  accent: "#4f46e5"
  accent-2: "#7c3aed"
  ring: "#c4b5fd"
  focus-halo: "rgb(167 139 250 / 0.35)"
  success: "#6ee7b7"
  danger: "#fda4af"
  warning: "#fcd34d"
typography:
  display:
    fontFamily: "Geist, Geist Fallback"
    fontSize: "clamp(2.35rem, 7.6vw, 3.4rem)"
    fontWeight: 600
    lineHeight: 1.04
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Geist, Geist Fallback"
    fontSize: "1.875rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Geist, Geist Fallback"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "-0.025em"
  lead:
    fontFamily: "Geist, Geist Fallback"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.625
  body:
    fontFamily: "Geist, Geist Fallback"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.625
  body-sm:
    fontFamily: "Geist, Geist Fallback"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.43
  label:
    fontFamily: "Geist, Geist Fallback"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.43
  button:
    fontFamily: "Geist, Geist Fallback"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.2
  pill:
    fontFamily: "Geist, Geist Fallback"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.3
  mono:
    fontFamily: "Geist Mono, Geist Mono Fallback"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.43
rounded:
  mark: "8px"
  tile: "12px"
  control: "14px"
  notice: "16px"
  panel: "24px"
  pill: "999px"
spacing:
  field-gap: "8px"
  row-gap: "12px"
  page-gutter: "16px"
  field-stack: "20px"
  panel-pad: "24px"
  section-stack: "28px"
  panel-pad-wide: "32px"
  touch-min: "44px"
  control-height: "48px"
components:
  panel:
    backgroundColor: "{colors.glass}"
    textColor: "{colors.ink}"
    rounded: "{rounded.panel}"
    padding: "24px"
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "0.75rem 1.4rem"
    height: "3rem"
  button-ghost:
    backgroundColor: "{colors.glass}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "0.75rem 1.4rem"
    height: "3rem"
  button-ghost-hover:
    backgroundColor: "{colors.glass-strong}"
    textColor: "{colors.ink}"
  nav-bar:
    backgroundColor: "{colors.glass}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "6px 6px 6px 20px"
  nav-link:
    textColor: "{colors.ink-muted}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "0 16px"
    height: "44px"
  nav-link-hover:
    backgroundColor: "{colors.glass}"
    textColor: "{colors.ink}"
  nav-link-active:
    backgroundColor: "{colors.glass-strong}"
    textColor: "{colors.ink}"
  input:
    backgroundColor: "rgb(255 255 255 / 0.08)"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "0 1rem"
    height: "3rem"
  input-focus:
    backgroundColor: "rgb(255 255 255 / 0.14)"
    textColor: "{colors.ink}"
  select-menu:
    backgroundColor: "{colors.menu-surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.notice}"
    padding: "6px"
  select-option:
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.tile}"
    padding: "0 14px"
    height: "44px"
  select-option-active:
    backgroundColor: "{colors.glass-strong}"
    textColor: "{colors.ink}"
  pill:
    backgroundColor: "{colors.glass}"
    textColor: "{colors.ink}"
    typography: "{typography.pill}"
    rounded: "{rounded.pill}"
    padding: "0.25rem 0.75rem"
  notice-danger:
    backgroundColor: "rgb(253 164 175 / 0.12)"
    textColor: "{colors.danger}"
    typography: "{typography.label}"
    rounded: "{rounded.notice}"
    padding: "12px 16px"
  notice-warning:
    backgroundColor: "rgb(252 211 77 / 0.12)"
    textColor: "{colors.ink}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.notice}"
    padding: "12px 16px"
  notice-success:
    backgroundColor: "rgb(110 231 183 / 0.12)"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.notice}"
    padding: "12px 16px"
  accent-tile:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.ink}"
    rounded: "{rounded.tile}"
    size: "40px"
---

# Design System: UkRide

## Overview

**Creative North Star: "Glass on a gradient"**

Every page sits on one deep indigo-to-violet backdrop that stays fixed while the content scrolls. Content lives on frosted glass panels: a faint white fill, a blur of whatever is behind, a thin light border and a soft shadow that falls below the panel. The feel is calm and spacious, with white text, large touch targets and few colours. This is the customer-facing register; driver and admin screens do not exist yet, so nothing here describes them.

The look was chosen by the user on 2026-10-07 ("Glass and gradient", accent "Indigo / violet") after an earlier road-sign design was rejected on sight. An independent finish review on 2026-10-08 found eight issues; all were fixed, and the rules that came out of it are recorded below as named rules. This file describes what the shipped code does. The source of every token is `frontend/src/app/globals.css`. It is the full record of the design system; PRODUCT.md carries a short version of the visual direction, and where the two differ this file wins.

One thing is deliberately outside this system: the HTML emails sent by the backend (`backend/src/modules/auth/auth.emails.ts`) use Arial on a light layout, because mail clients do not load web fonts or support backdrop blur. Do not copy the email styling into the web app, and do not "fix" the emails to match the web app.

**Key Characteristics:**
- One fixed backdrop of indigo and violet, behind every page.
- Frosted glass panels with a dark scrim under the fill, so text stays readable.
- One accent, an indigo-to-violet gradient, used sparingly.
- Status shown as a pill with a coloured dot and words.
- One typeface family (Geist), white and one muted lavender for text.
- One dark theme. There is no light mode.

## Colors

A narrow palette: two hues (indigo and violet) for the backdrop and the accent, white and one lavender for text, translucent white for glass, and three pastel status colours.

### Primary
- **Accent Indigo** (`accent`) and **Accent Violet** (`accent-2`): the two ends of the one accent gradient. It fills the primary button (at 135 degrees) and the small accent tiles (corner to corner): the brand mark, the account avatar and the number of the step that is open. White text on its two ends measures 6.29:1 and 5.70:1.
- **Focus Lavender** (`ring`): the focus outline on links and buttons, the border of a focused input, the text cursor, the tick beside the chosen dropdown option, and the underline under text links (at 70% strength, full strength on hover).
- **Focus Halo** (`focus-halo`): the 4px ring around a focused input or an open dropdown trigger. The same violet at 55% is the text selection colour.

### Neutral
- **Deep Indigo Base** (`bg-from`) and **Deep Violet Base** (`bg-to`): the 155 degree base gradient of the backdrop. `bg-from` is also the page background colour behind the backdrop.
- **Indigo Pool** (`bg-indigo`) and **Violet Pool** (`bg-violet`): four soft radial pools of colour laid over the base, one near each corner.
- **Scrim** (`scrim`): a dark layer painted under the white fill of every glass panel.
- **Ink** (`ink`): all primary text and icons.
- **Muted Ink** (`ink-muted`): secondary text, hints, placeholders, inactive navigation links, labels in detail rows. Measures about 10:1 on the base gradient and about 6:1 on the raw pool colours.
- **Glass** (`glass`), **Strong Glass** (`glass-strong`): the fill of a panel or glass button, and the stronger fill for hover, the active navigation link and the highlighted dropdown option.
- **Glass Border** (`glass-border`): the 1px border of panels, glass buttons, inputs and pills. Panels brighten the top edge to white at 34%, as if light catches it.
- **Line** (`line`): divider rows inside a panel, and the outline of a step that is not open yet.
- **Menu Surface** (`menu-surface`): the nearly opaque fill of the open dropdown list.

### Tertiary
The status colours.

- **Mint** (`success`), **Rose** (`danger`), **Amber** (`warning`): the dot in a status pill, error text under a field, and the border and tint of notices. They are pastel on purpose so they read on dark glass (roughly 8:1 to 10:1 on the base). A neutral pill uses Muted Ink for its dot.

### Named Rules
**The Two-Hue Rule.** The backdrop uses indigo and violet only, the two colours the look was chosen in. Its pools are sized in viewport units (`vw` and `vh`), so a phone and a wide monitor get the same picture: colour behind the content, never a flood and never an empty void.

**The Scrim Rule.** Every glass panel paints the dark scrim under its white fill. This is what keeps Muted Ink above 4.5:1 on a phone, wherever the panel happens to sit on the backdrop. A new glass surface without the scrim is a contrast bug.

**The One Accent Rule.** There is one accent gradient. A page has at most one gradient button, and it is that page's main action. Navigation buttons are glass, never accent. Outside the button, the same gradient appears only on the small accent tiles.

**The Words First Rule.** Status is always written in words. The coloured dot supports the label and is never the only signal.

## Typography

**Display Font:** Geist (loaded with `next/font`, exposed as `--font-geist-sans`)
**Body Font:** Geist
**Label/Mono Font:** Geist Mono (exposed as `--font-geist-mono`)

**Character:** One clean geometric sans for everything, set in semibold with slightly tight tracking for headings and regular weight for reading text. Hierarchy comes from size, weight and the two ink colours, not from a second typeface.

### Hierarchy
- **Display** (600, `clamp(2.35rem, 7.6vw, 3.4rem)`, line-height 1.04, tracking -0.025em): the home page headline only. It wraps freely on small screens and is broken by hand into two lines from 1024px up.
- **Headline** (600, 1.875rem rising to 2.25rem from 640px, line-height 1.25, tracking -0.025em): the one `h1` at the top of a form or account panel. The system status page, whose title sits on the backdrop instead of in a panel, uses one step larger (2.25rem rising to 3rem).
- **Title** (600, 1.25rem, tracking -0.025em): the heading of a panel that is not the page title, such as "API" or "Live system status".
- **Lead** (400, 1.125rem, line-height 1.625, Muted Ink): the sentence under a page title that sits on the backdrop. Kept to about 42 characters wide on the home page.
- **Body** (400, 1rem, line-height 1.625): the sentence under a panel headline, and text typed into inputs.
- **Small** (400, 0.875rem): hints, footnotes, detail-row labels, helper sentences. Usually Muted Ink.
- **Label** (500, 0.875rem): field labels, navigation links, the "Show" / "Hide" control. The "Optional" marker beside a label is 0.75rem, regular, Muted Ink.
- **Button** (600, 1rem, line-height 1.2) and **Pill** (600, 0.875rem, line-height 1.3).
- **Mono** (Geist Mono, 400, 0.875rem): technical values in detail rows on the status page, such as version, address and request ID.

### Named Rules
**The Technical Values Rule.** Geist Mono is for values a machine produced (a version, a URL, an ID). Everything a person reads as language, including status labels inside a mono row, is Geist.

**The Lined-Up Numbers Rule.** Numbers that sit in a column (phone numbers, dates in detail rows) use tabular figures so digits line up.

## Layout

One centred column, at most 1024px wide, with 16px side gutters that grow to 24px from 640px. The navigation bar floats above it, 12px from the top (16px from 640px), and stays there while the page scrolls. Page content starts 40px below the bar (56px from 640px) and ends with 64px of space (96px from 640px).

Forms and single-purpose panels are narrow and centred: 576px at most for register and account, 448px for sign in, forgot password, reset password and email confirmation. The status page puts two panels side by side from 1024px; the home page splits into a wide text column and a narrower panel (1.3 to 0.7) from 1024px. Below those widths everything stacks in one column. Only two breakpoints are in use: 640px and 1024px.

Spacing follows a 4px step. The recurring distances are: 8px from a label to its control, 20px between fields, 28px between the sections of a panel, 24px of padding inside a panel (32px from 640px), and 12px to 16px between items in a row. Detail rows are a label on the left and a value on the right, separated by divider lines, with about 12px to 14px above and below.

**The 44px Rule.** Anything a finger presses is at least 44px tall: navigation links, dropdown options, compact buttons and the "Show" / "Hide" control. Standard buttons and inputs are 48px. Layouts must fit a 360px wide screen without sideways scrolling; long button labels wrap and stay centred instead of being cut off.

## Elevation & Depth

Depth is a hybrid of translucency and soft shadows. A panel is separated from the backdrop by its blur (18px, with saturation raised to 140%), its light border and a wide, soft shadow that falls below it. There are only three levels: the backdrop, glass panels on it, and the dropdown menu above a panel. The menu is nearly opaque, because nothing behind it may show through the options.

Where the browser does not support backdrop blur, a panel falls back to a nearly solid indigo fill (`rgb(40 34 92 / 0.92)`) so text stays readable.

### Shadow Vocabulary
- **Panel** (`box-shadow: 0 24px 60px -20px rgb(8 6 30 / 0.65), inset 0 1px 0 rgb(255 255 255 / 0.18)`): every glass panel and the navigation bar. The inset line is the light on the top edge.
- **Menu** (`box-shadow: 0 24px 60px -12px rgb(4 3 20 / 0.85), inset 0 1px 0 rgb(255 255 255 / 0.14)`): the open dropdown list.
- **Primary button** (`box-shadow: 0 12px 26px -10px rgb(20 8 60 / 0.9), inset 0 1px 0 rgb(255 255 255 / 0.25)`): at rest. On hover it deepens to `0 16px 30px -10px rgb(20 8 60 / 0.95), inset 0 1px 0 rgb(255 255 255 / 0.3)`.
- **Lift** (`box-shadow: 0 10px 20px -8px rgb(20 8 60 / 0.9)`): under an accent tile (brand mark, avatar, open step).
- **Focus ring** (`box-shadow: 0 0 0 4px rgb(167 139 250 / 0.35)`): around a focused input. An invalid input uses `0 0 0 4px rgb(253 164 175 / 0.22)`.

### Named Rules
**The Falling Shadow Rule.** Depth is a soft shadow with a vertical offset, in a dark indigo, that falls below the object. No coloured glow with zero offset around buttons, tiles or panels. The focus ring on inputs is not a glow: it is a hard-edged 4px ring with no blur, and it stays.

**The No Nesting Rule.** No glass panel inside a glass panel. Inside a panel, group things with divider rows. A tinted notice (see Components) is the one bordered box allowed inside a panel; it has no blur and no shadow.

**The One Theme Rule.** There is one dark theme. The gradient is the design, so there is no light mode and no theme switch.

## Shapes

Everything is rounded, and the radius grows with the size of the object: 8px for the brand mark, 12px for small tiles and dropdown options, 14px for buttons and inputs, 16px for notices, the dropdown list and the larger tiles (avatar, success tick), 24px for panels. Status pills, navigation links and the navigation bar itself are fully rounded.

Borders are always 1px and translucent white. There are no thick borders, no side stripes and no solid fills other than the accent gradient.

Icons are drawn inline as SVG on a 24 unit grid: one stroke in the current text colour, 2 to 2.5 wide, with round caps and joins. The brand mark is a white "U" drawn as a single stroke on an accent tile.

## Components

### Buttons
- **Shape:** softly rounded (14px), at least 48px tall, padding 0.75rem by 1.4rem, semibold label. A label may wrap to two lines on a narrow phone.
- **Primary:** the Accent Indigo to Accent Violet gradient at 135 degrees, white label, the primary button shadow. One per page.
- **Ghost:** glass fill, glass border, white label, no shadow. Used for every secondary action and for "Sign up" in the navigation bar (there it is fully rounded and 44px tall).
- **Hover / Active:** primary brightens by 10% and its shadow deepens; ghost switches to Strong Glass. Both shrink to 98% while pressed. Transitions take 180ms.
- **Busy:** a button is disabled only while its own request is running. It fades to 70%, shows a spinner where there is room, and its label changes to say what is happening ("Signing you in").
- **Compact:** a 44px tall ghost button with small text, for a secondary action inside a row or notice.

### Status pill
- **Style:** fully rounded, glass fill and border, an 8px dot followed by a short semibold label. Never wraps.
- **Variants:** success (Mint dot), danger (Rose dot), warning (Amber dot), neutral (Muted Ink dot). The label carries the meaning, for example "Online", "Down", "Not confirmed", "Soon".

### Panels
- **Corner Style:** 24px.
- **Background:** the scrim under the Glass fill, with the backdrop blurred behind.
- **Shadow Strategy:** the Panel shadow from Elevation & Depth.
- **Border:** 1px Glass Border, brighter on the top edge.
- **Internal Padding:** 24px, 32px from 640px.
- **Inside a panel:** a headline or title, then sections 28px apart. Lists of facts are detail rows split by 1px lines, not smaller cards.

### Inputs / Fields
- **Style:** 48px tall, 14px radius, a faint white fill (8%), 1px Glass Border, white text at 1rem, Muted Ink placeholder. Text inputs and the dropdown trigger share this look.
- **Field:** a visible label above (8px gap), then the control, then one line below it: a hint in Muted Ink, replaced by the error when there is one.
- **Hover / Focus:** the border brightens on hover. On focus the border turns Focus Lavender, the fill brightens to 14% and the 4px Focus Halo appears.
- **Error:** Rose border and a Rose 4px ring on the control; under it, a small alert icon and the message in Rose, medium weight.
- **Password:** a "Show" / "Hide" text control sits inside the right end of the input. New forms use the shared `PasswordInput` component (`frontend/src/components/ui/PasswordInput.tsx`).
- **Text area:** the same look, three lines tall to start, 12px of padding above and below, resizable downwards only.
- **Numbers:** a text input with a numeric keyboard, not the browser's number spinner.
- **Autofill:** the browser's yellow or blue autofill colour is suppressed so the field stays glass.

### Dropdown (Select)
The project's own dropdown, not the browser's list. The trigger looks like an input with a chevron that turns over when open. The list opens 8px below the trigger on the Menu Surface, with 16px corners and 6px of padding. Each option is a 44px row with 12px corners; the highlighted row is Strong Glass, and the chosen row shows a Focus Lavender tick. A "No answer" row in Muted Ink clears an optional field. It is fully keyboard operable (arrows, Home, End, Enter, Space, Escape, type a letter to jump).

### Navigation
A floating glass bar, fully rounded, as wide as the content column. Brand mark and name on the left; links on the right. A link is a 44px tall, fully rounded target in Muted Ink at label size; hover gives it a Glass fill and white text, and the current page gets a Strong Glass fill. On screens narrower than 640px the "Vehicles" link is hidden, and "Status" below 768px; the home page links to both. When signed in, the links collapse to one link named after the person. A link stays highlighted on the sub-pages of its section.

### Notices
A tinted box inside a panel for a message about the whole form or page: 16px corners, a 1px border in the status colour at 50%, and a fill of the same colour at about 12%. An error notice sets its text in Rose, medium weight, small size. A warning notice keeps white text and may hold one compact ghost button. A confirmation is a warning notice that asks a question in its first, semibold sentence and holds two compact ghost buttons: the answer that does it ("Yes, switch it off") and the one that does not ("Keep it on"). It opens under the row it is about, takes focus, and closes on Escape. A success notice (Mint border and tint, white text, medium weight) sits at the top of a panel to confirm something that was just saved.

### Tables
For staff screens, where rows are compared. A real `table` inside a panel: a header row in Muted Ink at label size between two 1px lines, then rows split by 1px lines. Numbers are right-aligned with tabular figures. The first cell holds the name in semibold with its slug below in Geist Mono and Muted Ink; a row that is switched off sets its name in Muted Ink. The last cell holds compact ghost buttons, right-aligned. Status is a pill. As the screen narrows, columns are hidden and their values fold into the first cell (position below 1024px, counts below 768px, status below 640px), so the page never scrolls sideways.

### Accent tiles
A small rounded square filled with the same Accent Indigo to Accent Violet gradient as the primary button, with the Lift shadow. Three uses: the brand mark (28px, 8px corners), the open step number (40px, 12px corners) and the account avatar (56px, 16px corners). A step that is not open is the same size with a Line outline and no fill. A neutral tile (Strong Glass fill, Glass Border, 48px, 16px corners) holds the Mint tick on success screens.

### Text links
White, medium weight, with a 2px underline in Focus Lavender at 70%, set 4px below the text. The underline goes to full strength on hover.

### Loading
A small spinner in the current text colour, always beside words that say what is loading ("Loading your account"). Loading, success and failure are announced to screen readers.

### Motion
Panels rise in once when a page loads: 14px upward with a fade, over 520ms on a strong ease-out curve (`cubic-bezier(0.16, 1, 0.3, 1)`), each later panel 90ms after the one before. The dropdown list opens from its trigger in 160ms. Hover and focus changes take 160ms to 200ms. All of it is switched off under `prefers-reduced-motion`.

## Do's and Don'ts

### Do:
- **Do** put content on a glass panel with the scrim under its fill, a 1px Glass Border and the Panel shadow.
- **Do** use the gradient button once per page, for the main action, and glass buttons for everything else.
- **Do** group facts inside a panel as detail rows split by 1px Line dividers.
- **Do** write every status as a pill with a dot and words.
- **Do** give every field a visible label, and show its error directly under the control.
- **Do** keep every pressable target at least 44px tall, and check each screen at 360px wide.
- **Do** use Geist for interface text and Geist Mono only for machine-produced values.
- **Do** draw icons as inline single-stroke SVG in the current text colour.
- **Do** keep motion short and remove it under `prefers-reduced-motion`.
- **Do** reuse the shared classes in `frontend/src/app/globals.css` (`.glass`, `.btn`, `.btn-primary`, `.btn-ghost`, `.control`, `.pill`, `.lift`, `.tabular`, `.rise`, `.pop`) before writing new styles.

### Don't:
- **Don't** add a colour outside indigo and violet to the backdrop, or size its pools in pixels.
- **Don't** make a glass surface without the scrim, or so transparent that text on it is hard to read.
- **Don't** put a glass panel inside a glass panel.
- **Don't** use the accent gradient for navigation buttons, or for a second button on the same page.
- **Don't** add a glow with zero offset. Depth is a soft shadow that falls below the object.
- **Don't** use gradient text.
- **Don't** add a light mode or a theme switch.
- **Don't** use the browser's native select list; use the project's own dropdown.
- **Don't** use emoji as icons.
- **Don't** show status by colour alone, or label a field with its placeholder only.
- **Don't** carry the Arial, light-background email styling into the web app.

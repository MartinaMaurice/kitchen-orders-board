# Kitchen Orders Board

An Angular 18 app for restaurant staff to track orders from creation to serving. Built for the
Kitchen Orders Board take-home task, against the provided `json-server` mock API.

## Setup

Requires Node 18.19+ (built and tested on Node 22) and npm.

```bash
npm install

# Terminal 1 — mock API on http://localhost:3000
npx json-server@1.0.0-beta.3 db.json --port 3000

# Terminal 2 — app on http://localhost:4200
npm start
```

Open `http://localhost:4200`. `json-server` writes back to `db.json` as you use the app (moving
orders, creating new ones) — copy it aside first if you want to reset the seed data.

### Running tests

```bash
npm test          # unit tests (Karma/Jasmine), headed Chrome
npm test -- --no-watch --browsers=ChromeHeadless   # CI-style single run
```

35 specs covering the price calculator, the custom validators, the drag-and-drop forward-only
rule, and two components (`OrderCardComponent`, `AppComponent`).

## What's implemented

All seven core requirements, plus every optional bonus:

- **Board** at `/orders` with four live-counted columns, search (debounced) by order/table
  number, type filter, both synced to URL query params.
- **Move forward**: a button on every card (`PATCH /orders/:id`), optimistic UI with rollback +
  toast on failure. Cards can also be **dragged** into the next column (see bonuses below).
- **Order details** at `/orders/:id`, lazy-loaded, full price breakdown, handles a missing id.
- **New order** at `/orders/new`, lazy-loaded, dynamic item rows, custom validators, live running
  total, submit-guarding.
- **Auto-refresh** every 15s, no overlapping requests, stops when you leave the board.
- Loading / empty / error states everywhere; usable down to 375px.

**Bonus (all five, since the brief said pick one or two — the app is small enough that doing all
of them didn't cost much extra time):**

1. **Unit tests** — `pricing.util`, `order-status.util`, the custom validators, `OrderCardComponent`,
   `OrderColumnComponent`'s drag-and-drop rules, `AppComponent`.
2. **Arabic / English toggle with RTL** — a real on/off switch in the header; flipping it sets
   `<html dir>` globally via a signal effect, so every page mirrors correctly (see
   `TranslationService`).
3. **`OnPush` everywhere** — every component in the app.
4. **Pause polling while the tab is hidden** — `VisibilityService` wraps the Page Visibility API;
   polling resumes (with an immediate refresh) the moment the tab is foregrounded again.
5. **Deployed demo** — see [Deployment](#deployment) below.

## Architecture & key decisions

**Feature folders, thin components, fat services.** `core/services` owns all HTTP access and
state (`OrdersService`, `MenuService`); components read signals and call service methods.
`Components should not call HttpClient directly` is enforced by convention — nothing outside
`core/services` imports `HttpClient`.

**Signals for state, RxJS for async plumbing.** `OrdersService.orders` is a signal that
components read directly in templates (`orders()`), which pairs naturally with `OnPush` — no
`async` pipe wiring needed. RxJS is used where it's the right tool: the polling stream
(`timer` + `merge` + `exhaustMap`), debounced search (`debounceTime` + `distinctUntilChanged`),
and reactive forms (`valueChanges`). Both APIs bridge cleanly via `toSignal`/`takeUntilDestroyed`,
so there's one subscription-management story throughout (`takeUntilDestroyed`, or ownership by a
component's `constructor`/`ngOnDestroy` for the long-lived poll).

**Polling: `merge(timer(0, 15000), visibility.becameVisible$).pipe(filter(...), exhaustMap(...))`.**
`exhaustMap` is the reason a tick is dropped instead of queued while a request is still in
flight — the brief asked for no overlapping requests, and `exhaustMap` is the one flattening
operator that does that by construction (`switchMap` would cancel-and-restart, `mergeMap` would
overlap, `concatMap` would queue up a backlog if the API is ever slow). The board component
subscribes with `takeUntilDestroyed()`, so polling stops the instant the board is destroyed —
there's nothing to manually clean up.

**Optimistic updates.** `OrdersService.updateStatus()` patches the local `orders` signal
immediately, fires the `PATCH`, and reverts that one order (only that one — not a full refetch)
if the request errors, while the component surfaces a toast. This keeps the UI instant on the
happy path without ever showing stale data on failure.

**Modals instead of full-page navigation for new-order / details.** The brief specifies
`/orders/new` and `/orders/:id` as lazy routes — those are unchanged. What changed is *where they
render*: they're children of the `orders` route, rendering into the board component's own
`<router-outlet>` and styled as a modal overlay (`ModalOverlayComponent`) instead of replacing the
whole page. This means the board — and its polling — stays mounted underneath while you fill in a
new order or check an order's details, and the URLs, lazy loading and the ability to deep-link or
refresh into `/orders/new` all still work exactly as specified.

**Drag-and-drop (`@angular/cdk/drag-drop`) as a second way to advance an order,** alongside the
required button. `cdkDropListEnterPredicate` only allows a card to enter the column that is its
*immediate* next status (checked against `nextStatus()`, the same pure function the button path
uses), so you can't drag a New order straight to Served. Dropping just calls the same
`updateStatus()` used by the button — one code path, two input methods. The button remains the
primary, always-available action (keyboard and touch-drag-averse users included).

**Custom validators** (`shared/validators/order-form.validators.ts`): `egyptianPhoneValidator`
(`/^01[0125]\d{8}$/`, only rejects a *non-empty* bad value — `Validators.required` is layered on
separately and only when the order type is `delivery`), `tableNumberValidator` (integer 1–40),
and `minItemsValidator` for the items `FormArray`. Table/phone requiredness is toggled at runtime
via `setValidators()` on the order-type control's `valueChanges`, rather than two near-duplicate
forms.

**Pricing** (`shared/utils/pricing.util.ts`) is a pure function, independent of Angular, taking
`items` + `menu` and returning subtotal/service/VAT/total plus joined line items. It's used
identically by the order card (subtotal only, per the brief's "card totals are subtotals"), the
details page (full breakdown), and the new-order form (running total) — verified against both
worked examples in the brief (#1041 dine-in → 574.56, #1044 delivery → 273.60).

**Kanban layout, not a long page.** The board is a fixed-height flex layout (header/filters fixed,
`flex: 1; min-height: 0` for the column row) so each column scrolls its own card list instead of
the whole page growing. Below 900px the column row becomes a horizontally-scrolling, snap-aligned
strip instead of stacking, since a kitchen display benefits more from seeing all four statuses at
a glance than from a single long vertical list.

**i18n** is a small hand-rolled `TranslationService` (a `lang` signal, a flat key→string
dictionary per language, `{{token}}` interpolation, `.plural()` for count-based strings) rather
than `@angular/localize` — localize is build-time (one bundle per locale) which doesn't fit a
runtime toggle, and a full i18n library was overkill for ~70 strings in two languages.

## Assumptions

- **Next order number** is `max(existing order numbers, 1000) + 1`, fetched once when the new-order
  form opens. Two staff members submitting at the exact same instant could in theory collide;
  acceptable for this scope, called out here as a known limitation.
- **Advancing an order is serialized app-wide** (one in-flight `PATCH` at a time, tracked by a
  single `advancingId` signal) rather than per-card, to keep the double-submission guard simple.
  In practice a `PATCH` against local `json-server` resolves in milliseconds, so this is not
  noticeable in use.
- **A card's own line breakdown needs the menu** even on the board (to compute the subtotal shown
  on the card), so `MenuService` is loaded by both the board and the details/new-order pages;
  it's fetched once and shared via `shareReplay`.
- Where the brief left the visual design open, decisions favored a dense, kanban-style operational
  view (a kitchen display, not a marketing page) — for example the horizontally-scrolling column
  strip on narrow screens over full vertical stacking, since staff cross-reference all four
  columns at once.

## What I'd improve with more time

- Per-card (rather than app-wide) submission locking during status advances.
- A proper i18n extraction workflow (or a switch to `@angular/localize`) if the string count grew
  much further — the hand-rolled dictionary is fine at this size but wouldn't scale gracefully.
- E2E coverage (Playwright/Cypress) for the polling/rollback/drag-and-drop flows — the current
  suite is unit-level only, per the brief's "meaningful unit tests" bonus.
- Keyboard-operable drag-and-drop (the CDK supports it) as an accessibility follow-up to the
  mouse/touch drag.
- A small backend-agnostic mapping layer if this ever needed to point at a real API with different
  field names, instead of the current 1:1 mapping to `db.json`'s shape.

## Deployment

The production build (`npm run build`) points `environment.production.ts` at
`my-json-server.typicode.com/<github-user>/<repo>`, which serves this repo's `db.json` as a REST
API with no server to host — update that URL after pushing to GitHub, then deploy `dist/` to
Vercel/Netlify/GitHub Pages. Note that `my-json-server` resets its in-memory writes periodically
and only reads `db.json` from the repo's default branch, so it's a good fit for a read-mostly demo
rather than a persistent deployment.

## Tech

Angular 18 (standalone components, `strict` TypeScript), RxJS + Signals, `@angular/cdk`
(drag-drop only — no Material), no admin template, no UI kit beyond CDK's headless drag-drop
primitives.

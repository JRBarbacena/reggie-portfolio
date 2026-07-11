# Reggie — Portfolio

A fully static, zero-backend personal portfolio site built with vanilla HTML,
CSS, and JavaScript. Apple-inspired minimalism, a neumorphic soft-UI treatment,
and a MotoGP-first racing color palette (Formula 1 colors used only as secondary
accents).

## Pages

Home · Tech · Travel · Life · Designs. The primary pages appear as direct
navigation links; **Designs** (and any future pages) live behind the "…"
overflow menu.

## Structure

```
/                     deployable as-is — copy to any static host
├── index.html        Home (default entry point)
├── tech.html         Tech (education / career / job)
├── travel.html       Travel (experiences, trips, places)
├── life.html         Life (interests outside work/study)
├── designs.html      Designs (design work / visual projects)
├── css/
│   ├── tokens.css        design system — single source of truth
│   ├── base.css          reset, layout container, type scale
│   ├── neumorphism.css   soft-UI surfaces + resting/hover/pressed states
│   ├── motion.css        CSS-only motion + reduced-motion policy
│   ├── components.css     reusable themed components
│   └── main.css          the only stylesheet each page links (@imports above)
├── js/
│   ├── pages.js          page registry (single source of truth)
│   ├── nav-model.js      pure navigation logic (no DOM)
│   ├── site-nav.js       <site-nav> web component
│   ├── a11y.js           contrast + heading-order helpers
│   ├── motion.js         IntersectionObserver reveal trigger (no GSAP)
│   └── asset-guard.js    graceful asset-failure handling
├── assets/           images/ · fonts/
└── tests/            unit/ (Vitest + fast-check) · e2e/ · helpers/
```

## Design system

All colors, typography, spacing, shadows, and motion values are defined once in
`css/tokens.css` as CSS custom properties. Change a token there and it updates
every page.

## Motion

Motion is CSS-only (transitions + `@keyframes`, animating `transform`/`opacity`).
`js/motion.js` merely toggles a class to trigger scroll reveals — no animation
library. All non-essential motion respects `prefers-reduced-motion`.

## Development

The shipped site needs no build step. Tooling below is for testing only.

```bash
npm install     # install dev/test tooling (not shipped)
npm test        # run unit + property-based tests (Vitest + fast-check)
```

To preview locally, serve the folder with any static server, e.g.:

```bash
npx serve .
```

## Testing

- **Property-based tests** (Vitest + fast-check, ≥100 iterations) cover the
  navigation model, contrast math, and heading-order validation.
- **DOM tests** (jsdom) cover the `<site-nav>` component rendering and active
  state, including the overflow-page case.
```

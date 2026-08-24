# Reggie — Portfolio

Static personal portfolio (vanilla HTML, CSS, and JavaScript). No build step for
the site itself — Vercel serves the repo root. Dev tooling is only for tests and
CI quality gates.

## Docs

| Doc | Purpose |
|-----|---------|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Layers, routing, deploy, CI map |
| [docs/ADD_A_PAGE.md](docs/ADD_A_PAGE.md) | Checklist for adding a page |
| [docs/DESIGN_TOKENS.md](docs/DESIGN_TOKENS.md) | Colors, type, space, motion tokens |
| [docs/CI.md](docs/CI.md) | Workflows, local reproduction, failures |

## Pages

Home · Tech · Travel · Life · Designs. Primary pages are top-level nav links;
**Designs** (and future overflow pages) live under the “More” menu.

Clean URLs (`/tech`, `/travel`, …) are enabled by Vercel `cleanUrls`. On disk the
files remain `tech.html`, `travel.html`, etc.

## Structure

```
/
├── index.html, tech.html, travel.html, life.html, designs.html, 404.html
├── css/          tokens → base → neumorphism → components → motion (via main.css)
├── js/           pages registry, nav, footer, page modules, a11y helpers
├── assets/       images (photos, certificates, brand)
├── tests/unit/   Vitest + fast-check
├── scripts/      static/responsive QA + local a11y helper
├── docs/         architecture and rebuild guides
└── .github/      CI workflows + Dependabot
```

## Local development

```bash
npm install
npm run serve          # static preview on :5173 (cleanUrls via serve.json)
npm test               # unit + property tests
npm run qa             # static + responsive QA + tests
npm run lhci           # Lighthouse CI (npx-pinned; not in package-lock)
```

Link checking uses [lychee](https://lychee.cli.rs/) with [`lychee.toml`](lychee.toml).
See [docs/CI.md](docs/CI.md) for the exact commands CI runs.

## Design notes

- Design tokens live only in `css/tokens.css`.
- Navigation is driven by `js/pages.js` → `nav-model.js` → `<site-nav>`.
- Motion is CSS-first; `js/motion.js` only toggles reveal classes.
- Accent colors used as text/links meet WCAG AA (≥ 4.5:1) on `--bg-base`.

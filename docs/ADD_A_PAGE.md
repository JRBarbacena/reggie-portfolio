# Adding a page

Use this checklist whenever you add a route to the portfolio.

## 1. Register the page

Edit [`js/pages.js`](../js/pages.js):

```js
{ id: "studio", label: "Studio", href: "/studio", tier: "primary" }
// or tier: "overflow" for the More menu
```

- `id` must match `active-page` on the HTML page.
- `href` must be the **clean** path (no `.html`); Vercel `cleanUrls` maps it to
  `studio.html` on disk.
- Array order = nav order.

## 2. Create the HTML shell

Copy an existing page (e.g. `designs.html`) to `studio.html`:

- Set `<title>`, meta description, and one `<h1>`.
- `<site-nav active-page="studio"></site-nav>`
- Link `css/main.css` and the shared scripts (`preloader`, `site-nav`,
  `site-footer`, `motion`, `asset-guard`, …).
- Prefer relative asset paths for page-local media; root paths
  (`/assets/...`) are fine for brand icons (lychee resolves them via
  `root_dir`).

## 3. Styles and behavior

- Prefer tokens from `css/tokens.css` — do not hardcode palette values.
- Add page-specific JS only if needed; keep shared behavior in existing modules.
- Update unit tests if nav shape or active-state logic changes
  (`tests/unit/nav-model.test.js`, `tests/unit/site-nav.test.js`).

## 4. Quality gates

| Gate | Update |
|------|--------|
| Lighthouse | Add the page to `.lighthouserc.json` → `ci.collect.url` |
| Link check | Clean paths are covered by `fallback_extensions = ["html"]` in `lychee.toml` if the file is `studio.html` |
| Portfolio QA | Ensure `npm run qa` still passes |
| Accent contrast | If you introduce new text colors, assert ≥ 4.5:1 on `--bg-base` in `tests/unit/a11y.test.js` |

## 5. Content and deploy

1. Add images under `assets/images/…` with descriptive `alt` text.
2. Preview with `npm run serve` and open `/studio`.
3. Open a PR — CI runs QA, Lighthouse, lychee, and `npm audit`.

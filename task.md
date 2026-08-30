# Portfolio Delivery and Correction Plan

Status: React production cutover implemented; provider connection configured; production promotion pending
Last reviewed: 2026-08-30
Scope: Home, Tech, Travel, Life, shared navigation/footer, motion, build generation, quality gates, and deployment readiness

This file replaces the previous task sequence. The old sequence contained steps that did not execute reliably and must not be retried. Work should proceed only from the current repository state and the commands documented here.

## 1. Product concept

The portfolio is a React/Vite personal site built around four public stories:

- Home introduces Reggie and routes visitors into the main content lanes.
- Tech presents engineering experience, tools, credentials, and community albums.
- Travel presents trips as an editorial journey.
- Life presents sport, racing, coffee, and personal interests.

The visual system combines bright-white glassmorphism and neumorphism, a restrained red identity accent, editorial typography, and short entrance transitions. Motion is supporting feedback, not a requirement for understanding or operating the site.

## 2. Legacy static architecture (rollback reference)

The following describes the retained pre-cutover implementation. The production
architecture is now React/Vite with Supabase and is documented in
`docs/ARCHITECTURE.md`.

### Runtime

The runtime is plain HTML, CSS, and browser JavaScript. There is no client-side router and no framework hydration step.

```text
HTML documents
  -> shared CSS entry point
  -> shared Web Components
       -> site-nav.js
       -> site-footer.js
  -> page behavior modules
       -> preloader.js
       -> motion.js
       -> hero.js
       -> terminal.js
       -> tech-albums.js
  -> service-worker registration and cache policy
```

Native links remain the navigation baseline. JavaScript adds a short fade before allowing a normal same-origin page request. There is no loading panel or progress indicator. Modified clicks, new-tab actions, downloads, external links, and current-page links are not intercepted.

### Configuration and generated artifacts

`config/site-manifest.json` is the source of truth for:

- public routes and backing HTML documents;
- navigation order and page tier;
- expected page headings;
- clean-route redirects;
- response headers;
- required and optional shell assets;
- service-worker cache roles.

`scripts/generate-site.mjs` validates that manifest and generates:

- `js/generated/pages.js`;
- `js/generated/cache-manifest.js`;
- `vercel.json`;
- `_redirects`;
- `_headers`.

Generated files must not be hand-edited. Change the manifest or generator, run `npm run generate`, and commit the resulting artifacts together.

### Styling

- `css/tokens.css` owns color, spacing, type, radius, shadow, duration, and easing values.
- `css/base.css` owns reset, document defaults, the content column, and accessibility fundamentals.
- `css/components.css` owns navigation, cards, page layouts, preloader, social dock, and route feedback.
- `css/motion.css` owns reveal states, motion fallbacks, and reduced-motion behavior.
- `css/main.css` is the shared stylesheet entry point.

Page-specific selectors may define composition, but spacing and type should reuse tokens. Headings use balanced wrapping; prose uses a consistent readable line height and start alignment, except explicitly centered section introductions.

### Motion lifecycle

There are three distinct motion types:

1. The optional Home entry gate appears on a first direct Home visit or reload. It is skipped for reduced motion, Save-Data, internal navigation, history restoration, blocked storage, or a missing script.
2. Home hero elements begin a staggered entrance only after the gate finishes. The animation uses the independent `translate` property so it does not overwrite the collage's positional rotations.
3. Scroll content uses `data-reveal`, with `motion.js` adding `is-revealed` through `IntersectionObserver`.

All content is immediately visible when reduced motion is requested or JavaScript is unavailable.

### Caching and offline behavior

Documents, CSS, and JavaScript use revalidation rather than immutable caching. Images can use a short browser cache with stale-while-revalidate. The generated cache identity changes when shell inputs change, which prevents stale versions of restored components from persisting across releases.

## 3. Local development

Install and verify:

```powershell
npm.cmd ci
npm.cmd run generate:check
npm.cmd run verify
```

Run the portfolio:

```powershell
npm.cmd run preview
```

Open `http://127.0.0.1:4173`.

Do not use `npx serve .` as the normal preview path. The repository preview server understands clean routes, redirects, headers, the custom 404 page, and the test contract.

If port 4173 is already in use, the portfolio is usually already running. Open the existing URL or start a second instance on another port:

```powershell
$env:PORT=4175
npm.cmd run preview
```

Browser smoke tests use port 4174 by default so they do not collide with the normal preview.

## 4. CI pipelines and GitHub Actions

All third-party GitHub Actions are pinned to immutable commit hashes. Workflows have read-only repository permissions, bounded timeouts, concurrency cancellation, and explicit manual triggers.

### Portfolio QA

Triggers: pushes to `main`, pull requests to `main`, and manual dispatch.

Jobs:

- deterministic static verification runs generation drift checks, content readiness, origin policy, static analysis, responsive/motion source checks, unit tests, and route-contract tests;
- Chromium interaction smoke installs only Chromium, runs the release interaction suite, and uploads failure evidence.

### Lighthouse

Triggers: pull requests, weekly schedule, and manual dispatch.

It audits performance and accessibility using the repository's local preview contract and uploads reports even if the audit fails.

### Link check

Triggers: pull requests, weekly schedule, and manual dispatch.

It checks links in HTML and Markdown with bounded retries. Internal runtime routes are also covered independently by the deterministic route tests.

### Dependency security

Triggers: pull requests, weekly schedule, and manual dispatch.

It installs from the lockfile with `npm ci` and fails for high-severity npm advisories.

### CD boundary

The repository contains Vercel-compatible clean-route, redirect, cache, and security-header output. A production deployment trigger is not defined in GitHub Actions; it is expected to be provided by the hosting provider's repository integration. Confirm the following in Vercel before treating CD as complete:

- the production project points to the correct GitHub repository;
- the production branch is `main`;
- no framework build command replaces the static output;
- generated `vercel.json` is honored;
- pull requests receive preview deployments;
- required CI checks block merging when they fail.

## 5. Corrected regressions

The following corrections are implemented in the current working tree:

- The preloader description below “Welcome” is removed.
- The preloader retains a real dialog, inert background, keyboard focus management, a visible Enter control, and a fail-open path.
- The original RB monogram is used in navigation and the Home entry gate.
- Navbar clicks use a short page fade before native route navigation, without loading UI.
- All social links render actual inline SVG icons for Facebook, Instagram, TikTok, and LinkedIn.
- The social dock stays hidden at the top of Home and slides in from the right after scrolling.
- Home hero photos, chips, and headline have a dedicated staggered entrance that does not conflict with desktop rotations.
- Pick a Lane has a section-level entrance plus staggered card reveals.
- Home, Tech, Travel, and Life share consistent paragraph line height, wrapping, heading balance, and explicit content alignment.
- Reduced-motion users receive final content immediately.
- Generated cache artifacts were refreshed after the component changes.

## 6. Lapses found and recommended controls

### Resolved: React dependency advisory

The dependency tree was updated and the final high-severity audit reports zero
vulnerabilities. Keep the scheduled dependency workflow enabled.

### A. Component identity was changed during infrastructure work

The navigation mark and preloader are product components, not disposable build details. Infrastructure changes must not replace or remove branded UI unless the product request explicitly asks for it.

Control: include visual component assertions for the original monogram, preloader, social icons, and Home motion in browser smoke tests.

### B. Generic reveal transforms conflicted with composed layouts

The Home collage already uses transforms for rotation and positioning. A generic reveal transform can overwrite those transforms and make the composition jump or lose its intended angle.

Control: complex positioned components must use a component-specific animation or define a safe transform composition contract.

### C. Social “icons” degraded to abbreviations

Text marks such as `FB`, `IG`, and `TT` did not preserve the expected visual identity and could appear missing at small sizes.

Control: keep self-contained inline SVG marks with accessible names on their links. Do not depend on external icon CDNs.

### D. Home deliberately hid the dock at the point users expected it

The dock was disabled while the Home hero intersected the viewport, which made the social navigation appear broken.

Control: visibility changes for persistent navigation require an explicit product decision and an interaction test at the top of every route.

### E. Preview-port collisions were reported as application errors

`EADDRINUSE` means another process already owns the port; it does not mean the portfolio build failed.

Control: keep the developer preview on 4173, browser tests on 4174, and document how to choose an alternate `PORT`.

### F. Generated configuration can drift

Navigation, hosting routes, and cache entries are derived from one manifest. Editing generated outputs directly creates short-lived fixes that are overwritten later.

Control: `npm run generate:check` remains the first verification gate.

### G. Encoding artifacts remain a content-quality risk

Some source comments and strings have shown mojibake sequences when read through inconsistent terminal encodings.

Control: keep source files UTF-8, add a repository-wide encoding scan, and correct user-visible mojibake before release. Do not bulk-rewrite files without reviewing content changes.

### I. Deployment ownership is not codified

CI is visible in the repository, but the production deployment connection is provider-side.

Control: document the Vercel project ID, production branch, rollback owner, and required checks in the project README or an operations runbook without committing secrets.

## 7. Acceptance checklist

- [x] Preloader contains no description below “Welcome.”
- [x] Entering the portfolio releases inert content and starts Home motion.
- [x] Navbar page changes use a simple fade without loading feedback.
- [x] Navigation remains native, same-origin, and GET-only.
- [x] Social dock exposes four visible branded icons.
- [x] Home hero elements enter smoothly without losing their positions.
- [x] Pick a Lane heading and cards reveal with a stagger.
- [x] Home, Tech, Travel, and Life use shared text rhythm and alignment rules.
- [x] Reduced-motion content is immediately usable.
- [x] Generated artifacts match the manifest.
- [x] Static, unit, route, responsive, and browser interaction checks pass.
- [x] Authenticate/connect Vercel, configure Supabase variables in every environment, make the repository public, and protect `main` with required QA checks.
- [x] Retire Designs and remove its navigation route.
- [x] Add a dedicated UTF-8/mojibake CI scan.

## 8. Required verification before merge

Run:

```powershell
npm.cmd run generate
npm.cmd run verify
npm.cmd run test:e2e:smoke
npm.cmd audit --audit-level=high
```

Then manually inspect Home, Tech, Travel, and Life at desktop and mobile widths. Check the preloader once on a direct Home load, simple navbar fades between every route, focus and Escape behavior, social links, Home hero motion, Pick a Lane reveals, and text wrapping at narrow widths.

Do not deploy if generated files drift, a clean route redirects unexpectedly, reduced-motion content stays hidden, the service worker serves an older component version, or the original brand mark is missing.

## 9. Active React and Supabase migration task list

The original static portfolio remains the visual and interaction reference. React
work must preserve the existing page structure, content order, responsive behavior,
motion, navigation, UI, UX, and brand identity unless a redesign is explicitly
approved.

- [x] Create an isolated React/Vite foundation without replacing the static release.
- [x] Connect Supabase authentication, album tables, private storage, and admin access.
- [x] Support private drafts, publishing, editing, cover replacement, photo addition/removal, and confirmed album deletion.
- [x] Let the admin assign an album to Tech, Travel, or Life.
- [x] Display database-managed published albums on Tech and remove hardcoded Tech albums.
- [x] Restore the original Home structure, navigation, footer, social dock, hero composition, motion, and responsive behavior in React.
- [x] Restore the original Tech structure, terminal behavior, cards, certificates, motion, and responsive behavior in React while retaining database albums.
- [x] Remove the motorsport concept while retaining red as a restrained identity accent within a bright-white hybrid glassmorphism/neumorphism system.
- [x] Migrate and intentionally refine Travel while preserving the established portfolio identity and responsive quality.
- [x] Rebuild Travel as one Tech-style hero, split International/Local album collections, permanent coming-soon cards, and the shared footer.
- [x] Add an admin-selectable Local or International scope for Travel albums.
- [x] Display database-managed published Travel albums in their selected collection.
- [x] Convert public Travel entries from photo albums into cover-led journal cards with long-form story modals.
- [x] Separate the admin into Overview, Tech Albums, and Travel Journals workspaces with destination-specific rules.
- [x] Migrate and intentionally refine Life while preserving the established portfolio identity and responsive quality.
- [x] Display published Life albums in its assigned public page.
- [x] Design the admin dashboard for easy navigation, clear album status, previews, editing, uploads, and mobile use.
- [x] Inspect and restore PWA installation, offline behavior, caching, icons, and device responsiveness for the React build.
- [x] Complete accessibility, validation, cross-device, performance, security, and visual-regression checks before cutover.
- [x] Replace the static production entry after desktop/mobile captures and automated acceptance of all public pages.

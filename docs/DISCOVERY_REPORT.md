# Architecture and engineering discovery report

Review date: 2026-11-01

This report is a source inspection and non-mutating verification baseline. No
application feature, database schema, production record, dependency, deployment,
or secret was changed or accessed.

## Evidence labels

- **Confirmed — repository:** directly supported by tracked source or config.
- **Confirmed — live HEAD:** observed with a read-only HTTP HEAD request.
- **Observed locally:** produced by a local command in this checkout.
- **External verification required:** depends on Vercel, Supabase, GitHub, or DNS
  state not encoded in the repository.
- **Recommendation:** a proposed future action, not current behavior.

## Executive summary

The project is a React/Vite portfolio with a substantial visual layer, a
Supabase-backed publishing dashboard, a reviewed local FAQ assistant, temporary
human chat, and a private contact inbox. Its most important security decision is
sound: public browser code receives a publishable Supabase key, while RLS and
private Storage policies protect drafts and visitor data; server-only keys are
used only by the two Vercel Functions.

The source also contains meaningful production safeguards: bounded request
bodies, idempotent contacts, token-hashed chat sessions, database-enforced chat
limits, retention jobs, CSP, private media, reduced-motion behavior, service-free
browser tests, and rollback documentation.

The immediate baseline is not release-green. The committed lockfile audit
reports five high and eight moderate advisories, and the local dependency tree is
incomplete/corrupt, so lint, type analysis, unit tests, build, and Playwright
could not be executed in this review without reinstalling dependencies. The
source-defined test suite is useful but lacks real Supabase/RLS integration,
automated accessibility checks, coverage thresholds, and performance budgets.

## What was inspected

- all tracked application, API, server, migration, test, workflow, deployment,
  environment-example, PWA, and existing documentation files;
- route composition and major UI component behavior;
- all ten Supabase migrations, policies, grants, trigger functions, and cron jobs;
- both Vercel Function handlers and their shared request helpers;
- package manifests, lockfile, lint/type/test/build configuration;
- live response headers for public routes, `/admin`, one legacy redirect, and a
  method-only check of `/api/contact`.

Production forms were not submitted. Admin authentication was not attempted.
Supabase tables, Storage, cron history, Vercel variables/logs, and GitHub settings
were not accessed.

## Confirmed product behavior

| Area | Confirmed behavior |
|---|---|
| Home | Desktop entry curtain, animated hero, 57-sphere Ballpit, interest chips, and destination carousel |
| Tech | Terminal, experience/education, DriftWall tool display, seven certificates, two built-in galleries, and published galleries |
| Travel | Supabase-published journals grouped as international/local with long-form modal reading |
| Life | Sport, rides, coffee, home-base story, static photos, and published galleries |
| Zenith FAQ | Reviewed local rules with typo tolerance; selected album questions may query public Supabase rows |
| Live chat | One-hour sliding expiry, opaque browser token, hashed token in DB, online presence, admin reply, immediate end/delete |
| Contact | Consent-based private inbox submission with recent FAQ context and an idempotency UUID |
| Admin | Passwordless sign-in plus allow-list check; content, inbox, live chat, alerts, and presence management |
| Privacy | Public disclosure of stored fields, retention, providers, and optional Resend notification |
| PWA | Manifest, service worker, bounded caches, public-route offline fallback, and explicit offline denial for Admin |

The full component and data-flow description is in
[`ARCHITECTURE.md`](ARCHITECTURE.md).

## Security and data-safety assessment

### Controls confirmed in source

- Supabase secrets have no `VITE_` prefix and are read only by server functions.
- `.env*` is ignored except for a placeholder-only `.env.example`.
- A targeted scan found no high-confidence committed private key or service-key
  pattern. This is evidence from the current tracked tree, not full history.
- Admin UI requires a session and a successful `is_album_admin()` RPC.
- RLS is enabled for every application table; explicit grants in migration 008
  narrow which operations reach RLS.
- The private Storage bucket permits public signed reads only for published media
  or an allow-listed administrator.
- Anonymous roles receive no direct chat-table privileges.
- Contact writes go through a server key; browser roles receive no insert grant.
- Cleanup functions are security-definer functions with empty search paths and
  no browser-role execute permission.
- Contact and chat responses are non-cacheable and contain correlation IDs.
- React renders visitor and admin text as text; there is no visitor-controlled
  `dangerouslySetInnerHTML`. The only `innerHTML` animation targets a source-code
  constant in the Home preloader.
- The checked CSP denies plugins and framing and limits scripts to self. Live
  HEAD responses also contained HSTS from Vercel.

### Findings and follow-up

| Priority | Finding | Why it matters | Recommended supervised action |
|---|---|---|---|
| P0 | Lockfile audit reports 5 high and 8 moderate advisories | The security workflow should fail today; Vite and transitive Zod findings include high severity | Review advisory reachability, update one dependency group at a time, run the full suite, and avoid `npm audit fix --force` |
| P0 | Local `node_modules` is incomplete and has no `.bin` directory | The documented baseline cannot be reproduced in this checkout; `npm ls` reports many invalid/extraneous packages | With approval, run a clean `npm ci`, then rerun every gate before application work |
| P1 | Applied migration and cron state is not provable from source | Correct SQL does not guarantee production RLS, grants, retention, or caps are active | Compare remote migration history and cron jobs read-only; never auto-apply from an AI run |
| P1 | API rate limits are process-local | Cold starts and multiple function instances reset/split counters; source-IP header trust is platform-dependent | Confirm the documented Vercel Firewall rules and observe 429/5xx behavior before tuning |
| P1 | No real Supabase authorization integration tests | Current tests mostly inspect SQL text and mocked clients; policy regressions could pass CI | Add an isolated test project or local Supabase test job with synthetic users and explicit allow/deny cases |
| P2 | Admin writes span multiple database and Storage calls | Mid-flow failure can leave a draft, missing cover, or orphaned media; some Storage removal errors are ignored | Add compensating cleanup and observable error handling before considering broader content workflows |
| P2 | Type analysis excludes pages and components | `jsconfig.json` checks APIs, server helpers, selected libraries, and configs but not most JSX | Expand checking gradually or add a separate React check without pretending the current gate covers the UI |
| P2 | No automated accessibility audit | Keyboard behavior is tested for Zenith, but WCAG regressions across pages/dialogs are not systematically detected | Add Playwright plus axe checks for public routes, modal states, and reduced motion |
| P2 | No performance or bundle budgets | Animation libraries, WebGL, 6.7 MB of public assets, and roughly 9,300 CSS lines can regress silently | Record build chunks and add practical Lighthouse/bundle/image budgets after a clean build |
| P2 | Built-in photos do not currently have responsive variants | `responsivePhotoSrcSet()` returns `undefined`; `sizes` attributes therefore do not select smaller files | Generate reviewed image variants and validate visual quality before enabling `srcset` |
| P2 | Portfolio facts have drifted from implementation | Knowledge says 48 Ballpit spheres, FAQ says 65, implementation uses 57; the FAQ test asserts the stale 65 | Establish one reviewed source of truth and add implementation-linked contract tests |
| P3 | CSS ownership is diffuse | Global base/component/legacy/responsive CSS and colocated files overlap, increasing visual-regression risk | Map selector ownership, remove dead rules only with screenshot review, and avoid broad AI rewrites |

### Authorization boundary summary

```text
Public content: publishable key -> explicit SELECT grant -> RLS published policy
Admin content: Supabase session -> authenticated grant -> is_album_admin() RLS
Contact write: browser -> Vercel validation -> server key -> private table
Live chat: browser token -> Vercel hash lookup -> server key -> private tables
Admin chat: Supabase session -> authenticated grant -> admin RLS -> Realtime
Media: private bucket -> policy -> one-hour signed URL
```

No conclusion about actual production rows or policy activation was drawn because
production Supabase was deliberately not queried.

## Engineering baseline

### Source-defined checks

`npm run verify` is configured to run:

1. ESLint across the repository.
2. `tsc --noEmit` using `jsconfig.json`.
3. Vitest unit tests.
4. The Vite production build.

The source defines 39 expanded unit cases across request parsing, API contracts,
FAQ matching, state precedence, album loading/signing, privacy, route markers,
and upload rules. It defines 15 Playwright scenarios before the three-project
desktop/tablet/mobile matrix, with project-specific skips for pointer behavior.

Important limits:

- there is no coverage collection or threshold;
- API success paths against Supabase are not exercised;
- Admin album/inbox workflows are not exercised end to end;
- service-worker offline behavior is described but not browser-tested;
- accessibility checks are interaction-specific rather than standards-based;
- some tests are source-string contracts, not behavior tests.

### CI/CD

- `portfolio-qa.yml` runs `npm ci`, `npm run verify`, installs Chromium, and runs
  Playwright on pull requests, `main`, and manual dispatch.
- `security-audit.yml` runs `npm audit --audit-level=high` on pushes, pull
  requests, a weekly schedule, and manual dispatch.
- `link-check.yml` runs Lychee on pull requests, weekly, and manually.
- Actions are pinned to immutable commit hashes, permissions are read-only, and
  jobs have timeouts and concurrency cancellation.
- Dependabot proposes npm and Actions updates weekly.
- There is no source-controlled deployment workflow. Vercel Git integration is
  the expected CD boundary.

### Local verification results

| Check | Result |
|---|---|
| Git worktree before documentation | Clean |
| Node / npm | Node 22.22.3 / npm 10.9.8 |
| JavaScript syntax for API/server/lib/hook/config files | Passed |
| `npm run verify` | Blocked at ESLint: `node_modules/.bin/eslint` missing |
| Explicit configured type analysis | Blocked: local Node and Vite type packages incomplete |
| Unit tests | Not run: local Vitest entry point missing |
| Production build | Not run: local Vite entry point missing |
| Playwright | Not run because the build/dev toolchain is incomplete |
| Lockfile security audit | 13 advisories: 5 high, 8 moderate |
| `git diff --check` before edits | Passed |

No dependency installation was attempted because it requires explicit approval.

### Accessibility and performance safeguards already present

- skip link and semantic landmarks;
- focus-visible styling and multiple native modal dialogs;
- explicit Zenith focus trap and Escape/focus restoration behavior;
- reduced-motion paths in every major animation system;
- Save-Data gating for WebGL and smooth scrolling;
- route-level lazy loading and deferred near-viewport components;
- hidden-document and offscreen animation pausing;
- lazy image decoding/loading below the fold;
- stale-chunk recovery and route error boundary;
- service-free E2E configuration that clears Supabase browser variables.

These are implementation controls, not proof of a passing WCAG or performance
score.

## Live deployment observations

Read-only HEAD requests on 2026-11-01 confirmed:

- `/`, `/tech`, `/travel`, `/life`, `/privacy`, and `/admin` returned the SPA
  shell with HTTP 200;
- `/tech.html` returned HTTP 308 to `/tech`;
- `/api/contact` rejected HEAD with HTTP 405 and `Allow: POST`;
- the live responses included the configured CSP, `nosniff`, referrer policy,
  permissions policy, and `Cache-Control` values;
- Vercel added HSTS.

This does not confirm the deployed Git SHA, visible page interactions, Supabase
configuration, secret scopes, live-chat behavior, or form delivery.

## External verification register

Before describing the system as production-verified, a maintainer should confirm:

- the exact Vercel project and deployed commit;
- `main` as the production branch and Preview behavior for pull requests;
- environment-variable names and environment scopes without exposing values;
- GitHub branch-protection and required-check configuration;
- all ten migrations in the intended Supabase project and in order;
- RLS enabled, expected grants/policies present, and `album-media` still private;
- both cleanup cron jobs scheduled and succeeding;
- Realtime publication contains only the intended chat tables;
- Vercel Firewall/edge limits for both APIs;
- Supabase backup/PITR and Storage export coverage;
- alerting and the last known-good deployment record.

## Phased improvement roadmap

### Phase 0 — restore a trustworthy green baseline

1. Approve and perform `npm ci` in a controlled branch/worktree.
2. Reproduce lint, configured type analysis, unit tests, build, and Playwright.
3. Triage and patch the current npm advisories without force-fixing.
4. Correct the Ballpit fact drift and any tests that encode stale facts.
5. Record build chunks and current screenshots before structural refactors.

### Phase 1 — prove security boundaries

1. Perform the read-only external verification register.
2. Add isolated Supabase allow/deny tests for anonymous, normal authenticated,
   allow-listed admin, and server roles.
3. Test API success, duplicate contact submission, token mismatch, expiry,
   concurrency cap, and cleanup behavior with synthetic data.
4. Confirm durable provider rate rules and request-ID-based observability.
5. Add compensation/cleanup behavior for partial Admin media operations.

### Phase 2 — make quality measurable

1. Add automated accessibility scans and keyboard checks for every modal.
2. Add coverage reporting with thresholds based on the measured baseline.
3. Add production bundle, image, and Lighthouse budgets.
4. Browser-test service-worker update/offline behavior.
5. Expand type analysis to React components in small, reviewable steps.

### Phase 3 — reduce maintenance cost

1. Make portfolio facts a reviewed single source of truth for pages, FAQ, and
   tests where practical.
2. Introduce real responsive image variants.
3. Map and gradually simplify CSS ownership with visual-regression evidence.
4. Centralize shared validation/constants only where it reduces drift without
   coupling browser and privileged server code.
5. Add lightweight architecture decision records for security and data changes.

### Phase 4 — supervised product improvement

Only after the baseline and boundaries are measurable should AI-assisted work
optimize content discovery, interaction polish, or new features. Every change
must retain a human owner, a narrow hypothesis, rollback instructions, and
evidence from the relevant gates.

The operating model for these phases is defined in
[`CONTINUOUS_IMPROVEMENT.md`](CONTINUOUS_IMPROVEMENT.md). Current priorities and
acceptance criteria are maintained in [`ROADMAP.md`](ROADMAP.md) and
[`QUALITY_STANDARDS.md`](QUALITY_STANDARDS.md).

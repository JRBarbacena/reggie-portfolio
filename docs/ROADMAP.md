# Evidence-backed improvement roadmap

This roadmap is derived from the repository review in
`docs/DISCOVERY_REPORT.md`. Priority describes urgency and impact; the risk
field describes the implementation/change risk. Items are proposals, not
authorization to install, migrate, merge, deploy, or access production data.

Selection rules:

- Work on one focused item at a time.
- Reconfirm the evidence before implementation because the repository may change.
- Prefer an item whose prerequisites and verification environment are available.
- Do not start a lower-priority visual experiment while a release-blocking P0 is
  unresolved unless a human explicitly reprioritizes it.
- Update this roadmap when evidence changes; do not keep completed or disproven
  findings as permanent work.

Entries labeled **Status: Completed** are retained as dated engineering
evidence. Entries without that label remain outstanding proposals and still
require their stated authorization and verification.

## P0 — critical security, data integrity, or production reliability

### P0.1 Restore a reproducible local verification environment

- **Status:** Completed locally on 2026-11-04 from checkpoint `c251f2e`.

- **Problem:** The current local dependency tree is incomplete. There is no
  `node_modules/.bin`, `npm ls` reports invalid/extraneous packages, and the
  normal verification command cannot start.
- **Evidence:** `npm run verify` stopped at missing ESLint; explicit Vitest/Vite
  entry points and configured type definitions were unavailable during the
  2026-11-01 baseline.
- **Affected components:** `package.json`, `package-lock.json`, local
  `node_modules/`, all lint/type/test/build workflows.
- **Expected outcome:** A clean, lockfile-reproducible Node 22 install can run
  every documented gate and distinguish environment failures from code failures.
- **Verification:** With explicit installation approval, run `npm ci`,
  `npm ls --depth=0`, `npm run verify`, and `npm run test:e2e`; record exact
  versions and results without committing `node_modules`.
- **Risk level:** Medium. `npm ci` replaces the local dependency tree and needs
  explicit authorization, but should not change tracked files.
- **Completion evidence:** Node 22.22.3/npm 10.9.8 `npm ci` completed without a
  lockfile change; `npm ls --depth=0`, `npm run verify`, and the service-free
  Playwright desktop/tablet/mobile suite passed. The dependency-audit failure is
  tracked separately in P0.2.

### P0.2 Resolve current high-severity dependency advisories

- **Problem:** The committed dependency graph does not meet the release standard
  of zero unresolved high-severity advisories.
- **Evidence:** On 2026-11-05, `npm audit --audit-level=high` reported 11
  vulnerabilities: five high and six moderate, involving Vite, transitive Zod,
  Vitest mocker, and Minimatch/ESLint paths. The earlier 13-finding result is
  retained as dated discovery history.
- **Affected components:** `package.json`, `package-lock.json`, Vite dev/build
  tooling, Vitest, ESLint dependencies, and `@vercel/functions` transitive code.
- **Expected outcome:** Zero high-severity audit findings with compatible,
  reviewed versions and no regression in build, browser behavior, or functions.
- **Verification:** Review each advisory's reachability; update one dependency
  group at a time; run audit, `npm run verify`, Playwright, API unit tests, and
  compare production chunks. Do not use `npm audit fix --force`.
- **Risk level:** High. Suggested fixes may contain breaking changes and touch
  both tooling and server-function dependencies.

### P0.3 Verify production security and retention controls without changing them

- **Problem:** Source contains the intended migrations, grants, RLS, Storage
  policies, cron jobs, branch protections, edge limits, and deployment settings,
  but their active production state is not provable from the repository.
- **Evidence:** Ten local migrations and detailed runbooks exist; discovery did
  not access Supabase/Vercel/GitHub dashboards or production records.
- **Affected components:** Supabase migration history, RLS/grants, private
  `album-media`, Realtime publication, cleanup cron jobs, Vercel Firewall and
  environment scopes, GitHub required checks, deployed commit.
- **Expected outcome:** A dated, read-only control inventory confirms or records
  gaps without exposing values or modifying provider state.
- **Verification:** Compare migration names/checksums, policy/grant definitions,
  bucket privacy/limits, cron schedule names, environment variable names/scopes,
  firewall paths, branch rules, and deployment SHA. Use metadata and synthetic
  checks only; do not inspect real visitor content.
- **Risk level:** High. Verification touches privileged provider surfaces; any
  remediation must be a separately authorized task.

## P1 — high-impact performance and functional improvements

### P1.1 Add executable Supabase authorization integration tests

- **Problem:** RLS/grant correctness is largely inferred from SQL and source-string
  tests rather than executed against Postgres/Supabase roles.
- **Evidence:** Unit tests inspect privacy SQL and mock album clients; there is no
  anonymous/non-admin/admin/server allow-deny matrix.
- **Affected components:** `supabase/migrations/*.sql`, album/photo queries,
  Admin auth, contact inbox, chat tables, Storage policies, Realtime access.
- **Expected outcome:** CI or a controlled local job proves public reads,
  private denials, admin access, and server-only writes with synthetic data.
- **Verification:** In local/isolated Supabase, test anonymous, ordinary
  authenticated, allow-listed admin, and server roles across select/insert/update/
  delete and Storage operations. Confirm failures are fail-closed.
- **Risk level:** High. Test setup handles auth and privileged test credentials;
  it must never point at production.

### P1.2 Make public API abuse protection durable

- **Problem:** Current sliding-window limiters live in each function instance, so
  cold starts and horizontal scaling can split/reset counters.
- **Evidence:** `createSlidingWindowLimiter()` stores counters in a module-level
  `Map`; the production runbook separately recommends Vercel Firewall rules.
- **Affected components:** `api/contact.js`, `api/live-chat.js`,
  `server/request-security.js`, Vercel Firewall configuration and monitoring.
- **Expected outcome:** Globally meaningful limits protect contact and live chat
  while retaining current validation, shared-network usability, `Retry-After`,
  and safe failure behavior.
- **Verification:** First confirm provider rules. With synthetic requests in an
  approved environment, verify per-path thresholds, 429 responses, retry timing,
  normal shared-network behavior, and request-ID/log correlation.
- **Risk level:** High. Overly strict edge rules can block legitimate visitors;
  provider changes require explicit authorization.

### P1.3 Make Admin database/Storage workflows failure-safe

- **Problem:** Album creation, cover replacement, photo removal, and deletion span
  multiple Postgres and Storage requests. Mid-flow failure may leave incomplete
  drafts or orphaned objects, and some Storage removal errors are ignored.
- **Evidence:** `AdminPage.jsx` inserts/updates rows and uploads/removes objects
  sequentially without a transaction or compensating cleanup record.
- **Affected components:** `react-app/src/pages/AdminPage.jsx`,
  `pages/admin/AdminAlbumView.jsx`, Supabase albums/photos, `album-media`.
- **Expected outcome:** Partial failures are visible, retryable, and do not
  silently diverge database references from stored objects.
- **Verification:** In an isolated project, inject failure after each step of
  create, replace, remove, and delete. Assert the resulting row/object state,
  administrator message, safe logs, and retry behavior.
- **Risk level:** High. The work changes data-management behavior and must be
  tested only with synthetic data.

### P1.4 Implement real responsive variants for built-in photographs

- **Problem:** Components provide `sizes`, but
  `responsivePhotoSrcSet()` currently returns `undefined`, so browsers cannot
  choose a smaller width variant.
- **Evidence:** `react-app/src/responsive-photos.js`; public assets total about
  6.7 MiB and include individual images around 300 KiB.
- **Affected components:** `responsive-photos.js`, Home/Tech/Life images,
  built-in albums, asset-generation/storage conventions.
- **Expected outcome:** Mobile and tablet download smaller appropriate images
  without visible quality loss, broken paths, or disclosure of source originals.
- **Verification:** Generate reviewed WebP/AVIF width variants outside production,
  confirm dimensions/quality, assert valid `srcset`, compare network bytes and
  LCP on representative viewports, and run visual/E2E checks.
- **Risk level:** Medium. Mechanical asset changes can create broken references,
  repository growth, or visible degradation.

### P1.5 Reconcile portfolio fact drift

- **Status:** Completed locally on 2026-11-05.
- **Problem:** Before reconciliation, the same implementation fact was
  represented inconsistently: portfolio knowledge said 48 Ballpit spheres,
  Zenith said 65, Home config used 57, and a unit test protected the stale 65
  response.
- **Evidence:** `portfolio-knowledge.js`, `portfolio-faq.js`,
  `HeroBallpit.jsx`, and `portfolio-faq.test.js`.
- **Affected components:** Home behavior documentation, Zenith answers, tests,
  Architecture/Discovery documents.
- **Expected outcome:** UI, FAQ, tests, and documentation share one owner-reviewed
  value or derive it from a stable source without coupling unrelated modules.
- **Verification:** Confirm the intended count with the owner, update the minimum
  set of files, and run the focused FAQ contract plus the full repository gate.
  Run browser and visual checks if the runtime count or rendering behavior
  changes.
- **Risk level:** Low for factual correction; Medium if changing the actual
  sphere count because it affects performance and visuals.
- **Completion evidence:** `HeroBallpit.jsx` remains configured for 57 spheres;
  portfolio knowledge, Zenith's answer, and the focused FAQ contract test now
  use the same value without changing rendering behavior.

### P1.6 Add successful API and lifecycle tests with synthetic data

- **Problem:** Current API tests emphasize invalid/unconfigured paths. Contact
  persistence, duplicate suppression, chat start/send/poll/end, expiry, first
  notification behavior, and concurrent caps are not executed end to end.
- **Evidence:** `tests/unit/api-handlers.test.js` and mocked Playwright live
  reply; no real isolated backend flow.
- **Affected components:** both `api/*.js`, request helpers, migrations
  005/006/008/009/010, Admin inbox/chat views.
- **Expected outcome:** Core server-backed visitor flows and privacy invariants
  are reproducible without touching production.
- **Verification:** Use an isolated Supabase project and fake notification
  transport; assert statuses, stored bounded data, idempotency, token mismatch,
  expiry, deletion cascade, 200-message race protection, and sanitized logs.
- **Risk level:** High because test credentials and destructive synthetic cleanup
  must remain strictly isolated.

## P2 — code quality, accessibility, and user experience

### P2.1 Expand static analysis to React pages and components

- **Problem:** The current type-check include list excludes most JSX, leaving the
  majority of UI outside the configured analysis.
- **Evidence:** `jsconfig.json` includes APIs, server helpers, selected libs,
  photo helpers, and configs but not `pages/**/*.jsx` or
  `components/**/*.jsx`.
- **Affected components:** `jsconfig.json`, all React pages/components/hooks,
  potentially shared prop/data contracts.
- **Expected outcome:** UI regressions such as invalid props, missing fields, and
  unsafe nullable access are detected before browser tests.
- **Verification:** Establish current diagnostics, expand scope incrementally,
  resolve issues without blanket suppression, then keep `npm run typecheck`
  green in CI.
- **Risk level:** Medium. Broad enablement can produce a large diff; split by
  directory or feature.

### P2.2 Add automated accessibility regression checks

- **Problem:** The project has deliberate keyboard/focus/reduced-motion behavior,
  but no standards-based automated audit across routes and modal states.
- **Evidence:** Playwright checks Zenith focus and route overflow; no
  axe-equivalent tooling or WCAG gate exists.
- **Affected components:** all public routes, navigation, Zenith modes, album and
  certificate dialogs, Travel journal, Admin setup/auth views.
- **Expected outcome:** Serious/critical semantic, labeling, focus, and contrast
  regressions fail CI while manual keyboard/visual review remains required.
- **Verification:** Run audits on each route and opened interactive state at
  desktop/mobile and reduced motion; require zero serious/critical findings and
  document justified exceptions.
- **Risk level:** Medium. Adding a dependency needs approval; remediation may
  affect markup/CSS across components.

### P2.3 Test service-worker offline and update behavior

- **Problem:** Offline and stale-deployment behavior is implemented and documented
  but not exercised by the browser suite.
- **Evidence:** `react-app/public/sw.js`, stale-chunk recovery in `main.jsx`,
  and manual-only release checklist.
- **Affected components:** service worker caches, public routes, `/admin`
  offline fallback, asset chunks, deployment rollback behavior.
- **Expected outcome:** Automated evidence shows public cached recovery,
  non-caching of APIs/private cross-origin media, Admin offline denial, and safe
  activation/update after a deploy.
- **Verification:** Build/serve the production app, install the worker, warm
  selected routes, go offline, test public/Admin paths, simulate cache-version
  change, and assert old caches are removed.
- **Risk level:** Medium. Browser cache tests can be timing-sensitive and must
  remain isolated from a developer's normal browser profile.

### P2.4 Establish coverage and behavior-focused regression thresholds

- **Problem:** The suite has useful tests but no coverage report/threshold, and
  several contracts inspect source strings instead of executing behavior.
- **Evidence:** `vitest.config.js` only defines include/globals; no coverage
  provider or thresholds are configured.
- **Affected components:** Vitest configuration and tests for API, chatbot,
  public albums, routing, privacy, and uploads.
- **Expected outcome:** Coverage gaps are visible and critical boundaries cannot
  regress unnoticed; thresholds start from measured reality and rise deliberately.
- **Verification:** Generate a baseline after the dependency environment is
  restored, classify untested critical branches, add behavior tests, and enforce
  agreed line/branch thresholds without excluding difficult security code.
- **Risk level:** Low to Medium. Tooling needs approval and poorly chosen
  thresholds can reward low-value tests.

### P2.5 Introduce performance and visual-regression baselines

- **Problem:** No automated bundle, image, Web Vitals, or screenshot comparison
  detects gradual regressions in this animation-heavy, CSS-heavy portfolio.
- **Evidence:** About 9,300 CSS lines, multiple animation libraries, 6.7 MiB of
  public assets, and no budget/visual workflow.
- **Affected components:** Vite build output, Home WebGL/entry, DriftWall,
  galleries, responsive CSS, public media.
- **Expected outcome:** Reviewers see chunk/media changes and representative
  screenshots; material performance or identity regressions require explanation.
- **Verification:** Capture clean-build chunk sizes and approved route/state
  screenshots, define tolerances after baseline review, and run on desktop/mobile
  with reduced motion.
- **Risk level:** Medium. Visual tests can be noisy; baselines must be human
  approved and never auto-updated to hide a regression.

### P2.6 Map and reduce CSS ownership overlap incrementally

- **Problem:** Global token/base/component/motion layers, legacy
  `styles.css`, `responsive.css`, and colocated CSS overlap, increasing the
  cost and risk of visual changes.
- **Evidence:** Approximately 9,300 lines of CSS across these layers; discovery
  did not establish dead-rule or ownership automation.
- **Affected components:** all style files, especially shared navigation, page
  layouts, Admin, and complex visual components.
- **Expected outcome:** Each selector has a clearer owner, dead rules are removed
  with evidence, and component changes need fewer broad overrides.
- **Verification:** Inventory selectors/usages, choose one component slice,
  capture screenshots and interaction states, remove only proven-dead/duplicate
  rules, then run responsive and reduced-motion checks.
- **Risk level:** Medium to High. Broad cleanup can silently change brand and
  responsive behavior; never perform a repository-wide rewrite.

## P3 — optional enhancements and future experimentation

### P3.1 Add lightweight architecture decision records

- **Problem:** Security, data-retention, PWA, and visual-system decisions are
  documented in several runbooks but lack concise decision history.
- **Evidence:** Architecture and operations documents describe current state;
  there is no `docs/adr/` convention.
- **Affected components:** Documentation only initially; future high-risk changes.
- **Expected outcome:** Important decisions record context, choice, consequences,
  owner, and supersession without bloating code comments.
- **Verification:** Pilot an ADR only for the next material architecture/security
  decision and confirm it links to affected docs/tests.
- **Risk level:** Low. Avoid creating ADRs for routine implementation choices.

### P3.2 Run focused, reversible product experiments

- **Problem:** No current defect requires a redesign, but future content discovery
  or inquiry-flow ideas may be worth testing after the baseline is trustworthy.
- **Evidence:** The current product already has clear Home/Tech/Travel/Life lanes,
  Zenith handoff, and contact paths; discovery found no evidence supporting an
  immediate identity change.
- **Affected components:** To be specified per experiment; never assume whole-site
  scope.
- **Expected outcome:** One hypothesis is tested without changing identity,
  collecting unnecessary visitor data, or coupling it to security/backend work.
- **Verification:** Define the success signal and non-goals first, use a Preview,
  perform accessibility/performance review, and retain a one-change rollback.
- **Risk level:** Low to High depending on scope. Experiments involving visitor
  data, auth, or providers are high risk and need explicit approval.

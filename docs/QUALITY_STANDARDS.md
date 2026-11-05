# Engineering quality standards

These standards define the acceptance bar for supervised changes to this
portfolio. They distinguish controls that exist today from controls that remain
to be implemented.

Status labels:

- **Enforced:** an automated repository check currently evaluates the standard.
- **Implemented:** the behavior exists, but automated enforcement is incomplete.
- **Manual:** the release process requires human verification.
- **Missing:** the safeguard is a documented target, not current behavior.
- **External:** verification or enforcement lives in Vercel, Supabase, GitHub, or
  another provider and cannot be proved by repository source.

## Universal definition of done

Every change must:

1. State the problem, evidence, scope, non-goals, and risk.
2. Preserve the permanent safety boundaries in `AGENTS.md`.
3. Add or update behavior-focused tests when behavior changes.
4. Pass the relevant automated checks, or explicitly report why a check was
   blocked. A failure may not be silently skipped or reclassified as success.
5. Review desktop, tablet, mobile, keyboard, and reduced-motion effects when UI
   or animation changes.
6. Update architecture, privacy, setup, operations, roadmap, or policy documents
   when their contracts change.
7. Include a rollback approach proportionate to risk.

## Security and privacy

| Standard | Acceptance measure | Current mechanism | Status |
|---|---|---|---|
| No committed secrets | Zero private/service keys, tokens, private keys, or populated secret env values in the tracked tree | `.gitignore`, placeholder-only `.env.example`, `npm run check:secrets` over eligible tracked and non-ignored untracked current-tree text | Enforced for common high-confidence patterns in valid UTF-8 text up to 2 MiB; binary content, larger files, Git history, and provider scanning remain outside this check |
| Browser credential boundary | Only `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` may be bundled into the client | `react-app/src/lib/supabase.js`, environment docs | Implemented |
| Admin authorization | A Supabase session plus `is_album_admin() = true` is required; anonymous and ordinary authenticated users cannot access admin data | Database grants, RLS, Storage policies, Admin RPC check | Implemented; production state external |
| Public content boundary | Anonymous clients can select only published albums/photos and their policy-authorized media | RLS and private `album-media` bucket | Implemented; production state external |
| Private write boundary | Contact/live-chat visitor writes pass through Vercel Functions; no anonymous table-write shortcut | Server-only Supabase client and revoked anonymous grants | Implemented |
| Input limits | Every public API action has a method allow-list, byte limit, field bounds, and safe error response | `api/*.js`, `server/request-security.js`, unit tests | Enforced for selected invalid paths |
| Abuse resistance | Source throttles remain enabled; durable provider limits must be verified for both API paths | Process-local limiter; documented Vercel Firewall rules | Implemented locally/external globally |
| Contact idempotency | Repeated submission with the same valid UUID creates at most one inquiry | API upsert and migration 009 unique index | Implemented; integration test missing |
| Chat isolation | Reading/sending/ending requires a valid session ID, token hash, open status, and future expiry | `activeSession()`, private tables, 200-message DB trigger | Implemented; integration test missing |
| Data minimization | Contact transcript is at most six bounded user/assistant messages; chat returns at most 100 newest messages | Client/API sanitizers and API query limit | Implemented/unit tested in part |
| Retention | Chats expire one hour after latest activity; replied/archived inquiries delete after 180 days | Migrations 006/008/010 and cron | Implemented in migrations; production cron external |
| No sensitive logs | Logs contain event, request ID, action, and bounded error metadata—not visitor content, email, tokens, or credentials | `logServerError()` | Implemented; log review external |
| Dependency security | Zero unresolved high-severity advisories before release | GitHub audit workflow and local `npm audit --audit-level=high` | Enforced, currently failing baseline |
| Security headers | CSP, framing denial, `nosniff`, referrer policy, permissions policy, and HSTS in production | `vercel.json`; HSTS supplied by Vercel | Implemented/external |
| Migration repository integrity | Existing migrations keep their ordered names and reviewed contents; migrations contain no connection target or psql shell command | `npm run check:migrations`, SHA-256 manifest | Enforced statically; SQL execution and remote state remain external |

Security-sensitive changes require explicit allow/deny tests for anonymous,
ordinary authenticated, allow-listed admin, and server roles in an isolated
environment. This matrix is currently **missing**.

Privacy disclosures must match code and active provider behavior. Any new field,
recipient, retention period, third party, tracking mechanism, or use of visitor
content requires a simultaneous review of `PrivacyPage.jsx`, tests, and setup
documentation.

## Performance and asset loading

| Standard | Acceptance measure | Current mechanism | Status |
|---|---|---|---|
| Production build | `npm run build:react` completes without an unexplained warning or missing asset | Vite build in `npm run verify` and CI | Enforced when dependencies are healthy |
| Route splitting | All route pages remain lazy imports in `App.jsx` | Unit source contract | Enforced |
| Heavy visual deferral | Ballpit, Tech stack wall, Home carousel, published sections, and masonry load only when needed | `lazy`, `Suspense`, `useNearViewport` | Implemented |
| Animation lifecycle | Continuous work pauses when offscreen/hidden where applicable and cleans observers/RAF/listeners on unmount | Ballpit, DriftWall, SmoothScroll, ClickSpark, shell observers | Implemented/manual regression check |
| User preference safeguards | Reduced motion produces usable final states; Save-Data disables WebGL/entry and smooth scrolling | Media queries and connection checks | Implemented/E2E partial |
| Image loading | Above-fold priority is deliberate; below-fold images use lazy loading and async decoding | Page/component image attributes | Implemented |
| Responsive image delivery | Changed/new portfolio photographs have real width variants and a working `srcset` | Certificates have variants; photo helper returns `undefined` | Missing for photos |
| Asset review | Any new/changed single asset over 300 KiB requires written justification and visual review; total public-asset growth must be reported | Current public assets are about 6.7 MiB; no CI budget | Manual target |
| Bundle review | Record initial and total compressed JS/CSS chunks after each dependency or major visual change; unexplained growth blocks approval | No stored baseline/budget | Missing |
| Runtime performance | Representative Home, Tech, Travel, and Life traces show no long-running animation while offscreen and no avoidable repeated network loop | Existing pause/defer logic | Manual; automated budget missing |
| Web-vitals target | On a representative production-like mobile run: LCP ≤ 2.5 s, CLS ≤ 0.1, and INP ≤ 200 ms; record environment and variance | No Lighthouse/Web Vitals job or production telemetry confirmed | Missing |

Numeric performance targets are release goals, not claims about the current
site. Establish a reproducible baseline before enforcing regression thresholds.
Do not trade accessibility, image quality, or identity for an isolated score.

## Accessibility and responsiveness

| Standard | Acceptance measure | Current mechanism | Status |
|---|---|---|---|
| Keyboard access | Every control, menu, carousel, modal, form, and admin action is reachable and operable without a pointer | Semantic controls, focus styles, native dialogs, Zenith trap | Implemented/manual; E2E partial |
| Focus lifecycle | Opening a modal moves focus into it; Escape/close works; keyboard-triggered dismissal restores a logical trigger | Zenith E2E and selected dialog code | Implemented in part; full dialog matrix missing |
| Semantic structure | One meaningful page `h1`, labeled landmarks/regions, associated form labels, useful alt text, and status/error announcements | React markup and targeted tests | Implemented/manual |
| Reduced motion | No content remains hidden, no required action depends on animation, and continuous decorative motion is suppressed | CSS/JS reduced-motion paths | Implemented |
| Responsive layout | No horizontal overflow at 390×844, 820×1180, and 1440×900 for public routes, Admin setup state, and 404 | Playwright projects and overflow tests | Enforced for current route set |
| Touch/coarse pointer | Home entry is skipped where intended and hover-only information remains available | Pointer media queries and E2E touch check | Enforced in part |
| Zoom/reflow | Primary tasks remain usable at 200% zoom and 320 CSS px width | Responsive CSS | Manual target; dedicated test missing |
| Automated accessibility | Zero serious or critical automated accessibility findings on each public route and opened modal state | No axe-equivalent dependency/check | Missing |

Color, contrast, focus visibility, animation comfort, and alternative text require
human review even after automated checks are added.

## Functional correctness

- All routes in `App.jsx` must render their intended page and direct reload must
  resolve through the Vercel SPA rewrite.
- Legacy `/index.html`, `/tech.html`, `/travel.html`, and `/life.html`
  redirects must remain intentional.
- Public pages must remain usable when Supabase browser variables are empty.
- Published content must appear only in its selected destination. Travel scope
  must group journals correctly.
- Signed-media failure must not expose a private path or crash the entire route.
- Admin access must fail closed when configuration, session, RPC, RLS, or
  Storage authorization fails.
- Contact and chat endpoints must return actionable generic errors without
  leaking configuration or provider details.
- PWA behavior must keep public cached content recoverable while refusing
  offline Admin access.
- Facts shown by pages, Zenith, tests, and documentation must agree. The current
  Ballpit 48/65/57 drift violates this standard and is tracked in `ROADMAP.md`.

Existing checks cover route markers, FAQ rules, selected API invalid paths,
album signing, responsive overflow, Zenith interaction, and a mocked live reply.
End-to-end Admin workflows, real Supabase allow/deny behavior, service-worker
offline/update behavior, and successful API/database paths are **missing**.

## Maintainability and clean architecture

- Route pages compose features; shared components do not own privileged server
  behavior.
- Data access stays in focused hooks/lib modules rather than being duplicated
  across presentation components.
- Server functions share request-boundary logic through
  `server/request-security.js`.
- New abstractions must remove proven duplication or enforce a boundary. Do not
  introduce frameworks, state libraries, or service layers speculatively.
- Avoid files or refactors whose scope cannot be reviewed confidently. Split
  large changes by behavior and risk.
- Source-string tests may protect static contracts, but user behavior and
  security boundaries should use executable tests where possible.
- New code must pass ESLint and the configured type check. Expand type coverage
  deliberately; do not claim most JSX is currently checked.
- CSS changes must name the owning layer/component and include responsive and
  screenshot review when selectors are broad.
- Public portfolio facts should have one reviewed source where practical.
- Remove code or functionality only with evidence that it is unused and with
  explicit approval when user-visible behavior changes.

Maintainability has no current complexity or dead-CSS automation. Type coverage,
CSS ownership mapping, and a single fact source remain roadmap work.

## Error handling and observability

| Area | Standard | Current status |
|---|---|---|
| Browser route failures | Show a usable recovery view and retain stale-chunk reload protection | Implemented via error boundary and entry recovery |
| Data loading | Distinguish loading, empty, unconfigured, and error states | Implemented for published content and Admin optional features |
| API failures | Return bounded generic messages, correct status, no-store, and request ID | Implemented/unit tested in part |
| Upstream calls | Apply explicit timeouts and fail without exposing secrets | Implemented |
| Logs | Structured event names; no PII, message content, or tokens | Implemented in server helper |
| Correlation | Surface `X-Request-Id` for provider-log correlation | Implemented |
| Monitoring | Route checks, 5xx/latency/429 review, storage/database capacity, cron checks | Documented; provider implementation external |
| Partial Admin writes | Detect and compensate for database/Storage divergence | Missing |

Do not swallow a security- or data-integrity-relevant error. Best-effort cleanup
must be logged safely and surfaced to the administrator without exposing secrets.

## Automated testing and regression prevention

Existing automated gates:

- `npm run check:repository` — current-tree secret patterns plus migration
  naming, target, encoding, and checksum safeguards.
- `npm run lint` — ESLint.
- `npm run typecheck` — configured JS analysis; limited scope.
- `npm run test:unit` — Vitest.
- `npm run build:react` — Vite production build.
- `npm run test:e2e` — Playwright desktop/tablet/mobile projects.
- `npm audit --audit-level=high` — local/CI dependency gate.
- GitHub link checking and Dependabot.

Required test selection:

- Documentation-only: `git diff --check`, link/path review, and consistency
  review. Run broader checks if documentation changes executable commands or
  contracts.
- Pure library/API logic: targeted Vitest plus `npm run verify`.
- UI/interaction: relevant unit tests, `npm run verify`, Playwright, and manual
  responsive/reduced-motion review.
- Auth/RLS/data: isolated Supabase policy/integration matrix plus all standard
  gates.
- Dependency change: audit, lockfile review, full verify/E2E, and bundle diff.
- PWA/routing: direct reload, redirect, offline/update behavior, verify/E2E.

Missing safeguards:

- executable RLS/grant integration tests;
- successful API-to-database tests with synthetic data;
- Admin content/inbox/chat browser workflows;
- automated accessibility scanning;
- coverage reporting and thresholds;
- visual-regression baselines;
- service-worker offline/update tests;
- bundle/image/Web Vitals budgets;
- full JSX type coverage.

## Deployment safety and recovery

A release is eligible for human approval only when:

1. Relevant local checks and required CI are green.
2. No unresolved high-severity dependency advisory remains.
3. The complete diff and lockfile changes are reviewed.
4. The Vercel Preview is accepted on desktop, tablet, and mobile.
5. Security/privacy-sensitive changes have isolated allow/deny evidence.
6. Migrations, provider rules, or environment changes have a separate reviewed
   plan and named human executor.
7. The exact production commit and rollback target are recorded.
8. Privacy, setup, runbook, and architecture documentation match the release.

Never make production secrets available to untrusted Preview deployments.
Prefer an isolated Supabase Preview project; otherwise leave server-backed
Preview features disabled.

Recovery standards:

- Static rollback uses a known healthy Vercel deployment or reviewed Git revert.
- Applied migrations are not destructively rolled back automatically; prefer a
  forward-compatible repair after preserving evidence.
- Data recovery stops writes, restores first into an isolated project, validates
  RLS/media/auth behavior, then follows an approved production plan.
- Service-worker cache versions are reviewed when rollback compatibility is at
  risk.
- Post-recovery checks cover routes, Admin auth, published/private media, contact,
  temporary chat, retention, headers, and deployed commit.

Provider linkage, branch protection, backups/PITR, alerting, edge limits, cron
execution, and the deployed SHA are **external** until verified.

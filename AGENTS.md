# Project instructions for AI engineering agents

These instructions apply to the entire repository. Read this file before making
changes, then read the documents relevant to the task:

- `docs/ARCHITECTURE.md` — source-backed system architecture.
- `docs/QUALITY_STANDARDS.md` — acceptance standards and current enforcement.
- `docs/ROADMAP.md` — evidence-backed improvement priorities.
- `docs/CONTINUOUS_IMPROVEMENT.md` — recurring supervised AI workflow.
- `docs/WORKSPACE_MANAGEMENT.md` — workspace isolation, ownership, and
  integration procedures.
- `docs/DISCOVERY_REPORT.md` — current findings and external verification gaps.
- `docs/DEPLOYMENT.md` and `docs/PRODUCTION_RUNBOOK.md` — release and recovery.
- `docs/SUPABASE_SETUP.md` and `docs/CHATBOT_SETUP.md` — backend setup.

Do not treat provider-side claims as confirmed merely because a runbook records
them. Vercel, Supabase, GitHub, DNS, secrets, applied migrations, cron jobs, and
the deployed commit require separate verification.

## Product and architecture

This is a client-rendered React 19 single-page portfolio built by Vite 8. Vite
uses `react-app/` as its root and emits `dist-react/`. React Router 7 owns the
routes. Vercel serves the static build and two serverless functions. Supabase
provides authentication, Postgres/PostgREST, private Storage, Realtime, and RLS.

Main paths:

- `react-app/index.html` — Vite HTML entry.
- `react-app/src/main.jsx` — browser boot, auth-callback routing, stale-chunk
  recovery, service-worker registration.
- `react-app/src/App.jsx` — lazy route definitions.
- `react-app/src/components/AppShell.jsx` — shared shell, route transitions,
  reveals, navigation/footer composition, scroll effects, and Zenith placement.
- `react-app/src/pages/` — route-level page components.
- `react-app/src/components/` — shared and complex visual components.
- `react-app/src/hooks/` — reusable state/data/view hooks.
- `react-app/src/lib/` — Supabase client, published-content queries, FAQ facts,
  chatbot state, and API client.
- `react-app/src/styles/`, `react-app/src/styles.css`, and
  `react-app/src/responsive.css` — global styling layers.
- `api/contact.js` and `api/live-chat.js` — Vercel Functions.
- `server/request-security.js` — shared request parsing, throttling, timeouts,
  correlation IDs, safe JSON responses, and structured error logging.
- `supabase/migrations/` — ordered schema, grant, RLS, Storage, trigger, and
  retention changes.
- `tests/unit/` and `tests/e2e/` — Vitest and Playwright.
- `vercel.json` — build, routing, functions, caching, and security headers.

There is no server-rendered React layer and no custom always-on application
server.

## Routes and page responsibilities

- `/` → `react-app/src/pages/HomePage.jsx`: branded introduction, desktop
  entry curtain, Three.js Ballpit, personal photo/interest collage, and the
  Tech/Travel/Life destination carousel.
- `/tech` → `TechPage.jsx`: terminal introduction, experience/education,
  lazy `TechStackWall`/`DriftWall`, certificates, two built-in event albums,
  and published Supabase albums.
- `/travel` → `TravelPage.jsx`: published Travel journals grouped by
  `travel_scope` into International and Local collections, with journal dialogs.
- `/life` → `LifePage.jsx`: sport, rides, coffee, home-base content, static
  photos, and published Life albums.
- `/admin` → `AdminPage.jsx` and `pages/admin/*.jsx`: passwordless sign-in,
  allow-list authorization, album/journal management, contact inbox, temporary
  chats, presence, and dashboard alerts.
- `/privacy` → `PrivacyPage.jsx`: visitor-data, retention, and provider
  disclosures.
- Unknown paths → `NotFoundPage.jsx`.

Important shared components:

- `SiteNavigation.jsx` and `SiteFooter.jsx` own primary navigation, contact
  information, privacy link, and social links.
- `ChatbotWidget.jsx`, `useChatbotController.js`, and
  `portfolio-faq.js` implement Zenith's reviewed FAQ, contact mode, and human
  handoff. Zenith is not generative AI. Album-related questions may query public
  published rows.
- `LiveChatPanel.jsx` manages the visitor's temporary chat session and polling.
- `PublishedAlbumSection.jsx`, `usePublishedAlbums.js`, and
  `published-albums.js` load published rows and one-hour signed media URLs.
- `AlbumViewer.jsx` and `Masonry.jsx` render modal photo galleries.
- `HeroBallpit.jsx` and `Ballpit.jsx` implement the WebGL hero. The current
  Home configuration is 57 spheres; do not repeat stale 48/65-sphere facts.
- `HomeEntryPreloader.jsx`, `HomeHeroIntro.jsx`, `HomeLaneCarousel.jsx`,
  `DriftWall.jsx`, `SmoothScroll.jsx`, and `ClickSpark.jsx` own major motion
  and interaction systems.

## Design identity and UX principles

- Preserve the established bright-white glassmorphism/neumorphism, soft depth,
  restrained shadows, red identity accent, RB mark, and personal storytelling.
- Do not redesign merely to follow a trend. Brand, content order, and signature
  interactions are product behavior.
- Keep interfaces responsive across desktop, tablet, and mobile.
- Keyboard, focus, readable content, semantic structure, reduced motion, coarse
  pointers, Save-Data, loading, empty, error, offline, and unconfigured-service
  states are first-class experiences.
- Do not hide content behind animation. Reduced-motion users must receive final
  states immediately.
- Motion should explain hierarchy or add character without blocking navigation.
  Expensive animation must pause offscreen or while the document is hidden where
  practical.
- Preserve the service-free public experience: routes and reviewed FAQ remain
  usable when Supabase/server functions are not configured.
- Never invent or expand personal, academic, employment, client, project,
  credential, or metric claims without owner-provided evidence.

## Code and component conventions

- Use functional React components and hooks unless an error boundary requires a
  class component.
- Keep route composition in `pages/`, reusable UI in `components/`, reusable
  behavior in `hooks/`, and data/domain helpers in `lib/`.
- Keep privileged server logic out of `react-app/`. Browser code may use only
  publishable credentials.
- Continue route-level lazy loading. Lazy-load expensive below-the-fold visual
  systems when possible and preserve existing viewport gates.
- Reuse existing helpers and components before introducing a parallel pattern.
- Keep changes narrow. Avoid drive-by formatting, broad CSS rewrites, or moving
  files without a demonstrated benefit.
- Treat `styles/main.css` imports, legacy global `styles.css`,
  `responsive.css`, and colocated component CSS as overlapping contracts.
  Review selectors and visual regressions before deleting or consolidating rules.
- Render visitor/admin content as React text. Do not introduce
  `dangerouslySetInnerHTML` for external or user-controlled data.
- Keep validation at trust boundaries. Client validation is UX; server/database
  validation, grants, RLS, and constraints are the security boundary.
- Update facts, tests, privacy text, setup docs, and architecture docs together
  when a contract changes.
- Do not edit already-applied migration files. New schema work requires a new
  ordered migration and explicit human authorization.

## Animation and interaction conventions

- Anime.js is used for the Home text/entry sequence.
- GSAP is used for the Home lane carousel and masonry motion.
- Three.js/WebGL powers the Ballpit.
- Lenis enhances fine-pointer desktop wheel scrolling.
- CSS and `AppShell` observers provide route/viewport reveals.
- `IntersectionObserver`, `ResizeObserver`, `requestAnimationFrame`, document
  visibility, reduced-motion media queries, and Save-Data checks are established
  performance patterns.
- Native `dialog` is used for albums, certificates, and Travel journals. Zenith
  uses an ARIA modal with explicit focus trapping and scroll locking.
- When changing a composed transform, ensure reveal/hover animation does not
  overwrite layout transforms.

Any interaction change must be checked with keyboard, mouse, touch/coarse
pointer, reduced motion, and the relevant responsive viewports.

## Backend API conventions

`api/contact.js` and `api/live-chat.js`:

- accept POST only and return `Allow: POST` for other methods;
- parse bounded JSON with `server/request-security.js`;
- return safe JSON, `Cache-Control: no-store`, `nosniff`, and a request ID;
- bound upstream Supabase calls with timeouts;
- log structured event names and error metadata, never message bodies, email
  addresses, session tokens, credentials, or private records;
- use server-only `SUPABASE_URL` plus `SUPABASE_SECRET_KEY` or
  `SUPABASE_SERVICE_ROLE_KEY`;
- must preserve validation, idempotency/token checks, rate-limit responses, and
  generic client errors.

`/api/contact` currently enforces a 24 KiB body, five requests per source key
per ten minutes, a honeypot, field bounds, consent, a UUID submission key, and
at most six recent FAQ messages.

`/api/live-chat` currently enforces an 8 KiB body, per-action process-local
limits, hashed 32-byte session tokens, 1,200-character messages, a 200-message
session cap, at most 100 returned messages, open/future-expiry checks, and
optional first-message Resend notification.

Process-local throttles are not globally durable. Provider edge rules are
external controls and must not be assumed active without verification.

## Supabase security boundaries

- Browser variables are only `VITE_SUPABASE_URL` and
  `VITE_SUPABASE_PUBLISHABLE_KEY`. They are public by design.
- Never put a secret/service-role key in a `VITE_` variable, React component,
  browser log, test fixture, issue, or committed file.
- Admin sign-in uses passwordless OTP with `shouldCreateUser: false`.
- A session alone is insufficient. `is_album_admin()`, explicit grants, RLS,
  and private Storage policies enforce authorization.
- Public album reads require `published = true`; drafts and private visitor
  records must remain inaccessible to anonymous/non-admin clients.
- Visitor contact/chat writes use Vercel Functions with a server key. Do not add
  anonymous direct-table write policies as a shortcut.
- Live-chat tokens are secrets for the lifetime of a session. Only their SHA-256
  hashes belong in the database.
- The `album-media` bucket stays private. Public media uses time-limited signed
  URLs backed by policies.
- Retention jobs delete expired chats and replied/archived inquiries according
  to the migrations. Their production activation is external state.
- Never query, copy, mutate, or use production visitor data for testing.
- Never apply, repair, reorder, or roll back migrations automatically.

Any change to authentication, authorization, RLS, grants, retention, Storage, or
server keys is high risk: inspect and propose first, use an isolated project and
synthetic data, and require explicit human authorization before implementation
or production action.

## AI usage and browser-verification efficiency

Use the least expensive reliable method for development, debugging, and code
changes. Reduce token and tool usage without weakening correctness, security,
accessibility, or the verification standards below.

- Inspect the relevant source and existing tests before using browser
  automation. Read only the task-relevant documents and file sections; do not
  repeatedly reload unchanged context during the same task.
- Prefer static analysis, focused searches, and the smallest relevant automated
  test for straightforward component, CSS, documentation, or logic changes.
- Use Playwright Chromium only when actual browser behavior or visual evidence
  is needed, such as responsive layout, rendering/alignment, interaction,
  navigation, authentication, focus, touch, reduced motion, or a browser-only
  defect. Do not launch it merely because a frontend file changed.
- When Playwright is justified, target the affected route, state, viewport, and
  test first. Reuse an active browser/server session when practical, inspect the
  smallest useful DOM region, and capture screenshots only when visual review
  materially helps. Avoid repeated navigation and unchanged screenshots.
- Expand from focused checks to broader `verify` or end-to-end gates when a
  failure, cross-cutting risk, release-level task, or the standards below require
  it. Do not run unrelated extensive suites by default.
- Keep progress updates and handoffs concise. Report files changed, tests run,
  whether Chromium was used and why, remaining issues, and whether verification
  succeeded.

## Testing and verification

The normal commands, after an explicitly approved clean dependency install, are:

```bash
npm ci
npm run verify
npm run test:e2e
npm audit --audit-level=high
git diff --check
```

`npm run verify` runs lint, the configured JavaScript type analysis, unit tests,
and the production build. The current `jsconfig.json` does not cover most JSX;
do not describe it as full application type safety.

Run the smallest relevant checks during development, then the complete gates
before handoff when the environment supports them. Never claim a test passed if
it did not run. Never silently skip or weaken a failing check. Report environment
blockers separately from code failures.

Use Playwright's service-free configuration for ordinary browser smoke tests.
Do not add production secrets to CI. Supabase/RLS integration tests must use a
local or isolated non-production project with synthetic identities and data.

For acceptance criteria and missing automation, follow
`docs/QUALITY_STANDARDS.md`.

## Git, pull-request, and deployment rules

- Work only in the task's assigned workspace and non-production task or
  integration branch. A Codex-managed detached worktree is allowed only when
  its intended base branch and starting commit are recorded for the task,
  unless the user explicitly directs otherwise.
- Never merge or commit directly to `main`, and never force-push.
- Do not push, open/merge a pull request, deploy, promote, or roll back without
  explicit authorization for that exact action.
- Keep pull requests focused and reviewable. Separate dependency, visual,
  security/data, and unrelated cleanup changes.
- Preserve user changes in a dirty worktree. Do not use destructive Git commands
  to manufacture a clean state.
- A release candidate requires green relevant checks, a reviewed diff, no
  unresolved high-severity audit finding, Preview acceptance, rollback notes,
  and any risk-specific evidence.
- Vercel deployment is provider-side Git integration; there is no deployment
  workflow in GitHub Actions. A merge is not proof of deployment.
- Database/provider actions are separate from code approval. Never infer
  migration or production authorization from approval to edit source.

## Permanent safety boundaries

- Never modify or deploy production without explicit authorization.
- Never apply Supabase migrations automatically.
- Never expose credentials, private messages, or personal user data.
- Never bypass authentication, authorization, RLS, or security checks.
- Never merge directly into the production branch.
- Never remove existing functionality without justification and approval.
- Never silently skip failing tests.
- Never rewrite large portions of the project unnecessarily.
- Never change project identity simply to follow design trends.

When blocked by missing authority, secrets, provider access, production data, or
a required dependency installation, stop the unsafe action, report the exact
blocker, and continue with safe read-only work where possible.

## Required handoff

Every completed task must report:

1. Files created or modified.
2. Confirmed behavior and assumptions.
3. Tests/checks run with pass, fail, or blocked status.
4. Security, privacy, data, accessibility, and performance impact.
5. Remaining safeguards or external verification.
6. Recommended next focused step.

Use the Observe → Evaluate → Prioritize → Implement → Test → Review → Document
workflow in `docs/CONTINUOUS_IMPROVEMENT.md`.

## Workspace isolation and concurrent development

`docs/WORKSPACE_MANAGEMENT.md` is the canonical operating procedure for Local,
Worktree, Cloud, CLI, desktop, and scheduled work. These requirements are
permanent safety boundaries:

- No two autonomous implementation tasks may modify the same Git working tree
  simultaneously. Read-only inspection may be shared when it does not mutate
  repository or provider state.
- Every implementation task must have one assigned directory, one owner or
  orchestrator, an assigned non-production task or integration branch, an
  explicit scope and file-ownership boundary, and a recorded starting commit.
  A detached managed worktree must still record its assigned base branch.
- Before modifying files, run and review `pwd`, `git branch --show-current`,
  `git rev-parse HEAD`, `git status --short`, and
  `git worktree list --porcelain`. Identify Local, Worktree, or Cloud mode and
  confirm that the directory is assigned to the task and has no other active
  implementation owner.
- Prefer a Codex-managed worktree for implementation. Concurrent local tasks
  require distinct worktrees and must not share a mutable branch; a managed
  detached HEAD remains isolated until a task branch is assigned. When the
  developer is actively using the local checkout, unattended or background
  implementation must use another worktree; otherwise it must remain read-only.
- Each autonomous agent that may write must have its own assigned worktree and
  ownership scope. Delegation, a new conversation, or a forked chat does not by
  itself establish a separate directory; verify the reported workspace before
  allowing the agent to implement.
- Scheduled tasks default to read-only observation. Any explicitly authorized
  scheduled implementation in this Git repository must use a dedicated
  background worktree, never the developer's active Local checkout.
- Never reset, stash, clean, overwrite, discard, or transfer another developer's
  or agent's uncommitted work. Handoffs that move code between Local and a
  worktree require human awareness and a reviewed destination state.
- Worktrees isolate checked-out files, not shared databases, ports, browser
  profiles, output directories, secrets, Vercel/Supabase/GitHub settings, or
  external services. Assign and coordinate those resources separately.
- Stop implementation when ownership, isolation, scope, or repository state is
  ambiguous. Preserve the worktree, collect read-only evidence, and request
  direction rather than resolving the ambiguity with Git mutations.
- Integration is controlled: stop the implementation owner, review its complete
  diff, run relevant checks, identify overlap with other worktrees, then use a
  human-reviewed merge, pull request, Handoff, or cherry-pick. Never
  automatically merge overlapping or unverified changes; rerun checks after
  integration.
- Record the source and integration commits plus the rollback method before
  integration. If rollback is required, use a reviewed revert or the documented
  release procedure; never rewrite shared history or discard another workspace's
  changes to manufacture a rollback.

`AGENTS.md` communicates policy to cooperating tools; it is not a filesystem
lock and cannot prevent another process from writing. Safety depends on selecting
the correct Codex execution mode, using Git worktrees and branches, recording
ownership, and stopping when a collision is detected.

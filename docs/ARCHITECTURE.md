# Portfolio architecture

This document describes the architecture confirmed in the repository as of
2026-11-01. It intentionally separates source-controlled behavior from provider
state that must be checked in Vercel or Supabase.

## System context

```text
Visitor browser
  |
  | GET pages and static assets
  v
Vercel CDN -> React 19 / Vite single-page application
  |                         |
  |                         | publishable Supabase client
  |                         v
  |                  Supabase Auth, PostgREST, Storage, Realtime
  |
  | POST /api/contact and /api/live-chat
  v
Vercel Functions -> Supabase with a server-only key
                  -> Resend for an optional first-chat notification

Administrator browser
  -> Supabase passwordless sign-in
  -> is_album_admin() allow-list check
  -> RLS-protected content, inbox, chat, storage, and Realtime operations
```

The frontend is client rendered. Vercel serves the `dist-react` build, redirects
legacy `.html` paths, and rewrites non-API deep links to the application shell.
There is no server-rendered React layer and no custom application server.

## Technology stack

| Area | Confirmed implementation |
|---|---|
| Runtime | Node 22 for tooling and Vercel Functions |
| Frontend | React 19, React DOM, React Router 7, Vite 8 |
| Styling | Plain CSS, shared design tokens, global/component styles |
| Motion | Anime.js, GSAP, Lenis, CSS transitions, IntersectionObserver |
| Graphics | Three.js/WebGL Ballpit, Canvas click sparks, inline SVG |
| Icons | Phosphor Icons, Simple Icons, and the Devicon Java mark |
| Backend | Supabase Auth, Postgres/PostgREST, Storage, Realtime, RLS |
| Server endpoints | Two Vercel Functions under `api/` |
| Optional email | Resend, called only for the first visitor chat message |
| Unit tests | Vitest |
| Browser tests | Playwright with desktop, tablet, and mobile projects |
| Hosting | Vercel static output plus serverless functions |

Exact dependency constraints are in `package.json`; resolved versions and
integrity hashes are in `package-lock.json`.

## Frontend boot and routing

`react-app/index.html` loads `react-app/src/main.jsx`. The entry point:

- moves Supabase auth callbacks that land on `/` to `/admin`;
- installs one guarded reload path for stale lazy-loaded chunks;
- mounts a `BrowserRouter` under React `StrictMode`;
- registers the service worker only in production and during browser idle time.

`App.jsx` lazy-loads every route:

| Route | Page |
|---|---|
| `/` | Home |
| `/tech` | Technology story, credentials, tools, and albums |
| `/travel` | Published local and international travel journals |
| `/life` | Interests, sport, rides, coffee, and albums |
| `/admin` | Authenticated content, inbox, and chat dashboard |
| `/privacy` | Visitor-data and service disclosures |
| `*` | React 404 view |

`AppShell` supplies the skip link, route transition handling, shared footer,
custom scrollbar, smooth scrolling, pointer sparks, reveal observers, and
Zenith. The regular header is omitted on Home because Home renders its header
inside the hero. Zenith is omitted on `/admin`.

## Public pages

### Home

Home contains a desktop-only entry curtain, an Anime.js text scramble, a
Three.js Ballpit configured for 57 spheres, a photo-and-interest collage, and a
GSAP destination carousel for Tech, Travel, and Life. The entry sequence is
skipped on coarse/small viewports, reduced motion, Save-Data, and internal
navigation. Ballpit initialization is gated by WebGL support and pauses outside
the viewport or while the document is hidden.

### Tech

Tech contains an animated terminal, three experience/academic entries, a
lazy-loaded `TechStackWall`, seven certificate previews, two built-in event
albums, database-published Tech albums, and a closing statement. `DriftWall`
renders five vertically moving columns of technology marks, applies pointer
parallax, pauses its animation when not visible, and has a reduced-motion
layout. Album galleries lazy-load the GSAP masonry component.

### Travel

Travel contains a terminal introduction and database-published travel journals
grouped by `travel_scope` into International and Local collections. Opening a
journal shows its cover, long-form description, location, category, and signed
supporting images in a native modal dialog.

### Life

Life presents volleyball, motorcycles, coffee, basketball, San Mateo, and a
small static photo story. A shared published-album section adds database-backed
Life galleries. It ends with a personal philosophy statement.

### Privacy and 404

Privacy documents contact-inquiry fields, chat retention, notification behavior,
and the service providers used. Unknown routes render a local recovery link.

## Zenith assistant and human handoff

Zenith is not a generative-AI service. The assistant dynamically imports a
reviewed, typo-tolerant intent/FAQ module. Most answers are computed entirely in
the browser. Album-list, album, and journal questions may make a public
Supabase query so the answer can include currently published content. Questions
are otherwise not sent to an AI provider.

The widget has three modes:

1. Reviewed portfolio FAQ.
2. Temporary visitor-to-administrator live chat.
3. Contact form submission to the private inbox.

The modal widget traps focus, closes on Escape, restores launcher focus for
keyboard dismissal, locks background scrolling, and exposes live regions for
status and messages.

## Public album read flow

Public pages use only `VITE_SUPABASE_URL` and
`VITE_SUPABASE_PUBLISHABLE_KEY`. `loadPublishedAlbums` selects rows where
`published = true` and `destination` matches the page. RLS is the actual read
boundary. Media paths are exchanged for one-hour signed Storage URLs. A failed
batch-signing request falls back to signing each path separately.

Travel retries without `travel_scope` when the first query fails, preserving
compatibility with a database that has not applied migration 003. That fallback
is compatibility behavior, not evidence that production is missing a migration.

## Admin authentication and authorization

Admin sign-in uses Supabase passwordless email OTP with user creation disabled.
After a session exists, the frontend calls `is_album_admin()`. The dashboard is
shown only when that function returns `true`.

The database function is `security definer`, has an empty search path after
migration 008, and compares the JWT email with `admin_allowlist`. RLS and Storage
policies call the same function. Route visibility and client-side state are not
treated as security controls.

An allow-listed administrator can:

- create private Tech/Life albums and Travel journals;
- upload, replace, and remove media;
- edit metadata and publish or unpublish content;
- permanently delete content and its referenced media;
- read, classify, and delete contact inquiries;
- view, reply to, and end temporary chats;
- publish dashboard presence and subscribe to chat changes through Realtime.

Image uploads are checked in the browser for JPEG/PNG/WebP and 10 MB maximum
size. Decodable images are converted to WebP and bounded to 1280 px for covers
or 1920 px for gallery images when that produces a smaller file. The private
Storage bucket independently enforces the same MIME and byte limits.

## Vercel Functions

### `POST /api/contact`

The contact handler allows POST only, limits the body to 24 KiB, uses a
honeypot, validates and bounds all fields, requires consent, retains at most six
FAQ messages, requires a UUID retry key, and upserts idempotently. It applies a
process-local limit of five requests per source key per ten minutes. It writes
through a server-only Supabase key and returns safe errors with a request ID.

### `POST /api/live-chat`

The live-chat handler limits JSON bodies to 8 KiB and supports `start`,
`presence`, `send`, `poll`, and `end`. Each action has a process-local
per-source rate. A new session receives a 32-byte random token; only its SHA-256
hash is stored. Every authenticated session lookup requires the session ID,
token hash, open status, and future expiry.

Visitor messages are limited to 1,200 characters. The endpoint checks a
200-message cap, and migration 010 enforces the same cap under a row lock to
handle concurrent inserts. Responses return at most the newest 100 messages.
The first visitor message may trigger an asynchronous Resend notification.

Both functions bound Supabase calls with a 6.5-second fetch timeout, avoid
logging visitor content, and return `Cache-Control: no-store`.

## Database and storage model

The ten ordered migrations define:

- `admin_allowlist` and `is_album_admin()`;
- `albums` and `album_photos`;
- `destination` and Travel `travel_scope` classifications;
- long-form Travel descriptions;
- `contact_inquiries` and status tracking;
- `chat_sessions`, `chat_messages`, and singleton `chat_presence`;
- the private `album-media` bucket and upload constraints;
- explicit browser-role grants and RLS policies;
- a contact idempotency key;
- the concurrency-safe chat-message cap.

Scheduled database jobs remove expired chats every ten minutes and remove
inquiries 180 days after they become `replied` or `archived`. New and read
inquiries have no automatic age-based deletion in the current migrations.
Whether these migrations and cron jobs are active in production cannot be
proved from this repository.

## Styling and animation architecture

`styles/main.css` imports tokens, base rules, neumorphism, shared components,
and motion rules. `styles.css` and `responsive.css` are also loaded globally,
while complex components have colocated CSS. The source currently contains
about 9,300 lines of CSS, so selector ownership and regression review matter.

Motion is progressively enhanced. Reduced-motion handling exists in the shell,
preloader, hero text, Ballpit, carousel, DriftWall, masonry, mascot, click
sparks, and smooth scrolling. Save-Data additionally disables the entry/WebGL
path and Lenis. Intersection and resize observers defer work and pause expensive
animation when practical.

## PWA and offline behavior

The production service worker is network-first for navigation, cache-first for
hashed assets, and bounded stale-while-revalidate for same-origin media. Public
routes may fall back to a cached route or shell. Offline `/admin` always receives
the physical offline document. Cross-origin Supabase signed media and API POSTs
are not placed in these caches.

## Build, CI, and deployment

Vite uses `react-app/` as its root and emits `dist-react/`. `vercel.json` defines
the build, output, two function durations, redirects, SPA rewrite, cache rules,
CSP, content-type protection, referrer policy, and permissions policy.

GitHub Actions provide:

- a dependency-free repository-text secret pattern scan and ordered migration checksum
  validation before the main verification install;
- lint, configured JavaScript type analysis, unit tests, and production build;
- Playwright smoke tests on desktop, tablet, and mobile;
- high-severity npm audit enforcement;
- scheduled and pull-request link checking;
- weekly Dependabot proposals for npm and GitHub Actions.

There is no GitHub Actions deployment job. Production delivery depends on the
Vercel Git integration, whose project linkage, branch selection, environment
values, and deployed commit remain provider-side state.

## Repository map

```text
api/                    Vercel Functions
docs/                   architecture, setup, operations, and AI workflow
react-app/public/       static media, manifest, service worker, offline page
react-app/src/          routes, UI, hooks, data clients, and styles
server/                 shared function request/security helpers
scripts/                dependency-free repository safeguard checks
supabase/migrations/    ordered database, RLS, storage, and retention changes
tests/unit/             Vitest source and contract tests
tests/e2e/              Playwright interaction and responsive smoke tests
.github/workflows/      repository QA, audit, and link checks
vercel.json             hosting, routing, function, cache, and header contract
```

For audit findings and external verification gaps, see
[`DISCOVERY_REPORT.md`](DISCOVERY_REPORT.md). Acceptance criteria and priorities
are in [`QUALITY_STANDARDS.md`](QUALITY_STANDARDS.md) and
[`ROADMAP.md`](ROADMAP.md). For the recurring supervised improvement process,
see [`CONTINUOUS_IMPROVEMENT.md`](CONTINUOUS_IMPROVEMENT.md).

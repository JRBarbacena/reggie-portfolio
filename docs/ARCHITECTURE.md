# Architecture

## Delivery model

The production portfolio is a client-rendered React 19 single-page application
built by Vite. React Router owns Home, Tech, Travel, Life, Admin, and 404 views.
Vercel serves the static `dist-react` output, redirects retained legacy URL
aliases, and rewrites deep links to the React shell.

```text
react-app/index.html
  -> react-app/src/main.jsx
     -> BrowserRouter
        -> AppShell
           -> shared navigation, footer, motion, scrollbar
           -> lazy Home / Tech / Travel / Life / Admin routes
  -> shared React design system
  -> Supabase publishable client
  -> production service worker and manifest
```

## Data and authorization

The browser uses only `VITE_SUPABASE_URL` and
`VITE_SUPABASE_PUBLISHABLE_KEY`. Public pages query published destination content.
The Admin route uses passwordless authentication and verifies membership through
the `is_album_admin` database function. Row-level security and private storage
policies—not the discoverability of `/admin`—enforce access.

Admin operations support private drafts, publication, destination/category rules,
cover replacement, supporting-photo addition/removal, editing, and confirmed
deletion. Storage media is exposed to authorized/public views with time-limited
signed URLs.

## Styling and motion

The visual system combines bright-white glass and neumorphic surfaces with a red
accent. Shared CSS tokens control spacing, typography, elevation, duration, and
easing. `data-reveal` content is observed by `AppShell`; reduced-motion users see
final states immediately.

Home lazy-loads the Three.js Ballpit. It pauses outside the viewport, omits the
cursor-following sphere, and falls back to a static treatment for reduced motion
or Save-Data. The first-session/reload Home preloader is portaled outside the
inert application root and is skipped during internal navigation.

The shared `AppShell` owns one-time viewport reveals for all four public routes:
Home, Tech, Travel, and Life. A unit test verifies that every route keeps both
reveal and deferred-section markers, preventing a future Home-only change.

## PWA behavior

Vite copies public PWA files from `react-app/public` into `dist-react`. The
service worker caches the React shell entry assets, loads route chunks only when
they are requested, uses network-first
navigation, keeps public pages available offline, and deliberately serves the
physical offline document for `/admin` while disconnected. Runtime media caching
is same-origin and bounded.

## Production configuration

`vercel.json` is the checked source of truth for headers, the React build/output
settings, and SPA rewrites. The CSP permits Supabase HTTPS/WebSocket connections and
signed images while denying frames, plugins, camera, microphone, and geolocation.

## Verification architecture

`npm run verify` runs current unit tests and builds React for production.

Browser interaction, responsive layout, PWA/offline behavior, preloader,
Ballpit, and accessibility are reviewed manually before release. Scheduled link
and dependency workflows provide additional repository checks.

## Deployment and rollback

Vercel Git integration should build `main` and pull requests using the committed
configuration. Required public environment variables must be configured in each
Vercel environment. Roll back through Vercel deployment history or a normal Git
revert; never place privileged Supabase credentials in the frontend to repair a
deployment.

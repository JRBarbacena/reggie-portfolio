# Architecture

## Delivery model

The production portfolio is a client-rendered React 19 single-page application
built by Vite. React Router owns Home, Tech, Travel, Life, Admin, and 404 views.
Vercel serves the static `dist-react` output and rewrites deep links to the React
shell after applying permanent legacy-HTML redirects.

```text
react-app/index.html
  -> react-app/src/main.jsx
     -> BrowserRouter
        -> AppShell
           -> shared navigation, footer, motion, scrollbar
           -> lazy Home / Tech / Travel / Life / Admin routes
  -> shared css/ design system
  -> Supabase publishable client
  -> production service worker and manifest
```

The old root HTML and browser-JavaScript implementation remains in source control
as rollback/reference material, but it is not the Vercel production output.

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

## PWA behavior

Vite copies the public PWA files from `assets` into `dist-react`. The service
worker caches the React shell and discovered built chunks, uses network-first
navigation, keeps public pages available offline, and deliberately serves the
physical offline document for `/admin` while disconnected. Runtime media caching
is same-origin and bounded.

## Production configuration

`config/site-manifest.json` is the checked source of truth for product routes,
legacy aliases, headers, React build/output settings, and SPA rewrites.
`scripts/generate-site.mjs` validates it and generates `vercel.json` plus retained
route/cache fixtures. The CSP permits Supabase HTTPS/WebSocket connections and
signed images while denying frames, plugins, camera, microphone, and geolocation.

## Verification architecture

`npm run verify` validates generated files and encoding, runs unit tests, builds
React, and executes the production HTTP contract twice. The route contract checks
security headers, clean routes, aliases, Admin, the physical offline document,
assets, and SPA fallback.

`npm run test:e2e:smoke` runs Chromium interaction checks through a repository
runner that owns the preview-server lifecycle. `npm run qa:react` adds Axe,
mobile/desktop overflow, PWA/offline, preloader, Ballpit, and performance-signal
acceptance. Scheduled Lighthouse, link, and dependency workflows provide slower
release evidence.

## Deployment and rollback

Vercel Git integration should build `main` and pull requests using the committed
configuration. Required public environment variables must be configured in each
Vercel environment. Roll back through Vercel deployment history or a normal Git
revert; never place privileged Supabase credentials in the frontend to repair a
deployment.

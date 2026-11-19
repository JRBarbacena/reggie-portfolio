# Deployment runbook

## Vercel project settings

- Repository: `JRBarbacena/reggie-portfolio`
- Production branch: `main`
- Framework: Vite
- Build command: `npm run build:react`
- Output directory: `dist-react`
- Install command: `npm ci` or Vercel's lockfile default

The committed `vercel.json` supplies these build values, security headers,
legacy URL redirects, and React SPA fallback. Do not override them with conflicting
dashboard values.

The build also copies `react-app/public/favicon.ico` to the site root. It wraps
the RB `favicon-32.png` image for browsers that request `/favicon.ico` directly;
keep both files in sync when the brand icon changes. Verify the response is an
icon rather than the SPA HTML fallback after deployment.

Use Node 22 for local release checks and Vercel builds; `package.json` and CI
declare that runtime explicitly.

## Environment variables

Configure these browser-safe values for Development, Preview, and Production:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Zenith needs these **server-only Vercel variables** for temporary human chat
and the private contact inbox:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (or `SUPABASE_SECRET_KEY` for projects using the newer key name)

Optional first-message email alerts additionally use `RESEND_API_KEY`, with
`CHAT_NOTIFICATION_EMAIL`, `CHAT_NOTIFICATION_FROM`, and `SITE_URL` available
as overrides. These remain server-only and must never use a `VITE_` prefix.

Never prefix a secret with `VITE_`, add it to `react-app/.env.local`, or expose
it in a client-side component. The browser uses only the two publishable
variables; Vercel Functions use the server-only values. After changing a Vite
environment variable, redeploy because values are embedded during the frontend
build.

Use separate Supabase projects and keys for Preview and Production whenever
server-backed preview testing is enabled. Never expose a production server key
to an untrusted preview deployment. If a separate preview project is not
available, omit the server-only variables from Preview; the static portfolio
and local Zenith FAQ will still work.

In Vercel, scope each value deliberately instead of selecting every environment
by default. Keep Production secrets Production-only, use synthetic credentials
and data for Preview, and leave server features disabled for untrusted forks.
Confirm the Production Branch is `main` and require Vercel's successful preview
plus both GitHub verification workflows before merging.

Copy `.env.example` only as a naming reference. For local Vite work, place the
two `VITE_` values in `react-app/.env.local`; keep server-only values in the
Vercel dashboard or the local environment used by `vercel dev`.

Follow [CHATBOT_SETUP.md](CHATBOT_SETUP.md) for the ordered Supabase migrations,
Vercel server variables, optional Resend notification, and end-to-end
verification steps. Zenith's reviewed FAQ does not use an AI-provider API.

In **Supabase Dashboard → Authentication → URL Configuration**, set:

- Site URL: `https://reggiebarbacena.vercel.app`
- Redirect URL: `https://reggiebarbacena.vercel.app/admin`
- Local redirects: `http://localhost:5173/admin` and
  `http://127.0.0.1:5173/admin`
- Optional Vercel preview redirect:
  `https://reggie-portfolio-*-dummynigiegie-2626s-projects.vercel.app/**`

The production `/admin` redirect must be an exact allow-list entry. If it is
missing, Supabase falls back to Site URL. After changing these values, request
a new magic link because an already-sent email keeps its original destination.

## Release procedure

1. Use Node 22, run `npm ci`, `npm run verify`, `npm run test:e2e`, and
   `npm audit --audit-level=high`.
2. Push a branch and inspect its Vercel preview on desktop, tablet, and mobile.
3. Confirm public Supabase content, the `/admin` sign-in callback, PWA install,
   chatbot fallback behavior, and one secure contact submission.
4. Merge to `main` only after required checks pass.
5. Verify `/`, `/tech`, `/travel`, `/life`, `/admin`, one legacy `.html` URL,
   `/privacy`, and a direct deep-link reload on production. Confirm the deployed
   commit SHA in Vercel before closing the release.

## Repository controls

The settings in this section are the intended/previously recorded provider
state. They cannot be proved by repository source alone; verify them in GitHub
and Vercel before each production release.

The GitHub repository should be public and `main` should be protected. Pull
requests should be up to date and pass these checks:

- Generated, encoding, unit, React build, and route verification

Browser interaction and motion are reviewed manually before merging; there is
also a Playwright status check covering desktop, tablet, and mobile viewports.

The recorded policy requires linear history and resolved conversations, applies
protection to administrators, disables force-pushes and branch deletion, and
uses zero required approvals for the current single-maintainer workflow. Confirm
that GitHub still matches this policy.

The previous runbook records the Vercel CLI as linked to `reggie-portfolio` and
both required browser Supabase variables as configured for Development, Preview,
and Production. Verify those claims without exposing values. The committed
`vercel.json` defines the framework, build command, and output directory; avoid
conflicting dashboard overrides and never commit `.vercel` credentials.

## Rollback

- Immediate: promote the previous healthy deployment in Vercel.
- Repository: revert the cutover commit and allow Vercel to redeploy `main`.
- Data: do not roll back Supabase migrations destructively; keep content private
  while application compatibility is restored.

Record the last known-good deployment URL before each production promotion.
After a rollback, verify the deployment SHA and repeat the production smoke
checks; a Git revert alone is not evidence that Vercel finished promoting it.

After rollback, clear or advance the service-worker shell version if clients are
still receiving an incompatible cached shell.

Operational alerts, edge-rate rules, backup checks, secret rotation, and the
full incident procedure are documented in [PRODUCTION_RUNBOOK.md](PRODUCTION_RUNBOOK.md).

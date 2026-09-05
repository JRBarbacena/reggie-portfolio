# Deployment runbook

## Vercel project settings

- Repository: `JRBarbacena/reggie-portfolio`
- Production branch: `main`
- Framework: Vite
- Build command: `npm run build:react`
- Output directory: `dist-react`
- Install command: `npm ci` or Vercel's lockfile default

The committed `vercel.json` supplies these build values, security headers,
legacy redirects, and React SPA fallback. Do not override them with conflicting
dashboard values.

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

Follow [CHATBOT_SETUP.md](CHATBOT_SETUP.md) for the ordered Supabase migration,
Vercel secret, Responses API, and end-to-end verification steps.

In Supabase Authentication URL Configuration, add the production domain and
Vercel preview callback patterns required for `/admin` passwordless links.

## Release procedure

1. Run `npm run verify`, `npm run test:e2e:smoke`, `npm run qa:react`, and
   `npm audit --audit-level=high`.
2. Push a branch and inspect its Vercel preview on desktop and mobile.
3. Confirm public Supabase content, the `/admin` sign-in callback, PWA install,
   chatbot fallback behavior, and one secure contact submission.
4. Merge to `main` only after required checks pass.
5. Verify `/`, `/tech`, `/travel`, `/life`, `/admin`, one legacy `.html` alias,
   and a direct deep-link reload on production.

## Repository controls

The GitHub repository is public and `main` is protected. Pull requests must be
up to date and pass these checks:

- Generated, encoding, unit, React build, and route verification
- Chromium interaction and motion smoke

Linear history and resolved conversations are required. Protection applies to
administrators; force-pushes and branch deletion are disabled. Approval count is
zero because this is currently a single-maintainer repository.

The Vercel CLI is authenticated and linked to `reggie-portfolio`. Both required
Supabase variables are configured for Development, Preview, and Production. The
dashboard retains generic framework defaults, while the committed `vercel.json`
authoritatively overrides the framework, build command, and output directory for
each deployment. Do not commit `.vercel` credentials.

## Rollback

- Immediate: promote the previous healthy deployment in Vercel.
- Repository: revert the cutover commit and allow Vercel to redeploy `main`.
- Data: do not roll back Supabase migrations destructively; keep content private
  while application compatibility is restored.

After rollback, clear or advance the service-worker shell version if clients are
still receiving an incompatible cached shell.

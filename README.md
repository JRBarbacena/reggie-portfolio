# Reggie — Portfolio 

A React/Vite developer portfolio with four public stories—Home, Tech, Travel,
and Life—and a private Supabase-backed content dashboard. The interface combines
bright-white glassmorphism and neumorphism with a restrained red identity accent.

## Product routes

| Route | Purpose |
|---|---|
| `/` | Home introduction and content lanes |
| `/tech` | Engineering, tools, certificates, and published Tech albums |
| `/travel` | International and Local travel journals |
| `/life` | Sport, coffee, rides, and published Life albums |
| `/admin` | Authenticated content dashboard |

Legacy `/index.html`, `/tech.html`, `/travel.html`, and `/life.html` addresses
redirect permanently to their clean routes. Unknown paths render the React 404
view. `/offline.html` remains a physical PWA fallback document.

## Local development

```bash
npm ci
npm run dev:react
```

Open `http://127.0.0.1:5173`.

Build and preview the production application:

```bash
npm run build:react
npm run preview
```

The preview defaults to `http://127.0.0.1:4173`.

## Supabase configuration

Create `react-app/.env.local` without committing it:

```dotenv
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

Use the publishable key—not a service-role or secret key. Database, storage,
authentication, admin allow-list, and row-level security setup is documented in
[docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md).

## Verification

```bash
npm run verify
npm run test:e2e:smoke
npm run qa:react
npm audit --audit-level=high
```

- `verify` checks generated deployment configuration, UTF-8, unit tests, the
  React production build, security headers, redirects, and SPA route fallback.
- `test:e2e:smoke` checks routes, navigation, preloader rules, motion,
  reduced-motion behavior, responsive typography, focus, and album states.
- `qa:react` runs mobile/desktop accessibility, overflow, PWA/offline,
  performance-signal, Admin, and retired-route acceptance checks.
- `qa:visual` writes reproducible review captures under
  `artifacts/visual-acceptance`.

## Deployment

Vercel builds with `npm run build:react` and serves `dist-react`. React Router
deep links are handled by the generated SPA rewrite in `vercel.json`; CSP allows
only the application, required Supabase HTTPS/WebSocket endpoints, and local
media sources.

Provider setup, environment variables, preview acceptance, production promotion,
and rollback are documented in [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Editing rules

- Public content and composition live under `react-app/src`.
- Shared design tokens and component styles remain under `css` while the React
  migration uses them.
- Edit `config/site-manifest.json`, then run `npm run generate`; do not hand-edit
  generated route/configuration artifacts.
- Never commit Supabase secret/service-role keys or `.env.local`.
- Do not invent employment, client, metric, project, or credential content.



<!-- To run the system do this portfolio locally -->
<!-- run:  cd C:\Users\Andrew\Desktop\reggie-portfolio -->
<!-- npm run dev:react -->
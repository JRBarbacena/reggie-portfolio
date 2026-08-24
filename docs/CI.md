# CI runbook

Four GitHub Actions workflows guard the portfolio. Thresholds stay **strict**.

## Workflows

| Workflow | File | Trigger | Command |
|----------|------|---------|---------|
| Portfolio QA | `.github/workflows/portfolio-qa.yml` | push/PR `main`, daily | `npm ci` → `npm run qa` |
| Lighthouse Audit | `.github/workflows/lighthouse.yml` | PR `main`, weekly | `npm ci` → `npx --yes @lhci/cli@0.15.1 autorun` |
| Link Check | `.github/workflows/link-check.yml` | PR `main`, weekly | lychee + `lychee.toml` |
| Dependency Security Audit | `.github/workflows/security-audit.yml` | PR `main`, weekly | `npm ci` → `npm audit --audit-level=high` |

Dependabot (`.github/dependabot.yml`) opens weekly PRs for npm and Actions.

## Local reproduction

```bash
npm ci
npm audit --audit-level=high
npm run qa
npm run lhci
```

Link check (install [lychee](https://lychee.cli.rs/) first):

```bash
lychee --config lychee.toml --root-dir "$PWD" --no-progress "./**/*.html" "./**/*.md"
```

On Windows PowerShell, pass an absolute `--root-dir` (e.g. `(Get-Location).Path`).

Optional local a11y helper (uses npx lighthouse; does not alter the lockfile):

```bash
node scripts/run-a11y-lighthouse.mjs
```

## Why `@lhci/cli` is not in package.json

Pinning `@lhci/cli` as a devDependency pulls `puppeteer` / `lighthouse` trees that
currently report **high** npm advisories. That would fail Dependency Security
Audit while Lighthouse itself is only a CI probe.

CI therefore installs a **pinned** CLI ephemerally:

```text
npx --yes @lhci/cli@0.15.1 autorun
```

Config: [`.lighthouserc.json`](../.lighthouserc.json) — accessibility is an
**error** at `minScore: 0.9`; upload target is `filesystem` (no public temp
storage).

## Common failures → fixes

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Security audit red | Transitive high vulns in lockfile | Upgrade Vitest/tooling; keep `--audit-level=high`; do **not** add `@lhci/cli` to dependencies |
| Link check: `/tech` missing | Clean URL without fallback | Keep `fallback_extensions = ["html"]` and `index_files` in `lychee.toml`; pass `--root-dir` |
| Link check: `css/main.css?v=…` | Query string on local file | Covered by remap `(.+)\?v=.+ $1` in `lychee.toml` |
| Link check: `href="#"` | Placeholder CTA | Use a disabled `<button>`, not a fake link |
| Lighthouse a11y &lt; 0.9 | Contrast / headings / hidden content | Tune tokens for AA; avoid extra `h1` in preloader; do not leave `preloader-pending` on during audits |
| Lighthouse flake on Windows | Chrome temp `EPERM` / `NO_FCP` | Trust Ubuntu CI; or retry with fewer open Chrome processes. Prefer `npm run lhci` on Linux/CI |
| Portfolio QA fail | Structure / responsive / unit tests | Read `scripts/qa-static.mjs` / `qa-responsive.mjs` output; fix and re-run `npm run qa` |

## Config files to know

- [`lychee.toml`](../lychee.toml) — accept codes, remaps, path excludes  
- [`.lighthouserc.json`](../.lighthouserc.json) — URLs and assert levels  
- [`serve.json`](../serve.json) — local `cleanUrls` for `npm run serve`  
- [`.gitignore`](../.gitignore) — ignores `node_modules/`, `.lighthouseci/`, `.cursor/`

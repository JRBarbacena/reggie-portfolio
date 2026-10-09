# Production operations runbook

This portfolio is a static Vite site with two small Vercel Functions and a
managed Supabase backend. Keep that shape: it does not need a load balancer,
queue, custom database server, or always-on application host.

## Environment boundaries

- Production deploys from `main` and uses only Production-scoped Vercel values.
- Prefer a separate Supabase project for Preview. If that is unavailable, leave
  server secrets unset in Preview instead of granting previews production access.
- The only browser-visible variables are `VITE_SUPABASE_URL` and
  `VITE_SUPABASE_PUBLISHABLE_KEY`. Service/secret and Resend keys are server-only.
- Protect `main`, require both verification jobs, and review dependency updates.

## Release checklist

1. Use Node 22 and run `npm ci`.
2. Run `npm run verify`, `npm run test:e2e`, and
   `npm audit --audit-level=high`.
3. Review `git diff --check`, the complete diff, generated build sizes, and a
   high-confidence secret scan. Do not paste secret values into logs or issues.
4. Apply unapplied Supabase migrations in order. Never edit a migration that is
   already deployed, and never run destructive migration repair without first
   reconciling remote history.
5. Validate the Vercel Preview on desktop, tablet, and mobile. Exercise `/`,
   `/tech`, `/travel`, `/life`, `/admin`, a deep-link reload, offline fallback,
   one temporary chat, and one contact submission.
6. Merge only when CI is green. After production deploy, repeat route and API
   smoke checks and confirm the new deployment is serving the expected commit.

## Edge abuse controls (manual provider configuration)

The handlers include bounded per-instance throttles, body limits, and upstream
timeouts. Add Vercel Firewall rate rules for globally durable protection:

- `/api/contact`: start with 5 POST requests per source IP per 10 minutes.
- `/api/live-chat`: start with 90 POST requests per source IP per minute.
- Block or challenge obvious automation and non-POST traffic; do not challenge
  normal static assets or Supabase callbacks.

Observe real traffic for at least a week and tune for shared networks before
making rules stricter. A `429` response should retain `Retry-After`. Provider
rules are defense in depth; do not remove validation or RLS from the app.

## Monitoring and alert thresholds

Configure these in Vercel/Supabase or the existing monitoring provider; no new
always-on service is required:

- Synthetic GET for `/`, `/tech`, `/travel`, and `/life` every five minutes.
- Alert when route checks fail twice consecutively.
- Alert when either API reaches 2% 5xx responses over 10 minutes (with at least
  five requests), or p95 duration exceeds 2 seconds over 15 minutes.
- Review sudden `429` growth, structured `contact.insert_failed`,
  `live_chat.request_failed`, and `live_chat.notification_failed` events.
- Alert before Supabase database or storage consumption reaches 80% of the plan.
- Weekly, confirm the expired-chat cleanup job is still scheduled and that old
  sessions are being removed.

Logs contain request IDs, action names, and error codes—not visitor messages,
email addresses, live-chat tokens, or credentials. Use the response
`X-Request-Id` to correlate a visitor report with function logs.

## Backup and restore

- Verify the Supabase plan's database backup/PITR coverage and retention; do not
  assume settings from another project or tier.
- Database backups protect rows and storage metadata. Verify separately whether
  object bytes are covered, and export the private `album-media` bucket on a
  regular schedule appropriate to how often content changes.
- At least quarterly, restore the latest database backup and media export into
  an isolated non-production project. Confirm albums, RLS, admin sign-in, signed
  media, inbox access, and chat cleanup before recording the drill as successful.
- Keep exports encrypted, access-controlled, retention-limited, and outside the
  public repository. Do not restore production visitor data into shared previews.

## Secret rotation

Rotate Supabase server keys and Resend keys immediately after suspected
exposure, maintainer offboarding, or unexpected access; otherwise review them
quarterly and rotate according to provider policy.

1. Create the replacement key without deleting the active key when supported.
2. Update Production and the isolated Preview environment separately.
3. Redeploy and test contact, temporary chat, and notification delivery.
4. Revoke the old key, then verify logs contain no authentication failures.
5. If a secret reached Git history, treat it as compromised even after deletion:
   revoke it first, then clean history only with an explicit coordinated plan.

## Incident response and rollback

1. Assess scope from Vercel deployment/function logs, Supabase logs, provider
   status pages, and request IDs. Never copy visitor content into the incident log.
2. Contain: disable the affected endpoint or remove its server variables, add a
   temporary firewall rule, revoke exposed keys, or unpublish affected content.
3. Recover the static site by promoting the last healthy Vercel deployment.
   Prefer a forward-compatible database fix; do not destructively roll back an
   applied migration.
4. If data is damaged, stop writes, preserve evidence, restore into an isolated
   project first, validate, then perform a documented production recovery.
5. After recovery, verify every public route, admin sign-in, signed media,
   contact delivery, temporary-chat expiry, security headers, and service-worker
   update behavior. Record cause, timeline, affected data, and preventive action.

The static-site rollback target is 15 minutes when Vercel is healthy. Database
and media recovery time and recovery point depend on the enabled Supabase plan
and the last verified export; record the actual values after each restore drill.

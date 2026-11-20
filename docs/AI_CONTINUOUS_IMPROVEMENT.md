# Supervised AI continuous improvement system

This document retains the extended operating contract and review checklists.
The canonical project entry points are `../AGENTS.md`, `QUALITY_STANDARDS.md`,
`ROADMAP.md`, and the recurring workflow in `CONTINUOUS_IMPROVEMENT.md`.

This is the operating contract for AI-assisted maintenance of the portfolio. It
is intentionally supervised: AI can investigate, propose, implement in an
isolated change, and collect evidence, but a human owns scope, sensitive access,
acceptance, merge, migration, and deployment decisions.

## Vision

Continuously improve the portfolio without eroding its identity, accessibility,
security boundaries, factual accuracy, or visitor privacy. Prefer small changes
whose effect can be measured and reversed. Documentation and tests are part of
the product, not cleanup after implementation.

## Non-negotiable boundaries

An AI work session must not, unless a human gives explicit task-specific
authorization:

- read or reveal production secrets;
- query, copy, modify, or delete production visitor data;
- apply, repair, reorder, or roll back a database migration;
- change RLS, grants, authentication, retention, or Storage policies;
- install or upgrade dependencies;
- push, merge, create a release, promote a deployment, or change provider settings;
- submit production contact/chat forms or create production test records;
- invent biography, employment, client, metric, credential, or project facts;
- replace branded visuals or interaction behavior as incidental refactoring;
- use destructive Git or filesystem commands to obtain a clean state.

Repository instructions and the current user request always take precedence.
Existing uncommitted work belongs to the maintainer and must be preserved.

## Evidence classes

Every report or proposal should label claims as one of:

- **Confirmed:** traced to a file, command result, test, or approved provider
  observation.
- **Inference:** a reasoned conclusion from confirmed evidence.
- **Assumption:** needed to proceed but not yet verified.
- **External verification required:** only a provider/dashboard/production check
  can establish it.
- **Recommendation:** desired future state, not present behavior.

If a claim affects security, privacy, biography, or deployment, source evidence
is required. Silence is not evidence that a production control exists.

## Risk tiers and approval gates

| Tier | Examples | AI may do independently in an approved coding task | Human gate |
|---|---|---|---|
| Low | Documentation, comments, isolated tests, typo fixes | Inspect, edit, and run existing checks | Review before merge |
| Medium | UI behavior, component refactor, API validation, cache behavior | Implement narrowly and verify locally | Approve scope and preview before merge |
| High | Auth/RLS, visitor data, migrations, server keys, dependency majors, retention, destructive operations | Inspect and propose only by default | Explicit approval before implementation and again before production action |
| Production | Merge, migration execution, secret/provider changes, deploy/rollback | Never infer permission | Named human executes or explicitly authorizes the exact action |

When uncertain, use the higher tier.

## Improvement loop

```text
Human objective
  -> discovery and evidence packet
  -> narrow proposal with risk tier and rollback
  -> human scope approval when required
  -> isolated implementation
  -> automated and manual evidence
  -> human review
  -> preview acceptance
  -> human merge/deploy decision
  -> observation and documentation update
```

### 1. Intake

Record:

- the user-visible or operational problem;
- who is affected;
- the desired outcome and non-goals;
- the expected risk tier;
- whether any provider, dependency, schema, or production access would be needed.

Do not turn a broad request such as “improve the site” into an authorization to
redesign, upgrade, migrate, or deploy.

### 2. Discovery

Before editing:

1. Read repository instructions and relevant existing documentation completely.
2. Check `git status` and preserve unrelated changes.
3. Trace the behavior from route/component through data/API/policy and tests.
4. Identify existing design, content, privacy, and performance contracts.
5. Write confirmed facts, assumptions, and unknown external state separately.
6. Capture the smallest relevant baseline: tests, screenshots, bundle output,
   response contract, or reproduction steps.

For this repository, start with
[`ARCHITECTURE.md`](ARCHITECTURE.md) and
[`DISCOVERY_REPORT.md`](DISCOVERY_REPORT.md).

### 3. Proposal

For medium/high-risk work, prepare a short change record:

```text
Objective:
Evidence/reproduction:
Confirmed constraints:
Proposed change:
Files and systems in scope:
Risk tier:
Data/security impact:
Verification plan:
Rollback plan:
External checks still required:
```

Prefer one hypothesis per change. Separate dependency upgrades, visual changes,
and data-policy work so each can be reviewed and rolled back independently.

### 4. Implementation

- Work on a branch or isolated worktree.
- Keep diffs narrow and avoid drive-by formatting.
- Do not change generated or provider-owned state unless it is explicitly in scope.
- Add or update tests that observe behavior, not only source strings.
- Preserve reduced-motion, keyboard, responsive, privacy, and service-free paths.
- Treat error, loading, empty, offline, and unconfigured states as product states.
- Update architecture, privacy, setup, or runbook docs in the same change when a
  contract changes.

### 5. Verification

After a human-approved clean dependency install, the default repository gates are:

```bash
npm ci
npm run verify
npm run test:e2e
npm audit --audit-level=high
git diff --check
```

`npm run verify` covers lint, the configured JavaScript type-analysis scope,
unit tests, and production build. It does not currently prove all JSX types,
accessibility, production RLS, performance, or provider configuration.

Add risk-specific evidence:

| Change type | Additional evidence |
|---|---|
| Visual/motion | Desktop, tablet, mobile, reduced motion, coarse pointer, screenshots |
| Navigation/PWA | Direct deep link, reload, offline fallback, service-worker update |
| FAQ/content | Fact-source review, typo/fallback cases, no invented claims |
| Contact/chat API | Invalid, oversized, rate-limited, timeout, duplicate, expiry, token mismatch |
| Admin/media | Anonymous deny, non-admin deny, admin allow, partial-failure cleanup |
| Auth/RLS/schema | Isolated Supabase project, synthetic identities/data, policy matrix review |
| Dependency | Advisory reachability, lockfile diff, bundle diff, full tests |
| Performance | Production build chunks, representative Lighthouse and runtime trace |
| Accessibility | Keyboard-only walkthrough and automated accessibility scan |

Never use production visitor records as test fixtures.

### 6. Human review and release

The handoff must state:

- what changed and what did not;
- user/data/security impact;
- commands run and their exact pass/fail status;
- remaining assumptions and external checks;
- rollback procedure;
- whether documentation is synchronized.

A human reviews the diff and evidence, accepts the Vercel Preview, and decides
whether to merge. Database migrations, provider rules, secret changes, and
production promotion require their own explicit action; merge approval does not
implicitly authorize them.

### 7. Observe and learn

After a human-led release:

- verify the deployed commit and critical routes;
- watch error, latency, and abuse signals for the change;
- confirm privacy/retention behavior when relevant using synthetic records;
- record regressions, rollback, and follow-up work;
- update the discovery report when architecture or known risks materially change.

## Quality standard

A change is complete only when it is:

- **Correct:** observed behavior matches the stated objective and edge states.
- **Safe:** authorization remains server/database enforced and no secret crosses
  into browser code.
- **Private:** data collection is necessary, disclosed, bounded, and retained as
  documented.
- **Accessible:** keyboard, focus, semantics, contrast, zoom, and reduced motion
  remain usable.
- **Performant:** expensive work is deferred/paused and bundle/media changes are
  measured.
- **Resilient:** failures are bounded, visible, recoverable, and do not pretend to
  succeed.
- **Maintainable:** the smallest clear abstraction is used and facts do not drift.
- **Reversible:** rollback is understood before release.
- **Evidenced:** tests and manual observations are reported honestly, including
  anything that could not run.

## Portfolio-specific invariants

Every improvement must preserve these unless a human explicitly changes the
product contract:

- Home, Tech, Travel, and Life remain the primary public stories.
- `/admin` security depends on Supabase Auth plus allow-list-backed RLS, never
  route obscurity.
- Only published albums and their referenced media are public.
- Browser code receives only the Supabase URL and publishable key.
- Contact and live-chat server keys remain server-only.
- Zenith uses reviewed portfolio facts and clearly identifies human handoff.
- Contact consent and the Privacy link remain present at collection time.
- Temporary chats expire and can be ended/erased.
- Reduced-motion and service-free states remain first-class.
- Existing personal claims and credentials are not expanded without owner review.
- The established white glass/neumorphic surface language and red accent are
  product identity, not disposable implementation detail.

## Roadmap ownership

`ROADMAP.md` is the single prioritized backlog. It records the problem, evidence,
affected components, expected outcome, verification, and risk for each proposed
improvement. Do not maintain a second task list here: update the roadmap when new
evidence changes a priority, completes an item, or disproves a finding.

`DISCOVERY_REPORT.md` remains the dated baseline rather than a live task queue.
Product experiments start only after the relevant security and quality gates are
trustworthy, and still require a narrow hypothesis and human-approved scope.

## Documentation ownership

Update documentation in the same pull request when any of these change:

- routes, major components, or data flows: `ARCHITECTURE.md`;
- confirmed baseline findings or external-verification status:
  `DISCOVERY_REPORT.md`;
- improvement priority or completion evidence: `ROADMAP.md`;
- measurable acceptance criteria and enforcement status:
  `QUALITY_STANDARDS.md`;
- recurring workflow: `CONTINUOUS_IMPROVEMENT.md`;
- AI authority, risk tiers, or extended review checklists: this file;
- variables/provider setup: `DEPLOYMENT.md`, `SUPABASE_SETUP.md`, or
  `CHATBOT_SETUP.md`;
- incident, retention, backup, or monitoring process: `PRODUCTION_RUNBOOK.md`;
- visitor data behavior: the application Privacy page and relevant tests.

Documentation must distinguish repository truth from provider claims. Never add
secret values, visitor content, private project identifiers, or production data
to an AI transcript, issue, pull request, or committed report.

## Periodic supervised review

Suggested cadence, subject to the maintainer's approval:

- Per change: relevant tests, diff review, Preview acceptance, documentation.
- Weekly: Dependabot and security workflow results; failed link checks.
- Monthly: dependency/advisory triage, Core Web Vitals or Lighthouse sample,
  accessibility smoke review, error/abuse trends.
- Quarterly: architecture and threat-model review, secret-rotation review,
  isolated restore drill, RLS policy matrix, stale content/fact audit.

These are review prompts, not autonomous schedules. No AI process may execute a
production action merely because a cadence is documented.

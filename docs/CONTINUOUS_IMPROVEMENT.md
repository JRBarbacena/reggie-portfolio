# Continuous improvement policy

This is the canonical recurring workflow for supervised AI work in this
repository. It applies to interactive sessions and scheduled tasks. The goal is
steady, evidence-backed improvement—not continuous code churn.

Read `AGENTS.md`, `QUALITY_STANDARDS.md`, `ROADMAP.md`, and the documents for the
affected subsystem before acting. `AI_CONTINUOUS_IMPROVEMENT.md` retains the
extended operating contract, evidence taxonomy, and review checklists. If the
documents disagree, stop and reconcile the conflict with repository evidence and
human direction before changing behavior.

## Governing principles

- A documented opportunity is not automatic permission to implement it.
- Select focused work from current evidence, production-safe observations, test
  failures, audit results, or an explicit human objective.
- Prefer the smallest reversible change that addresses the demonstrated cause.
- Preserve the portfolio's identity, content, behavior, privacy, and security
  boundaries unless the owner explicitly approves a scoped change.
- Tests and documentation are part of the change, not optional follow-up work.
- A scheduled task may inspect and report within its authorization, but it may
  not infer permission to install, migrate, merge, deploy, access private data,
  or modify provider settings.
- No-change is a valid outcome when evidence does not support an intervention.

## Recurring workflow

```text
Observe -> Evaluate -> Prioritize -> Implement -> Test -> Review -> Document
   ^                                                                    |
   +--------------------------------------------------------------------+
```

Each cycle must keep an evidence trail and an explicit human control point for
high-risk or production actions.

### 1. Observe

Collect current, read-only evidence before proposing a change:

- review the active request, current branch, worktree status, relevant source,
  tests, migrations, runbooks, and recent documentation;
- reproduce the reported behavior when it is safe and possible;
- use existing lint, type, unit, build, browser, audit, and link checks rather
  than guessing from filenames;
- compare actual behavior with `QUALITY_STANDARDS.md` and documented contracts;
- record external controls—deployed SHA, provider settings, applied migrations,
  cron jobs, edge limits, environment scopes—as unverified unless an approved
  read-only provider check confirms them;
- do not inspect production secrets, private messages, or personal user data.

Observation output: a short evidence packet containing the source or command,
date, scope, observed result, and any limitation.

### 2. Evaluate

Determine whether the observation represents a defect, security or privacy risk,
reliability gap, measurable performance/accessibility issue, maintainability
cost, documentation drift, or expected behavior.

Label material claims:

- **Confirmed:** directly supported by source, a command, a test, or an approved
  provider observation.
- **Inference:** a reasoned conclusion from confirmed facts.
- **Assumption:** a fact required to proceed but not yet verified.
- **External verification required:** repository evidence cannot establish it.
- **Recommendation:** proposed future state, not present behavior.

Evaluate impact, likelihood, affected users/data, root cause, reversibility, and
the cost of doing nothing. Do not turn a preference or current design trend into
a defect without supporting evidence.

### 3. Prioritize

Map confirmed opportunities to `ROADMAP.md`:

- **P0:** critical security, data integrity, or production reliability.
- **P1:** high-impact performance or functional improvement.
- **P2:** code quality, accessibility, or user-experience improvement.
- **P3:** optional enhancement or controlled experiment.

Choose one bounded item whose prerequisites and verification environment exist.
State the problem, evidence, affected paths, expected outcome, non-goals,
verification plan, risk, rollback, and approvals required. A human must approve
scope before high-risk auth, RLS, migration, retention, private-data, provider,
or production work.

Do not manufacture lower-priority work to keep a schedule busy. If evidence is
unchanged, report that result and stop.

### 4. Implement

Implementation is allowed only when the current request or approved recurring
task authorizes changes of that type.

- work on the current development/feature/chore branch;
- preserve unrelated and uncommitted user work;
- make a narrow patch and reuse established components, helpers, tokens, and
  interaction patterns;
- keep privileged code out of the browser and validate at every trust boundary;
- add or update behavior-focused tests with the change;
- avoid broad refactors, identity changes, dependency additions, schema changes,
  and feature removal unless separately justified and approved;
- never apply migrations, use production visitor data, or change production
  state as an implementation shortcut.

If implementation uncovers a materially different cause or scope, pause and
return to Evaluate/Prioritize instead of silently expanding the change.

### 5. Test

Run the smallest relevant checks during development and the complete applicable
gates before handoff. The normal repository gates are documented in `AGENTS.md`
and `QUALITY_STANDARDS.md`.

For each check, report exactly one state:

- **Pass:** the command or manual check completed successfully.
- **Fail:** it ran and found a defect.
- **Blocked:** it could not run because of a stated environment, dependency,
  access, or authorization limitation.
- **Not applicable:** explain why the check does not apply.

Never silently skip, weaken, or relabel a failure. Test security/data behavior
only in a local or isolated non-production environment with synthetic identities
and records. UI changes also require keyboard, responsive, reduced-motion, and
relevant loading/error/offline-state review.

### 6. Review

Review the full diff and evidence, not only the edited function:

- confirm the stated problem is actually resolved and the non-goals stayed out
  of scope;
- inspect auth, authorization, RLS, privacy, data retention, API, caching,
  accessibility, responsiveness, motion, performance, and factual-content impact;
- verify no secrets, visitor content, generated artifacts, debug output, or
  unrelated formatting entered the diff;
- assess failure paths, rollback steps, and whether documentation now matches
  behavior;
- record unresolved risks and external verification separately.

Human review is mandatory before merge. Preview acceptance, migration approval,
provider changes, production deployment, and rollback each remain separate human
decisions; permission for one does not imply another.

### 7. Document

Finish every cycle by recording:

1. files created or modified;
2. confirmed behavior, assumptions, and external verification gaps;
3. checks run and their pass/fail/blocked status;
4. security, privacy, data, performance, accessibility, and deployment impact;
5. rollback or recovery notes appropriate to the risk;
6. roadmap/quality-standard changes supported by new evidence;
7. the recommended next focused step, or why no further action is warranted.

Update architecture, privacy, setup, runbooks, tests, and factual content only
when their contract changed. Mark a roadmap item complete only after its expected
outcome and verification have been demonstrated; otherwise retain it with an
updated evidence/status note.

The documented result becomes input to the next Observe phase.

## Scheduled-task policy

Scheduled tasks should default to read-only observation and reporting. Suitable
recurring work includes dependency advisory review, CI/test trend review, broken
link reports, documentation drift checks, and a reminder to verify external
controls. Any scheduled task must define its scope, sources, frequency, owner,
output destination, and escalation threshold.

Scheduled tasks must not:

- install or upgrade packages;
- modify application code or documentation unless explicitly authorized;
- use secrets or query production visitor records;
- apply migrations or alter Supabase/Vercel/GitHub settings;
- submit contact/live-chat records to production;
- commit, push, merge, release, deploy, promote, or roll back;
- auto-accept generated baselines or suppress failing checks.

When a threshold is crossed, produce an evidence-backed proposal. Do not perform
the remediation merely because the task detected it.

## Permanent stop conditions

Stop the unsafe action and request explicit direction if work would require:

- modifying or deploying production;
- applying a Supabase migration;
- exposing credentials, private messages, or personal user data;
- bypassing authentication, authorization, RLS, or another security control;
- merging directly into the production branch;
- removing functionality without justification and approval;
- skipping or weakening a failing test;
- unnecessarily rewriting a large portion of the project;
- changing project identity simply to follow a design trend.

Continue with safe read-only investigation or documentation when possible, and
report the exact boundary rather than attempting a workaround.

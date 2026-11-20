# Workspace management

This document defines how developers, Codex sessions, delegated agents, and
scheduled tasks work safely in parallel on this repository. It implements the
workspace-isolation requirements in `AGENTS.md` without claiming to provide a
technical lock.

## Governing rule

No two autonomous implementation tasks may modify the same Git working tree at
the same time. A conversation, agent, terminal, or schedule is not isolated just
because it has a different UI or process. Isolation exists only when the task
has a separately assigned directory and Git state, or when it is genuinely
read-only.

Prefer Codex-managed worktrees and Git isolation over informal coordination.
`AGENTS.md` can instruct cooperating tools, but it cannot prevent an editor,
shell, scheduled process, or another agent from writing to the same files.

## Task ownership and required task record

Before implementation begins, record the following in the task prompt, issue,
chat, or handoff:

```text
Task:
Owner or orchestrator:
Execution mode: Local | Worktree | Cloud
Assigned directory:
Assigned task, base, or integration branch:
Git state: branch name | detached HEAD based on assigned branch
Starting commit:
Scope and non-goals:
Owned files or directories:
Shared resources, services, and ports:
Integration target and method:
Verification plan:
```

File ownership here is a coordination boundary, not operating-system ownership.
If two tasks need the same file, lockfile, generated output, migration sequence,
or configuration surface, give that area to one implementation owner and run
the work sequentially.

## Mandatory preflight

Run these checks immediately before the first file modification and again after
any Handoff, resumed session, or unexpected repository-state change:

```bash
pwd
git rev-parse --show-toplevel
git branch --show-current
git rev-parse HEAD
git status --short
git worktree list --porcelain
```

Then confirm all of the following:

1. The current directory is the directory assigned to this task.
2. The branch, detached HEAD, and starting commit match the task record.
3. Every existing change is understood and belongs to the current owner or is
   explicitly out of scope and safe to preserve.
4. No developer, agent, chat, scheduled run, or external coding tool is actively
   implementing in this same directory.
5. The task's proposed files do not overlap another active task's ownership.
6. The execution mode is appropriate for the task.
7. Shared services, ports, output directories, and credentials have separate
   ownership or are not needed.

An empty branch name is expected in some detached worktrees; it is not permission
to skip ownership or starting-commit checks. If any answer is unknown, stop
implementation and remain read-only until the owner or developer resolves it.

## Execution modes

### Local execution

Local is the developer-created checkout, usually open in the developer's editor.
Treat it as foreground workspace owned by the developer.

Use Local for:

- read-only investigation;
- an interactive implementation task explicitly assigned to that checkout when
  no other implementation is active;
- final review or testing after a controlled Handoff or integration.

Do not use Local for unattended implementation, parallel autonomous tasks, or a
scheduled task that may write. If the developer is actively editing the Local
checkout, all automated implementation must move to a separate worktree. A dirty
Local checkout is not a scratch area: never reset, stash, clean, or copy its
changes elsewhere without explicit human direction.

### Git worktrees

A Worktree is a second Git checkout with its own files and index while sharing
the repository's Git object database. It is the default mode for an autonomous
implementation task and is mandatory for concurrent local implementation.

Prefer a Codex-managed worktree:

- In the Codex desktop app, choose **Worktree** before sending the implementation
  prompt and select the intended starting branch.
- In Codex CLI, use `/worktree` from an idle session to create or enter a managed
  worktree, then repeat the mandatory preflight inside it.
- Use a manually created Git worktree only when Codex-managed worktrees are not
  available and a developer has deliberately assigned its path and branch.

Local-environment setup scripts may run automatically when Codex creates a
managed worktree. For this repository, do not configure a setup script to
install dependencies, copy credentials, or mutate shared services unless that
action has the separate approval required by `AGENTS.md`.

Codex-managed worktrees may begin at a detached HEAD. Record the exact starting
commit and create a distinct task branch only when the chosen integration flow
requires one. Git prevents one branch from being checked out in two worktrees,
but it does not prevent two processes from writing to the same directory.

Start from committed state whenever practical. Codex can create a managed
worktree from a branch that has local changes, and Handoff can move chat and code
between Local and Worktree, but this repository does not permit automatic
transfer of uncommitted work. Use those capabilities only with explicit human
awareness, after reviewing both source and destination state.

### Cloud

Cloud runs a task in an isolated hosted workspace created from a published cloud
environment. Use Cloud for independent remote work that should continue without
the developer's computer, provided the repository, base revision, dependencies,
network policy, and required credentials are configured deliberately.

For each Cloud task:

- record the repository, branch or revision, and actual starting commit;
- assign one task owner, scope, file boundary, and integration path;
- do not assume local uncommitted changes are present;
- use a task-specific branch or reviewed pull request for integration;
- provide only the minimum non-production credentials and network access;
- review the complete diff and rerun tests after integration locally.

Each Cloud task has separate working files, but Cloud does not isolate provider
accounts, quotas, databases, environment variables, Vercel projects, Supabase
projects, or other external services. Coordinate those resources exactly as for
local worktrees.

## Codex CLI and desktop usage

### Codex CLI

1. Start Codex in the assigned repository or worktree directory.
2. Run the mandatory preflight before asking for changes.
3. Use Local only for a single explicitly assigned foreground task.
4. Use `/worktree` for a new implementation task when the developer or another
   task may continue using Local.
5. Put the owner, starting commit, file scope, shared resources, and integration
   method in the initial prompt.
6. Before leaving the session, review the diff and report the worktree path,
   branch or detached HEAD, checks, and integration status.

Codex CLI can prepare and test a scheduled-task prompt, but scheduled tasks are
created and managed in ChatGPT web or the desktop app.

### Codex desktop

Choose the execution target before the first implementation prompt:

- **Local:** foreground, exclusive work in the developer's checkout.
- **Worktree:** the normal choice for isolated or parallel implementation.
- **Cloud:** a hosted, independent task using a published environment.

Do not use a separate chat as a substitute for a separate worktree. Use Handoff
only after checking both source and destination status and ensuring the
destination has no competing owner. The app's diff, branch, commit, push, and
pull-request controls do not replace the repository's authorization and review
requirements.

## Parallel AI agents

An orchestrator may delegate read-only research within a shared checkout, but
every delegated or parallel agent that may write must receive its own assigned
Git worktree, base or task branch, starting commit, owned paths, and integration
method. Spawning an agent, forking a conversation, opening another chat, or
using another terminal does not prove that its working directory is separate.
Confirm the directory and `git worktree list --porcelain` output for every
writer before implementation begins.

The orchestrator owns coordination, not all files by default. It must keep a
task-to-worktree and task-to-path ownership map, prevent overlapping writes,
and designate one owner for any shared file, lockfile, migration sequence,
generated asset set, or configuration surface. If scopes begin to overlap,
stop the affected writers and resolve ownership before either task continues.
Do not rely on later merge conflict resolution as the ownership mechanism.

## Manual development while AI tasks are running

The developer's Local checkout remains developer-owned while background,
scheduled, or parallel AI implementation runs. Configure every AI writer to use
another worktree and branch. Manual editing may continue in Local only when its
owned files and shared resources do not overlap an active AI task.

Before the developer or an AI task expands scope, compare ownership records and
current diffs. If both need the same path or service, pause one task and assign
one implementation owner; the other may inspect read-only or wait. Do not move
uncommitted changes between Local and a worktree merely to make the overlap
disappear. Use a reviewed Handoff or Git integration only after the source and
destination are stable and the developer has approved the transfer.

## Scheduled tasks

Scheduled tasks default to read-only observation and reporting under
`docs/CONTINUOUS_IMPROVEMENT.md`.

For this Git repository:

- a scheduled run that may edit files requires explicit authorization and a
  dedicated background Worktree target;
- never configure scheduled implementation to run in the developer's Local
  checkout;
- if a scheduled run starts in Local or cannot establish its worktree, it must
  perform only read-only checks and report the isolation failure;
- define the task owner, project, scope, owned paths, starting branch, output,
  cadence, stop conditions, and integration method in the saved prompt;
- keep sandbox access narrow and never infer permission to install packages,
  use production data, change provider settings, commit, push, merge, or deploy;
- test the prompt manually, review the first runs, and archive obsolete runs so
  managed worktrees can be cleaned up safely.

Local scheduled tasks need the computer and desktop app running. Cloud or web
scheduled tasks do not gain access to the developer's local checkout and must
use repository or connected-service state available to that environment.

## Shared-resource restrictions

Git worktrees isolate working files, not the systems those files can access.
Before using any shared resource, assign one owner and document the isolation
method.

- **Databases and Supabase:** Never run competing migrations. Use separate local
  databases, schemas, or isolated non-production projects with synthetic data.
  Production visitor data remains prohibited for testing.
- **Vercel, GitHub, DNS, and provider settings:** Treat settings, deployments,
  secrets, branch protections, and integrations as shared external state. One
  authorized owner changes them at a time; code-task isolation is not provider
  authorization.
- **Secrets and environment files:** Do not commit, print, or casually copy
  secrets into worktrees. If ignored setup files are deliberately supplied to a
  managed worktree, use only minimum-scope non-production values and review what
  is copied.
- **Ports and local services:** Assign unique ports and service instances to
  concurrent tasks. Do not stop or reconfigure a server owned by another task.
- **Output and cache directories:** Give each task separate screenshot, report,
  coverage, build, and temporary-output paths when commands can overlap.
- **Browser profiles and sessions:** Do not share a mutable authenticated browser
  profile between autonomous tasks. Never use production admin sessions or
  visitor records for testing.
- **External APIs:** Coordinate credentials, quotas, rate limits, test accounts,
  webhooks, and idempotency keys. A separate worktree does not prevent duplicate
  external actions.

## Git integration and conflict resolution

When an implementation owner finishes:

1. Stop further writes from that task and any schedule tied to its worktree.
2. Review the complete diff, including generated files and deletions.
3. Run the relevant tests and repository safeguards in that worktree. They must
   pass before integration; if a required check is blocked, stop and obtain an
   explicit human decision rather than treating it as success.
4. Fetch or inspect the integration target as authorized and identify file,
   dependency, migration, and shared-resource conflicts with other worktrees.
5. Obtain human review and integrate with the chosen merge, pull request,
   Handoff, or controlled cherry-pick. Never auto-merge overlapping or
   unverified work.
6. Rerun relevant checks in the integrated state.
7. Record the source revision, integration commit, last known-good reference,
   and rollback method. A code rollback uses a reviewed revert; a deployment or
   provider rollback follows its separately authorized runbook. Never reset or
   force-push shared history to erase an integration.
8. Remove or archive the task worktree only after its needed work is safely
   integrated or deliberately abandoned by the owner.

Commit, push, pull-request, merge, deployment, provider, and production actions
still require the separate authorizations defined in `AGENTS.md`.

## Collision recovery

If another developer, agent, scheduled task, or tool is unexpectedly modifying
the same workspace:

1. Stop or interrupt every autonomous writer immediately. Pause the scheduled
   task if one is involved. Do not attempt a quick finishing edit.
2. Do not reset, stash, clean, checkout, revert, merge, or move files.
3. Collect read-only evidence:

   ```bash
   pwd
   git branch --show-current
   git rev-parse HEAD
   git status --short
   git diff --name-only
   git worktree list --porcelain
   ```

4. Identify each active owner, task, starting commit, claimed files, and any
   shared external actions already taken.
5. Designate one implementation owner for the affected working tree. All other
   tasks remain read-only or restart from an explicitly assigned clean worktree.
6. If edits overlap, have the designated owner reconcile them manually with the
   developer. Never split or transfer uncommitted changes automatically.
7. Review the recovered diff, rerun relevant tests, and document which task owns
   integration and which tasks were cancelled or restarted.

If ownership cannot be established, preserve the workspace unchanged and ask
the developer for direction. Repository integrity takes priority over task
completion.

## Official Codex references

- [Codex environments](https://learn.chatgpt.com/docs/environments/modes)
- [Worktrees](https://learn.chatgpt.com/docs/environments/git-worktrees)
- [Local environments](https://learn.chatgpt.com/docs/environments/local-environment)
- [Cloud environments](https://learn.chatgpt.com/docs/environments/cloud-environments)
- [Developer commands](https://learn.chatgpt.com/docs/developer-commands)
- [Scheduled tasks](https://learn.chatgpt.com/docs/automations)

# Zenith deployment setup

Zenith has two modes plus two server endpoints:

- FAQ answers run locally from reviewed portfolio facts and need no API key.
- `/api/live-chat` manages opaque temporary visitor sessions and messages.
- `/api/contact` stores a visitor's contact request in the private Supabase inbox.

Both endpoints run as Vercel Functions. Secret keys must stay in Vercel and must
never be added to a React component or prefixed with `VITE_`.

## 1. Apply the inbox migration now

This project has already been using the Supabase SQL Editor for its existing
migrations. Use the same method once for the Zenith inbox so the deployed
contact form has a destination:

1. Open the Supabase project.
2. Open **SQL Editor**, then choose **New query**.
3. Open `supabase/migrations/20260904_005_chatbot_inbox.sql` on this computer.
4. Copy the SQL *inside the file*. Do not paste the filename or its Windows path.
5. Paste the SQL into the editor and select **Run**.
6. Open **Table Editor** and confirm that `contact_inquiries` exists.
7. In **Database > Policies**, confirm that Row Level Security is enabled for
   `contact_inquiries`. Do not add an anonymous/public insert policy. The
   server-only Vercel endpoint performs inserts with a secret key.
8. Sign in at `/admin`, open **Inbox**, and confirm that the empty state loads.

For the temporary visitor/admin chat foundation, repeat the same copy-and-run
process with `supabase/migrations/20260904_006_ephemeral_live_chat.sql`. This
creates only the disposable `chat_sessions` and `chat_messages` tables plus a
cleanup job; it does not delete albums or permanent contact inquiries.

### Temporary chat retention

- Sessions expire one hour after their latest message.
- Each valid visitor or admin message extends that session by one hour.
- Expired sessions must be treated as unavailable immediately by the API/UI.
- Supabase Cron runs every ten minutes and removes expired sessions.
- `chat_messages.session_id` uses `on delete cascade`, so all messages belonging
  to a deleted session are removed automatically.
- Contact-form inquiries remain permanent until an admin archives or deletes
  them; they are not casual live-chat messages.

The migration is idempotent for its table, trigger, index, and policies, so
running this exact file again should not create duplicate objects.

## 2. Recommended workflow for future SQL migrations

After this release, use the Supabase CLI so the repository and remote migration
history remain synchronized:

1. Install or invoke the current Supabase CLI.
2. From the repository root, sign in and link this folder to the correct project:

   ```powershell
   npx supabase login
   npx supabase link --project-ref YOUR_PROJECT_REF
   ```

3. Before the first CLI push, compare local and remote history:

   ```powershell
   npx supabase migration list
   ```

   Because earlier files were applied manually in SQL Editor, do not run
   `migration repair` blindly. First confirm that every listed schema change is
   truly present remotely; repair changes migration history, not the schema.

4. Create each new change as a new migration. Never edit an old migration that
   has already been applied:

   ```powershell
   npx supabase migration new short_change_name
   ```

5. Add the SQL to the newly generated timestamped file under
   `supabase/migrations/`.
6. With a local Supabase stack available, test all migrations from a clean state:

   ```powershell
   npx supabase start
   npx supabase db reset
   ```

7. Review the generated schema and application locally.
8. Link to the remote project if needed, check the list again, then apply only
   unapplied migrations:

   ```powershell
   npx supabase migration list
   npx supabase db push
   ```

9. Commit the migration file with the application code. Only one person should
   push migrations to the shared remote project at a time.

## 3. Configure Vercel

Open **Vercel Dashboard > reggie-portfolio > Settings > Environment Variables**.
Add these as **Secret** values for Production. Add them to Preview too if Zenith
should work on preview deployments:

| Variable | Where to copy it from | Used by |
|---|---|---|
| `SUPABASE_URL` | Supabase project Connect dialog / project URL | `/api/live-chat`, `/api/contact` |
| `SUPABASE_SECRET_KEY` | Supabase server-side secret key | `/api/live-chat`, `/api/contact` |

`SUPABASE_SERVICE_ROLE_KEY` is also supported for projects still using the
legacy service-role key name. Configure one server secret, not both. Never use
the publishable key for this server variable, and never expose either server
secret as `VITE_SUPABASE_SECRET_KEY`.

The existing browser variables remain separate:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

After saving or changing any Vercel environment variable, create a new
deployment. Variable changes do not alter deployments that already exist.

Email notification for the first visitor message in each temporary chat is
optional. To enable it, create a Resend API key and add these server-only
Vercel variables:

| Variable | Required | Value |
|---|---|---|
| `RESEND_API_KEY` | Yes | Resend API key beginning with `re_` |
| `CHAT_NOTIFICATION_EMAIL` | No | Inbox to notify; defaults to `iggybarbacena@gmail.com` |
| `CHAT_NOTIFICATION_FROM` | No | Verified sender; defaults to `Zenith <onboarding@resend.dev>` |
| `SITE_URL` | No | Production origin used for the `/admin` link |

The message is still saved when email is unconfigured or delivery fails.
Zenith sends only one notification email per chat session to avoid inbox spam.

## 4. FAQ and temporary-chat pattern

OpenAI is not required. Reviewed FAQ matching happens in the browser and does
not store questions. Human-to-human chat uses this path:

```text
Visitor -> POST /api/live-chat -> Vercel Function -> private Supabase tables
Admin dashboard -> authenticated Supabase client -> reply
```

The visitor receives an opaque random token. Only its SHA-256 hash is stored;
the Vercel endpoint requires both the session ID and token before it will read,
send, or erase messages. Admin access remains protected by Supabase Auth and
the existing allow list. The browser polls while the panel is open, while the
admin dashboard also subscribes to secured Postgres changes.

## 5. Verify the live release

1. Redeploy the latest commit in Vercel.
2. Open the deployment and ask Zenith a simple portfolio question.
3. Confirm an FAQ question is answered without a network request.
4. Ask Zenith to **talk to Reggie**, use the offered handoff, and confirm `POST /api/live-chat` succeeds.
5. Sign in at `/admin`, open **Chats**, reply, and confirm the visitor receives it.
6. Enable chat alerts for the dashboard session and confirm a new visitor reply produces a sound and visual notice.
7. If Resend is configured, confirm the first visitor message sends an email containing the visitor name.
8. End the test chat and confirm it disappears from both screens.
9. Submit one test contact message, then verify it under **Inbox**.
10. Check Vercel Function logs if an endpoint returns `502` or `503`.

When using `npm run dev:react` at `localhost:5173`, FAQ works but Vercel
Functions do not run. Use a Vercel preview deployment for the simplest full
live-chat and contact test.

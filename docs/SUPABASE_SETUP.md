# Supabase portfolio setup

1. Open your Supabase project, then open **SQL Editor** and choose **New query**.
2. Open `supabase/migrations/20260829_001_album_backend.sql` locally. Copy all of its SQL contents into Supabase and click **Run**. Do not paste the filename or file path; Supabase cannot read files from your computer.
3. Repeat the copy-and-run process, in order, for:
   - `20260829_002_album_destinations.sql`
   - `20260829_003_travel_album_scope.sql`
   - `20260829_004_travel_journal_content.sql`
   - `20260904_005_chatbot_inbox.sql`
   - `20260904_006_ephemeral_live_chat.sql`
4. Run each migration as a separate query.
5. In a new query, run the allow-list statement from migration 001 after replacing its placeholder with the exact email invited under **Authentication → Users**.
6. Keep the `album-media` bucket private. Migration 001 creates it and its policies automatically.

The browser uses only the project URL and publishable key. Never put a secret or service-role key in the React application.

## Portfolio chatbot and private inbox

Zenith's FAQ works locally without an AI provider. Temporary human chat and secure contact submission run through Vercel server functions after deployment. In **Vercel → Project Settings → Environment Variables**, add these server-only values (never prefix them with `VITE_`):

- `SUPABASE_URL` — the same project URL used by the portfolio.
- `SUPABASE_SERVICE_ROLE_KEY` — the Supabase server/service-role secret key. `SUPABASE_SECRET_KEY` is also accepted by the endpoint if your project uses Supabase's newer secret-key naming.

The new migration creates `contact_inquiries` with RLS enabled. Visitors cannot query this table from the browser; only the server endpoint can create messages and an allow-listed admin can read or update their status from `/admin`.

Migration 006 keeps temporary live chat separate from albums and permanent
inquiries. A session expires one hour after its latest message; its messages are
deleted through `on delete cascade` when the scheduled cleanup runs every ten
minutes. Albums and `contact_inquiries` are never touched by that cleanup.

The complete click-by-click migration, Vercel variable, Responses API, and live
verification procedure is in [CHATBOT_SETUP.md](CHATBOT_SETUP.md).

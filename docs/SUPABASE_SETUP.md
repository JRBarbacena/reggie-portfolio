# Supabase portfolio setup

1. Open your Supabase project, then open **SQL Editor** and choose **New query**.
2. Open `supabase/migrations/20260829_001_album_backend.sql` locally. Copy all of its SQL contents into Supabase and click **Run**. Do not paste the filename or file path; Supabase cannot read files from your computer.
3. Repeat the copy-and-run process, in order, for:
   - `20260829_002_album_destinations.sql`
   - `20260829_003_travel_album_scope.sql`
   - `20260829_004_travel_journal_content.sql`
4. Run each migration as a separate query.
5. In a new query, run the allow-list statement from migration 001 after replacing its placeholder with the exact email invited under **Authentication → Users**.
6. Keep the `album-media` bucket private. Migration 001 creates it and its policies automatically.

The browser uses only the project URL and publishable key. Never put a secret or service-role key in the React application.

-- Ephemeral visitor/admin live chat.
-- Album media and permanent contact inquiries are intentionally unaffected.

create extension if not exists pg_cron with schema pg_catalog;

create table if not exists public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique check (token_hash ~ '^[a-f0-9]{64}$'),
  visitor_name text not null default 'Visitor'
    check (char_length(visitor_name) between 1 and 80),
  status text not null default 'open'
    check (status in ('open', 'ended')),
  created_at timestamptz not null default now(),
  last_activity_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '1 hour')
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.chat_sessions(id) on delete cascade,
  sender text not null check (sender in ('visitor', 'admin')),
  body text not null check (char_length(body) between 1 and 1200),
  created_at timestamptz not null default now()
);

create table if not exists public.chat_presence (
  id boolean primary key default true check (id),
  status text not null default 'offline' check (status in ('online', 'offline')),
  last_seen_at timestamptz not null default now()
);

insert into public.chat_presence (id, status)
values (true, 'offline')
on conflict (id) do nothing;

create index if not exists chat_sessions_expiry_idx
  on public.chat_sessions (expires_at);

create index if not exists chat_sessions_activity_idx
  on public.chat_sessions (last_activity_at desc);

create index if not exists chat_messages_session_created_idx
  on public.chat_messages (session_id, created_at);

alter table public.chat_sessions enable row level security;
alter table public.chat_messages enable row level security;
alter table public.chat_presence enable row level security;

-- Visitors use a server endpoint with an unguessable session token. They never
-- receive direct table permissions or a policy that can expose another chat.
revoke all on public.chat_sessions from anon;
revoke all on public.chat_messages from anon;
revoke all on public.chat_presence from anon;

grant select, update, delete on public.chat_sessions to authenticated;
grant select, insert, delete on public.chat_messages to authenticated;
grant select, update on public.chat_presence to authenticated;

drop policy if exists "album admins manage chat sessions" on public.chat_sessions;
create policy "album admins manage chat sessions"
on public.chat_sessions for all to authenticated
using (public.is_album_admin())
with check (public.is_album_admin());

drop policy if exists "album admins read chat messages" on public.chat_messages;
create policy "album admins read chat messages"
on public.chat_messages for select to authenticated
using (public.is_album_admin());

drop policy if exists "album admins reply to chats" on public.chat_messages;
create policy "album admins reply to chats"
on public.chat_messages for insert to authenticated
with check (public.is_album_admin() and sender = 'admin');

drop policy if exists "album admins delete chat messages" on public.chat_messages;
create policy "album admins delete chat messages"
on public.chat_messages for delete to authenticated
using (public.is_album_admin());

drop policy if exists "album admins manage chat presence" on public.chat_presence;
create policy "album admins manage chat presence"
on public.chat_presence for all to authenticated
using (public.is_album_admin())
with check (public.is_album_admin());

create or replace function public.extend_chat_session_expiry()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform 1
  from public.chat_sessions
  where id = new.session_id
    and status = 'open'
    and expires_at > now()
  for update;

  if not found then
    raise exception 'Chat session is closed or expired';
  end if;

  update public.chat_sessions
  set last_activity_at = now(),
      expires_at = now() + interval '1 hour'
  where id = new.session_id;
  return new;
end;
$$;

revoke all on function public.extend_chat_session_expiry() from public, anon, authenticated;

drop trigger if exists chat_messages_extend_session on public.chat_messages;
create trigger chat_messages_extend_session
before insert on public.chat_messages
for each row execute function public.extend_chat_session_expiry();

create or replace function public.delete_expired_chat_sessions()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  deleted_count integer;
begin
  delete from public.chat_sessions
  where expires_at <= now()
     or status = 'ended';

  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

revoke all on function public.delete_expired_chat_sessions() from public, anon, authenticated;

-- Keep one cleanup job. Sessions become invalid at expires_at; this job removes
-- their rows and cascaded messages within the following ten minutes.
do $$
declare
  existing_job bigint;
begin
  select jobid into existing_job
  from cron.job
  where jobname = 'cleanup-expired-portfolio-chats';

  if existing_job is not null then
    perform cron.unschedule(existing_job);
  end if;

  perform cron.schedule(
    'cleanup-expired-portfolio-chats',
    '*/10 * * * *',
    'select public.delete_expired_chat_sessions();'
  );
end;
$$;

-- Admin clients may receive new replies without polling. Visitor isolation will
-- continue to be enforced by the server endpoint and its opaque session token.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'chat_sessions'
  ) then
    alter publication supabase_realtime add table public.chat_sessions;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'chat_messages'
  ) then
    alter publication supabase_realtime add table public.chat_messages;
  end if;
end;
$$;

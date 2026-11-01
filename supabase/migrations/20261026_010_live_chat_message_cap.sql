-- Bound each temporary conversation even when requests arrive concurrently.
-- Replaces the migration-006 expiry trigger function without changing expiry.

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
    and expires_at > pg_catalog.now()
  for update;

  if not found then
    raise exception 'Chat session is closed or expired';
  end if;

  if (select pg_catalog.count(*) from public.chat_messages where session_id = new.session_id) >= 200 then
    raise check_violation using message = 'Chat session message limit reached';
  end if;

  update public.chat_sessions
  set last_activity_at = pg_catalog.now(),
      expires_at = pg_catalog.now() + interval '1 hour'
  where id = new.session_id;
  return new;
end;
$$;

revoke all on function public.extend_chat_session_expiry() from public, anon, authenticated;

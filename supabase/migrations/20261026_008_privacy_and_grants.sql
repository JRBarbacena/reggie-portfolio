-- Privacy retention and explicit browser-role privileges.
-- Apply after 20261009_007_storage_guardrails.sql.

create or replace function public.is_album_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_allowlist
    where email = pg_catalog.lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

revoke all on function public.is_album_admin() from public;
grant execute on function public.is_album_admin() to anon, authenticated;

-- RLS remains the authorization boundary; explicit grants limit which browser
-- operations reach it instead of relying on public-schema defaults.
revoke all on table public.admin_allowlist from anon, authenticated;
revoke all on table public.albums from anon, authenticated;
revoke all on table public.album_photos from anon, authenticated;
revoke all on table public.contact_inquiries from anon, authenticated;
revoke all on table public.chat_sessions from anon, authenticated;
revoke all on table public.chat_messages from anon, authenticated;
revoke all on table public.chat_presence from anon, authenticated;

grant select on table public.albums, public.album_photos to anon, authenticated;
grant insert, update, delete on table public.albums, public.album_photos to authenticated;
grant select, update, delete on table public.contact_inquiries to authenticated;
grant select, update, delete on table public.chat_sessions to authenticated;
grant select, insert, delete on table public.chat_messages to authenticated;
grant select, update on table public.chat_presence to authenticated;

drop policy if exists "album admins delete contact inquiries" on public.contact_inquiries;
create policy "album admins delete contact inquiries"
on public.contact_inquiries for delete to authenticated
using (public.is_album_admin());

create or replace function public.delete_resolved_contact_inquiries()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  deleted_count integer;
begin
  delete from public.contact_inquiries
  where status in ('replied', 'archived')
    and updated_at <= now() - interval '180 days';

  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

revoke all on function public.delete_resolved_contact_inquiries() from public, anon, authenticated;

do $$
declare
  existing_job bigint;
begin
  select jobid into existing_job
  from cron.job
  where jobname = 'cleanup-resolved-portfolio-inquiries';

  if existing_job is not null then
    perform cron.unschedule(existing_job);
  end if;

  perform cron.schedule(
    'cleanup-resolved-portfolio-inquiries',
    '19 3 * * *',
    'select public.delete_resolved_contact_inquiries();'
  );
end;
$$;

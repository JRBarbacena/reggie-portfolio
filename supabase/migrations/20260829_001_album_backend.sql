-- Album backend for the React portfolio.
-- Run this script in Supabase Dashboard > SQL Editor before using /admin.

create table if not exists public.admin_allowlist (
  email text primary key check (email = lower(email)),
  created_at timestamptz not null default now()
);

create or replace function public.is_album_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_allowlist
    where email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

revoke all on function public.is_album_admin() from public;
grant execute on function public.is_album_admin() to anon, authenticated;

create table if not exists public.albums (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 120),
  description text not null default '' check (char_length(description) <= 2000),
  location text not null default '' check (char_length(location) <= 180),
  cover_path text,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.album_photos (
  id uuid primary key default gen_random_uuid(),
  album_id uuid not null references public.albums(id) on delete cascade,
  storage_path text not null unique,
  caption text not null default '' check (char_length(caption) <= 500),
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now()
);

create index if not exists album_photos_album_order_idx
  on public.album_photos (album_id, sort_order, created_at);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists albums_set_updated_at on public.albums;
create trigger albums_set_updated_at
before update on public.albums
for each row execute function public.set_updated_at();

alter table public.admin_allowlist enable row level security;
alter table public.albums enable row level security;
alter table public.album_photos enable row level security;

create policy "published albums are public"
on public.albums for select
using (published or public.is_album_admin());

create policy "admins manage albums"
on public.albums for all to authenticated
using (public.is_album_admin())
with check (public.is_album_admin());

create policy "published album photos are public"
on public.album_photos for select
using (
  exists (
    select 1 from public.albums
    where albums.id = album_photos.album_id
      and (albums.published or public.is_album_admin())
  )
);

create policy "admins manage album photos"
on public.album_photos for all to authenticated
using (public.is_album_admin())
with check (public.is_album_admin());

insert into storage.buckets (id, name, public)
values ('album-media', 'album-media', false)
on conflict (id) do update set public = false;

create policy "published album media is readable"
on storage.objects for select
using (
  bucket_id = 'album-media'
  and (
    public.is_album_admin()
    or exists (
      select 1
      from public.albums
      left join public.album_photos on album_photos.album_id = albums.id
      where albums.published
        and (
          albums.cover_path = storage.objects.name
          or album_photos.storage_path = storage.objects.name
        )
    )
  )
);

create policy "admins upload album media"
on storage.objects for insert to authenticated
with check (bucket_id = 'album-media' and public.is_album_admin());

create policy "admins update album media"
on storage.objects for update to authenticated
using (bucket_id = 'album-media' and public.is_album_admin())
with check (bucket_id = 'album-media' and public.is_album_admin());

create policy "admins delete album media"
on storage.objects for delete to authenticated
using (bucket_id = 'album-media' and public.is_album_admin());

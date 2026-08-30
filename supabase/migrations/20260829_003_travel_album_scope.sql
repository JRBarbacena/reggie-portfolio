-- Travel albums are grouped into Local and International collections.
-- Existing Travel albums default to Local and can be changed in Admin.
alter table public.albums
  add column if not exists travel_scope text not null default 'local'
  check (travel_scope in ('local', 'international'));

comment on column public.albums.travel_scope is
  'Travel collection for Travel albums: local or international.';

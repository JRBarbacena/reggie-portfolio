-- A published album can appear in exactly one portfolio section.
-- Existing albums remain in Tech so this upgrade is safe to apply after 001.
alter table public.albums
  add column if not exists destination text not null default 'tech'
  check (destination in ('tech', 'travel', 'life'));

comment on column public.albums.destination is
  'The public portfolio section that displays this album: tech, travel, or life.';

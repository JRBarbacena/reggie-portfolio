-- Travel entries use albums.description as their long-form journal body.
-- Increase the original 2,000 character limit without changing existing data.
alter table public.albums
  drop constraint if exists albums_description_check;

alter table public.albums
  drop constraint if exists albums_description_length_check;

alter table public.albums
  add constraint albums_description_length_check
  check (char_length(description) <= 12000);

comment on column public.albums.description is
  'Album summary for Tech or long-form article body for Travel journals (maximum 12,000 characters).';

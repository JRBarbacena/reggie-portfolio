-- Private inbox for messages submitted through the portfolio chatbot.
-- Run this after the existing 20260829 album migrations.

create table if not exists public.contact_inquiries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  status text not null default 'new'
    check (status in ('new', 'read', 'replied', 'archived')),
  name text not null check (char_length(name) between 2 and 120),
  email text not null check (char_length(email) between 3 and 254 and email = lower(email)),
  topic text not null default 'General inquiry' check (char_length(topic) between 1 and 80),
  message text not null check (char_length(message) between 10 and 2000),
  transcript jsonb not null default '[]'::jsonb check (jsonb_typeof(transcript) = 'array'),
  consented_at timestamptz not null,
  source text not null default 'portfolio-chatbot' check (char_length(source) between 1 and 80),
  admin_note text not null default '' check (char_length(admin_note) <= 4000)
);

create index if not exists contact_inquiries_status_created_idx
  on public.contact_inquiries (status, created_at desc);

drop trigger if exists contact_inquiries_set_updated_at on public.contact_inquiries;
create trigger contact_inquiries_set_updated_at
before update on public.contact_inquiries
for each row execute function public.set_updated_at();

alter table public.contact_inquiries enable row level security;

-- Browser clients cannot insert, read, update, or delete inquiries directly.
-- The Vercel contact endpoint writes with a server-only Supabase secret key.
drop policy if exists "album admins read contact inquiries" on public.contact_inquiries;
create policy "album admins read contact inquiries"
on public.contact_inquiries for select to authenticated
using (public.is_album_admin());

drop policy if exists "album admins update contact inquiries" on public.contact_inquiries;
create policy "album admins update contact inquiries"
on public.contact_inquiries for update to authenticated
using (public.is_album_admin())
with check (public.is_album_admin());

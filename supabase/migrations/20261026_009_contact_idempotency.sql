-- Prevent a browser or network retry from creating duplicate contact messages.
-- Apply before deploying the API version that requires submissionId.

alter table public.contact_inquiries
  add column if not exists submission_id uuid;

create unique index if not exists contact_inquiries_submission_id_idx
  on public.contact_inquiries (submission_id);

comment on column public.contact_inquiries.submission_id is
  'Opaque client-generated retry key; contains no visitor information.';

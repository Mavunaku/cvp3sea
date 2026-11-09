-- "Notify me when available" requests from the cvpproperties.com property cards.
-- Applied to the cvp3sea Supabase project (migration name: create_notify_requests).
--
-- The public site (anon key) can ONLY add rows. Nobody can read, change or delete them with the public key,
-- so the emails stay private. Read them in the Supabase dashboard (Table Editor) or with the SQL below.

create table if not exists public.notify_requests (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  property_slug text not null check (char_length(property_slug) between 1 and 80),
  property_title text check (char_length(property_title) <= 200),
  name          text not null check (char_length(btrim(name)) between 1 and 120),
  email         text not null check (char_length(email) <= 254 and email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  phone         text check (char_length(phone) <= 40),
  page_path     text check (char_length(page_path) <= 200),
  status        text not null default 'new' check (status in ('new', 'notified', 'closed')),
  notified_at   timestamptz
);

-- one open request per person per property (a repeat click is not stored twice)
create unique index if not exists notify_requests_one_open_per_email
  on public.notify_requests (lower(email), property_slug) where status = 'new';
create index if not exists notify_requests_property_idx
  on public.notify_requests (property_slug, status, created_at desc);

alter table public.notify_requests enable row level security;

drop policy if exists "Anyone can ask to be notified" on public.notify_requests;
create policy "Anyone can ask to be notified"
  on public.notify_requests
  for insert
  to anon
  with check (status = 'new' and notified_at is null);

-- deliberately no select/update/delete policy for anon or authenticated
revoke all on public.notify_requests from anon, authenticated;
grant insert on public.notify_requests to anon;

-- ---------------------------------------------------------------------------
-- Handy queries (run in the Supabase SQL editor):
--   Who is waiting for a property:
--     select name, email, phone, created_at from public.notify_requests
--     where property_slug = '67GrandBLVD' and status = 'new' order by created_at;
--   After you have told them it is available:
--     update public.notify_requests set status = 'notified', notified_at = now()
--     where property_slug = '67GrandBLVD' and status = 'new';
-- ---------------------------------------------------------------------------

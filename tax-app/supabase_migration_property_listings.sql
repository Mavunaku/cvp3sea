-- Migration: add "property_listings" table so the Landlord Toolbox can toggle
-- each property's public availability, and the marketing site
-- (cvpproperties.com) can read that status live to show an
-- Available/Unavailable badge on the "Our Properties" cards.
-- Run this once in the Supabase SQL editor.

create table if not exists "public"."property_listings" (
    "slug" text primary key,
    "name" text not null,
    "available" boolean not null default false,
    "updated_at" timestamp with time zone default now()
);

alter table property_listings enable row level security;

-- Matches the permissive model already used by the rest of this app (the
-- Landlord Toolbox is gated by its own password login, not per-row Supabase
-- auth) — public read so the static marketing site can display live status,
-- and open write so the toolbox toggle can update it with the anon key.
create policy "Anyone can read and update property listings" on property_listings
    for all using (true);

-- Seed the 3 properties currently on the marketing site. Slugs match the
-- page filenames (without .html) used in cvpproperties.com's links.
insert into property_listings (slug, name, available) values
    ('67GrandBLVD', '67 Grand Blvd., Apt 1, Binghamton', false),
    ('67GrandBLVD2FL', '67 Grand Blvd., Apt 2, Binghamton', false),
    ('2112KypriotisDr1FL', 'Garden View Apt. — Greek Peak, NY', false)
on conflict (slug) do nothing;

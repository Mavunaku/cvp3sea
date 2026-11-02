-- Migration: add "social_campaigns" table + a "social-media" storage bucket so
-- the Landlord Toolbox's Social Media & Marketing tool can take an attached
-- photo/video + a draft idea, hand it off for a Reel/caption to be drafted,
-- and stage it for your approval before anything posts to Instagram/Facebook
-- or cvpproperties.com. Run this once in the Supabase SQL editor.

create table if not exists "public"."social_campaigns" (
    "id" uuid primary key default gen_random_uuid(),
    "title" text not null,
    "context" text not null,
    "image_urls" text[] not null default '{}',
    -- new -> drafted (caption + reel prepared) -> approved (you said go) ->
    -- published, or rejected at any point.
    "status" text not null default 'new',
    "caption" text,
    "reel_url" text,
    "platforms" text[] not null default '{instagram}',
    "notes" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);

alter table social_campaigns enable row level security;

-- Matches the permissive model already used by the rest of this app (the
-- Landlord Toolbox is gated by its own password login, not per-row Supabase
-- auth) — open read/write with the anon key.
create policy "Anyone can read and update social campaigns" on social_campaigns
    for all using (true);

-- Public bucket for campaign photos/videos/reels. Public so Instagram's
-- Graph API (and you, reviewing a draft) can fetch the file by URL.
insert into storage.buckets (id, name, public)
values ('social-media', 'social-media', true)
on conflict (id) do nothing;

create policy "Public read for social-media bucket" on storage.objects
    for select using (bucket_id = 'social-media');

create policy "Anyone can upload to social-media bucket" on storage.objects
    for insert with check (bucket_id = 'social-media');

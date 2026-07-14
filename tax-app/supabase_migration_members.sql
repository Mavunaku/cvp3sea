-- Migration: add "members" table for LLC member/partner K-1 allocation.
-- An empty members list (or a single 100% member) means the entity is
-- single-member and should use the Schedule C preview instead of K-1s.
-- Run this once in the Supabase SQL editor.

create table if not exists "public"."members" (
    "id" uuid default uuid_generate_v4() primary key,
    "name" text not null,
    "ownership_percent" numeric not null default 100,
    "user_id" text not null,
    "created_at" timestamp with time zone default now()
);

alter table members enable row level security;

create policy "Users can manage their own members" on members
    for all using (true);

create index if not exists idx_members_user_id on members(user_id);

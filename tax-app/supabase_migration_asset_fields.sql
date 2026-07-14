-- Migration: add missing depreciation-config columns to "assets"
-- These fields (type, business use %, useful life, Section 179, bonus depreciation)
-- are editable in the app UI but were never persisted to the database, so every
-- reload silently reset them to hardcoded defaults. Run this once in the Supabase
-- SQL editor before deploying the corresponding lib/database.ts fix.

alter table "public"."assets"
    add column if not exists "type" text default 'Other',
    add column if not exists "business_use_percent" numeric default 100,
    add column if not exists "useful_life" numeric default 5,
    add column if not exists "section_179" boolean default false,
    add column if not exists "bonus_depreciation" boolean default false;

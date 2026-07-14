-- Migration: add "capitalize_life" to ledger_entries so a capitalized
-- improvement can be depreciated over a user-chosen recovery period
-- (e.g. 5, 7, 15, 27.5, or 39 years) instead of a fixed 27.5. Run once
-- in the Supabase SQL editor.

alter table "public"."ledger_entries"
    add column if not exists "capitalize_life" numeric;

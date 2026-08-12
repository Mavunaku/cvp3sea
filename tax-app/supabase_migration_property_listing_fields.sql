-- Migration: add editable "heading" and "description" fields to
-- property_listings, so the Landlord Toolbox can edit the title/blurb shown
-- on each "Our Properties" card, not just its Available/Unavailable status.
-- Run this once in the Supabase SQL editor (after
-- supabase_migration_property_listings.sql has already been run).

alter table property_listings add column if not exists heading text;
alter table property_listings add column if not exists description text;

-- Backfill with the text currently hardcoded on the marketing site, so
-- nothing changes visually until a landlord actually edits a field.
update property_listings set heading = '67 Grand Blvd., Apt 1, Binghamton', description = 'Heart of Binghamton: 3-bed, 2 baths' where slug = '67GrandBLVD';
update property_listings set heading = '67 Grand Blvd., Apt 2, Binghamton', description = 'Heart of Binghamton: 3-bed, 2 baths' where slug = '67GrandBLVD2FL';
update property_listings set heading = 'Garden View Apt. — Greek Peak, NY', description = 'Mountain Resort: 2-bed, 1 bath — Ski, Swim, Enjoy!' where slug = '2112KypriotisDr1FL';

NOTIFY pgrst, 'reload schema';

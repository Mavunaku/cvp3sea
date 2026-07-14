-- Migration: add disposition/sale columns to "assets" for capital-gains
-- tracking (Form 4797). An asset with a sale_date and sale_price is treated
-- as sold during the year. Run once in the Supabase SQL editor.

alter table "public"."assets"
    add column if not exists "sale_date" date,
    add column if not exists "sale_price" numeric,
    add column if not exists "selling_costs" numeric;

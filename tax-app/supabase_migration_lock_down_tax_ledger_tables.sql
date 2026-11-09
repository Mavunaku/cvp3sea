-- Applied to the cvp3sea Supabase project (migration name: lock_down_tax_ledger_tables).
--
-- projects, years, assets and ledger_entries had Row Level Security OFF, so anyone holding the public anon key
-- could read, change or delete every row. Now: RLS on, no policies, anon/authenticated privileges revoked.
-- Result: the public key cannot touch these tables at all. Only the service_role key (server side only,
-- never in browser code) can read or write them.
--
-- NOTE: the tax-app currently talks to these tables straight from the browser with the anon key, so its cloud
-- sync/load is blocked by this. Local data is kept (the store persists to localStorage and ignores load errors).
-- To bring cloud sync back safely, move the table calls in lib/database.ts behind a server route that uses
-- SUPABASE_SERVICE_ROLE_KEY and checks a signed session cookie.

do $$
declare t text; p record;
begin
  foreach t in array array['projects','years','assets','ledger_entries'] loop
    execute format('alter table public.%I enable row level security', t);
    for p in select policyname from pg_policies where schemaname='public' and tablename=t loop
      execute format('drop policy %I on public.%I', p.policyname, t);
    end loop;
    execute format('revoke all on public.%I from anon, authenticated', t);
  end loop;
end $$;

-- ============================================
-- SUPABASE SCHEMA FIX - RUN THIS ENTIRE SCRIPT
-- ============================================
-- This script fixes all schema discrepancies found in the audit
-- Run this in your Supabase SQL Editor

-- 1. CRITICAL: Rename table from 'transactions' to 'ledger_entries'
-- (Skip this if your table is already named 'ledger_entries')
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'transactions'
    ) THEN
        ALTER TABLE transactions RENAME TO ledger_entries;
        RAISE NOTICE 'Table renamed from transactions to ledger_entries';
    ELSE
        RAISE NOTICE 'Table already named ledger_entries or does not exist';
    END IF;
END $$;

-- 2. Add missing columns to ledger_entries
ALTER TABLE ledger_entries 
ADD COLUMN IF NOT EXISTS project_name TEXT;

ALTER TABLE ledger_entries 
ADD COLUMN IF NOT EXISTS capitalize_useful_life DOUBLE PRECISION DEFAULT 27.5;

-- 3. Update ny_source default for new rows
ALTER TABLE ledger_entries 
ALTER COLUMN ny_source SET DEFAULT true;

-- 4. Update status check constraint to include 'Reconciled'
ALTER TABLE ledger_entries 
DROP CONSTRAINT IF EXISTS ledger_entries_status_check;

ALTER TABLE ledger_entries 
DROP CONSTRAINT IF EXISTS transactions_status_check;

ALTER TABLE ledger_entries 
ADD CONSTRAINT ledger_entries_status_check 
CHECK (status IN ('Cleared', 'Pending', 'Reconciled'));

-- 5. Add column comments for documentation
COMMENT ON COLUMN ledger_entries.project_name 
IS 'Cached project name for display purposes';

COMMENT ON COLUMN ledger_entries.capitalize_useful_life 
IS 'Depreciation period for capitalized improvements (years). Default is 27.5 years for residential rental property.';

-- 6. Update RLS policy name if needed
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'ledger_entries'
        AND policyname = 'Users can manage their own transactions'
    ) THEN
        DROP POLICY "Users can manage their own transactions" ON ledger_entries;
        CREATE POLICY "Users can manage their own ledger_entries" ON ledger_entries
            FOR ALL USING (true);
        RAISE NOTICE 'Updated RLS policy name';
    END IF;
END $$;

-- 7. Add additional indexes for performance
CREATE INDEX IF NOT EXISTS idx_ledger_entries_date ON ledger_entries(date);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_type ON ledger_entries(type);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_capitalize ON ledger_entries(capitalize) WHERE capitalize = true;

-- 8. Ensure assets table has all required columns
ALTER TABLE assets ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'Other';
ALTER TABLE assets ADD COLUMN IF NOT EXISTS business_use_percent DOUBLE PRECISION DEFAULT 100;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS useful_life DOUBLE PRECISION DEFAULT 5;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS section179 BOOLEAN DEFAULT false;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS bonus_depreciation BOOLEAN DEFAULT false;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS notes TEXT;

-- 9. Add comments to assets columns
COMMENT ON COLUMN assets.business_use_percent IS 'Percentage of business use (0-100)';
COMMENT ON COLUMN assets.useful_life IS 'Recovery period in years';
COMMENT ON COLUMN assets.type IS 'Asset type (e.g., Vehicle, Equipment, Building)';

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these to verify the fixes were applied

-- Check ledger_entries columns
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'ledger_entries' 
ORDER BY ordinal_position;

-- Check assets columns
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'assets' 
ORDER BY ordinal_position;

-- Check constraints
SELECT conname, contype, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'ledger_entries'::regclass;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Schema fixes completed successfully!';
    RAISE NOTICE 'Your database is now synchronized with the application code.';
END $$;

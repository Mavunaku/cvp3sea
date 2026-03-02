-- Add capitalize_useful_life column to ledger_entries table
ALTER TABLE ledger_entries 
ADD COLUMN IF NOT EXISTS capitalize_useful_life DOUBLE PRECISION DEFAULT 27.5;

-- Add comment for documentation
COMMENT ON COLUMN ledger_entries.capitalize_useful_life 
IS 'Depreciation period for capitalized improvements (years). Default is 27.5 years for residential rental property.';

-- Add missing columns to assets table
ALTER TABLE assets ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'Other';
ALTER TABLE assets ADD COLUMN IF NOT EXISTS business_use_percent DOUBLE PRECISION DEFAULT 100;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS useful_life DOUBLE PRECISION DEFAULT 5;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS section179 BOOLEAN DEFAULT false;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS bonus_depreciation BOOLEAN DEFAULT false;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS notes TEXT;

-- Comment for clarity
COMMENT ON COLUMN assets.business_use_percent IS 'Percentage of business use (0-100)';
COMMENT ON COLUMN assets.useful_life IS 'Recovery period in years';

-- ============================================================================
-- Migration 005: Add source field to vehicle_recommendations
-- ============================================================================
-- 
-- Purpose: Track the source of recommendations to distinguish between:
--   - ai_generated: From AI maintenance recommendations API
--   - manual: Manually added by service advisor
--   - inspection: Found during vehicle inspection
-- 
-- This allows filtering, reporting, and analytics on recommendation sources.
-- For example: "How many AI recommendations were approved this month?"
--
-- Safe to run multiple times (uses IF NOT EXISTS)
-- ============================================================================

-- Add source column if it doesn't exist
ALTER TABLE vehicle_recommendations 
ADD COLUMN IF NOT EXISTS source VARCHAR(20) DEFAULT 'manual';

-- Add helpful comment
COMMENT ON COLUMN vehicle_recommendations.source IS 'Source of recommendation: ai_generated, manual, inspection';

-- Add check constraint for valid values (optional but recommended)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'vehicle_recommendations_source_check'
  ) THEN
    ALTER TABLE vehicle_recommendations 
    ADD CONSTRAINT vehicle_recommendations_source_check 
    CHECK (source IN ('ai_generated', 'manual', 'inspection'));
  END IF;
END $$;

-- Add index for filtering by source (optional but useful for reports)
CREATE INDEX IF NOT EXISTS idx_vehicle_recommendations_source 
ON vehicle_recommendations(source);

-- Add superseded status to existing check constraint
DO $$
BEGIN
  -- Drop old constraint if it exists
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'vehicle_recommendations_status_check'
  ) THEN
    ALTER TABLE vehicle_recommendations 
    DROP CONSTRAINT vehicle_recommendations_status_check;
  END IF;
  
  -- Add new constraint with superseded status
  ALTER TABLE vehicle_recommendations 
  ADD CONSTRAINT vehicle_recommendations_status_check 
  CHECK (status IN ('awaiting_approval', 'approved', 'declined_for_now', 'superseded'));
END $$;

-- Migration complete
SELECT 'Migration 005 completed successfully' AS status;

-- ========================================
-- Migration: Add is_public column to generated_games
-- Date: 2025-10-27
-- Purpose: Enable public/private visibility control for games
-- ========================================

-- Add is_public column to generated_games table
-- Default: true (new games are public by default)
ALTER TABLE generated_games
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true;

-- Add index for performance optimization
-- This will speed up queries filtering by public/private status
CREATE INDEX IF NOT EXISTS idx_generated_games_is_public
ON generated_games(is_public);

-- Ensure all existing games are set to public
-- This maintains backward compatibility
UPDATE generated_games
SET is_public = true
WHERE is_public IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN generated_games.is_public IS
'Controls whether game appears in public hub. True=public (visible to all), False=private (visible only to owner in hub)';

-- Verify migration
SELECT
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'generated_games'
AND column_name = 'is_public';

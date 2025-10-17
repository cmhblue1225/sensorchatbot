-- Add creator_id column to generated_games table for user permission management
-- This migration adds user ownership tracking to AI-generated games

-- Step 1: Add creator_id column
ALTER TABLE generated_games
ADD COLUMN IF NOT EXISTS creator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Step 2: Create index for performance
CREATE INDEX IF NOT EXISTS idx_generated_games_creator_id
ON generated_games(creator_id);

-- Step 3: Migrate existing games to test@test.com account
-- All existing remote storage games will be owned by test@test.com
UPDATE generated_games
SET creator_id = (SELECT id FROM auth.users WHERE email = 'test@test.com')
WHERE creator_id IS NULL;

-- Step 4: Drop old RLS policies
DROP POLICY IF EXISTS "Anyone can read generated games" ON generated_games;
DROP POLICY IF EXISTS "Authenticated users can insert games" ON generated_games;
DROP POLICY IF EXISTS "Anyone can update games" ON generated_games;
DROP POLICY IF EXISTS "Anyone can delete games" ON generated_games;

-- Step 5: Create new RLS policies with proper permissions

-- READ: Anyone can view all games (for gameplay)
CREATE POLICY "Anyone can read games"
ON generated_games FOR SELECT
USING (true);

-- INSERT: Only authenticated users can create games, and they must set themselves as creator
CREATE POLICY "Authenticated users can insert games"
ON generated_games FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = creator_id);

-- UPDATE: Only game creator or admin can update
CREATE POLICY "Creator or admin can update games"
ON generated_games FOR UPDATE
TO authenticated
USING (
    auth.uid() = creator_id OR
    auth.email() = 'admin@admin.com'
);

-- DELETE: Only game creator or admin can delete
CREATE POLICY "Creator or admin can delete games"
ON generated_games FOR DELETE
TO authenticated
USING (
    auth.uid() = creator_id OR
    auth.email() = 'admin@admin.com'
);

-- Step 6: Add comments for documentation
COMMENT ON COLUMN generated_games.creator_id IS 'User who created this game (references auth.users). NULL for legacy games.';

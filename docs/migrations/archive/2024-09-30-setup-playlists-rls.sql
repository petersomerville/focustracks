-- Setup Row Level Security for playlists table
-- This ensures users can only access their own playlists

-- Enable RLS on playlists table
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view own playlists" ON playlists;
DROP POLICY IF EXISTS "Users can insert own playlists" ON playlists;
DROP POLICY IF EXISTS "Users can update own playlists" ON playlists;
DROP POLICY IF EXISTS "Users can delete own playlists" ON playlists;

-- Allow users to view their own playlists
CREATE POLICY "Users can view own playlists" ON playlists
  FOR SELECT
  USING (auth.uid() = user_id);

-- Allow users to create their own playlists
CREATE POLICY "Users can insert own playlists" ON playlists
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own playlists
CREATE POLICY "Users can update own playlists" ON playlists
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own playlists
CREATE POLICY "Users can delete own playlists" ON playlists
  FOR DELETE
  USING (auth.uid() = user_id);
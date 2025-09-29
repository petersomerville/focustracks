-- Find approved submissions that don't have corresponding tracks
-- This happens when the automatic track creation failed during approval

-- First, let's see all approved submissions
SELECT
  id,
  title,
  artist,
  genre,
  duration,
  youtube_url,
  spotify_url,
  status,
  created_at,
  updated_at
FROM track_submissions
WHERE status = 'approved'
ORDER BY updated_at DESC;

-- Now find which approved submissions don't have matching tracks
-- We'll match by title and artist to identify orphaned submissions
SELECT DISTINCT
  s.id as submission_id,
  s.title,
  s.artist,
  s.genre,
  s.duration,
  s.youtube_url,
  s.spotify_url,
  s.updated_at as approved_at
FROM track_submissions s
LEFT JOIN tracks t ON (s.title = t.title AND s.artist = t.artist)
WHERE s.status = 'approved'
  AND t.id IS NULL  -- No matching track found
ORDER BY s.updated_at DESC;
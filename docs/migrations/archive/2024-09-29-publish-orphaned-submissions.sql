-- Manually publish approved submissions that failed to create tracks
-- This script replicates the logic from src/app/api/submissions/[id]/route.ts lines 88-124

-- Insert tracks for orphaned approved submissions
-- Using the same logic as the API: youtube_url and spotify_url in separate fields,
-- plus audio_url for backward compatibility (prefer youtube, fallback to spotify)
INSERT INTO tracks (
  title,
  artist,
  genre,
  duration,
  youtube_url,
  spotify_url,
  audio_url,
  created_at
)
SELECT
  s.title,
  s.artist,
  s.genre,
  s.duration,
  s.youtube_url,
  s.spotify_url,
  COALESCE(s.youtube_url, s.spotify_url) as audio_url,  -- Prefer youtube, fallback to spotify
  NOW() as created_at
FROM track_submissions s
LEFT JOIN tracks t ON (s.title = t.title AND s.artist = t.artist)
WHERE s.status = 'approved'
  AND t.id IS NULL  -- Only insert if no matching track exists
  AND (s.youtube_url IS NOT NULL OR s.spotify_url IS NOT NULL);  -- Must have at least one URL

-- Verify the insertions worked
SELECT
  t.id,
  t.title,
  t.artist,
  t.youtube_url,
  t.spotify_url,
  t.audio_url,
  t.created_at
FROM tracks t
WHERE t.created_at >= (NOW() - INTERVAL '1 minute')  -- Show recently created tracks
ORDER BY t.created_at DESC;
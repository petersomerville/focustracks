-- Fix missing youtube_url fields for the 6 original tracks
-- The TrackCard component requires youtube_url to show play buttons and platform icons

UPDATE tracks SET youtube_url = 'https://www.youtube.com/watch?v=jfKfPfyJRdk' WHERE title = 'Deep Focus';
UPDATE tracks SET youtube_url = 'https://www.youtube.com/watch?v=5qap5aO4i9A' WHERE title = 'Study Session';
UPDATE tracks SET youtube_url = 'https://www.youtube.com/watch?v=DWcJFNfaw9c' WHERE title = 'Coding Flow';
UPDATE tracks SET youtube_url = 'https://www.youtube.com/watch?v=4xDzrJKXOOY' WHERE title = 'Peaceful Mind';
UPDATE tracks SET youtube_url = 'https://www.youtube.com/watch?v=UfcAVejslrU' WHERE title = 'Productivity Boost';
UPDATE tracks SET youtube_url = 'https://www.youtube.com/watch?v=1HZtNaQfXak' WHERE title = 'Classical Study';

-- Verify the updates worked
SELECT title, audio_url, youtube_url FROM tracks WHERE title IN ('Deep Focus', 'Study Session', 'Coding Flow', 'Peaceful Mind', 'Productivity Boost', 'Classical Study');
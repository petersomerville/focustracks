import { NextRequest, NextResponse } from 'next/server'
import { Track } from '@/lib/supabase'

// Mock data for Phase 2 development
const MOCK_TRACKS: Track[] = [
  {
    id: '1',
    title: 'Deep Focus',
    artist: 'Ambient Collective',
    genre: 'Ambient',
    duration: 3600, // 1 hour
    youtube_url: 'https://www.youtube.com/watch?v=jfKfPfyJRdk',
    spotify_url: 'https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC',
    created_at: '2024-01-15T10:00:00Z'
  },
  {
    id: '2',
    title: 'Peaceful Piano Study',
    artist: 'Classical Focus',
    genre: 'Classical',
    duration: 2400, // 40 minutes
    youtube_url: 'https://www.youtube.com/watch?v=lFcSrYw-ARY',
    spotify_url: 'https://open.spotify.com/track/0VjIjW4GlULA4WZZeqtqZ5',
    created_at: '2024-01-14T15:30:00Z'
  },
  {
    id: '3',
    title: 'Electronic Concentration',
    artist: 'Digital Minds',
    genre: 'Electronic',
    duration: 2700, // 45 minutes
    youtube_url: 'https://www.youtube.com/watch?v=f02mOEt11OQ',
    spotify_url: 'https://open.spotify.com/track/2takcwOaAZWiXQijPHIx7B',
    created_at: '2024-01-13T09:15:00Z'
  },
  {
    id: '4',
    title: 'Nature Sounds for Focus',
    artist: 'Earth Tones',
    genre: 'Ambient',
    duration: 5400, // 1.5 hours
    youtube_url: 'https://www.youtube.com/watch?v=sTux-QtKCQs',
    created_at: '2024-01-12T14:20:00Z'
  },
  {
    id: '5',
    title: 'Minimal Techno Work',
    artist: 'Focus Beat',
    genre: 'Electronic',
    duration: 3000, // 50 minutes
    youtube_url: 'https://www.youtube.com/watch?v=3s7d8D2z7ck',
    spotify_url: 'https://open.spotify.com/track/6DCZcSspjsKoFjzjrWoCdn',
    created_at: '2024-01-11T11:45:00Z'
  },
  {
    id: '6',
    title: 'Bach for Concentration',
    artist: 'J.S. Bach',
    genre: 'Classical',
    duration: 2100, // 35 minutes
    youtube_url: 'https://www.youtube.com/watch?v=6JQm5aSjX6g',
    spotify_url: 'https://open.spotify.com/track/5FVd6KXrgO9B3JPmC8OPst',
    created_at: '2024-01-10T16:00:00Z'
  },
  {
    id: '7',
    title: 'Lofi Hip Hop Study',
    artist: 'Chill Beats',
    genre: 'Electronic',
    duration: 4200, // 70 minutes
    youtube_url: 'https://www.youtube.com/watch?v=5yx6BWlEVcY',
    spotify_url: 'https://open.spotify.com/track/0vvXsWCC9xrXsKd4FyS8kM',
    created_at: '2024-01-09T13:30:00Z'
  },
  {
    id: '8',
    title: 'Meditation Bells',
    artist: 'Zen Masters',
    genre: 'Ambient',
    duration: 1800, // 30 minutes
    youtube_url: 'https://www.youtube.com/watch?v=nOJWdHGzRfY',
    created_at: '2024-01-08T08:00:00Z'
  },
  {
    id: '9',
    title: 'Debussy for Deep Work',
    artist: 'Claude Debussy',
    genre: 'Classical',
    duration: 2700, // 45 minutes
    youtube_url: 'https://www.youtube.com/watch?v=9E6b3swbnWg',
    spotify_url: 'https://open.spotify.com/track/4Nd3c3g4n3fBqn3bSYgWfP',
    created_at: '2024-01-07T12:15:00Z'
  },
  {
    id: '10',
    title: 'Rain and Thunder',
    artist: 'Nature Sounds Pro',
    genre: 'Ambient',
    duration: 7200, // 2 hours
    youtube_url: 'https://www.youtube.com/watch?v=n_Dv4JMiwK8',
    created_at: '2024-01-06T10:30:00Z'
  }
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const genre = searchParams.get('genre')
    const search = searchParams.get('search')

    let filteredTracks = [...MOCK_TRACKS]

    // Apply genre filter if provided
    if (genre && genre !== 'All') {
      filteredTracks = filteredTracks.filter(track => track.genre === genre)
    }

    // Apply search filter if provided
    if (search) {
      const searchLower = search.toLowerCase()
      filteredTracks = filteredTracks.filter(track =>
        track.title.toLowerCase().includes(searchLower) ||
        track.artist.toLowerCase().includes(searchLower)
      )
    }

    // Sort by created_at descending (newest first)
    filteredTracks.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    return NextResponse.json({ tracks: filteredTracks })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

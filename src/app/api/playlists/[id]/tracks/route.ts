import { NextRequest, NextResponse } from 'next/server'
import { PlaylistTrack } from '@/lib/supabase'
import {
  MOCK_PLAYLIST_TRACKS,
  addPlaylistTrack,
  removePlaylistTrack,
  getNextPlaylistTrackId
} from '@/lib/mockData'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { trackId } = await request.json()

    if (!trackId) {
      return NextResponse.json({ error: 'Track ID is required' }, { status: 400 })
    }

    // Check if track is already in playlist
    const existingTrack = MOCK_PLAYLIST_TRACKS.find(
      pt => pt.playlist_id === id && pt.track_id === trackId
    )

    if (existingTrack) {
      return NextResponse.json({ error: 'Track already in playlist' }, { status: 400 })
    }

    // Get next position
    const playlistTracks = MOCK_PLAYLIST_TRACKS.filter(pt => pt.playlist_id === id)
    const nextPosition = playlistTracks.length > 0
      ? Math.max(...playlistTracks.map(pt => pt.position)) + 1
      : 1

    // Create new playlist track
    const newPlaylistTrack: PlaylistTrack = {
      id: getNextPlaylistTrackId(),
      playlist_id: id,
      track_id: trackId,
      position: nextPosition
    }

    addPlaylistTrack(newPlaylistTrack)

    return NextResponse.json({ playlistTrack: newPlaylistTrack })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const trackId = searchParams.get('trackId')

    if (!trackId) {
      return NextResponse.json({ error: 'Track ID is required' }, { status: 400 })
    }

    // Find the playlist track to ensure it exists
    const existingTrack = MOCK_PLAYLIST_TRACKS.find(
      pt => pt.playlist_id === id && pt.track_id === trackId
    )

    if (!existingTrack) {
      return NextResponse.json({ error: 'Track not found in playlist' }, { status: 404 })
    }

    // Remove the playlist track
    removePlaylistTrack(id, trackId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Note: Mock data is now managed in /lib/mockData.ts for shared access

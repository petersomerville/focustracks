import { NextRequest, NextResponse } from 'next/server'
import { MOCK_PLAYLISTS, MOCK_PLAYLIST_TRACKS, removePlaylist } from '@/lib/mockData'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    // Find playlist
    const playlist = MOCK_PLAYLISTS.find(p => p.id === id)

    if (!playlist) {
      return NextResponse.json({ error: 'Playlist not found' }, { status: 404 })
    }

    // Get tracks API to get full track data
    const tracksResponse = await fetch(`${request.nextUrl.origin}/api/tracks`)
    const tracksData = await tracksResponse.json()
    const allTracks = tracksData.tracks || []

    // Get playlist tracks and join with full track data
    const playlistTracks = MOCK_PLAYLIST_TRACKS
      .filter(pt => pt.playlist_id === id)
      .sort((a, b) => a.position - b.position)
      .map(pt => allTracks.find(track => track.id === pt.track_id))
      .filter(Boolean) // Remove any tracks that weren't found

    return NextResponse.json({
      playlist: {
        ...playlist,
        tracks: playlistTracks
      }
    })
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
    // Find playlist
    const playlist = MOCK_PLAYLISTS.find(p => p.id === id)

    if (!playlist) {
      return NextResponse.json({ error: 'Playlist not found' }, { status: 404 })
    }

    // Remove playlist and all its tracks
    removePlaylist(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

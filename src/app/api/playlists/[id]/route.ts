import { NextRequest, NextResponse } from 'next/server'
import { MOCK_PLAYLISTS, MOCK_PLAYLIST_TRACKS, removePlaylist } from '@/lib/mockData'
import { Track } from '@/lib/supabase'
import { createLogger } from '@/lib/logger'
import { createErrorResponse } from '@/lib/api-schemas'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const logger = createLogger('api:playlists:[id]')
  try {
    const { id } = await params
    // Find playlist
    const playlist = MOCK_PLAYLISTS.find(p => p.id === id)

    if (!playlist) {
      return NextResponse.json(
        createErrorResponse('Playlist not found', 'The requested playlist does not exist', 'NOT_FOUND'),
        { status: 404 }
      )
    }

    // Get tracks API to get full track data
    const tracksResponse = await fetch(`${request.nextUrl.origin}/api/tracks`)
    const tracksData = await tracksResponse.json()
    const allTracks = tracksData.tracks || []

    // Get playlist tracks and join with full track data
    const playlistTracks = MOCK_PLAYLIST_TRACKS
      .filter(pt => pt.playlist_id === id)
      .sort((a, b) => a.position - b.position)
      .map(pt => allTracks.find((track: Track) => track.id === pt.track_id))
      .filter(Boolean) as Track[] // Remove any tracks that weren't found

    return NextResponse.json({
      playlist: {
        ...playlist,
        tracks: playlistTracks
      }
    })
  } catch (error) {
    logger.error('Unexpected error fetching playlist', error instanceof Error ? error : String(error))
    return NextResponse.json(
      createErrorResponse('Internal server error', 'An unexpected error occurred', 'INTERNAL_ERROR'),
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const logger = createLogger('api:playlists:[id]:delete')
  try {
    const { id } = await params
    // Find playlist
    const playlist = MOCK_PLAYLISTS.find(p => p.id === id)

    if (!playlist) {
      return NextResponse.json(
        createErrorResponse('Playlist not found', 'The requested playlist does not exist', 'NOT_FOUND'),
        { status: 404 }
      )
    }

    // Remove playlist and all its tracks
    removePlaylist(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Unexpected error deleting playlist', error instanceof Error ? error : String(error))
    return NextResponse.json(
      createErrorResponse('Internal server error', 'An unexpected error occurred', 'INTERNAL_ERROR'),
      { status: 500 }
    )
  }
}

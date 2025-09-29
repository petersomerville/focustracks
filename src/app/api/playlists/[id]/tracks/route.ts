import { NextRequest, NextResponse } from 'next/server'
import { MOCK_PLAYLISTS, MOCK_PLAYLIST_TRACKS, addTrackToPlaylist, removeTrackFromPlaylist, reorderPlaylistTracks } from '@/lib/mockData'
import { createLogger } from '@/lib/logger'
import { createErrorResponse, formatZodErrors, addTrackToPlaylistSchema } from '@/lib/api-schemas'
import { z } from 'zod'

const logger = createLogger('api:playlists:[id]:tracks')

// Schema for reordering tracks
const reorderTracksSchema = z.object({
  track_id: z.string().uuid('Must be a valid track ID'),
  new_position: z.number().min(0, 'Position must be non-negative'),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const logger = createLogger('api:playlists:[id]:tracks:add')
  try {
    const { id } = await params
    const body = await request.json()
    
    // Validate request body using Zod schema
    const validation = addTrackToPlaylistSchema.safeParse(body)
    if (!validation.success) {
      logger.warn('Invalid add track request', {
        errors: validation.error.issues
      })
      return NextResponse.json(
        formatZodErrors(validation.error),
        { status: 400 }
      )
    }

    const { track_id } = validation.data

    // Find playlist
    const playlist = MOCK_PLAYLISTS.find(p => p.id === id)

    if (!playlist) {
      return NextResponse.json(
        createErrorResponse('Playlist not found', 'The requested playlist does not exist', 'NOT_FOUND'),
        { status: 404 }
      )
    }

    // Check if track is already in playlist
    const existingTrack = MOCK_PLAYLIST_TRACKS.find(
      pt => pt.playlist_id === id && pt.track_id === track_id
    )

    if (existingTrack) {
      return NextResponse.json(
        createErrorResponse('Track already in playlist', 'This track is already in the playlist', 'DUPLICATE_TRACK'),
        { status: 409 }
      )
    }

    // Add track to playlist
    const playlistTrack = addTrackToPlaylist(id, track_id)
    return NextResponse.json({ playlistTrack })
  } catch (error) {
    logger.error('Unexpected error adding track to playlist', error instanceof Error ? error : String(error))
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
  const logger = createLogger('api:playlists:[id]:tracks:remove')
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const track_id = searchParams.get('track_id')

    if (!track_id) {
      return NextResponse.json(
        createErrorResponse('Track ID required', 'track_id query parameter is required', 'MISSING_PARAMETER'),
        { status: 400 }
      )
    }

    // Find playlist
    const playlist = MOCK_PLAYLISTS.find(p => p.id === id)

    if (!playlist) {
      return NextResponse.json(
        createErrorResponse('Playlist not found', 'The requested playlist does not exist', 'NOT_FOUND'),
        { status: 404 }
      )
    }

    // Check if track is in playlist
    const existingTrack = MOCK_PLAYLIST_TRACKS.find(
      pt => pt.playlist_id === id && pt.track_id === track_id
    )

    if (!existingTrack) {
      return NextResponse.json(
        createErrorResponse('Track not in playlist', 'This track is not in the playlist', 'TRACK_NOT_FOUND'),
        { status: 404 }
      )
    }

    // Remove track from playlist
    removeTrackFromPlaylist(id, track_id)
    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Unexpected error removing track from playlist', error instanceof Error ? error : String(error))
    return NextResponse.json(
      createErrorResponse('Internal server error', 'An unexpected error occurred', 'INTERNAL_ERROR'),
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const logger = createLogger('api:playlists:[id]:tracks:reorder')
  try {
    const { id } = await params
    const body = await request.json()
    
    // Validate request body using Zod schema
    const validation = reorderTracksSchema.safeParse(body)
    if (!validation.success) {
      logger.warn('Invalid reorder tracks request', {
        errors: validation.error.issues
      })
      return NextResponse.json(
        formatZodErrors(validation.error),
        { status: 400 }
      )
    }

    const { track_id, new_position } = validation.data

    // Find playlist
    const playlist = MOCK_PLAYLISTS.find(p => p.id === id)

    if (!playlist) {
      return NextResponse.json(
        createErrorResponse('Playlist not found', 'The requested playlist does not exist', 'NOT_FOUND'),
        { status: 404 }
      )
    }

    // Check if track is in playlist
    const existingTrack = MOCK_PLAYLIST_TRACKS.find(
      pt => pt.playlist_id === id && pt.track_id === track_id
    )

    if (!existingTrack) {
      return NextResponse.json(
        createErrorResponse('Track not in playlist', 'This track is not in the playlist', 'TRACK_NOT_FOUND'),
        { status: 404 }
      )
    }

    // Reorder track in playlist
    const updatedPlaylistTracks = reorderPlaylistTracks(id, track_id, new_position)
    return NextResponse.json({ playlistTracks: updatedPlaylistTracks })
  } catch (error) {
    logger.error('Unexpected error reordering tracks in playlist', error instanceof Error ? error : String(error))
    return NextResponse.json(
      createErrorResponse('Internal server error', 'An unexpected error occurred', 'INTERNAL_ERROR'),
      { status: 500 }
    )
  }
}
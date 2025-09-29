import { NextRequest, NextResponse } from 'next/server'
import { PlaylistTrack } from '@/lib/supabase'
import {
  MOCK_PLAYLIST_TRACKS,
  addPlaylistTrack,
  removePlaylistTrack,
  getNextPlaylistTrackId
} from '@/lib/mockData'
import { createLogger } from '@/lib/logger'
import { addTrackToPlaylistSchema, createErrorResponse, formatZodErrors } from '@/lib/api-schemas'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const logger = createLogger('api:playlists:[id]:tracks')
  try {
    const { id } = await params
    const body = await request.json()
    
    // Validate request body using Zod schema
    const validation = addTrackToPlaylistSchema.safeParse(body)
    if (!validation.success) {
      logger.warn('Invalid add track to playlist request', {
        errors: validation.error.issues
      })
      return NextResponse.json(
        formatZodErrors(validation.error),
        { status: 400 }
      )
    }

    const { track_id: trackId } = validation.data

    // Check if track is already in playlist
    const existingTrack = MOCK_PLAYLIST_TRACKS.find(
      pt => pt.playlist_id === id && pt.track_id === trackId
    )

    if (existingTrack) {
      return NextResponse.json(
        createErrorResponse('Track already in playlist', 'This track is already in the playlist', 'DUPLICATE_TRACK'),
        { status: 400 }
      )
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
  const logger = createLogger('api:playlists:[id]:tracks:delete')
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const trackId = searchParams.get('trackId')

    if (!trackId) {
      return NextResponse.json(
        createErrorResponse('Track ID is required', 'trackId query parameter is missing', 'MISSING_PARAMETER'),
        { status: 400 }
      )
    }

    // Find the playlist track to ensure it exists
    const existingTrack = MOCK_PLAYLIST_TRACKS.find(
      pt => pt.playlist_id === id && pt.track_id === trackId
    )

    if (!existingTrack) {
      return NextResponse.json(
        createErrorResponse('Track not found in playlist', 'The specified track is not in this playlist', 'NOT_FOUND'),
        { status: 404 }
      )
    }

    // Remove the playlist track
    removePlaylistTrack(id, trackId)

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Unexpected error removing track from playlist', error instanceof Error ? error : String(error))
    return NextResponse.json(
      createErrorResponse('Internal server error', 'An unexpected error occurred', 'INTERNAL_ERROR'),
      { status: 500 }
    )
  }
}

// Note: Mock data is now managed in /lib/mockData.ts for shared access

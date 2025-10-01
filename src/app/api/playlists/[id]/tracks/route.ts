import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createLogger } from '@/lib/logger'
import { createErrorResponse, formatZodErrors, addTrackToPlaylistSchema, createApiResponse } from '@/lib/api-schemas'
import { z } from 'zod'

const _logger = createLogger('api:playlists:[id]:tracks')

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
  const startTime = Date.now()
  const { id } = await params

  try {
    const supabase = await createServerSupabaseClient()
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

    logger.apiRequest('POST', `/api/playlists/${id}/tracks`, { track_id })

    // Check if playlist exists
    const { data: playlist, error: playlistError } = await supabase
      .from('playlists')
      .select('id')
      .eq('id', id)
      .single()

    if (playlistError || !playlist) {
      logger.warn('Playlist not found', { id })
      return NextResponse.json(
        createErrorResponse('Playlist not found', 'The requested playlist does not exist', 'NOT_FOUND'),
        { status: 404 }
      )
    }

    // Check if track is already in playlist
    const { data: existingTrack } = await supabase
      .from('playlist_tracks')
      .select('id')
      .eq('playlist_id', id)
      .eq('track_id', track_id)
      .single()

    if (existingTrack) {
      logger.warn('Track already in playlist', { playlistId: id, trackId: track_id })
      return NextResponse.json(
        createErrorResponse('Track already in playlist', 'This track is already in the playlist', 'DUPLICATE_TRACK'),
        { status: 409 }
      )
    }

    // Get the next position
    const { data: playlistTracks } = await supabase
      .from('playlist_tracks')
      .select('position')
      .eq('playlist_id', id)
      .order('position', { ascending: false })
      .limit(1)

    const nextPosition = (playlistTracks?.[0]?.position || 0) + 1

    // Add track to playlist
    const { data: playlistTrack, error } = await supabase
      .from('playlist_tracks')
      .insert({
        playlist_id: id,
        track_id,
        position: nextPosition
      })
      .select()
      .single()

    const duration = Date.now() - startTime

    if (error) {
      logger.error('Database insert failed', { error, playlistId: id, trackId: track_id, duration })
      logger.apiResponse('POST', `/api/playlists/${id}/tracks`, 500, duration)
      return NextResponse.json(
        createErrorResponse('Failed to add track to playlist', 'Database insert error', 'DATABASE_ERROR'),
        { status: 500 }
      )
    }

    logger.dbQuery('INSERT playlist track', duration, { playlistId: id, trackId: track_id })
    logger.apiResponse('POST', `/api/playlists/${id}/tracks`, 201, duration)

    const response = createApiResponse({ playlistTrack })
    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    const duration = Date.now() - startTime
    logger.error('Unexpected error adding track to playlist', { error: error instanceof Error ? error : String(error) })
    logger.apiResponse('POST', `/api/playlists/${id}/tracks`, 500, duration)

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
  const startTime = Date.now()
  const { id } = await params

  try {
    const supabase = await createServerSupabaseClient()
    const { searchParams } = new URL(request.url)
    const track_id = searchParams.get('track_id')

    if (!track_id) {
      return NextResponse.json(
        createErrorResponse('Track ID required', 'track_id query parameter is required', 'MISSING_PARAMETER'),
        { status: 400 }
      )
    }

    logger.apiRequest('DELETE', `/api/playlists/${id}/tracks`, { track_id })

    // Check if playlist exists
    const { data: playlist, error: playlistError } = await supabase
      .from('playlists')
      .select('id')
      .eq('id', id)
      .single()

    if (playlistError || !playlist) {
      logger.warn('Playlist not found', { id })
      return NextResponse.json(
        createErrorResponse('Playlist not found', 'The requested playlist does not exist', 'NOT_FOUND'),
        { status: 404 }
      )
    }

    // Check if track is in playlist
    const { data: existingTrack } = await supabase
      .from('playlist_tracks')
      .select('id')
      .eq('playlist_id', id)
      .eq('track_id', track_id)
      .single()

    if (!existingTrack) {
      logger.warn('Track not in playlist', { playlistId: id, trackId: track_id })
      return NextResponse.json(
        createErrorResponse('Track not in playlist', 'This track is not in the playlist', 'TRACK_NOT_FOUND'),
        { status: 404 }
      )
    }

    // Remove track from playlist
    const { error } = await supabase
      .from('playlist_tracks')
      .delete()
      .eq('playlist_id', id)
      .eq('track_id', track_id)

    const duration = Date.now() - startTime

    if (error) {
      logger.error('Database delete failed', { error, playlistId: id, trackId: track_id, duration })
      logger.apiResponse('DELETE', `/api/playlists/${id}/tracks`, 500, duration)
      return NextResponse.json(
        createErrorResponse('Failed to remove track from playlist', 'Database delete error', 'DATABASE_ERROR'),
        { status: 500 }
      )
    }

    logger.dbQuery('DELETE playlist track', duration, { playlistId: id, trackId: track_id })
    logger.apiResponse('DELETE', `/api/playlists/${id}/tracks`, 200, duration)

    const response = createApiResponse({ success: true })
    return NextResponse.json(response)
  } catch (error) {
    const duration = Date.now() - startTime
    logger.error('Unexpected error removing track from playlist', { error: error instanceof Error ? error : String(error) })
    logger.apiResponse('DELETE', `/api/playlists/${id}/tracks`, 500, duration)

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
  const startTime = Date.now()
  const { id } = await params

  try {
    const supabase = await createServerSupabaseClient()
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

    logger.apiRequest('PUT', `/api/playlists/${id}/tracks`, { track_id, new_position })

    // Check if playlist exists
    const { data: playlist, error: playlistError } = await supabase
      .from('playlists')
      .select('id')
      .eq('id', id)
      .single()

    if (playlistError || !playlist) {
      logger.warn('Playlist not found', { id })
      return NextResponse.json(
        createErrorResponse('Playlist not found', 'The requested playlist does not exist', 'NOT_FOUND'),
        { status: 404 }
      )
    }

    // Check if track is in playlist
    const { data: existingTrack } = await supabase
      .from('playlist_tracks')
      .select('id, position')
      .eq('playlist_id', id)
      .eq('track_id', track_id)
      .single()

    if (!existingTrack) {
      logger.warn('Track not in playlist', { playlistId: id, trackId: track_id })
      return NextResponse.json(
        createErrorResponse('Track not in playlist', 'This track is not in the playlist', 'TRACK_NOT_FOUND'),
        { status: 404 }
      )
    }

    // Update the track position
    const { error } = await supabase
      .from('playlist_tracks')
      .update({ position: new_position })
      .eq('playlist_id', id)
      .eq('track_id', track_id)

    const duration = Date.now() - startTime

    if (error) {
      logger.error('Database update failed', { error, playlistId: id, trackId: track_id, newPosition: new_position, duration })
      logger.apiResponse('PUT', `/api/playlists/${id}/tracks`, 500, duration)
      return NextResponse.json(
        createErrorResponse('Failed to reorder track', 'Database update error', 'DATABASE_ERROR'),
        { status: 500 }
      )
    }

    logger.dbQuery('UPDATE playlist track position', duration, { playlistId: id, trackId: track_id, newPosition: new_position })
    logger.apiResponse('PUT', `/api/playlists/${id}/tracks`, 200, duration)

    const response = createApiResponse({ success: true })
    return NextResponse.json(response)
  } catch (error) {
    const duration = Date.now() - startTime
    logger.error('Unexpected error reordering tracks in playlist', { error: error instanceof Error ? error : String(error) })
    logger.apiResponse('PUT', `/api/playlists/${id}/tracks`, 500, duration)

    return NextResponse.json(
      createErrorResponse('Internal server error', 'An unexpected error occurred', 'INTERNAL_ERROR'),
      { status: 500 }
    )
  }
}
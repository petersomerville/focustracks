import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { createLogger } from '@/lib/logger'
import { createErrorResponse, formatZodErrors, updatePlaylistSchema, createApiResponse } from '@/lib/api-schemas'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const logger = createLogger('api:playlists:[id]')
  const startTime = Date.now()
  const { id } = await params

  try {

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      logger.warn('Invalid playlist ID format', { id })
      return NextResponse.json(
        createErrorResponse('Invalid playlist ID', 'Playlist ID must be a valid UUID', 'INVALID_ID'),
        { status: 400 }
      )
    }

    logger.apiRequest('GET', `/api/playlists/${id}`)

    // Get playlist from database
    const { data: playlist, error: playlistError } = await supabase
      .from('playlists')
      .select('*')
      .eq('id', id)
      .single()

    const duration = Date.now() - startTime

    if (playlistError) {
      if (playlistError.code === 'PGRST116') {
        logger.warn('Playlist not found', { id, duration })
        logger.apiResponse('GET', `/api/playlists/${id}`, 404, duration)
        return NextResponse.json(
          createErrorResponse('Playlist not found', 'The requested playlist does not exist', 'NOT_FOUND'),
          { status: 404 }
        )
      }

      logger.error('Database query failed', playlistError, { id, duration })
      logger.apiResponse('GET', `/api/playlists/${id}`, 500, duration)
      return NextResponse.json(
        createErrorResponse('Failed to fetch playlist', 'Database query error', 'DATABASE_ERROR'),
        { status: 500 }
      )
    }

    // Get playlist tracks with full track data
    const { data: playlistTracks, error: tracksError } = await supabase
      .from('playlist_tracks')
      .select(`
        *,
        tracks (*)
      `)
      .eq('playlist_id', id)
      .order('position', { ascending: true })

    if (tracksError) {
      logger.error('Failed to fetch playlist tracks', tracksError, { id })
      return NextResponse.json(
        createErrorResponse('Failed to fetch playlist tracks', 'Database query error', 'DATABASE_ERROR'),
        { status: 500 }
      )
    }

    // Extract tracks from the joined data
    const tracks = playlistTracks?.map(pt => pt.tracks).filter(Boolean) || []

    logger.dbQuery('SELECT playlist with tracks', duration, { 
      playlistId: id, 
      tracksCount: tracks.length 
    })
    logger.apiResponse('GET', `/api/playlists/${id}`, 200, duration)

    const response = createApiResponse({
      playlist: {
        ...playlist,
        tracks
      }
    })
    return NextResponse.json(response)
  } catch (error) {
    const duration = Date.now() - startTime
    logger.error('Unexpected error fetching playlist', error instanceof Error ? error : String(error))
    logger.apiResponse('GET', `/api/playlists/${id}`, 500, duration)

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
  const logger = createLogger('api:playlists:[id]:update')
  const startTime = Date.now()
  const { id } = await params

  try {
    const body = await request.json()
    
    // Validate request body using Zod schema
    const validation = updatePlaylistSchema.safeParse(body)
    if (!validation.success) {
      logger.warn('Invalid playlist update request', {
        errors: validation.error.issues
      })
      return NextResponse.json(
        formatZodErrors(validation.error),
        { status: 400 }
      )
    }

    const { name } = validation.data

    logger.apiRequest('PUT', `/api/playlists/${id}`, { name })

    // Update playlist in database
    const { data: updatedPlaylist, error } = await supabase
      .from('playlists')
      .update({
        name: name.trim(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    const duration = Date.now() - startTime

    if (error) {
      if (error.code === 'PGRST116') {
        logger.warn('Playlist not found for update', { id, duration })
        logger.apiResponse('PUT', `/api/playlists/${id}`, 404, duration)
        return NextResponse.json(
          createErrorResponse('Playlist not found', 'The requested playlist does not exist', 'NOT_FOUND'),
          { status: 404 }
        )
      }

      logger.error('Database update failed', error, { id, name, duration })
      logger.apiResponse('PUT', `/api/playlists/${id}`, 500, duration)
      return NextResponse.json(
        createErrorResponse('Failed to update playlist', 'Database update error', 'DATABASE_ERROR'),
        { status: 500 }
      )
    }

    logger.dbQuery('UPDATE playlist', duration, { playlistId: id })
    logger.apiResponse('PUT', `/api/playlists/${id}`, 200, duration)

    const response = createApiResponse({ playlist: updatedPlaylist })
    return NextResponse.json(response)
  } catch (error) {
    const duration = Date.now() - startTime
    logger.error('Unexpected error updating playlist', error instanceof Error ? error : String(error))
    logger.apiResponse('PUT', `/api/playlists/${id}`, 500, duration)

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
  const startTime = Date.now()
  const { id } = await params

  try {

    logger.apiRequest('DELETE', `/api/playlists/${id}`)

    // Delete playlist tracks first (cascade should handle this, but being explicit)
    const { error: tracksError } = await supabase
      .from('playlist_tracks')
      .delete()
      .eq('playlist_id', id)

    if (tracksError) {
      logger.error('Failed to delete playlist tracks', tracksError, { id })
      return NextResponse.json(
        createErrorResponse('Failed to delete playlist tracks', 'Database delete error', 'DATABASE_ERROR'),
        { status: 500 }
      )
    }

    // Delete playlist
    const { error } = await supabase
      .from('playlists')
      .delete()
      .eq('id', id)

    const duration = Date.now() - startTime

    if (error) {
      logger.error('Database delete failed', error, { id, duration })
      logger.apiResponse('DELETE', `/api/playlists/${id}`, 500, duration)
      return NextResponse.json(
        createErrorResponse('Failed to delete playlist', 'Database delete error', 'DATABASE_ERROR'),
        { status: 500 }
      )
    }

    logger.dbQuery('DELETE playlist', duration, { playlistId: id })
    logger.apiResponse('DELETE', `/api/playlists/${id}`, 200, duration)

    const response = createApiResponse({ success: true })
    return NextResponse.json(response)
  } catch (error) {
    const duration = Date.now() - startTime
    logger.error('Unexpected error deleting playlist', error instanceof Error ? error : String(error))
    logger.apiResponse('DELETE', `/api/playlists/${id}`, 500, duration)

    return NextResponse.json(
      createErrorResponse('Internal server error', 'An unexpected error occurred', 'INTERNAL_ERROR'),
      { status: 500 }
    )
  }
}

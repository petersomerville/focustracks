import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { createLogger } from '@/lib/logger'
import { createPlaylistSchema, createErrorResponse, formatZodErrors, createApiResponse } from '@/lib/api-schemas'

export async function GET(_request: NextRequest) {
  const logger = createLogger('api:playlists')
  const startTime = Date.now()

  try {
    logger.apiRequest('GET', '/api/playlists')

    // Query playlists from database
    const { data: playlists, error } = await supabase
      .from('playlists')
      .select('*')
      .order('created_at', { ascending: false })

    const duration = Date.now() - startTime

    if (error) {
      logger.error('Database query failed', error, { duration })
      logger.apiResponse('GET', '/api/playlists', 500, duration)
      return NextResponse.json(
        createErrorResponse('Failed to fetch playlists', 'Database query error', 'DATABASE_ERROR'),
        { status: 500 }
      )
    }

    logger.dbQuery('SELECT playlists', duration, { resultsCount: playlists?.length })
    logger.apiResponse('GET', '/api/playlists', 200, duration)

    const response = createApiResponse({ playlists: playlists || [] })
    return NextResponse.json(response)
  } catch (error) {
    const duration = Date.now() - startTime
    logger.error('Unexpected error fetching playlists', error instanceof Error ? error : String(error))
    logger.apiResponse('GET', '/api/playlists', 500, duration)

    return NextResponse.json(
      createErrorResponse('Internal server error', 'An unexpected error occurred', 'INTERNAL_ERROR'),
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const logger = createLogger('api:playlists')
  const startTime = Date.now()

  try {
    const body = await request.json()
    
    // Validate request body using Zod schema
    const validation = createPlaylistSchema.safeParse(body)
    if (!validation.success) {
      logger.warn('Invalid playlist creation request', {
        errors: validation.error.issues
      })
      return NextResponse.json(
        formatZodErrors(validation.error),
        { status: 400 }
      )
    }

    const { name } = validation.data

    logger.apiRequest('POST', '/api/playlists', { name })

    // Create new playlist in database
    const { data: newPlaylist, error } = await supabase
      .from('playlists')
      .insert({
        name: name.trim(),
        user_id: 'demo-user-1', // For now, use demo user. In production, get from auth
      })
      .select()
      .single()

    const duration = Date.now() - startTime

    if (error) {
      logger.error('Database insert failed', error, { name, duration })
      logger.apiResponse('POST', '/api/playlists', 500, duration)
      return NextResponse.json(
        createErrorResponse('Failed to create playlist', 'Database insert error', 'DATABASE_ERROR'),
        { status: 500 }
      )
    }

    logger.dbQuery('INSERT playlist', duration, { playlistId: newPlaylist.id })
    logger.apiResponse('POST', '/api/playlists', 201, duration)

    const response = createApiResponse({ playlist: newPlaylist })
    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    const duration = Date.now() - startTime
    logger.error('Unexpected error creating playlist', error instanceof Error ? error : String(error))
    logger.apiResponse('POST', '/api/playlists', 500, duration)

    return NextResponse.json(
      createErrorResponse('Internal server error', 'An unexpected error occurred', 'INTERNAL_ERROR'),
      { status: 500 }
    )
  }
}

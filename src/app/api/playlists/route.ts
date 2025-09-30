import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createLogger } from '@/lib/logger'
import { createPlaylistSchema, createErrorResponse, formatZodErrors, createApiResponse } from '@/lib/api-schemas'

export async function GET(_request: NextRequest) {
  const logger = createLogger('api:playlists')
  const startTime = Date.now()

  try {
    // Get authenticated user from server-side client
    const supabaseServer = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser()

    if (authError || !user) {
      logger.warn('Unauthorized playlists fetch attempt', { authError })
      return NextResponse.json(
        createErrorResponse('Unauthorized', 'You must be logged in to view playlists', 'UNAUTHORIZED'),
        { status: 401 }
      )
    }

    logger.apiRequest('GET', '/api/playlists', { userId: user.id })

    // Query playlists from database for the authenticated user
    const { data: playlists, error } = await supabaseServer
      .from('playlists')
      .select('*')
      .eq('user_id', user.id)
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
    // Get authenticated user from server-side client
    const supabaseServer = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser()

    if (authError || !user) {
      logger.warn('Unauthorized playlist creation attempt', { authError })
      return NextResponse.json(
        createErrorResponse('Unauthorized', 'You must be logged in to create playlists', 'UNAUTHORIZED'),
        { status: 401 }
      )
    }

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

    logger.apiRequest('POST', '/api/playlists', { name, userId: user.id })

    // Create new playlist in database using authenticated client
    const { data: newPlaylist, error } = await supabaseServer
      .from('playlists')
      .insert({
        name: name.trim(),
        user_id: user.id,
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

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { tracksQuerySchema, createApiResponse, createErrorResponse, formatZodErrors } from '@/lib/api-schemas'
import { createLogger } from '@/lib/logger'

const logger = createLogger('api:tracks')

export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    // Parse and validate query parameters using Zod
    const { searchParams } = new URL(request.url)
    const queryParams = {
      genre: searchParams.get('genre') || undefined,
      search: searchParams.get('search') || undefined,
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined,
      offset: searchParams.get('offset') ? Number(searchParams.get('offset')) : undefined,
    }

    // Validate query parameters
    const validation = tracksQuerySchema.safeParse(queryParams)
    if (!validation.success) {
      logger.warn('Invalid query parameters', {
        queryParams,
        errors: validation.error.issues
      })
      return NextResponse.json(
        formatZodErrors(validation.error),
        { status: 400 }
      )
    }

    const { genre, search, limit, offset } = validation.data

    logger.apiRequest('GET', '/api/tracks', {
      genre,
      search,
      limit,
      offset
    })

    // Build query with validated parameters
    let query = supabase.from('tracks').select('*', { count: 'exact' })

    // Apply genre filter if provided
    if (genre && genre !== 'All') {
      query = query.eq('genre', genre)
    }

    // Apply search filter if provided
    if (search) {
      query = query.or(`title.ilike.%${search}%,artist.ilike.%${search}%`)
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    // Sort by created_at descending (newest first)
    query = query.order('created_at', { ascending: false })

    const { data: tracks, error, count } = await query
    const duration = Date.now() - startTime

    if (error) {
      logger.error('Database query failed', error, {
        genre,
        search,
        duration
      })
      logger.apiResponse('GET', '/api/tracks', 500, duration)
      return NextResponse.json(
        createErrorResponse('Failed to fetch tracks', 'Database query error', 'DATABASE_ERROR'),
        { status: 500 }
      )
    }

    logger.dbQuery('SELECT tracks with filters', duration, {
      genre,
      search,
      resultsCount: tracks?.length
    })

    const response = createApiResponse({
      tracks: tracks || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit
      }
    })

    logger.apiResponse('GET', '/api/tracks', 200, duration)
    return NextResponse.json(response)

  } catch (error) {
    const duration = Date.now() - startTime
    logger.error('Unexpected error in tracks API', error instanceof Error ? error : String(error))
    logger.apiResponse('GET', '/api/tracks', 500, duration)

    return NextResponse.json(
      createErrorResponse('Internal server error', 'An unexpected error occurred', 'INTERNAL_ERROR'),
      { status: 500 }
    )
  }
}

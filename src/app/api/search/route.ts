import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { createApiResponse, createErrorResponse, formatZodErrors } from '@/lib/api-schemas'
import { createLogger } from '@/lib/logger'
import { z } from 'zod'

const logger = createLogger('api:search')

// Search query schema
const searchQuerySchema = z.object({
  q: z.string().min(1, 'Search query is required').max(255, 'Search query cannot exceed 255 characters'),
  type: z.enum(['tracks', 'playlists', 'all']).default('all'),
  genre: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
})

export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    // Parse and validate query parameters
    const { searchParams } = new URL(request.url)
    const queryParams = {
      q: searchParams.get('q') || undefined,
      type: searchParams.get('type') || 'all',
      genre: searchParams.get('genre') || undefined,
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined,
      offset: searchParams.get('offset') ? Number(searchParams.get('offset')) : undefined,
    }

    // Validate query parameters
    const validation = searchQuerySchema.safeParse(queryParams)
    if (!validation.success) {
      logger.warn('Invalid search query parameters', {
        queryParams,
        errors: validation.error.issues
      })
      return NextResponse.json(
        formatZodErrors(validation.error),
        { status: 400 }
      )
    }

    const { q, type, genre, limit, offset } = validation.data

    logger.apiRequest('GET', '/api/search', {
      q,
      type,
      genre,
      limit,
      offset
    })

    const results: {
      tracks?: unknown[]
      playlists?: unknown[]
      pagination: {
        total: number
        limit: number
        offset: number
        hasMore: boolean
      }
    } = {
      pagination: {
        total: 0,
        limit,
        offset,
        hasMore: false
      }
    }

    // Search tracks if requested
    if (type === 'tracks' || type === 'all') {
      let tracksQuery = supabase
        .from('tracks')
        .select('*', { count: 'exact' })
        .or(`title.ilike.%${q}%,artist.ilike.%${q}%`)

      // Apply genre filter if provided
      if (genre && genre !== 'All') {
        tracksQuery = tracksQuery.eq('genre', genre)
      }

      // Apply pagination
      tracksQuery = tracksQuery.range(offset, offset + limit - 1)
      tracksQuery = tracksQuery.order('created_at', { ascending: false })

      const { data: tracks, error: tracksError, count: tracksCount } = await tracksQuery

      if (tracksError) {
        logger.error('Tracks search failed', tracksError, { q, genre })
        return NextResponse.json(
          createErrorResponse('Search failed', 'Database query error', 'DATABASE_ERROR'),
          { status: 500 }
        )
      }

      results.tracks = tracks || []
      results.pagination.total += tracksCount || 0
    }

    // Search playlists if requested
    if (type === 'playlists' || type === 'all') {
      let playlistsQuery = supabase
        .from('playlists')
        .select('*', { count: 'exact' })
        .ilike('name', `%${q}%`)

      // Apply pagination
      playlistsQuery = playlistsQuery.range(offset, offset + limit - 1)
      playlistsQuery = playlistsQuery.order('created_at', { ascending: false })

      const { data: playlists, error: playlistsError, count: playlistsCount } = await playlistsQuery

      if (playlistsError) {
        logger.error('Playlists search failed', playlistsError, { q })
        return NextResponse.json(
          createErrorResponse('Search failed', 'Database query error', 'DATABASE_ERROR'),
          { status: 500 }
        )
      }

      results.playlists = playlists || []
      results.pagination.total += playlistsCount || 0
    }

    // Update pagination
    results.pagination.hasMore = results.pagination.total > offset + limit

    const duration = Date.now() - startTime

    logger.dbQuery('SEARCH across tables', duration, {
      q,
      type,
      resultsCount: {
        tracks: results.tracks?.length || 0,
        playlists: results.playlists?.length || 0
      }
    })

    const response = createApiResponse(results)
    logger.apiResponse('GET', '/api/search', 200, duration)
    return NextResponse.json(response)

  } catch (error) {
    const duration = Date.now() - startTime
    logger.error('Unexpected error in search API', error instanceof Error ? error : String(error))
    logger.apiResponse('GET', '/api/search', 500, duration)

    return NextResponse.json(
      createErrorResponse('Internal server error', 'An unexpected error occurred', 'INTERNAL_ERROR'),
      { status: 500 }
    )
  }
}

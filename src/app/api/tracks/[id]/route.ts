import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { createApiResponse, createErrorResponse } from '@/lib/api-schemas'
import { createLogger } from '@/lib/logger'

const logger = createLogger('api:tracks:[id]')

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now()
  const { id } = await params

  try {

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      logger.warn('Invalid track ID format', { id })
      return NextResponse.json(
        createErrorResponse('Invalid track ID', 'Track ID must be a valid UUID', 'INVALID_ID'),
        { status: 400 }
      )
    }

    logger.apiRequest('GET', `/api/tracks/${id}`)

    // Query the database for the specific track
    const { data: track, error } = await supabase
      .from('tracks')
      .select('*')
      .eq('id', id)
      .single()

    const duration = Date.now() - startTime

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        logger.warn('Track not found', { id, duration })
        logger.apiResponse('GET', `/api/tracks/${id}`, 404, duration)
        return NextResponse.json(
          createErrorResponse('Track not found', 'The requested track does not exist', 'NOT_FOUND'),
          { status: 404 }
        )
      }

      logger.error('Database query failed', { error, id, duration })
      logger.apiResponse('GET', `/api/tracks/${id}`, 500, duration)
      return NextResponse.json(
        createErrorResponse('Failed to fetch track', 'Database query error', 'DATABASE_ERROR'),
        { status: 500 }
      )
    }

    logger.dbQuery('SELECT track by ID', duration, { trackId: id })
    logger.apiResponse('GET', `/api/tracks/${id}`, 200, duration)

    const response = createApiResponse({ track })
    return NextResponse.json(response)

  } catch (error) {
    const duration = Date.now() - startTime
    logger.error('Unexpected error in track details API', { error: error instanceof Error ? error : String(error) })
    logger.apiResponse('GET', `/api/tracks/${id}`, 500, duration)

    return NextResponse.json(
      createErrorResponse('Internal server error', 'An unexpected error occurred', 'INTERNAL_ERROR'),
      { status: 500 }
    )
  }
}

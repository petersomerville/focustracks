import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import type { TrackSubmission as _TrackSubmission } from '@/lib/supabase'
import { createSubmissionSchema, createErrorResponse, formatZodErrors } from '@/lib/api-schemas'
import { createLogger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  const logger = createLogger('api:submissions')
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 })
    }

    const body = await request.json()
    
    // Validate request body using Zod schema
    const validation = createSubmissionSchema.safeParse(body)
    if (!validation.success) {
      logger.warn('Invalid submission request', {
        errors: validation.error.issues
      })
      return NextResponse.json(
        formatZodErrors(validation.error),
        { status: 400 }
      )
    }

    const { title, artist, genre, duration, youtube_url, spotify_url, description } = validation.data

    const { data, error } = await supabase
      .from('track_submissions')
      .insert({
        title: title.trim(),
        artist: artist.trim(),
        genre: genre.trim(),
        duration,
        youtube_url: youtube_url?.trim() || null,
        spotify_url: spotify_url?.trim() || null,
        description: description.trim(),
        submitted_by: user.id,
        status: 'pending'
      })
      .select()
      .single()

    if (error) {
      logger.error('Database error creating submission', error)
      return NextResponse.json(
        createErrorResponse('Failed to submit track', 'Database error occurred', 'DATABASE_ERROR'),
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Track submitted successfully',
      submission: data
    })
  } catch (error) {
    logger.error('Unexpected error creating submission', error instanceof Error ? error : String(error))
    return NextResponse.json(
      createErrorResponse('Internal server error', 'An unexpected error occurred', 'INTERNAL_ERROR'),
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const logger = createLogger('api:submissions')
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const isAdmin = searchParams.get('admin') === 'true'

    let query = supabase
      .from('track_submissions')
      .select('*')

    if (isAdmin) {
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (!userProfile || userProfile.role !== 'admin') {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
      }
    } else {
      query = query.eq('submitted_by', user.id)
    }

    if (status) {
      query = query.eq('status', status)
    }

    query = query.order('created_at', { ascending: false })

    const { data, error } = await query

    if (error) {
      logger.error('Database error fetching submissions', error)
      return NextResponse.json(
        createErrorResponse('Failed to fetch submissions', 'Database error occurred', 'DATABASE_ERROR'),
        { status: 500 }
      )
    }

    return NextResponse.json({ submissions: data })
  } catch (error) {
    logger.error('Unexpected error fetching submissions', error instanceof Error ? error : String(error))
    return NextResponse.json(
      createErrorResponse('Internal server error', 'An unexpected error occurred', 'INTERNAL_ERROR'),
      { status: 500 }
    )
  }
}
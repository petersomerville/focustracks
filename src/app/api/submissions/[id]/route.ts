import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'
import type { Track } from '@/lib/supabase'
import { createLogger } from '@/lib/logger'
import { updateSubmissionSchema, createErrorResponse, formatZodErrors } from '@/lib/api-schemas'

// Function to create admin client with service role for bypassing RLS
function createSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing required Supabase environment variables')
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const logger = createLogger('api:submissions:id')
  try {
    const { id } = await params

    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 })
    }

    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userProfile || userProfile.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    
    // Validate request body using Zod schema
    const validation = updateSubmissionSchema.safeParse(body)
    if (!validation.success) {
      logger.warn('Invalid submission update request', {
        errors: validation.error.issues
      })
      return NextResponse.json(
        formatZodErrors(validation.error),
        { status: 400 }
      )
    }

    const { status, admin_notes } = validation.data

    const { data: submission, error: fetchError } = await supabase
      .from('track_submissions')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !submission) {
      return NextResponse.json(
        createErrorResponse('Submission not found', 'The requested submission does not exist', 'NOT_FOUND'),
        { status: 404 }
      )
    }

    if (submission.status !== 'pending') {
      return NextResponse.json(
        createErrorResponse('Submission already processed', 'This submission has already been reviewed', 'ALREADY_PROCESSED'),
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('track_submissions')
      .update({
        status,
        admin_notes: admin_notes || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      logger.error('Database error updating submission', { error })
      return NextResponse.json(
        createErrorResponse('Failed to update submission', 'Database error occurred', 'DATABASE_ERROR'),
        { status: 500 }
      )
    }

    if (status === 'approved') {
      // Prepare track data for insertion with backward compatibility
      const trackData: Partial<Track> & { audio_url?: string } = {
        title: submission.title,
        artist: submission.artist,
        genre: submission.genre,
        duration: submission.duration,
        youtube_url: submission.youtube_url || null,
        spotify_url: submission.spotify_url || null
      }

      // Also populate audio_url for backward compatibility (prefer youtube, fallback to spotify)
      if (submission.youtube_url) {
        trackData.audio_url = submission.youtube_url
      } else if (submission.spotify_url) {
        trackData.audio_url = submission.spotify_url
      }

      logger.info('Preparing to insert track from approved submission', { trackTitle: trackData.title, artist: trackData.artist })

      const supabaseAdmin = createSupabaseAdmin()
      const { data: insertedTrack, error: trackError } = await supabaseAdmin
        .from('tracks')
        .insert(trackData)
        .select()

      if (trackError) {
        logger.error('Failed to create track from submission', { error: trackError, trackData })
        return NextResponse.json(
          createErrorResponse('Submission approved but failed to create track', trackError.message, 'TRACK_CREATION_ERROR'),
          { status: 500 }
        )
      }

      logger.info('Successfully created track from submission', { trackId: insertedTrack?.[0]?.id })
    }

    return NextResponse.json({
      message: `Submission ${status}`,
      submission: data
    })
  } catch (error) {
    logger.error('Unexpected error in submission update', { error: error instanceof Error ? error : String(error) })
    return NextResponse.json(
      createErrorResponse('Internal server error', 'An unexpected error occurred', 'INTERNAL_ERROR'),
      { status: 500 }
    )
  }
}
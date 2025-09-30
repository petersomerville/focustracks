import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { TrackSubmission as _TrackSubmission } from '@/lib/supabase'
import { createSubmissionSchema, createErrorResponse, formatZodErrors } from '@/lib/api-schemas'
import { createLogger } from '@/lib/logger'

// Create a server-side Supabase client with service role for admin operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const getSupabaseClient = (token?: string) => {
  if (token) {
    // For regular authenticated requests, use the user's token
    return createClient(supabaseUrl, supabaseServiceKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    })
  }
  // For server-side operations, use service role key (bypasses RLS)
  return createClient(supabaseUrl, supabaseServiceKey)
}

export async function POST(request: NextRequest) {
  const logger = createLogger('api:submissions')
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const supabase = getSupabaseClient(token)
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
    // Use service role client to bypass RLS for admin check
  const adminClient = getSupabaseClient()

    const { data: { user }, error: authError } = await adminClient.auth.getUser(token)

    if (authError || !user) {
      logger.warn('Auth error in GET submissions', { authError })
      return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const isAdmin = searchParams.get('admin') === 'true'

    let query = adminClient
      .from('track_submissions')
      .select('*')

    if (isAdmin) {
      // Use admin client to bypass RLS and check user role
      const { data: userProfile, error: profileError } = await adminClient
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      logger.debug('Admin role check', { userId: user.id, userProfile, profileError })

      if (profileError) {
        logger.error('Error fetching user profile', profileError)
        return NextResponse.json({ error: 'Failed to verify admin status' }, { status: 500 })
      }

      if (!userProfile || userProfile.role !== 'admin') {
        logger.warn('Non-admin user attempted admin access', { userId: user.id, role: userProfile?.role })
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
      }

      // Admin can see all submissions
    } else {
      // Regular users can only see their own submissions
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
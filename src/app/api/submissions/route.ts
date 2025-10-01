import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { TrackSubmission as _TrackSubmission } from '@/lib/supabase'
import { createSubmissionSchema, createErrorResponse, formatZodErrors } from '@/lib/api-schemas'
import { createLogger } from '@/lib/logger'

// Create a server-side Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// For regular authenticated requests with user token - use anon key
const getUserClient = (token: string) => {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  })
}

// For admin operations that need to bypass RLS - use service role key
const getAdminClient = () => {
  if (!supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for admin operations')
  }
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
    const supabase = getUserClient(token)
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
    const userClient = getUserClient(token)

    // Verify user authentication first with user client
    const { data: { user }, error: authError } = await userClient.auth.getUser(token)

    if (authError || !user) {
      logger.warn('Auth error in GET submissions', { authError })
      return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const isAdmin = searchParams.get('admin') === 'true'

    if (isAdmin) {
      // For admin requests, verify role and use admin client to bypass RLS
      try {
        const adminClient = getAdminClient()

        // Check user role using admin client
        const { data: userProfile, error: profileError } = await adminClient
          .from('user_profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        logger.debug('Admin role check', { userId: user.id, userProfile, profileError })

        if (profileError) {
          logger.error('Error fetching user profile', { error: profileError })
          return NextResponse.json({ error: 'Failed to verify admin status' }, { status: 500 })
        }

        if (!userProfile || userProfile.role !== 'admin') {
          logger.warn('Non-admin user attempted admin access', { userId: user.id, role: userProfile?.role })
          return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
        }

        // Admin can see all submissions - use admin client
        let query = adminClient
          .from('track_submissions')
          .select('*')

        if (status) {
          query = query.eq('status', status)
        }

        query = query.order('created_at', { ascending: false })

        const { data, error } = await query

        if (error) {
          logger.error('Database error fetching admin submissions', error)
          return NextResponse.json(
            createErrorResponse('Failed to fetch submissions', 'Database error occurred', 'DATABASE_ERROR'),
            { status: 500 }
          )
        }

        return NextResponse.json({ submissions: data })
      } catch (error) {
        // If service role key is not available, return error
        if (error instanceof Error && error.message.includes('SUPABASE_SERVICE_ROLE_KEY')) {
          logger.error('Service role key not configured for admin operations')
          return NextResponse.json({ error: 'Admin operations not available' }, { status: 503 })
        }
        throw error
      }
    } else {
      // Regular users can only see their own submissions - use user client
      let query = userClient
        .from('track_submissions')
        .select('*')
        .eq('submitted_by', user.id)

      if (status) {
        query = query.eq('status', status)
      }

      query = query.order('created_at', { ascending: false })

      const { data, error } = await query

      if (error) {
        logger.error('Database error fetching user submissions', error)
        return NextResponse.json(
          createErrorResponse('Failed to fetch submissions', 'Database error occurred', 'DATABASE_ERROR'),
          { status: 500 }
        )
      }

      return NextResponse.json({ submissions: data })
    }
  } catch (error) {
    logger.error('Unexpected error fetching submissions', error instanceof Error ? error : String(error))
    return NextResponse.json(
      createErrorResponse('Internal server error', 'An unexpected error occurred', 'INTERNAL_ERROR'),
      { status: 500 }
    )
  }
}
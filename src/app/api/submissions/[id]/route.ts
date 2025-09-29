import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'
import type { Track } from '@/lib/supabase'

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
    const { status, admin_notes } = body

    if (!['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const { data: submission, error: fetchError } = await supabase
      .from('track_submissions')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    if (submission.status !== 'pending') {
      return NextResponse.json({ error: 'Submission already processed' }, { status: 400 })
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
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to update submission' }, { status: 500 })
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

      console.log('Inserting track data:', trackData)

      const supabaseAdmin = createSupabaseAdmin()
      const { data: insertedTrack, error: trackError } = await supabaseAdmin
        .from('tracks')
        .insert(trackData)
        .select()

      if (trackError) {
        console.error('Failed to create track:', trackError)
        console.error('Track data that failed:', trackData)
        return NextResponse.json({
          error: 'Submission approved but failed to create track',
          details: trackError.message
        }, { status: 500 })
      }

      console.log('Successfully created track:', insertedTrack)
    }

    return NextResponse.json({
      message: `Submission ${status}`,
      submission: data
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
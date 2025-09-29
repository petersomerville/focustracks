import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
      .eq('id', params.id)
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
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to update submission' }, { status: 500 })
    }

    if (status === 'approved') {
      const { error: trackError } = await supabase
        .from('tracks')
        .insert({
          title: submission.title,
          artist: submission.artist,
          genre: submission.genre,
          duration: submission.duration,
          youtube_url: submission.youtube_url,
          spotify_url: submission.spotify_url
        })

      if (trackError) {
        console.error('Failed to create track:', trackError)
        return NextResponse.json({
          error: 'Submission approved but failed to create track'
        }, { status: 500 })
      }
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
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { trackId } = await request.json()

    if (!trackId) {
      return NextResponse.json({ error: 'Track ID is required' }, { status: 400 })
    }

    // Check if playlist belongs to user
    const { data: playlist, error: playlistError } = await supabase
      .from('playlists')
      .select('id')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (playlistError || !playlist) {
      return NextResponse.json({ error: 'Playlist not found' }, { status: 404 })
    }

    // Get next position
    const { data: lastTrack, error: positionError } = await supabase
      .from('playlist_tracks')
      .select('position')
      .eq('playlist_id', params.id)
      .order('position', { ascending: false })
      .limit(1)
      .single()

    const nextPosition = lastTrack ? lastTrack.position + 1 : 1

    const { data: playlistTrack, error } = await supabase
      .from('playlist_tracks')
      .insert({
        playlist_id: params.id,
        track_id: trackId,
        position: nextPosition
      })
      .select()
      .single()

    if (error) {
      console.error('Error adding track to playlist:', error)
      return NextResponse.json({ error: 'Failed to add track to playlist' }, { status: 500 })
    }

    return NextResponse.json({ playlistTrack })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const trackId = searchParams.get('trackId')

    if (!trackId) {
      return NextResponse.json({ error: 'Track ID is required' }, { status: 400 })
    }

    // Check if playlist belongs to user
    const { data: playlist, error: playlistError } = await supabase
      .from('playlists')
      .select('id')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (playlistError || !playlist) {
      return NextResponse.json({ error: 'Playlist not found' }, { status: 404 })
    }

    const { error } = await supabase
      .from('playlist_tracks')
      .delete()
      .eq('playlist_id', params.id)
      .eq('track_id', trackId)

    if (error) {
      console.error('Error removing track from playlist:', error)
      return NextResponse.json({ error: 'Failed to remove track from playlist' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

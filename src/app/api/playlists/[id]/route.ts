import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: playlist, error: playlistError } = await supabase
      .from('playlists')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (playlistError) {
      console.error('Error fetching playlist:', playlistError)
      return NextResponse.json({ error: 'Playlist not found' }, { status: 404 })
    }

    const { data: tracks, error: tracksError } = await supabase
      .from('playlist_tracks')
      .select(`
        *,
        tracks (*)
      `)
      .eq('playlist_id', params.id)
      .order('position')

    if (tracksError) {
      console.error('Error fetching playlist tracks:', tracksError)
      return NextResponse.json({ error: 'Failed to fetch playlist tracks' }, { status: 500 })
    }

    return NextResponse.json({ 
      playlist: {
        ...playlist,
        tracks: tracks.map(pt => pt.tracks)
      }
    })
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

    const { error } = await supabase
      .from('playlists')
      .delete()
      .eq('id', params.id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting playlist:', error)
      return NextResponse.json({ error: 'Failed to delete playlist' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const genre = searchParams.get('genre')
    const search = searchParams.get('search')

    const supabase = await createServerSupabaseClient()
    let query = supabase.from('tracks').select('*')

    // Apply genre filter if provided
    if (genre && genre !== 'All') {
      query = query.eq('genre', genre)
    }

    // Apply search filter if provided
    if (search) {
      query = query.or(`title.ilike.%${search}%,artist.ilike.%${search}%`)
    }

    const { data: tracks, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching tracks:', error)
      return NextResponse.json({ error: 'Failed to fetch tracks' }, { status: 500 })
    }

    return NextResponse.json({ tracks })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

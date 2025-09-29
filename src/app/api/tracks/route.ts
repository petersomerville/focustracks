import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const genre = searchParams.get('genre')
    const search = searchParams.get('search')

    let query = supabase.from('tracks').select('*')

    // Apply genre filter if provided
    if (genre && genre !== 'All') {
      query = query.eq('genre', genre)
    }

    // Apply search filter if provided
    if (search) {
      query = query.or(`title.ilike.%${search}%,artist.ilike.%${search}%`)
    }

    // Sort by created_at descending (newest first)
    query = query.order('created_at', { ascending: false })

    const { data: tracks, error } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch tracks' }, { status: 500 })
    }

    return NextResponse.json({ tracks: tracks || [] })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

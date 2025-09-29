import { NextRequest, NextResponse } from 'next/server'
import { Playlist } from '@/lib/supabase'
import { MOCK_PLAYLISTS, addPlaylist, getNextPlaylistId } from '@/lib/mockData'
import { createLogger } from '@/lib/logger'

export async function GET(_request: NextRequest) {
  const logger = createLogger('api:playlists')
  try {
    // For Phase 2, return mock playlists for demo user
    // In real implementation, this would check authentication
    const userPlaylists = MOCK_PLAYLISTS.filter(playlist => playlist.user_id === 'demo-user-1')

    return NextResponse.json({ playlists: userPlaylists })
  } catch (error) {
    logger.error('Unexpected error fetching playlists', error instanceof Error ? error : String(error))
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const logger = createLogger('api:playlists')
  try {
    const { name } = await request.json()

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: 'Playlist name is required' }, { status: 400 })
    }

    // Create new playlist with mock data
    const newPlaylist: Playlist = {
      id: getNextPlaylistId(),
      name: name.trim(),
      user_id: 'demo-user-1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    addPlaylist(newPlaylist)

    return NextResponse.json({ playlist: newPlaylist })
  } catch (error) {
    logger.error('Unexpected error creating playlist', error instanceof Error ? error : String(error))
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Note: Mock data is now managed in /lib/mockData.ts for shared access

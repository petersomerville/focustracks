import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Client-side Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Track {
  id: string
  title: string
  artist: string
  genre: string
  duration: number
  youtube_url?: string
  spotify_url?: string
  external_id?: string
  created_at: string
}

export interface Playlist {
  id: string
  name: string
  user_id: string
  created_at: string
  updated_at: string
}

export interface PlaylistTrack {
  id: string
  playlist_id: string
  track_id: string
  position: number
}

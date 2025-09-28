import { Playlist, PlaylistTrack } from './supabase'

// Global store for mock data that persists across module reloads
declare global {
  var __FOCUSTRACKS_MOCK_PLAYLISTS: Playlist[] | undefined
  var __FOCUSTRACKS_MOCK_PLAYLIST_TRACKS: PlaylistTrack[] | undefined
}

// Initialize or get existing mock data
if (!global.__FOCUSTRACKS_MOCK_PLAYLISTS) {
  global.__FOCUSTRACKS_MOCK_PLAYLISTS = [
    {
      id: '1',
      name: 'Focus Deep Work',
      user_id: 'demo-user-1',
      created_at: '2024-01-20T10:00:00Z',
      updated_at: '2024-01-20T10:00:00Z'
    },
    {
      id: '2',
      name: 'Study Session',
      user_id: 'demo-user-1',
      created_at: '2024-01-19T15:30:00Z',
      updated_at: '2024-01-19T15:30:00Z'
    }
  ]
}

if (!global.__FOCUSTRACKS_MOCK_PLAYLIST_TRACKS) {
  global.__FOCUSTRACKS_MOCK_PLAYLIST_TRACKS = [
    {
      id: '1',
      playlist_id: '1',
      track_id: '1',
      position: 1
    },
    {
      id: '2',
      playlist_id: '1',
      track_id: '3',
      position: 2
    },
    {
      id: '3',
      playlist_id: '2',
      track_id: '2',
      position: 1
    }
  ]
}

// Export references to the global data
export const MOCK_PLAYLISTS = global.__FOCUSTRACKS_MOCK_PLAYLISTS
export const MOCK_PLAYLIST_TRACKS = global.__FOCUSTRACKS_MOCK_PLAYLIST_TRACKS

// Helper functions to manage the shared data
export function addPlaylist(playlist: Playlist) {
  MOCK_PLAYLISTS.push(playlist)
}

export function removePlaylist(id: string) {
  const index = MOCK_PLAYLISTS.findIndex(p => p.id === id)
  if (index !== -1) {
    MOCK_PLAYLISTS.splice(index, 1)
    // Also remove all tracks for this playlist
    const tracksToRemove = MOCK_PLAYLIST_TRACKS.filter(pt => pt.playlist_id === id)
    tracksToRemove.forEach(track => {
      const trackIndex = MOCK_PLAYLIST_TRACKS.findIndex(pt => pt.id === track.id)
      if (trackIndex !== -1) {
        MOCK_PLAYLIST_TRACKS.splice(trackIndex, 1)
      }
    })
  }
}

export function addPlaylistTrack(playlistTrack: PlaylistTrack) {
  MOCK_PLAYLIST_TRACKS.push(playlistTrack)
}

export function removePlaylistTrack(playlistId: string, trackId: string) {
  const index = MOCK_PLAYLIST_TRACKS.findIndex(
    pt => pt.playlist_id === playlistId && pt.track_id === trackId
  )
  if (index !== -1) {
    MOCK_PLAYLIST_TRACKS.splice(index, 1)
  }
}

export function getNextPlaylistId(): string {
  const maxId = Math.max(...MOCK_PLAYLISTS.map(p => parseInt(p.id)), 0)
  return (maxId + 1).toString()
}

export function getNextPlaylistTrackId(): string {
  const maxId = Math.max(...MOCK_PLAYLIST_TRACKS.map(pt => parseInt(pt.id)), 0)
  return (maxId + 1).toString()
}
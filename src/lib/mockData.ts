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

export function updatePlaylist(id: string, updates: Partial<Pick<Playlist, 'name'>>): Playlist {
  const index = MOCK_PLAYLISTS.findIndex(p => p.id === id)
  if (index === -1) {
    throw new Error('Playlist not found')
  }
  
  const updatedPlaylist = {
    ...MOCK_PLAYLISTS[index],
    ...updates,
    updated_at: new Date().toISOString()
  }
  
  MOCK_PLAYLISTS[index] = updatedPlaylist
  return updatedPlaylist
}

export function addTrackToPlaylist(playlistId: string, trackId: string): PlaylistTrack {
  // Check if track is already in playlist
  const existingTrack = MOCK_PLAYLIST_TRACKS.find(
    pt => pt.playlist_id === playlistId && pt.track_id === trackId
  )
  
  if (existingTrack) {
    throw new Error('Track already in playlist')
  }
  
  // Get the next position (highest position + 1)
  const playlistTracks = MOCK_PLAYLIST_TRACKS.filter(pt => pt.playlist_id === playlistId)
  const maxPosition = Math.max(...playlistTracks.map(pt => pt.position), 0)
  
  const newPlaylistTrack: PlaylistTrack = {
    id: getNextPlaylistTrackId(),
    playlist_id: playlistId,
    track_id: trackId,
    position: maxPosition + 1
  }
  
  MOCK_PLAYLIST_TRACKS.push(newPlaylistTrack)
  return newPlaylistTrack
}

export function removeTrackFromPlaylist(playlistId: string, trackId: string): void {
  const index = MOCK_PLAYLIST_TRACKS.findIndex(
    pt => pt.playlist_id === playlistId && pt.track_id === trackId
  )
  
  if (index === -1) {
    throw new Error('Track not found in playlist')
  }
  
  MOCK_PLAYLIST_TRACKS.splice(index, 1)
  
  // Reorder remaining tracks to fill gaps
  const playlistTracks = MOCK_PLAYLIST_TRACKS.filter(pt => pt.playlist_id === playlistId)
  playlistTracks.sort((a, b) => a.position - b.position)
  
  playlistTracks.forEach((track, index) => {
    track.position = index + 1
  })
}

export function reorderPlaylistTracks(playlistId: string, trackId: string, newPosition: number): PlaylistTrack[] {
  const playlistTracks = MOCK_PLAYLIST_TRACKS.filter(pt => pt.playlist_id === playlistId)
  const trackToMove = playlistTracks.find(pt => pt.track_id === trackId)
  
  if (!trackToMove) {
    throw new Error('Track not found in playlist')
  }
  
  // Remove the track from its current position
  const currentIndex = MOCK_PLAYLIST_TRACKS.findIndex(pt => pt.id === trackToMove.id)
  MOCK_PLAYLIST_TRACKS.splice(currentIndex, 1)
  
  // Update positions of other tracks
  playlistTracks.forEach(track => {
    if (track.id !== trackToMove.id) {
      if (track.position > trackToMove.position && track.position <= newPosition) {
        track.position -= 1
      } else if (track.position < trackToMove.position && track.position >= newPosition) {
        track.position += 1
      }
    }
  })
  
  // Set new position for the moved track
  trackToMove.position = newPosition
  
  // Re-insert the track
  MOCK_PLAYLIST_TRACKS.push(trackToMove)
  
  // Sort all playlist tracks by position
  MOCK_PLAYLIST_TRACKS.sort((a, b) => {
    if (a.playlist_id !== b.playlist_id) {
      return a.playlist_id.localeCompare(b.playlist_id)
    }
    return a.position - b.position
  })
  
  return MOCK_PLAYLIST_TRACKS.filter(pt => pt.playlist_id === playlistId)
}
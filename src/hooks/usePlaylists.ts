import { useState, useEffect } from 'react'
import { Playlist } from '@/lib/supabase'

export function usePlaylists() {
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPlaylists = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch('/api/playlists')
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch playlists')
        }

        setPlaylists(data.playlists)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchPlaylists()
  }, [])

  const createPlaylist = async (name: string) => {
    try {
      const response = await fetch('/api/playlists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create playlist')
      }

      setPlaylists(prev => [data.playlist, ...prev])
      return { success: true, playlist: data.playlist }
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'An error occurred' 
      }
    }
  }

  const addTrackToPlaylist = async (playlistId: string, trackId: string) => {
    try {
      const response = await fetch(`/api/playlists/${playlistId}/tracks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ trackId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add track to playlist')
      }

      return { success: true }
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'An error occurred'
      }
    }
  }

  const deletePlaylist = async (playlistId: string) => {
    try {
      const response = await fetch(`/api/playlists/${playlistId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete playlist')
      }

      setPlaylists(prev => prev.filter(playlist => playlist.id !== playlistId))
      return { success: true }
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'An error occurred'
      }
    }
  }

  return { playlists, loading, error, createPlaylist, addTrackToPlaylist, deletePlaylist }
}

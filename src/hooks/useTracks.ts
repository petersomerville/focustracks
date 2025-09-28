import { useState, useEffect } from 'react'
import { Track } from '@/lib/supabase'

interface UseTracksOptions {
  genre?: string
  search?: string
}

export function useTracks({ genre, search }: UseTracksOptions = {}) {
  const [tracks, setTracks] = useState<Track[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTracks = async () => {
      try {
        setLoading(true)
        setError(null)

        const params = new URLSearchParams()
        if (genre && genre !== 'All') params.append('genre', genre)
        if (search) params.append('search', search)

        const response = await fetch(`/api/tracks?${params.toString()}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch tracks')
        }

        setTracks(data.tracks)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchTracks()
  }, [genre, search])

  return { tracks, loading, error }
}

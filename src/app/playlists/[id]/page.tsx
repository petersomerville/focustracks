'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Header from '@/components/Header'
import ProtectedRoute from '@/components/ProtectedRoute'
import TrackCard from '@/components/TrackCard'
import YouTubePlayer from '@/components/YouTubePlayer'
import { Track, Playlist } from '@/lib/supabase'
import { ArrowLeft, Trash2, Music } from 'lucide-react'
import { createLogger } from '@/lib/logger'

export default function PlaylistDetailPage() {
  const logger = createLogger('PlaylistDetailPage')
  const params = useParams()
  const router = useRouter()
  const playlistId = params.id as string

  const [playlist, setPlaylist] = useState<Playlist & { tracks: Track[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingTrack, setDeletingTrack] = useState<string | null>(null)

  // Player state
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(50)

  const fetchPlaylist = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/playlists/${playlistId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch playlist')
      }

      setPlaylist(data.playlist)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [playlistId])

  useEffect(() => {
    if (playlistId) {
      fetchPlaylist()
    }
  }, [playlistId, fetchPlaylist])

  const handleRemoveTrack = async (trackId: string) => {
    if (!playlist) return

    try {
      setDeletingTrack(trackId)
      const response = await fetch(`/api/playlists/${playlistId}/tracks?trackId=${trackId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        // Update the playlist state to remove the track
        setPlaylist(prev => {
          if (!prev) return null
          return {
            ...prev,
            tracks: prev.tracks.filter(track => track.id !== trackId)
          }
        })

        // If the removed track was currently playing, stop playback
        if (currentTrack?.id === trackId) {
          setCurrentTrack(null)
          setIsPlaying(false)
        }
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to remove track from playlist')
      }
    } catch (error) {
      logger.error('Error removing track from playlist', error instanceof Error ? error : String(error))
      alert('Failed to remove track from playlist')
    } finally {
      setDeletingTrack(null)
    }
  }

  const handlePlay = (track: Track) => {
    setCurrentTrack(track)
    setIsPlaying(true)
  }

  const handlePause = () => {
    setIsPlaying(false)
  }

  const handleResume = () => {
    setIsPlaying(true)
  }

  const handleSkipBack = () => {
    // YouTube player will handle this
  }

  const handleSkipForward = () => {
    // YouTube player will handle this
  }

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume)
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Back Button */}
          <button
            onClick={() => router.push('/playlists')}
            className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Playlists</span>
          </button>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600 dark:text-gray-400">Loading playlist...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-8">
              <p className="text-red-600 dark:text-red-400">Error: {error}</p>
            </div>
          )}

          {/* Playlist Content */}
          {!loading && !error && playlist && (
            <>
              {/* Playlist Header */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-6 mb-8">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      <Music className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                        {playlist.name}
                      </h1>
                      <p className="text-gray-600 dark:text-gray-400 mt-1">
                        {playlist.tracks.length} {playlist.tracks.length === 1 ? 'track' : 'tracks'}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                        Created {new Date(playlist.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tracks List */}
              {playlist.tracks.length > 0 ? (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    Tracks
                  </h2>
                  {playlist.tracks.map((track) => (
                    <div key={track.id} className="relative">
                      <TrackCard
                        track={track}
                        isPlaying={currentTrack?.id === track.id && isPlaying}
                        onPlay={handlePlay}
                        onPause={handlePause}
                      />
                      {/* Remove from Playlist Button */}
                      <button
                        onClick={() => handleRemoveTrack(track.id)}
                        disabled={deletingTrack === track.id}
                        className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors disabled:opacity-50"
                        title="Remove from playlist"
                      >
                        {deletingTrack === track.id ? (
                          <div className="h-4 w-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Music className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    No tracks in this playlist
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Add tracks to this playlist from the main music page
                  </p>
                  <button
                    onClick={() => router.push('/')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Browse Tracks
                  </button>
                </div>
              )}
            </>
          )}
        </main>

        {/* YouTube Player */}
        {currentTrack && (
          <YouTubePlayer
            track={currentTrack}
            isPlaying={isPlaying}
            onPlay={handleResume}
            onPause={handlePause}
            onSkipBack={handleSkipBack}
            onSkipForward={handleSkipForward}
            onVolumeChange={handleVolumeChange}
            volume={volume}
          />
        )}
      </div>
    </ProtectedRoute>
  )
}
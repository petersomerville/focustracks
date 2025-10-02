'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Header from '@/components/Header'
import ProtectedRoute from '@/components/ProtectedRoute'
import TrackCard from '@/components/TrackCard'
import YouTubePlayer from '@/components/YouTubePlayer'
import LoadingSpinner from '@/components/LoadingSpinner'
import ErrorMessage from '@/components/ErrorMessage'
import { Track, Playlist } from '@/lib/supabase'
import { ArrowLeft, Trash2, Music, Repeat } from 'lucide-react'
import { createLogger } from '@/lib/logger'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

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
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(-1)
  const [playlistMode, setPlaylistMode] = useState<'single' | 'sequential'>('single')

  const fetchPlaylist = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/playlists/${playlistId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch playlist')
      }

      // API returns { success: true, data: { playlist: ... } }
      const playlist = data.data?.playlist || data.playlist
      setPlaylist(playlist)
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
      const response = await fetch(`/api/playlists/${playlistId}/tracks?track_id=${trackId}`, {
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
      logger.error('Error removing track from playlist', { error: error instanceof Error ? error : String(error) })
      alert('Failed to remove track from playlist')
    } finally {
      setDeletingTrack(null)
    }
  }

  const handlePlay = (track: Track) => {
    const trackIndex = playlist?.tracks.findIndex(t => t.id === track.id) ?? -1
    setCurrentTrack(track)
    setCurrentTrackIndex(trackIndex)
    setIsPlaying(true)
  }

  const handlePause = () => {
    setIsPlaying(false)
  }

  const handleResume = () => {
    setIsPlaying(true)
  }

  const handleSkipBack = () => {
    if (!playlist || currentTrackIndex <= 0) return
    
    const prevTrack = playlist.tracks[currentTrackIndex - 1]
    setCurrentTrack(prevTrack)
    setCurrentTrackIndex(currentTrackIndex - 1)
    setIsPlaying(true)
  }

  const handleSkipForward = () => {
    if (!playlist || !playlist.tracks || currentTrackIndex >= playlist.tracks.length - 1) return
    
    const nextTrack = playlist.tracks[currentTrackIndex + 1]
    setCurrentTrack(nextTrack)
    setCurrentTrackIndex(currentTrackIndex + 1)
    setIsPlaying(true)
  }

  const handleTrackEnd = () => {
    if (playlistMode === 'sequential' && playlist && playlist.tracks && currentTrackIndex < playlist.tracks.length - 1) {
      // Auto-play next track in sequential mode
      const nextTrack = playlist.tracks[currentTrackIndex + 1]
      setCurrentTrack(nextTrack)
      setCurrentTrackIndex(currentTrackIndex + 1)
      setIsPlaying(true)
    } else {
      // Stop playback at end of playlist or in single mode
      setIsPlaying(false)
    }
  }

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume)
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Header />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Back Button */}
          <Button
            onClick={() => router.push('/playlists')}
            variant="ghost"
            className="mb-6 -ml-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Playlists
          </Button>

          {/* Loading State */}
          {loading && (
            <div className="py-12">
              <LoadingSpinner size="lg" text="Loading playlist..." />
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="py-8">
              <ErrorMessage
                title="Failed to load playlist"
                message={error}
                variant="error"
              />
            </div>
          )}

          {/* Playlist Content */}
          {!loading && !error && playlist && (
            <>
              {/* Playlist Header */}
              <Card className="mb-8">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                        <Music className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h1 className="text-3xl font-bold text-foreground">
                          {playlist.name}
                        </h1>
                        <p className="text-muted-foreground mt-1">
                          {playlist.tracks?.length || 0} {(playlist.tracks?.length || 0) === 1 ? 'track' : 'tracks'}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Created {new Date(playlist.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* Playlist Mode Toggle */}
                    {playlist.tracks && playlist.tracks.length > 0 && (
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-muted-foreground">Playback:</span>
                        <Button
                          onClick={() => setPlaylistMode(playlistMode === 'single' ? 'sequential' : 'single')}
                          variant={playlistMode === 'sequential' ? 'default' : 'outline'}
                          size="sm"
                          className="rounded-full"
                          title={playlistMode === 'single' ? 'Switch to sequential playback' : 'Switch to single track playback'}
                        >
                          {playlistMode === 'sequential' ? (
                            <>
                              <Repeat className="h-4 w-4 mr-1" />
                              Sequential
                            </>
                          ) : (
                            <>
                              <Music className="h-4 w-4 mr-1" />
                              Single
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Tracks List */}
              {playlist.tracks && playlist.tracks.length > 0 ? (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-foreground mb-4">
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
                      <Button
                        onClick={() => handleRemoveTrack(track.id)}
                        disabled={deletingTrack === track.id}
                        variant="ghost"
                        size="icon"
                        className="absolute top-4 right-4 text-muted-foreground hover:text-destructive"
                        title="Remove from playlist"
                      >
                        {deletingTrack === track.id ? (
                          <div className="h-4 w-4 border-2 border-destructive border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Music className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    No tracks in this playlist
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Add tracks to this playlist from the main music page
                  </p>
                  <Button onClick={() => router.push('/')}>
                    Browse Tracks
                  </Button>
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
            onTrackEnd={handleTrackEnd}
          />
        )}
      </div>
    </ProtectedRoute>
  )
}
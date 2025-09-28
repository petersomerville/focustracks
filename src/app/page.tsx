'use client'

import { useState } from 'react'
import Header from '@/components/Header'
import TrackCard from '@/components/TrackCard'
import YouTubePlayer from '@/components/YouTubePlayer'
import PlaylistSelectionModal from '@/components/PlaylistSelectionModal'
import ErrorMessage from '@/components/ErrorMessage'
import LoadingSpinner from '@/components/LoadingSpinner'
import { Button } from '@/components/ui/button'
import { Track } from '@/lib/supabase'
import { useTracks } from '@/hooks/useTracks'
import { toast } from 'sonner'

export default function Home() {
  const [selectedGenre, setSelectedGenre] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')

  const { tracks, loading, error } = useTracks({ 
    genre: selectedGenre, 
    search: searchQuery 
  })

  const [currentTrack, setCurrentTrack] = useState<Track | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(50)

  // Playlist modal state
  const [playlistModalOpen, setPlaylistModalOpen] = useState(false)
  const [trackToAdd, setTrackToAdd] = useState<Track | null>(null)

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

  const handleAddToPlaylist = (track: Track) => {
    setTrackToAdd(track)
    setPlaylistModalOpen(true)
  }

  const handlePlaylistModalClose = () => {
    setPlaylistModalOpen(false)
    setTrackToAdd(null)
  }

  const handlePlaylistAddSuccess = () => {
    toast.success('Track added to playlist!', {
      description: 'The track has been successfully added to your playlist.'
    })
  }

  const handleGenreFilter = (genre: string) => {
    setSelectedGenre(genre)
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
  }

  return (
    <div className="min-h-screen bg-background">
      <Header onSearch={handleSearch} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Music for Focus & Productivity
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover curated tracks designed to enhance your concentration and help you stay focused during work and study sessions.
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2 mb-8 justify-center">
          {['All', 'Ambient', 'Classical', 'Electronic'].map((category) => (
            <Button
              key={category}
              onClick={() => handleGenreFilter(category)}
              variant={selectedGenre === category ? "default" : "outline"}
              size="sm"
              className="rounded-full"
            >
              {category}
            </Button>
          ))}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="py-12">
            <LoadingSpinner size="lg" text="Loading tracks..." />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="py-8">
            <ErrorMessage
              title="Failed to load tracks"
              message={error}
              variant="error"
            />
          </div>
        )}

        {/* Tracks Grid */}
        {!loading && !error && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tracks.length > 0 ? (
              tracks.map((track) => (
                <TrackCard
                  key={track.id}
                  track={track}
                  isPlaying={currentTrack?.id === track.id && isPlaying}
                  onPlay={handlePlay}
                  onPause={handlePause}
                  onAddToPlaylist={handleAddToPlaylist}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-8">
                <p className="text-muted-foreground">No tracks found matching your criteria.</p>
              </div>
            )}
          </div>
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

      {/* Playlist Selection Modal */}
      <PlaylistSelectionModal
        isOpen={playlistModalOpen}
        track={trackToAdd}
        onClose={handlePlaylistModalClose}
        onSuccess={handlePlaylistAddSuccess}
      />
    </div>
  )
}

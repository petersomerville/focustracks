'use client'

import { useState } from 'react'
import Header from '@/components/Header'
import TrackCard from '@/components/TrackCard'
import YouTubePlayer from '@/components/YouTubePlayer'
import { Track } from '@/lib/supabase'
import { useTracks } from '@/hooks/useTracks'

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
    // TODO: Implement add to playlist logic
    console.log('Add to playlist:', track.title)
  }

  const handleGenreFilter = (genre: string) => {
    setSelectedGenre(genre)
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header onSearch={handleSearch} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Music for Focus & Productivity
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Discover curated tracks designed to enhance your concentration and help you stay focused during work and study sessions.
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2 mb-8 justify-center">
          {['All', 'Ambient', 'Classical', 'Electronic'].map((category) => (
            <button
              key={category}
              onClick={() => handleGenreFilter(category)}
              className={`px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
                selectedGenre === category
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Loading tracks...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-8">
            <p className="text-red-600 dark:text-red-400">Error: {error}</p>
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
                <p className="text-gray-600 dark:text-gray-400">No tracks found matching your criteria.</p>
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
    </div>
  )
}

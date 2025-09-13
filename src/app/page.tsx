'use client'

import { useState } from 'react'
import Header from '@/components/Header'
import TrackCard from '@/components/TrackCard'
import MusicPlayer from '@/components/MusicPlayer'
import { Track } from '@/lib/supabase'

// Mock data for development
const mockTracks: Track[] = [
  {
    id: '1',
    title: 'Deep Focus',
    artist: 'Ambient Collective',
    genre: 'Ambient',
    duration: 180,
    audio_url: '/audio/deep-focus.mp3',
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    title: 'Study Session',
    artist: 'Concentration Music',
    genre: 'Classical',
    duration: 240,
    audio_url: '/audio/study-session.mp3',
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '3',
    title: 'Coding Flow',
    artist: 'Electronic Focus',
    genre: 'Electronic',
    duration: 300,
    audio_url: '/audio/coding-flow.mp3',
    created_at: '2024-01-01T00:00:00Z'
  }
]

export default function Home() {
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

  const handleSkipBack = () => {
    // TODO: Implement skip back logic
  }

  const handleSkipForward = () => {
    // TODO: Implement skip forward logic
  }

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume)
  }

  const handleAddToPlaylist = (track: Track) => {
    // TODO: Implement add to playlist logic
    console.log('Add to playlist:', track.title)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Music for Focus & Productivity
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover curated tracks designed to enhance your concentration and help you stay focused during work and study sessions.
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2 mb-8 justify-center">
          {['All', 'Ambient', 'Classical', 'Electronic', 'Study', 'Work'].map((category) => (
            <button
              key={category}
              className="px-4 py-2 rounded-full border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
            >
              {category}
            </button>
          ))}
        </div>

        {/* Tracks Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {mockTracks.map((track) => (
            <TrackCard
              key={track.id}
              track={track}
              isPlaying={currentTrack?.id === track.id && isPlaying}
              onPlay={handlePlay}
              onPause={handlePause}
              onAddToPlaylist={handleAddToPlaylist}
            />
          ))}
        </div>
      </main>

      {/* Music Player */}
      <MusicPlayer
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        onPlay={() => setIsPlaying(true)}
        onPause={handlePause}
        onSkipBack={handleSkipBack}
        onSkipForward={handleSkipForward}
        onVolumeChange={handleVolumeChange}
        volume={volume}
      />
    </div>
  )
}

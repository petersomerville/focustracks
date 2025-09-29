'use client'

import { Play, Pause, SkipBack, SkipForward, Volume2 } from 'lucide-react'
import { Track } from '@/lib/supabase'

interface MusicPlayerProps {
  currentTrack: Track | null
  isPlaying: boolean
  onPlay: () => void
  onPause: () => void
  onSkipBack: () => void
  onSkipForward: () => void
  onVolumeChange: (volume: number) => void
  volume: number
}

export default function MusicPlayer({
  currentTrack,
  isPlaying,
  onPlay,
  onPause,
  onSkipBack,
  onSkipForward,
  onVolumeChange,
  volume
}: MusicPlayerProps) {
  if (!currentTrack) {
    return null
  }

  // Format duration utility - could be used for displaying track time
  // const formatDuration = (seconds: number) => {
  //   const mins = Math.floor(seconds / 60)
  //   const secs = seconds % 60
  //   return `${mins}:${secs.toString().padStart(2, '0')}`
  // }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center space-x-4">
          {/* Track Info */}
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-gray-900 truncate">
              {currentTrack.title}
            </h4>
            <p className="text-xs text-gray-600 truncate">
              {currentTrack.artist}
            </p>
          </div>

          {/* Controls */}
          <div className="flex items-center space-x-2">
            <button
              onClick={onSkipBack}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <SkipBack className="h-4 w-4" />
            </button>
            
            <button
              onClick={isPlaying ? onPause : onPlay}
              className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
            >
              {isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4 ml-0.5" />
              )}
            </button>
            
            <button
              onClick={onSkipForward}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <SkipForward className="h-4 w-4" />
            </button>
          </div>

          {/* Volume Control */}
          <div className="flex items-center space-x-2">
            <Volume2 className="h-4 w-4 text-gray-400" />
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => onVolumeChange(Number(e.target.value))}
              className="w-20"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

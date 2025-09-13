'use client'

import { Play, Pause, Plus } from 'lucide-react'
import { Track } from '@/lib/supabase'

interface TrackCardProps {
  track: Track
  isPlaying?: boolean
  onPlay: (track: Track) => void
  onPause: () => void
  onAddToPlaylist?: (track: Track) => void
}

export default function TrackCard({ 
  track, 
  isPlaying = false, 
  onPlay, 
  onPause, 
  onAddToPlaylist 
}: TrackCardProps) {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center space-x-4">
        {/* Play Button */}
        <button
          onClick={() => isPlaying ? onPause() : onPlay(track)}
          className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors"
        >
          {isPlaying ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5 ml-0.5" />
          )}
        </button>

        {/* Track Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-medium text-gray-900 truncate">
            {track.title}
          </h3>
          <p className="text-sm text-gray-600 truncate">
            {track.artist}
          </p>
          <div className="flex items-center space-x-2 mt-1">
            <span className="text-xs text-gray-500">{track.genre}</span>
            <span className="text-xs text-gray-400">•</span>
            <span className="text-xs text-gray-500">{formatDuration(track.duration)}</span>
          </div>
        </div>

        {/* Add to Playlist Button */}
        {onAddToPlaylist && (
          <button
            onClick={() => onAddToPlaylist(track)}
            className="flex-shrink-0 p-2 text-gray-400 hover:text-blue-600 transition-colors"
            title="Add to playlist"
          >
            <Plus className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}

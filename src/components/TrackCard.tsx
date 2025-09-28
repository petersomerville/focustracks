'use client'

import { Play, Pause, Plus } from 'lucide-react'
import { Track } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

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
  const { user } = useAuth()
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center space-x-4">
          {/* Play Button - Only show if YouTube URL is available */}
          {track.youtube_url && (
            <Button
              onClick={() => isPlaying ? onPause() : onPlay(track)}
              size="icon"
              className="flex-shrink-0 w-10 h-10 rounded-full"
            >
              {isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5 ml-0.5" />
              )}
            </Button>
          )}

          {/* Track Info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-medium text-foreground truncate">
              {track.title}
            </h3>
            <p className="text-sm text-muted-foreground truncate">
              {track.artist}
            </p>
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-xs text-muted-foreground">{track.genre}</span>
              <span className="text-xs text-muted-foreground/60">•</span>
              <span className="text-xs text-muted-foreground">{formatDuration(track.duration)}</span>
            </div>
          </div>

          {/* External Platform Links */}
          <div className="flex items-center space-x-2">
            {/* YouTube Link */}
            {track.youtube_url && (
              <a
                href={track.youtube_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 p-2 text-muted-foreground hover:text-red-600 transition-colors"
                title="Open in YouTube"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
            )}

            {/* Spotify Link */}
            {track.spotify_url && (
              <a
                href={track.spotify_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 p-2 text-muted-foreground hover:text-green-600 transition-colors"
                title="Open in Spotify"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z"/>
                </svg>
              </a>
            )}
          </div>

          {/* Add to Playlist Button */}
          {onAddToPlaylist && user && (
            <Button
              onClick={() => onAddToPlaylist(track)}
              variant="ghost"
              size="icon"
              className="flex-shrink-0"
              title="Add to playlist"
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { Track } from '@/lib/supabase'

interface YouTubePlayerProps {
  track: Track | null
  isPlaying: boolean
  onPlay: () => void
  onPause: () => void
  onSkipBack: () => void
  onSkipForward: () => void
  onVolumeChange: (volume: number) => void
  volume: number
}

export default function YouTubePlayer({
  track,
  isPlaying,
  onPlay,
  onPause,
  onSkipBack,
  onSkipForward,
  onVolumeChange,
  volume
}: YouTubePlayerProps) {
  const [player, setPlayer] = useState<YTPlayer | null>(null)
  const [isPlayerReady, setIsPlayerReady] = useState(false)

  // Extract YouTube video ID from URL
  const getYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = url.match(regExp)
    return (match && match[2].length === 11) ? match[2] : null
  }

  // Load YouTube API
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.YT) {
      const tag = document.createElement('script')
      tag.src = 'https://www.youtube.com/iframe_api'
      const firstScriptTag = document.getElementsByTagName('script')[0]
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)

      window.onYouTubeIframeAPIReady = () => {
        setIsPlayerReady(true)
      }
    } else if (window.YT) {
      setIsPlayerReady(true)
    }
  }, [])

  // Initialize player when ready
  useEffect(() => {
    if (isPlayerReady && typeof window !== 'undefined') {
      const newPlayer = new window.YT.Player('youtube-player', {
        height: '0',
        width: '0',
        host: 'https://www.youtube-nocookie.com',
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          enablejsapi: 1,
          fs: 0,
          iv_load_policy: 3,
          modestbranding: 1,
          playsinline: 1,
          rel: 0,
          origin: window.location.origin,
        },
        events: {
          onReady: (_event: YTEvent) => {
            console.log('YouTube player ready')
            setPlayer(newPlayer)
          },
          onStateChange: (event: YTEvent) => {
            if (event.data === window.YT.PlayerState.PLAYING) {
              console.log('YouTube player started playing')
            } else if (event.data === window.YT.PlayerState.PAUSED) {
              console.log('YouTube player paused')
            } else if (event.data === window.YT.PlayerState.ENDED) {
              console.log('YouTube player ended')
            }
          },
          onError: (event: YTEvent) => {
            console.error('YouTube player error:', event.data)
          }
        }
      })
    }
  }, [isPlayerReady])

  // Load track when track changes
  useEffect(() => {
    if (player && track && track.youtube_url) {
      const videoId = getYouTubeId(track.youtube_url)
      if (videoId) {
        console.log('Loading YouTube video:', videoId, 'for track:', track.title)
        try {
          player.loadVideoById(videoId)
        } catch (error) {
          console.error('Error loading YouTube video:', error)
        }
      } else {
        console.error('Could not extract video ID from URL:', track.youtube_url)
      }
    }
  }, [player, track])

  // Control playback
  useEffect(() => {
    if (player) {
      if (isPlaying) {
        player.playVideo()
      } else {
        player.pauseVideo()
      }
    }
  }, [player, isPlaying])

  // Control volume
  useEffect(() => {
    if (player) {
      player.setVolume(volume)
    }
  }, [player, volume])

  const handleSkipForward = () => {
    if (player) {
      const currentTime = player.getCurrentTime()
      player.seekTo(currentTime + 10, true)
    }
    onSkipForward()
  }

  const handleSkipBack = () => {
    if (player) {
      const currentTime = player.getCurrentTime()
      player.seekTo(Math.max(currentTime - 10, 0), true)
    }
    onSkipBack()
  }

  if (!track || !track.youtube_url) {
    return (
      <div data-testid="youtube-player-no-url">
        No valid YouTube URL provided
      </div>
    )
  }

  const youtubeUrl = track.youtube_url

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50" data-testid="youtube-player-container">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center space-x-4">
          {/* Track Info */}
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 uppercase tracking-wide">
              Now Playing:
            </p>
            <h4 className="text-sm font-medium text-gray-900 truncate">
              {track.title}
            </h4>
            <p className="text-xs text-gray-600 truncate">
              by {track.artist}
            </p>
          </div>

          {/* Controls */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleSkipBack}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              title="Skip back 10s"
              aria-label="Skip back 10 seconds"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8.445 14.832A1 1 0 0010 14v-2.798l5.445 3.63A1 1 0 0017 14V6a1 1 0 00-1.555-.832L10 8.798V6a1 1 0 00-1.555-.832l-6 4a1 1 0 000 1.664l6 4z"/>
              </svg>
            </button>
            
            <button
              onClick={isPlaying ? onPause : onPlay}
              className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"/>
                </svg>
              ) : (
                <svg className="h-4 w-4 ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"/>
                </svg>
              )}
            </button>
            
            <button
              onClick={handleSkipForward}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              title="Skip forward 10s"
              aria-label="Skip forward 10 seconds"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4.555 5.168A1 1 0 003 6v8a1 1 0 001.555.832L10 11.202V14a1 1 0 001.555.832l6-4a1 1 0 000-1.664l-6-4A1 1 0 0010 6v2.798l-5.445-3.63z"/>
              </svg>
            </button>
          </div>

          {/* Volume Control */}
          <div className="flex items-center space-x-2">
            <svg className="h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.824L4.617 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.617l3.766-3.824a1 1 0 011.617.824zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.983 5.983 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.984 3.984 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd"/>
            </svg>
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => onVolumeChange(Number(e.target.value))}
              className="w-20"
              aria-label="Volume control"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={volume}
            />
          </div>

          {/* YouTube Link */}
          <a
            href={youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
            title="Open in YouTube"
            aria-label={`Open ${track.title} by ${track.artist} in YouTube`}
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
          </a>
        </div>
      </div>
      
      {/* Hidden YouTube Player */}
      <div id="youtube-player" style={{ display: 'none' }}></div>
    </div>
  )
}

// YouTube API type definitions
interface YTPlayer {
  playVideo(): void
  pauseVideo(): void
  loadVideoById(videoId: string): void
  setVolume(volume: number): void
  getCurrentTime(): number
  getDuration(): number
  getPlayerState(): number
  seekTo(seconds: number, allowSeekAhead?: boolean): void
}

interface YTEvent {
  target: YTPlayer
  data: number
}

interface YTPlayerConstructor {
  new (elementId: string, options: {
    width: string | number
    height: string | number
    videoId?: string
    host?: string
    playerVars: Record<string, unknown>
    events: {
      onReady?: (event: YTEvent) => void
      onStateChange?: (event: YTEvent) => void
      onError?: (event: YTEvent) => void
    }
  }): YTPlayer
}

interface YTNamespace {
  Player: YTPlayerConstructor
  PlayerState: {
    PLAYING: number
    PAUSED: number
    ENDED: number
  }
}

// Extend Window interface for YouTube API
declare global {
  interface Window {
    YT: YTNamespace
    onYouTubeIframeAPIReady: () => void
  }
}

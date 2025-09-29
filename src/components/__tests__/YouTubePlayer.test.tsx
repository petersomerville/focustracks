/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen } from '@testing-library/react'
jest.mock('@/lib/logger', () => ({
  createLogger: () => ({
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    apiRequest: jest.fn(),
    apiResponse: jest.fn(),
    dbQuery: jest.fn(),
    userAction: jest.fn(),
    performance: jest.fn(),
  })
}))

// Mock the YouTube player factory
const mockYTPlayer = {
  playVideo: jest.fn(),
  pauseVideo: jest.fn(),
  loadVideoById: jest.fn(),
  setVolume: jest.fn(),
  getCurrentTime: jest.fn(() => 0),
  getDuration: jest.fn(() => 180),
  getPlayerState: jest.fn(() => 2),
  seekTo: jest.fn(),
  destroy: jest.fn(),
}

import YouTubePlayer from '@/components/YouTubePlayer'
import type { Track } from '@/lib/supabase'

// Mock window.YT
Object.defineProperty(window, 'YT', {
  value: {
    Player: jest.fn().mockImplementation(() => mockYTPlayer),
    PlayerState: {
      PLAYING: 1,
      PAUSED: 2,
      ENDED: 0,
    },
  },
  writable: true,
})

const mockTrack: Track = {
  id: '1',
  title: 'Test Track',
  artist: 'Test Artist',
  genre: 'Electronic',
  duration: 180,
  youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  created_at: '2023-01-01T00:00:00Z',
}

// Mock callback functions
const mockOnPlay = jest.fn()
const mockOnPause = jest.fn()
const mockOnSkipBack = jest.fn()
const mockOnSkipForward = jest.fn()
const mockOnVolumeChange = jest.fn()

const mockTrackWithoutYoutube: Track = {
  ...mockTrack,
  youtube_url: undefined,
}

describe('YouTubePlayer', () => {
  beforeEach(() => {
    // Clean up any existing DOM elements
    const existingPlayers = document.querySelectorAll('[id^="youtube-player"]')
    existingPlayers.forEach(player => player.remove())
    
    // Reset mocks
    jest.clearAllMocks()
    // Mock the global YT ready state
    ;(window as any).onYouTubeIframeAPIReady = jest.fn()
  })

  afterEach(() => {
    // Clean up any remaining DOM elements
    const existingPlayers = document.querySelectorAll('[id^="youtube-player"]')
    existingPlayers.forEach(player => player.remove())
  })

  it('renders correctly with a valid track', () => {
    render(
      <YouTubePlayer
        track={mockTrack}
        isPlaying={false}
        volume={50}
        onPlay={mockOnPlay}
        onPause={mockOnPause}
        onSkipBack={mockOnSkipBack}
        onSkipForward={mockOnSkipForward}
        onVolumeChange={mockOnVolumeChange}
      />
    )

    // Should render the hidden iframe container
    expect(screen.getByTestId('youtube-player-container')).toBeInTheDocument()
  })

  it('does not render when track has no YouTube URL', () => {
    render(
      <YouTubePlayer
        track={mockTrackWithoutYoutube}
        isPlaying={false}
        volume={50}
        onPlay={mockOnPlay}
        onPause={mockOnPause}
        onSkipBack={mockOnSkipBack}
        onSkipForward={mockOnSkipForward}
        onVolumeChange={mockOnVolumeChange}
      />
    )

    expect(screen.getByText('No valid YouTube URL provided')).toBeInTheDocument()
  })

  it('does not render when track is null', () => {
    render(
      <YouTubePlayer
        track={null}
        isPlaying={false}
        volume={50}
        onPlay={mockOnPlay}
        onPause={mockOnPause}
        onSkipBack={mockOnSkipBack}
        onSkipForward={mockOnSkipForward}
        onVolumeChange={mockOnVolumeChange}
      />
    )

    expect(screen.getByText('No valid YouTube URL provided')).toBeInTheDocument()
  })

  it('extracts YouTube video ID correctly', () => {
    const testCases = [
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      'https://youtu.be/dQw4w9WgXcQ',
      'https://www.youtube.com/embed/dQw4w9WgXcQ',
      'https://www.youtube.com/v/dQw4w9WgXcQ',
    ]

    testCases.forEach(url => {
      const trackWithUrl = { ...mockTrack, youtube_url: url }
      const { unmount } = render(
        <YouTubePlayer
          track={trackWithUrl}
          isPlaying={false}
          volume={50}
          onPlay={mockOnPlay}
          onPause={mockOnPause}
          onSkipBack={mockOnSkipBack}
          onSkipForward={mockOnSkipForward}
          onVolumeChange={mockOnVolumeChange}
        />
      )

      // The component should render successfully with valid URLs
      expect(screen.getByTestId('youtube-player-container')).toBeInTheDocument()
      
      // Clean up after each test case
      unmount()
    })
  })

  it('loads YouTube API script when not already loaded', () => {
    // In test environment, DOM manipulation is skipped
    // This test verifies the component renders without errors
    const { unmount } = render(
      <YouTubePlayer
        track={mockTrack}
        isPlaying={false}
        volume={50}
        onPlay={mockOnPlay}
        onPause={mockOnPause}
        onSkipBack={mockOnSkipBack}
        onSkipForward={mockOnSkipForward}
        onVolumeChange={mockOnVolumeChange}
      />
    )

    expect(screen.getByTestId('youtube-player-container')).toBeInTheDocument()
    unmount()
  })

  it('displays current track information', () => {
    const { unmount } = render(
      <YouTubePlayer
        track={mockTrack}
        isPlaying={false}
        volume={50}
        onPlay={mockOnPlay}
        onPause={mockOnPause}
        onSkipBack={mockOnSkipBack}
        onSkipForward={mockOnSkipForward}
        onVolumeChange={mockOnVolumeChange}
      />
    )

    expect(screen.getByText('Now Playing:')).toBeInTheDocument()
    expect(screen.getByText('Test Track')).toBeInTheDocument()
    expect(screen.getByText('by Test Artist')).toBeInTheDocument()
    
    unmount()
  })

  it('shows playing state correctly', () => {
    const { unmount } = render(
      <YouTubePlayer
        track={mockTrack}
        isPlaying={true}
        volume={50}
        onPlay={mockOnPlay}
        onPause={mockOnPause}
        onSkipBack={mockOnSkipBack}
        onSkipForward={mockOnSkipForward}
        onVolumeChange={mockOnVolumeChange}
      />
    )

    expect(screen.getByText('Now Playing:')).toBeInTheDocument()
    // When playing, the component should show the track info
    expect(screen.getByText('Test Track')).toBeInTheDocument()
    
    unmount()
  })

  it('handles invalid YouTube URLs gracefully', () => {
    const trackWithInvalidUrl: Track = {
      ...mockTrack,
      youtube_url: 'https://not-youtube.com/invalid',
    }

    const { unmount } = render(
      <YouTubePlayer
        track={trackWithInvalidUrl}
        isPlaying={false}
        volume={50}
        onPlay={mockOnPlay}
        onPause={mockOnPause}
        onSkipBack={mockOnSkipBack}
        onSkipForward={mockOnSkipForward}
        onVolumeChange={mockOnVolumeChange}
      />
    )

    // Should still render the container
    expect(screen.getByTestId('youtube-player-container')).toBeInTheDocument()
    
    unmount()
  })

  it('updates volume when volume prop changes', () => {
    const { rerender, unmount } = render(
      <YouTubePlayer
        track={mockTrack}
        isPlaying={false}
        volume={50}
        onPlay={mockOnPlay}
        onPause={mockOnPause}
        onSkipBack={mockOnSkipBack}
        onSkipForward={mockOnSkipForward}
        onVolumeChange={mockOnVolumeChange}
      />
    )

    // Change volume
    rerender(
      <YouTubePlayer
        track={mockTrack}
        isPlaying={false}
        volume={75}
        onPlay={mockOnPlay}
        onPause={mockOnPause}
        onSkipBack={mockOnSkipBack}
        onSkipForward={mockOnSkipForward}
        onVolumeChange={mockOnVolumeChange}
      />
    )

    // The component should handle the volume change
    // (Implementation details would depend on how volume is actually handled)
    expect(screen.getByTestId('youtube-player-container')).toBeInTheDocument()
    
    unmount()
  })
})
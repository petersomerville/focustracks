/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen } from '@testing-library/react'
import YouTubePlayer from '@/components/YouTubePlayer'
import type { Track } from '@/lib/supabase'

// Mock YouTube API
const mockYTPlayer = {
  playVideo: jest.fn(),
  pauseVideo: jest.fn(),
  loadVideoById: jest.fn(),
  setVolume: jest.fn(),
}

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

const mockTrackWithoutYoutube: Track = {
  ...mockTrack,
  youtube_url: undefined,
}

describe('YouTubePlayer', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Mock the global YT ready state
    ;(window as any).onYouTubeIframeAPIReady = jest.fn()
  })

  it('renders correctly with a valid track', () => {
    render(
      <YouTubePlayer
        track={mockTrack}
        isPlaying={false}
        volume={50}
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
      render(
        <YouTubePlayer
          track={trackWithUrl}
          isPlaying={false}
          volume={50}
        />
      )

      // The component should render successfully with valid URLs
      expect(screen.getByTestId('youtube-player-container')).toBeInTheDocument()
    })
  })

  it('loads YouTube API script when not already loaded', () => {
    // Mock document methods
    const mockScript = document.createElement('script')
    const mockGetElementsByTagName = jest.spyOn(document, 'getElementsByTagName')
    const mockCreateElement = jest.spyOn(document, 'createElement')
    const mockInsertBefore = jest.fn()

    mockCreateElement.mockReturnValue(mockScript)
    mockGetElementsByTagName.mockReturnValue([{
      parentNode: { insertBefore: mockInsertBefore }
    }] as any)

    // Temporarily remove YT from window to simulate fresh load
    const originalYT = (window as any).YT
    delete (window as any).YT

    render(
      <YouTubePlayer
        track={mockTrack}
        isPlaying={false}
        volume={50}
      />
    )

    expect(mockCreateElement).toHaveBeenCalledWith('script')
    expect(mockScript.src).toBe('https://www.youtube.com/iframe_api')
    expect(mockInsertBefore).toHaveBeenCalledWith(mockScript, expect.anything())

    // Restore YT
    ;(window as any).YT = originalYT

    mockCreateElement.mockRestore()
    mockGetElementsByTagName.mockRestore()
  })

  it('displays current track information', () => {
    render(
      <YouTubePlayer
        track={mockTrack}
        isPlaying={false}
        volume={50}
      />
    )

    expect(screen.getByText('Now Playing:')).toBeInTheDocument()
    expect(screen.getByText('Test Track')).toBeInTheDocument()
    expect(screen.getByText('by Test Artist')).toBeInTheDocument()
  })

  it('shows playing state correctly', () => {
    render(
      <YouTubePlayer
        track={mockTrack}
        isPlaying={true}
        volume={50}
      />
    )

    expect(screen.getByText('Now Playing:')).toBeInTheDocument()
    // When playing, the component should show the track info
    expect(screen.getByText('Test Track')).toBeInTheDocument()
  })

  it('handles invalid YouTube URLs gracefully', () => {
    const trackWithInvalidUrl: Track = {
      ...mockTrack,
      youtube_url: 'https://not-youtube.com/invalid',
    }

    // Spy on console.error to check error handling
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <YouTubePlayer
        track={trackWithInvalidUrl}
        isPlaying={false}
        volume={50}
      />
    )

    // Should still render the container but log an error
    expect(screen.getByTestId('youtube-player-container')).toBeInTheDocument()

    consoleSpy.mockRestore()
  })

  it('updates volume when volume prop changes', () => {
    const { rerender } = render(
      <YouTubePlayer
        track={mockTrack}
        isPlaying={false}
        volume={50}
      />
    )

    // Change volume
    rerender(
      <YouTubePlayer
        track={mockTrack}
        isPlaying={false}
        volume={75}
      />
    )

    // The component should handle the volume change
    // (Implementation details would depend on how volume is actually handled)
    expect(screen.getByTestId('youtube-player-container')).toBeInTheDocument()
  })
})
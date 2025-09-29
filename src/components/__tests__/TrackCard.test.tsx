import { render, screen, fireEvent } from '@testing-library/react'
import { useAuth } from '@/contexts/AuthContext'
import TrackCard from '@/components/TrackCard'
import type { Track } from '@/lib/supabase'

// Mock the useAuth hook
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}))

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>

const mockTrack: Track = {
  id: '1',
  title: 'Test Track',
  artist: 'Test Artist',
  genre: 'Test Genre',
  duration: 180,
  youtube_url: 'https://www.youtube.com/watch?v=testid',
  spotify_url: 'https://open.spotify.com/track/1234567890123456789012',
  created_at: '2023-01-01T00:00:00Z',
}

const mockTrackWithoutUrls: Track = {
  ...mockTrack,
  youtube_url: undefined,
  spotify_url: undefined,
}

describe('TrackCard', () => {
  const mockOnPlay = jest.fn()
  const mockOnPause = jest.fn()
  const mockOnAddToPlaylist = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseAuth.mockReturnValue({
      user: { id: '1', email: 'test@example.com' },
      loading: false,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
    })
  })

  it('renders track information correctly', () => {
    render(
      <TrackCard
        track={mockTrack}
        onPlay={mockOnPlay}
        onPause={mockOnPause}
      />
    )

    expect(screen.getByText('Test Track')).toBeInTheDocument()
    expect(screen.getByText('Test Artist')).toBeInTheDocument()
    expect(screen.getByText('Test Genre')).toBeInTheDocument()
    expect(screen.getByText('3:00')).toBeInTheDocument() // 180 seconds = 3:00
  })

  it('shows play button when youtube_url is available', () => {
    render(
      <TrackCard
        track={mockTrack}
        onPlay={mockOnPlay}
        onPause={mockOnPause}
      />
    )

    const playButton = screen.getByRole('button', { name: /play/i })
    expect(playButton).toBeInTheDocument()
  })

  it('does not show play button when youtube_url is not available', () => {
    render(
      <TrackCard
        track={mockTrackWithoutUrls}
        onPlay={mockOnPlay}
        onPause={mockOnPause}
      />
    )

    expect(screen.queryByRole('button', { name: /play/i })).not.toBeInTheDocument()
  })

  it('calls onPlay when play button is clicked', () => {
    render(
      <TrackCard
        track={mockTrack}
        onPlay={mockOnPlay}
        onPause={mockOnPause}
      />
    )

    const playButton = screen.getByRole('button', { name: /play/i })
    fireEvent.click(playButton)

    expect(mockOnPlay).toHaveBeenCalledWith(mockTrack)
  })

  it('shows pause button and calls onPause when playing', () => {
    render(
      <TrackCard
        track={mockTrack}
        isPlaying={true}
        onPlay={mockOnPlay}
        onPause={mockOnPause}
      />
    )

    const pauseButton = screen.getByRole('button', { name: /pause/i })
    expect(pauseButton).toBeInTheDocument()

    fireEvent.click(pauseButton)
    expect(mockOnPause).toHaveBeenCalled()
  })

  it('shows YouTube link when youtube_url is available', () => {
    render(
      <TrackCard
        track={mockTrack}
        onPlay={mockOnPlay}
        onPause={mockOnPause}
      />
    )

    const youtubeLink = screen.getByRole('link', { name: /listen to test track by test artist on youtube/i })
    expect(youtubeLink).toHaveAttribute('href', mockTrack.youtube_url)
    expect(youtubeLink).toHaveAttribute('target', '_blank')
  })

  it('shows Spotify link when spotify_url is available and valid', () => {
    render(
      <TrackCard
        track={mockTrack}
        onPlay={mockOnPlay}
        onPause={mockOnPause}
      />
    )

    const spotifyLink = screen.getByRole('link', { name: /listen to test track by test artist on spotify/i })
    expect(spotifyLink).toHaveAttribute('href', mockTrack.spotify_url)
    expect(spotifyLink).toHaveAttribute('target', '_blank')
  })

  it('shows add to playlist button when user is logged in and onAddToPlaylist is provided', () => {
    render(
      <TrackCard
        track={mockTrack}
        onPlay={mockOnPlay}
        onPause={mockOnPause}
        onAddToPlaylist={mockOnAddToPlaylist}
      />
    )

    const addButton = screen.getByRole('button', { name: /add test track by test artist to playlist/i })
    expect(addButton).toBeInTheDocument()

    fireEvent.click(addButton)
    expect(mockOnAddToPlaylist).toHaveBeenCalledWith(mockTrack)
  })

  it('does not show add to playlist button when user is not logged in', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
    })

    render(
      <TrackCard
        track={mockTrack}
        onPlay={mockOnPlay}
        onPause={mockOnPause}
        onAddToPlaylist={mockOnAddToPlaylist}
      />
    )

    expect(screen.queryByRole('button', { name: /add test track by test artist to playlist/i })).not.toBeInTheDocument()
  })

  it('formats duration correctly', () => {
    const trackWithLongDuration: Track = {
      ...mockTrack,
      duration: 3665, // 1 hour, 1 minute, 5 seconds
    }

    render(
      <TrackCard
        track={trackWithLongDuration}
        onPlay={mockOnPlay}
        onPause={mockOnPause}
      />
    )

    expect(screen.getByText('61:05')).toBeInTheDocument() // Shows as minutes:seconds
  })
})
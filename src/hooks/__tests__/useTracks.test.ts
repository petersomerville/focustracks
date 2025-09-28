import { renderHook, waitFor } from '@testing-library/react'
import { useTracks } from '../useTracks'

// Mock fetch
global.fetch = jest.fn()

describe('useTracks', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear()
  })

  it('fetches tracks successfully', async () => {
    const mockTracks = [
      {
        id: '1',
        title: 'Test Track',
        artist: 'Test Artist',
        genre: 'Ambient',
        duration: 300,
        audio_url: 'https://example.com',
        created_at: '2024-01-01T00:00:00Z'
      }
    ]

    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ tracks: mockTracks })
    })

    const { result } = renderHook(() => useTracks({}))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.tracks).toEqual(mockTracks)
    expect(result.current.error).toBeNull()
  })

  it('handles fetch error', async () => {
    ;(fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

    const { result } = renderHook(() => useTracks({}))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBe('Network error')
    expect(result.current.tracks).toEqual([])
  })

  it('applies genre filter', async () => {
    const mockTracks = [
      {
        id: '1',
        title: 'Ambient Track',
        artist: 'Test Artist',
        genre: 'Ambient',
        duration: 300,
        audio_url: 'https://example.com',
        created_at: '2024-01-01T00:00:00Z'
      },
      {
        id: '2',
        title: 'Classical Track',
        artist: 'Test Artist',
        genre: 'Classical',
        duration: 300,
        audio_url: 'https://example.com',
        created_at: '2024-01-01T00:00:00Z'
      }
    ]

    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ tracks: mockTracks })
    })

    const { result } = renderHook(() => useTracks({ genre: 'Ambient' }))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('genre=Ambient')
    )
  })

  it('applies search filter', async () => {
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ tracks: [] })
    })

    const { result } = renderHook(() => useTracks({ search: 'test' }))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('search=test')
    )
  })
})

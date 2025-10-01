import {
  validateSpotifyUrl,
  isValidSpotifyTrackId,
  extractSpotifyTrackId,
  validateYouTubeUrl,
  extractYouTubeVideoId,
  parseDurationToSeconds,
  formatSecondsToHMS,
  validateDurationFormat,
  validateTrackSubmission,
  cn
} from '../utils'

describe('utils', () => {
  // =============================================================================
  // Tailwind Utilities
  // =============================================================================

  describe('cn (className merger)', () => {
    it('merges class names correctly', () => {
      const result = cn('px-2 py-1', 'px-4')
      expect(result).toBe('py-1 px-4')
    })

    it('handles conditional classes', () => {
      const result = cn('base-class', true && 'conditional-class', false && 'hidden-class')
      expect(result).toContain('base-class')
      expect(result).toContain('conditional-class')
      expect(result).not.toContain('hidden-class')
    })
  })

  // =============================================================================
  // Spotify URL Validation
  // =============================================================================

  describe('validateSpotifyUrl', () => {
    it('validates correct Spotify track URLs', () => {
      expect(validateSpotifyUrl('https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT')).toBe(true)
      expect(validateSpotifyUrl('https://open.spotify.com/track/1234567890123456789012')).toBe(true)
    })

    it('rejects invalid Spotify URLs', () => {
      expect(validateSpotifyUrl('')).toBe(false)
      expect(validateSpotifyUrl('https://spotify.com/track/4cOdK2wGLETKBW3PvgPWqT')).toBe(false) // Missing 'open.'
      expect(validateSpotifyUrl('https://open.spotify.com/album/4cOdK2wGLETKBW3PvgPWqT')).toBe(false) // Album not track
      expect(validateSpotifyUrl('https://open.spotify.com/track/shortid')).toBe(false) // Wrong ID length
      expect(validateSpotifyUrl('https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT?si=abc')).toBe(false) // Query params
    })

    it('rejects non-string inputs', () => {
      expect(validateSpotifyUrl(null as unknown as string)).toBe(false)
      expect(validateSpotifyUrl(undefined as unknown as string)).toBe(false)
    })
  })

  describe('isValidSpotifyTrackId', () => {
    it('validates correct Spotify track IDs', () => {
      expect(isValidSpotifyTrackId('4cOdK2wGLETKBW3PvgPWqT')).toBe(true)
      expect(isValidSpotifyTrackId('1234567890123456789012')).toBe(true)
    })

    it('rejects invalid track IDs', () => {
      expect(isValidSpotifyTrackId('')).toBe(false)
      expect(isValidSpotifyTrackId('shortid')).toBe(false)
      expect(isValidSpotifyTrackId('toolongtrackid123456789012')).toBe(false)
      expect(isValidSpotifyTrackId('invalid-chars-!@#$%^&')).toBe(false)
    })
  })

  describe('extractSpotifyTrackId', () => {
    it('extracts track ID from valid URLs', () => {
      expect(extractSpotifyTrackId('https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT'))
        .toBe('4cOdK2wGLETKBW3PvgPWqT')
    })

    it('returns null for invalid URLs', () => {
      expect(extractSpotifyTrackId('https://invalid.com/track/abc')).toBe(null)
      expect(extractSpotifyTrackId('')).toBe(null)
      expect(extractSpotifyTrackId('not-a-url')).toBe(null)
    })
  })

  // =============================================================================
  // YouTube URL Validation
  // =============================================================================

  describe('validateYouTubeUrl', () => {
    it('validates correct YouTube watch URLs', () => {
      expect(validateYouTubeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(true)
      expect(validateYouTubeUrl('https://youtube.com/watch?v=dQw4w9WgXcQ')).toBe(true)
    })

    it('validates correct YouTube short URLs', () => {
      expect(validateYouTubeUrl('https://youtu.be/dQw4w9WgXcQ')).toBe(true)
      expect(validateYouTubeUrl('https://www.youtu.be/dQw4w9WgXcQ')).toBe(true)
    })

    it('validates YouTube URLs with query parameters', () => {
      expect(validateYouTubeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=30s')).toBe(true)
      expect(validateYouTubeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PLtest')).toBe(true)
    })

    it('rejects invalid YouTube URLs', () => {
      expect(validateYouTubeUrl('')).toBe(false)
      expect(validateYouTubeUrl('https://youtube.com/embed/dQw4w9WgXcQ')).toBe(false) // Embed format
      expect(validateYouTubeUrl('https://youtube.com/watch?v=short')).toBe(false) // Wrong ID length
      expect(validateYouTubeUrl('https://vimeo.com/123456789')).toBe(false) // Wrong platform
      expect(validateYouTubeUrl('http://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(false) // HTTP not HTTPS
    })
  })

  describe('extractYouTubeVideoId', () => {
    it('extracts video ID from watch URLs', () => {
      expect(extractYouTubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ'))
        .toBe('dQw4w9WgXcQ')
    })

    it('extracts video ID from short URLs', () => {
      expect(extractYouTubeVideoId('https://youtu.be/dQw4w9WgXcQ'))
        .toBe('dQw4w9WgXcQ')
    })

    it('extracts video ID from URLs with query params', () => {
      expect(extractYouTubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=30s'))
        .toBe('dQw4w9WgXcQ')
    })

    it('returns null for invalid URLs', () => {
      expect(extractYouTubeVideoId('https://invalid.com/video/abc')).toBe(null)
      expect(extractYouTubeVideoId('')).toBe(null)
      expect(extractYouTubeVideoId('not-a-url')).toBe(null)
    })
  })

  // =============================================================================
  // Duration Parsing and Formatting
  // =============================================================================

  describe('parseDurationToSeconds', () => {
    it('parses minutes-only format', () => {
      expect(parseDurationToSeconds('5')).toBe(300) // 5 minutes = 300 seconds
      expect(parseDurationToSeconds('90')).toBe(5400) // 90 minutes = 5400 seconds
      expect(parseDurationToSeconds('1')).toBe(60)
    })

    it('parses mm:ss format', () => {
      expect(parseDurationToSeconds('5:30')).toBe(330) // 5 min 30 sec
      expect(parseDurationToSeconds('0:45')).toBe(45)
      expect(parseDurationToSeconds('10:00')).toBe(600)
    })

    it('parses hh:mm:ss format', () => {
      expect(parseDurationToSeconds('1:05:30')).toBe(3930) // 1 hour 5 min 30 sec
      expect(parseDurationToSeconds('2:00:00')).toBe(7200) // 2 hours
      expect(parseDurationToSeconds('0:05:00')).toBe(300)
    })

    it('handles whitespace', () => {
      expect(parseDurationToSeconds(' 5:30 ')).toBe(330)
      expect(parseDurationToSeconds('1 : 05 : 30')).toBe(3930)
    })

    it('returns 0 for invalid inputs', () => {
      expect(parseDurationToSeconds('')).toBe(0)
      expect(parseDurationToSeconds('invalid')).toBe(0)
      expect(parseDurationToSeconds('5:30:45:10')).toBe(0) // Too many parts
    })
  })

  describe('formatSecondsToHMS', () => {
    it('formats seconds to mm:ss', () => {
      expect(formatSecondsToHMS(330)).toBe('5:30')
      expect(formatSecondsToHMS(45)).toBe('0:45')
      expect(formatSecondsToHMS(600)).toBe('10:00')
    })

    it('formats seconds to hh:mm:ss when >= 1 hour', () => {
      expect(formatSecondsToHMS(3930)).toBe('1:05:30')
      expect(formatSecondsToHMS(7200)).toBe('2:00:00')
      expect(formatSecondsToHMS(3600)).toBe('1:00:00')
    })

    it('pads minutes and seconds with zeros', () => {
      expect(formatSecondsToHMS(305)).toBe('5:05')
      expect(formatSecondsToHMS(3605)).toBe('1:00:05')
    })

    it('handles edge cases', () => {
      expect(formatSecondsToHMS(0)).toBe('0:00')
      expect(formatSecondsToHMS(59)).toBe('0:59')
      expect(formatSecondsToHMS(3599)).toBe('59:59')
    })
  })

  describe('validateDurationFormat', () => {
    it('validates mm:ss format', () => {
      expect(validateDurationFormat('5:30')).toBe(true)
      expect(validateDurationFormat('0:45')).toBe(true)
      expect(validateDurationFormat('90:00')).toBe(true)
    })

    it('validates hh:mm:ss format', () => {
      expect(validateDurationFormat('1:05:30')).toBe(true)
      expect(validateDurationFormat('2:00:00')).toBe(true)
      expect(validateDurationFormat('100:30:45')).toBe(true)
    })

    it('validates minutes-only format', () => {
      expect(validateDurationFormat('5')).toBe(true)
      expect(validateDurationFormat('90')).toBe(true)
      expect(validateDurationFormat('120')).toBe(true)
    })

    it('handles whitespace', () => {
      expect(validateDurationFormat(' 5:30 ')).toBe(true)
      expect(validateDurationFormat('  90  ')).toBe(true)
    })

    it('rejects invalid formats', () => {
      expect(validateDurationFormat('')).toBe(false)
      expect(validateDurationFormat('5:30:45:10')).toBe(false) // Too many parts
      expect(validateDurationFormat('abc')).toBe(false)
      expect(validateDurationFormat('5:3a')).toBe(false)
      expect(validateDurationFormat(':30')).toBe(false)
      expect(validateDurationFormat('5:')).toBe(false)
    })
  })

  // =============================================================================
  // Track Submission Validation
  // =============================================================================

  describe('validateTrackSubmission', () => {
    const validSubmission = {
      title: 'Test Track',
      artist: 'Test Artist',
      genre: 'Ambient',
      duration: '5:30',
      youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      description: 'This is a test description for the track.'
    }

    it('validates a complete valid submission', () => {
      const result = validateTrackSubmission(validSubmission)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('validates submission with only YouTube URL', () => {
      const result = validateTrackSubmission({
        ...validSubmission,
        spotify_url: undefined
      })
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('validates submission with only Spotify URL', () => {
      const result = validateTrackSubmission({
        ...validSubmission,
        youtube_url: undefined,
        spotify_url: 'https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT'
      })
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('requires title', () => {
      const result = validateTrackSubmission({
        ...validSubmission,
        title: ''
      })
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Title is required')
    })

    it('requires artist', () => {
      const result = validateTrackSubmission({
        ...validSubmission,
        artist: '   '
      })
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Artist is required')
    })

    it('requires genre', () => {
      const result = validateTrackSubmission({
        ...validSubmission,
        genre: ''
      })
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Genre is required')
    })

    it('requires description', () => {
      const result = validateTrackSubmission({
        ...validSubmission,
        description: ''
      })
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Description is required')
    })

    it('requires duration', () => {
      const result = validateTrackSubmission({
        ...validSubmission,
        duration: ''
      })
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Duration is required')
    })

    it('validates duration format', () => {
      const result = validateTrackSubmission({
        ...validSubmission,
        duration: 'invalid'
      })
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Duration must be in format mm:ss, hh:mm:ss, or just minutes (e.g., 5:30, 1:05:30, or 45)')
    })

    it('requires duration greater than 0', () => {
      const result = validateTrackSubmission({
        ...validSubmission,
        duration: '0:00'
      })
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Duration must be greater than 0')
    })

    it('requires at least one platform URL', () => {
      const result = validateTrackSubmission({
        ...validSubmission,
        youtube_url: undefined,
        spotify_url: undefined
      })
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('At least one platform URL (YouTube or Spotify) is required')
    })

    it('validates YouTube URL format', () => {
      const result = validateTrackSubmission({
        ...validSubmission,
        youtube_url: 'https://invalid-youtube-url.com'
      })
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Invalid YouTube URL format')
    })

    it('validates Spotify URL format', () => {
      const result = validateTrackSubmission({
        ...validSubmission,
        youtube_url: undefined,
        spotify_url: 'https://invalid-spotify-url.com'
      })
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Invalid Spotify URL format')
    })

    it('accumulates multiple errors', () => {
      const result = validateTrackSubmission({
        title: '',
        artist: '',
        genre: '',
        duration: '',
        description: ''
      })
      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(3)
    })
  })
})

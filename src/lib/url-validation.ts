/**
 * URL Validation and Normalization Utilities
 *
 * This replaces the ad-hoc URL validation scattered across the codebase
 * and provides consistent handling of YouTube and Spotify URLs.
 */

export interface NormalizedUrls {
  youtube_url?: string
  spotify_url?: string
  audio_url: string // Primary URL for playback (youtube preferred)
}

/**
 * Validate and extract YouTube video ID from various YouTube URL formats
 */
export function validateYouTubeUrl(url: string): { isValid: boolean; videoId?: string; normalizedUrl?: string } {
  if (!url) {
    return { isValid: false }
  }

  // YouTube URL patterns
  const patterns = [
    /^https?:\/\/(www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    /^https?:\/\/(www\.)?youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /^https?:\/\/(www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /^https?:\/\/(www\.)?youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) {
      const videoId = match[2]
      if (videoId && videoId.length === 11) {
        return {
          isValid: true,
          videoId,
          normalizedUrl: `https://www.youtube.com/watch?v=${videoId}`
        }
      }
    }
  }

  return { isValid: false }
}

/**
 * Validate and normalize Spotify URLs
 */
export function validateSpotifyUrl(url: string): { isValid: boolean; trackId?: string; normalizedUrl?: string } {
  if (!url) {
    return { isValid: false }
  }

  // Spotify URL patterns
  const patterns = [
    /^https?:\/\/open\.spotify\.com\/track\/([a-zA-Z0-9]{22})/,
    /^https?:\/\/spotify\.com\/track\/([a-zA-Z0-9]{22})/,
    /^spotify:track:([a-zA-Z0-9]{22})$/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) {
      const trackId = match[1]
      if (trackId && trackId.length === 22) {
        return {
          isValid: true,
          trackId,
          normalizedUrl: `https://open.spotify.com/track/${trackId}`
        }
      }
    }
  }

  return { isValid: false }
}

/**
 * Detect platform from URL
 */
export function detectPlatform(url: string): 'youtube' | 'spotify' | 'unknown' {
  if (!url) return 'unknown'

  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    return 'youtube'
  }

  if (url.includes('spotify.com')) {
    return 'spotify'
  }

  return 'unknown'
}

/**
 * Normalize and validate URLs for the track data model
 *
 * This function handles the youtube_url/spotify_url vs audio_url inconsistency
 * by properly separating the URLs and providing a fallback audio_url.
 */
export function normalizeTrackUrls(input: {
  youtube_url?: string
  spotify_url?: string
  audio_url?: string
}): {
  urls: NormalizedUrls
  errors: string[]
} {
  const errors: string[] = []
  let youtube_url: string | undefined
  let spotify_url: string | undefined

  // Process YouTube URL
  if (input.youtube_url) {
    const validation = validateYouTubeUrl(input.youtube_url)
    if (validation.isValid) {
      youtube_url = validation.normalizedUrl
    } else {
      errors.push(`Invalid YouTube URL: ${input.youtube_url}`)
    }
  }

  // Process Spotify URL
  if (input.spotify_url) {
    const validation = validateSpotifyUrl(input.spotify_url)
    if (validation.isValid) {
      spotify_url = validation.normalizedUrl
    } else {
      errors.push(`Invalid Spotify URL: ${input.spotify_url}`)
    }
  }

  // Handle legacy audio_url field
  if (input.audio_url && !youtube_url && !spotify_url) {
    const platform = detectPlatform(input.audio_url)

    if (platform === 'youtube') {
      const validation = validateYouTubeUrl(input.audio_url)
      if (validation.isValid) {
        youtube_url = validation.normalizedUrl
      } else {
        errors.push(`Invalid YouTube URL in audio_url: ${input.audio_url}`)
      }
    } else if (platform === 'spotify') {
      const validation = validateSpotifyUrl(input.audio_url)
      if (validation.isValid) {
        spotify_url = validation.normalizedUrl
      } else {
        errors.push(`Invalid Spotify URL in audio_url: ${input.audio_url}`)
      }
    } else {
      errors.push(`Unsupported platform in audio_url: ${input.audio_url}`)
    }
  }

  // Determine primary audio URL (prefer YouTube for embedded playback)
  const audio_url = youtube_url || spotify_url

  if (!audio_url) {
    errors.push('No valid audio URL provided')
  }

  return {
    urls: {
      youtube_url,
      spotify_url,
      audio_url: audio_url!
    },
    errors
  }
}

/**
 * Validate track duration in seconds
 */
export function validateDuration(duration: number): { isValid: boolean; error?: string } {
  if (typeof duration !== 'number' || isNaN(duration)) {
    return { isValid: false, error: 'Duration must be a number' }
  }

  if (duration <= 0) {
    return { isValid: false, error: 'Duration must be positive' }
  }

  if (duration > 86400) { // 24 hours
    return { isValid: false, error: 'Duration cannot exceed 24 hours' }
  }

  return { isValid: true }
}

/**
 * Validate track metadata
 */
export function validateTrackMetadata(metadata: {
  title: string
  artist: string
  genre: string
  duration: number
}): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  // Title validation
  if (!metadata.title || typeof metadata.title !== 'string') {
    errors.push('Title is required and must be a string')
  } else if (metadata.title.trim().length === 0) {
    errors.push('Title cannot be empty')
  } else if (metadata.title.length > 255) {
    errors.push('Title cannot exceed 255 characters')
  }

  // Artist validation
  if (!metadata.artist || typeof metadata.artist !== 'string') {
    errors.push('Artist is required and must be a string')
  } else if (metadata.artist.trim().length === 0) {
    errors.push('Artist cannot be empty')
  } else if (metadata.artist.length > 255) {
    errors.push('Artist cannot exceed 255 characters')
  }

  // Genre validation
  const validGenres = ['Ambient', 'Classical', 'Electronic', 'Jazz', 'Other']
  if (!metadata.genre || !validGenres.includes(metadata.genre)) {
    errors.push(`Genre must be one of: ${validGenres.join(', ')}`)
  }

  // Duration validation
  const durationValidation = validateDuration(metadata.duration)
  if (!durationValidation.isValid) {
    errors.push(durationValidation.error!)
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Full track validation combining metadata and URLs
 */
export function validateTrack(track: {
  title: string
  artist: string
  genre: string
  duration: number
  youtube_url?: string
  spotify_url?: string
  audio_url?: string
}): {
  isValid: boolean
  normalizedTrack?: {
    title: string
    artist: string
    genre: string
    duration: number
    youtube_url?: string
    spotify_url?: string
    audio_url: string
  }
  errors: string[]
} {
  const metadataValidation = validateTrackMetadata({
    title: track.title,
    artist: track.artist,
    genre: track.genre,
    duration: track.duration
  })

  const urlValidation = normalizeTrackUrls({
    youtube_url: track.youtube_url,
    spotify_url: track.spotify_url,
    audio_url: track.audio_url
  })

  const allErrors = [...metadataValidation.errors, ...urlValidation.errors]

  if (allErrors.length === 0) {
    return {
      isValid: true,
      normalizedTrack: {
        title: track.title.trim(),
        artist: track.artist.trim(),
        genre: track.genre,
        duration: track.duration,
        youtube_url: urlValidation.urls.youtube_url,
        spotify_url: urlValidation.urls.spotify_url,
        audio_url: urlValidation.urls.audio_url
      },
      errors: []
    }
  }

  return {
    isValid: false,
    errors: allErrors
  }
}
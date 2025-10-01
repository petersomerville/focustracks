import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function validateSpotifyUrl(url: string): boolean {
  if (!url) return false

  const spotifyTrackRegex = /^https:\/\/open\.spotify\.com\/track\/[a-zA-Z0-9]{22}$/
  return spotifyTrackRegex.test(url)
}

export function isValidSpotifyTrackId(trackId: string): boolean {
  if (!trackId) return false

  const trackIdRegex = /^[a-zA-Z0-9]{22}$/
  return trackIdRegex.test(trackId)
}

export function extractSpotifyTrackId(url: string): string | null {
  if (!validateSpotifyUrl(url)) return null

  const match = url.match(/\/track\/([a-zA-Z0-9]{22})$/)
  return match ? match[1] : null
}

export function validateYouTubeUrl(url: string): boolean {
  if (!url) return false

  const youtubeRegex = /^https:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[a-zA-Z0-9_-]{11}(&.*)?$/
  return youtubeRegex.test(url)
}

export function extractYouTubeVideoId(url: string): string | null {
  if (!validateYouTubeUrl(url)) return null

  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  return match ? match[1] : null
}

export function parseDurationToSeconds(durationString: string): number {
  if (!durationString) return 0

  // Handle various formats: "5:30", "1:05:30", "90" (minutes), etc.
  const parts = durationString.split(':').map(part => parseInt(part.trim(), 10))

  // Check for NaN values in parsed parts
  if (parts.some(part => isNaN(part))) return 0

  if (parts.length === 1) {
    // Single number - assume minutes
    return parts[0] * 60
  } else if (parts.length === 2) {
    // mm:ss format
    const [minutes, seconds] = parts
    return (minutes * 60) + seconds
  } else if (parts.length === 3) {
    // hh:mm:ss format
    const [hours, minutes, seconds] = parts
    return (hours * 3600) + (minutes * 60) + seconds
  }

  return 0
}

export function formatSecondsToHMS(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  } else {
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }
}

export function validateDurationFormat(durationString: string): boolean {
  if (!durationString) return false

  const trimmed = durationString.trim()

  // Allow formats: "5:30", "1:05:30", "90" (standalone number treated as minutes)
  // More flexible regex to handle various input formats
  const patterns = [
    /^\d{1,3}:\d{1,2}:\d{1,2}$/, // hh:mm:ss or h:mm:ss
    /^\d{1,2}:\d{1,2}$/,         // mm:ss or m:ss
    /^\d{1,3}$/                  // just minutes
  ]

  return patterns.some(pattern => pattern.test(trimmed))
}

export function validateTrackSubmission(submission: {
  title: string
  artist: string
  genre: string
  duration: string  // Changed from number to string
  youtube_url?: string
  spotify_url?: string
  description: string
}): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!submission.title.trim()) {
    errors.push('Title is required')
  }

  if (!submission.artist.trim()) {
    errors.push('Artist is required')
  }

  if (!submission.genre.trim()) {
    errors.push('Genre is required')
  }

  if (!submission.description.trim()) {
    errors.push('Description is required')
  }

  if (!submission.duration.trim()) {
    errors.push('Duration is required')
  } else if (!validateDurationFormat(submission.duration)) {
    errors.push('Duration must be in format mm:ss, hh:mm:ss, or just minutes (e.g., 5:30, 1:05:30, or 45)')
  } else if (parseDurationToSeconds(submission.duration) <= 0) {
    errors.push('Duration must be greater than 0')
  }

  if (!submission.youtube_url && !submission.spotify_url) {
    errors.push('At least one platform URL (YouTube or Spotify) is required')
  }

  if (submission.youtube_url && !validateYouTubeUrl(submission.youtube_url)) {
    errors.push('Invalid YouTube URL format')
  }

  if (submission.spotify_url && !validateSpotifyUrl(submission.spotify_url)) {
    errors.push('Invalid Spotify URL format')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}
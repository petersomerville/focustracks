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

export function validateTrackSubmission(submission: {
  title: string
  artist: string
  genre: string
  duration: number
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

  if (submission.duration <= 0) {
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
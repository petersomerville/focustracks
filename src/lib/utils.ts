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
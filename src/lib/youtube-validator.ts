/**
 * YouTube URL Validation Utilities
 *
 * These functions help validate YouTube URLs to prevent API errors
 * when loading videos in the embedded player.
 */

// Extract YouTube video ID from URL
export function getYouTubeId(url: string): string | null {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
  const match = url.match(regExp)
  return (match && match[2].length === 11) ? match[2] : null
}

// Validate YouTube URL format
export function isValidYouTubeUrl(url: string): boolean {
  return getYouTubeId(url) !== null
}

/**
 * Check if a YouTube video exists and is accessible
 * Uses YouTube oEmbed API (no API key required)
 */
export async function validateYouTubeVideo(url: string): Promise<{
  isValid: boolean
  error?: string
  title?: string
  author?: string
}> {
  const videoId = getYouTubeId(url)

  if (!videoId) {
    return { isValid: false, error: 'Invalid YouTube URL format' }
  }

  try {
    // Use YouTube oEmbed API to check if video exists
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`

    const response = await fetch(oembedUrl)

    if (!response.ok) {
      if (response.status === 404) {
        return { isValid: false, error: 'Video not found or private' }
      }
      return { isValid: false, error: `HTTP ${response.status}: ${response.statusText}` }
    }

    const data = await response.json()

    return {
      isValid: true,
      title: data.title,
      author: data.author_name
    }
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Network error'
    }
  }
}

/**
 * Validate multiple YouTube URLs in batch
 */
export async function validateYouTubeUrls(urls: string[]): Promise<{
  valid: string[]
  invalid: Array<{ url: string, error: string }>
}> {
  const results = await Promise.allSettled(
    urls.map(url => validateYouTubeVideo(url))
  )

  const valid: string[] = []
  const invalid: Array<{ url: string, error: string }> = []

  results.forEach((result, index) => {
    const url = urls[index]

    if (result.status === 'fulfilled' && result.value.isValid) {
      valid.push(url)
    } else {
      const error = result.status === 'rejected'
        ? result.reason.message
        : result.value.error || 'Unknown error'
      invalid.push({ url, error })
    }
  })

  return { valid, invalid }
}

/**
 * Development helper: validate all YouTube URLs in mock data
 */
export async function validateMockTrackUrls() {
  console.log('🔍 Validating YouTube URLs in mock data...')

  try {
    const response = await fetch('/api/tracks')
    const data = await response.json()
    const tracks = data.tracks || []

    const youtubeUrls = tracks
      .filter((track: any) => track.youtube_url)
      .map((track: any) => track.youtube_url)

    const validation = await validateYouTubeUrls(youtubeUrls)

    console.log(`✅ Valid URLs: ${validation.valid.length}`)
    console.log(`❌ Invalid URLs: ${validation.invalid.length}`)

    if (validation.invalid.length > 0) {
      console.warn('⚠️ Invalid YouTube URLs found:')
      validation.invalid.forEach(({ url, error }) => {
        console.warn(`   ${url} - ${error}`)
      })
    }

    return validation
  } catch (error) {
    console.error('Failed to validate URLs:', error)
    return null
  }
}
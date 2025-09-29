/**
 * API Request/Response Validation Schemas using Zod
 *
 * This provides type-safe validation for all API endpoints,
 * replacing ad-hoc validation scattered across route handlers.
 */

import { z } from 'zod'

// =============================================================================
// Base Types and Utilities
// =============================================================================

/**
 * Custom Zod refinements for URL validation
 */
const youtubeUrlSchema = z
  .string()
  .url('Must be a valid URL')
  .refine(
    (url) => {
      const patterns = [
        /^https?:\/\/(www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
        /^https?:\/\/(www\.)?youtu\.be\/([a-zA-Z0-9_-]{11})/,
      ]
      return patterns.some(pattern => pattern.test(url))
    },
    'Must be a valid YouTube URL'
  )

const spotifyUrlSchema = z
  .string()
  .url('Must be a valid URL')
  .refine(
    (url) => url.includes('open.spotify.com/track/') || url.includes('spotify.com/track/'),
    'Must be a valid Spotify track URL'
  )

const genreSchema = z.enum(['Ambient', 'Classical', 'Electronic', 'Jazz', 'Other'], {
  errorMap: () => ({ message: 'Genre must be one of: Ambient, Classical, Electronic, Jazz, Other' })
})

const durationSchema = z
  .number()
  .min(1, 'Duration must be at least 1 second')
  .max(86400, 'Duration cannot exceed 24 hours')

// =============================================================================
// Track Schemas
// =============================================================================

/**
 * Base track data validation
 */
export const trackMetadataSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title cannot exceed 255 characters'),
  artist: z.string().min(1, 'Artist is required').max(255, 'Artist cannot exceed 255 characters'),
  genre: genreSchema,
  duration: durationSchema,
})

/**
 * Track creation request
 */
export const createTrackSchema = z.object({
  ...trackMetadataSchema.shape,
  youtube_url: youtubeUrlSchema.optional(),
  spotify_url: spotifyUrlSchema.optional(),
  audio_url: z.string().url().optional(), // Legacy field for backward compatibility
}).refine(
  (data) => data.youtube_url || data.spotify_url || data.audio_url,
  'At least one URL (YouTube, Spotify, or audio_url) is required'
)

/**
 * Track response schema
 */
export const trackResponseSchema = z.object({
  id: z.string().uuid(),
  ...trackMetadataSchema.shape,
  youtube_url: z.string().url().nullable(),
  spotify_url: z.string().url().nullable(),
  audio_url: z.string().url(),
  created_at: z.string().datetime(),
})

/**
 * Tracks list query parameters
 */
export const tracksQuerySchema = z.object({
  genre: z.string().optional(),
  search: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
})

// =============================================================================
// Track Submission Schemas
// =============================================================================

/**
 * Track submission creation
 */
export const createSubmissionSchema = z.object({
  ...trackMetadataSchema.shape,
  youtube_url: youtubeUrlSchema.optional(),
  spotify_url: spotifyUrlSchema.optional(),
  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(1000, 'Description cannot exceed 1000 characters'),
}).refine(
  (data) => data.youtube_url || data.spotify_url,
  'At least one URL (YouTube or Spotify) is required'
)

/**
 * Track submission status update (admin only)
 */
export const updateSubmissionSchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected']),
  admin_notes: z.string().max(500, 'Admin notes cannot exceed 500 characters').optional(),
})

/**
 * Track submission response
 */
export const submissionResponseSchema = z.object({
  id: z.string().uuid(),
  ...trackMetadataSchema.shape,
  youtube_url: z.string().url().nullable(),
  spotify_url: z.string().url().nullable(),
  description: z.string(),
  submitted_by: z.string().uuid(),
  status: z.enum(['pending', 'approved', 'rejected']),
  admin_notes: z.string().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})

// =============================================================================
// Playlist Schemas
// =============================================================================

/**
 * Playlist creation
 */
export const createPlaylistSchema = z.object({
  name: z.string()
    .min(1, 'Playlist name is required')
    .max(100, 'Playlist name cannot exceed 100 characters')
    .trim(),
})

/**
 * Playlist update
 */
export const updatePlaylistSchema = z.object({
  name: z.string()
    .min(1, 'Playlist name is required')
    .max(100, 'Playlist name cannot exceed 100 characters')
    .trim(),
})

/**
 * Add track to playlist
 */
export const addTrackToPlaylistSchema = z.object({
  track_id: z.string().uuid('Must be a valid track ID'),
})

/**
 * Playlist response
 */
export const playlistResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  user_id: z.string().uuid(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  tracks: z.array(trackResponseSchema).optional(),
})

// =============================================================================
// Authentication Schemas
// =============================================================================

/**
 * User login
 */
export const loginSchema = z.object({
  email: z.string().email('Must be a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

/**
 * User registration
 */
export const registerSchema = z.object({
  email: z.string().email('Must be a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine(
  (data) => data.password === data.confirmPassword,
  {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  }
)

/**
 * User profile response
 */
export const userProfileSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  role: z.enum(['user', 'admin']),
  created_at: z.string().datetime(),
})

// =============================================================================
// Error Response Schemas
// =============================================================================

/**
 * Standard API error response
 */
export const errorResponseSchema = z.object({
  error: z.string(),
  message: z.string().optional(),
  code: z.string().optional(),
  details: z.record(z.any()).optional(),
})

/**
 * Validation error response
 */
export const validationErrorResponseSchema = z.object({
  error: z.literal('Validation failed'),
  issues: z.array(z.object({
    path: z.array(z.union([z.string(), z.number()])),
    message: z.string(),
    code: z.string(),
  })),
})

// =============================================================================
// Success Response Schemas
// =============================================================================

/**
 * Generic success response
 */
export const successResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  data: z.any().optional(),
})

/**
 * Paginated response wrapper
 */
export function createPaginatedResponseSchema<T extends z.ZodType>(itemSchema: T) {
  return z.object({
    data: z.array(itemSchema),
    pagination: z.object({
      total: z.number(),
      limit: z.number(),
      offset: z.number(),
      hasMore: z.boolean(),
    }),
  })
}

// =============================================================================
// Type Exports
// =============================================================================

export type TrackMetadata = z.infer<typeof trackMetadataSchema>
export type CreateTrackRequest = z.infer<typeof createTrackSchema>
export type TrackResponse = z.infer<typeof trackResponseSchema>
export type TracksQuery = z.infer<typeof tracksQuerySchema>

export type CreateSubmissionRequest = z.infer<typeof createSubmissionSchema>
export type UpdateSubmissionRequest = z.infer<typeof updateSubmissionSchema>
export type SubmissionResponse = z.infer<typeof submissionResponseSchema>

export type CreatePlaylistRequest = z.infer<typeof createPlaylistSchema>
export type UpdatePlaylistRequest = z.infer<typeof updatePlaylistSchema>
export type AddTrackToPlaylistRequest = z.infer<typeof addTrackToPlaylistSchema>
export type PlaylistResponse = z.infer<typeof playlistResponseSchema>

export type LoginRequest = z.infer<typeof loginSchema>
export type RegisterRequest = z.infer<typeof registerSchema>
export type UserProfile = z.infer<typeof userProfileSchema>

export type ErrorResponse = z.infer<typeof errorResponseSchema>
export type ValidationErrorResponse = z.infer<typeof validationErrorResponseSchema>
export type SuccessResponse = z.infer<typeof successResponseSchema>

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Create a type-safe API response
 */
export function createApiResponse<T>(data: T, success = true): SuccessResponse & { data: T } {
  return {
    success,
    data,
  }
}

/**
 * Create a standardized error response
 */
export function createErrorResponse(
  error: string,
  message?: string,
  code?: string,
  details?: Record<string, any>
): ErrorResponse {
  return {
    error,
    message,
    code,
    details,
  }
}

/**
 * Format Zod validation errors
 */
export function formatZodErrors(error: z.ZodError): ValidationErrorResponse {
  return {
    error: 'Validation failed',
    issues: error.issues.map(issue => ({
      path: issue.path,
      message: issue.message,
      code: issue.code,
    })),
  }
}
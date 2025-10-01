import {
  createSubmissionSchema,
  updateSubmissionSchema,
  createPlaylistSchema,
  updatePlaylistSchema,
  addTrackToPlaylistSchema,
  loginSchema,
  registerSchema,
  formatZodErrors,
  createErrorResponse
} from '../api-schemas'

describe('api-schemas', () => {
  // =============================================================================
  // Track Submission Schemas
  // =============================================================================

  describe('createSubmissionSchema', () => {
    const validSubmission = {
      title: 'Test Track',
      artist: 'Test Artist',
      genre: 'Ambient',
      duration: 300,
      youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      description: 'This is a detailed description explaining why this track helps with focus and productivity.'
    }

    it('validates a complete submission with YouTube URL', () => {
      const result = createSubmissionSchema.safeParse(validSubmission)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.title).toBe('Test Track')
        expect(result.data.youtube_url).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
      }
    })

    it('validates a submission with Spotify URL', () => {
      const submission = {
        ...validSubmission,
        youtube_url: undefined,
        spotify_url: 'https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT'
      }
      const result = createSubmissionSchema.safeParse(submission)
      expect(result.success).toBe(true)
    })

    it('validates a submission with both URLs', () => {
      const submission = {
        ...validSubmission,
        spotify_url: 'https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT'
      }
      const result = createSubmissionSchema.safeParse(submission)
      expect(result.success).toBe(true)
    })

    it('requires title', () => {
      const submission = { ...validSubmission, title: '' }
      const result = createSubmissionSchema.safeParse(submission)
      expect(result.success).toBe(false)
    })

    it('requires title length <= 255', () => {
      const submission = { ...validSubmission, title: 'a'.repeat(256) }
      const result = createSubmissionSchema.safeParse(submission)
      expect(result.success).toBe(false)
    })

    it('requires artist', () => {
      const submission = { ...validSubmission, artist: '' }
      const result = createSubmissionSchema.safeParse(submission)
      expect(result.success).toBe(false)
    })

    it('requires valid genre', () => {
      // @ts-expect-error - testing invalid genre type
      const submission = { ...validSubmission, genre: 'InvalidGenre' }
      const result = createSubmissionSchema.safeParse(submission)
      expect(result.success).toBe(false)
    })

    it('accepts valid genres', () => {
      const genres = ['Ambient', 'Classical', 'Electronic', 'Jazz', 'Other']
      genres.forEach(genre => {
        const submission = { ...validSubmission, genre }
        const result = createSubmissionSchema.safeParse(submission)
        expect(result.success).toBe(true)
      })
    })

    it('requires duration >= 1 second', () => {
      const submission = { ...validSubmission, duration: 0 }
      const result = createSubmissionSchema.safeParse(submission)
      expect(result.success).toBe(false)
    })

    it('requires duration <= 24 hours', () => {
      const submission = { ...validSubmission, duration: 86401 }
      const result = createSubmissionSchema.safeParse(submission)
      expect(result.success).toBe(false)
    })

    it('requires description with minimum 10 characters', () => {
      const submission = { ...validSubmission, description: 'Too short' }
      const result = createSubmissionSchema.safeParse(submission)
      expect(result.success).toBe(false)
    })

    it('requires description with maximum 1000 characters', () => {
      const submission = { ...validSubmission, description: 'a'.repeat(1001) }
      const result = createSubmissionSchema.safeParse(submission)
      expect(result.success).toBe(false)
    })

    it('requires at least one URL (YouTube or Spotify)', () => {
      const submission = {
        title: 'Test Track',
        artist: 'Test Artist',
        genre: 'Ambient',
        duration: 300,
        description: 'This is a detailed description.'
      }
      const result = createSubmissionSchema.safeParse(submission)
      expect(result.success).toBe(false)
    })

    it('validates YouTube URL format', () => {
      const submission = {
        ...validSubmission,
        youtube_url: 'https://invalid-url.com'
      }
      const result = createSubmissionSchema.safeParse(submission)
      expect(result.success).toBe(false)
    })

    it('validates Spotify URL format', () => {
      const submission = {
        ...validSubmission,
        youtube_url: undefined,
        spotify_url: 'https://invalid-spotify-url.com'
      }
      const result = createSubmissionSchema.safeParse(submission)
      expect(result.success).toBe(false)
    })
  })

  describe('updateSubmissionSchema', () => {
    it('validates approved status', () => {
      const result = updateSubmissionSchema.safeParse({ status: 'approved' })
      expect(result.success).toBe(true)
    })

    it('validates rejected status', () => {
      const result = updateSubmissionSchema.safeParse({ status: 'rejected' })
      expect(result.success).toBe(true)
    })

    it('validates pending status', () => {
      const result = updateSubmissionSchema.safeParse({ status: 'pending' })
      expect(result.success).toBe(true)
    })

    it('rejects invalid status', () => {
      const result = updateSubmissionSchema.safeParse({ status: 'invalid' })
      expect(result.success).toBe(false)
    })

    it('validates with admin notes', () => {
      const result = updateSubmissionSchema.safeParse({
        status: 'approved',
        admin_notes: 'Great track for focus!'
      })
      expect(result.success).toBe(true)
    })

    it('requires admin_notes <= 500 characters', () => {
      const result = updateSubmissionSchema.safeParse({
        status: 'approved',
        admin_notes: 'a'.repeat(501)
      })
      expect(result.success).toBe(false)
    })
  })

  // =============================================================================
  // Playlist Schemas
  // =============================================================================

  describe('createPlaylistSchema', () => {
    it('validates a valid playlist name', () => {
      const result = createPlaylistSchema.safeParse({ name: 'My Focus Playlist' })
      expect(result.success).toBe(true)
    })

    it('trims whitespace from playlist name', () => {
      const result = createPlaylistSchema.safeParse({ name: '  My Playlist  ' })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.name).toBe('My Playlist')
      }
    })

    it('requires playlist name', () => {
      const result = createPlaylistSchema.safeParse({ name: '' })
      expect(result.success).toBe(false)
    })

    it('requires playlist name <= 100 characters', () => {
      const result = createPlaylistSchema.safeParse({ name: 'a'.repeat(101) })
      expect(result.success).toBe(false)
    })
  })

  describe('updatePlaylistSchema', () => {
    it('validates a valid playlist name', () => {
      const result = updatePlaylistSchema.safeParse({ name: 'Updated Playlist' })
      expect(result.success).toBe(true)
    })

    it('trims whitespace', () => {
      const result = updatePlaylistSchema.safeParse({ name: '  Updated  ' })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.name).toBe('Updated')
      }
    })

    it('rejects whitespace-only names', () => {
      // Schema trims first, then validates, so '   ' becomes '' and fails min(1)
      const result = updatePlaylistSchema.safeParse({ name: '   ' })
      expect(result.success).toBe(false)
    })
  })

  describe('addTrackToPlaylistSchema', () => {
    it('validates a valid UUID track_id', () => {
      const result = addTrackToPlaylistSchema.safeParse({
        track_id: '123e4567-e89b-12d3-a456-426614174000'
      })
      expect(result.success).toBe(true)
    })

    it('rejects invalid UUID format', () => {
      const result = addTrackToPlaylistSchema.safeParse({ track_id: 'not-a-uuid' })
      expect(result.success).toBe(false)
    })

    it('rejects empty string', () => {
      const result = addTrackToPlaylistSchema.safeParse({ track_id: '' })
      expect(result.success).toBe(false)
    })
  })

  // =============================================================================
  // Authentication Schemas
  // =============================================================================

  describe('loginSchema', () => {
    it('validates correct email and password', () => {
      const result = loginSchema.safeParse({
        email: 'test@example.com',
        password: 'password123'
      })
      expect(result.success).toBe(true)
    })

    it('requires valid email format', () => {
      const result = loginSchema.safeParse({
        email: 'invalid-email',
        password: 'password123'
      })
      expect(result.success).toBe(false)
    })

    it('requires password >= 6 characters', () => {
      const result = loginSchema.safeParse({
        email: 'test@example.com',
        password: '12345'
      })
      expect(result.success).toBe(false)
    })
  })

  describe('registerSchema', () => {
    it('validates correct registration data', () => {
      const result = registerSchema.safeParse({
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123'
      })
      expect(result.success).toBe(true)
    })

    it('requires valid email format', () => {
      const result = registerSchema.safeParse({
        email: 'not-an-email',
        password: 'password123',
        confirmPassword: 'password123'
      })
      expect(result.success).toBe(false)
    })

    it('requires password >= 8 characters', () => {
      const result = registerSchema.safeParse({
        email: 'test@example.com',
        password: 'short',
        confirmPassword: 'short'
      })
      expect(result.success).toBe(false)
    })

    it('requires matching passwords', () => {
      const result = registerSchema.safeParse({
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'different456'
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some(issue => issue.path.includes('confirmPassword'))).toBe(true)
      }
    })
  })

  // =============================================================================
  // Helper Functions
  // =============================================================================

  describe('formatZodErrors', () => {
    it('formats Zod errors correctly', () => {
      const schema = createPlaylistSchema
      const result = schema.safeParse({ name: '' })

      if (!result.success) {
        const formatted = formatZodErrors(result.error)
        expect(formatted.error).toBe('Validation failed')
        expect(formatted.issues).toBeDefined()
        expect(Array.isArray(formatted.issues)).toBe(true)
        expect(formatted.issues.length).toBeGreaterThan(0)
        expect(formatted.issues[0]).toHaveProperty('path')
        expect(formatted.issues[0]).toHaveProperty('message')
        expect(formatted.issues[0]).toHaveProperty('code')
      }
    })

    it('includes path information', () => {
      const schema = loginSchema
      const result = schema.safeParse({ email: 'invalid', password: '123' })

      if (!result.success) {
        const formatted = formatZodErrors(result.error)
        const emailError = formatted.issues.find(issue => issue.path.includes('email'))
        const passwordError = formatted.issues.find(issue => issue.path.includes('password'))

        expect(emailError).toBeDefined()
        expect(passwordError).toBeDefined()
      }
    })

    it('converts code to string', () => {
      const schema = createSubmissionSchema
      const result = schema.safeParse({
        title: 'Test',
        artist: 'Test',
        genre: 'Ambient',
        duration: 300,
        description: 'Short'  // Too short
      })

      if (!result.success) {
        const formatted = formatZodErrors(result.error)
        formatted.issues.forEach(issue => {
          expect(typeof issue.code).toBe('string')
        })
      }
    })
  })

  describe('createErrorResponse', () => {
    it('creates basic error response', () => {
      const error = createErrorResponse('Something went wrong')
      expect(error.error).toBe('Something went wrong')
      expect(error.message).toBeUndefined()
      expect(error.code).toBeUndefined()
    })

    it('creates error response with message', () => {
      const error = createErrorResponse('Error', 'Detailed message')
      expect(error.error).toBe('Error')
      expect(error.message).toBe('Detailed message')
    })

    it('creates error response with code', () => {
      const error = createErrorResponse('Error', 'Message', 'ERR_CODE')
      expect(error.error).toBe('Error')
      expect(error.message).toBe('Message')
      expect(error.code).toBe('ERR_CODE')
    })

    it('creates error response with details', () => {
      const details = { field: 'email', reason: 'invalid format' }
      const error = createErrorResponse('Validation error', 'Check fields', 'VALIDATION', details)
      expect(error.error).toBe('Validation error')
      expect(error.message).toBe('Check fields')
      expect(error.code).toBe('VALIDATION')
      expect(error.details).toEqual(details)
    })
  })
})

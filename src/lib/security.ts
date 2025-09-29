/**
 * Security Enhancements and Rate Limiting
 * 
 * Provides rate limiting, input validation, and security utilities
 * for protecting the application from abuse and attacks.
 */

import { createLogger } from './logger'
import { NextRequest } from 'next/server'

const logger = createLogger('security')

/**
 * Rate limiter implementation
 */
export class RateLimiter {
  private requests: Map<string, { count: number; resetTime: number }> = new Map()

  constructor(
    private maxRequests: number = 100,
    private windowMs: number = 15 * 60 * 1000, // 15 minutes
    private blockDurationMs: number = 60 * 1000 // 1 minute block
  ) {}

  /**
   * Check if request is allowed
   */
  isAllowed(identifier: string): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now()
    const key = identifier
    const record = this.requests.get(key)

    if (!record || now > record.resetTime) {
      // First request or window expired
      this.requests.set(key, {
        count: 1,
        resetTime: now + this.windowMs
      })

      return {
        allowed: true,
        remaining: this.maxRequests - 1,
        resetTime: now + this.windowMs
      }
    }

    if (record.count >= this.maxRequests) {
      // Rate limit exceeded
      return {
        allowed: false,
        remaining: 0,
        resetTime: record.resetTime
      }
    }

    // Increment counter
    record.count++
    this.requests.set(key, record)

    return {
      allowed: true,
      remaining: this.maxRequests - record.count,
      resetTime: record.resetTime
    }
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const now = Date.now()
    for (const [key, record] of this.requests) {
      if (now > record.resetTime) {
        this.requests.delete(key)
      }
    }
  }

  /**
   * Get current status for an identifier
   */
  getStatus(identifier: string): { count: number; remaining: number; resetTime: number } {
    const record = this.requests.get(identifier)
    if (!record) {
      return { count: 0, remaining: this.maxRequests, resetTime: Date.now() + this.windowMs }
    }

    return {
      count: record.count,
      remaining: Math.max(0, this.maxRequests - record.count),
      resetTime: record.resetTime
    }
  }
}

/**
 * Global rate limiters for different endpoints
 */
export const rateLimiters = {
  api: new RateLimiter(100, 15 * 60 * 1000), // 100 requests per 15 minutes
  auth: new RateLimiter(5, 15 * 60 * 1000), // 5 auth attempts per 15 minutes
  search: new RateLimiter(50, 5 * 60 * 1000), // 50 searches per 5 minutes
  playlist: new RateLimiter(20, 5 * 60 * 1000), // 20 playlist operations per 5 minutes
}

/**
 * Input validation and sanitization
 */
export const inputValidation = {
  /**
   * Sanitize string input
   */
  sanitizeString: (input: string, maxLength: number = 1000): string => {
    if (typeof input !== 'string') return ''
    
    return input
      .trim()
      .slice(0, maxLength)
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
  },

  /**
   * Validate email format
   */
  validateEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email) && email.length <= 254
  },

  /**
   * Validate URL format
   */
  validateUrl: (url: string): boolean => {
    try {
      const parsedUrl = new URL(url)
      return ['http:', 'https:'].includes(parsedUrl.protocol)
    } catch {
      return false
    }
  },

  /**
   * Validate UUID format
   */
  validateUUID: (uuid: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    return uuidRegex.test(uuid)
  },

  /**
   * Validate password strength
   */
  validatePassword: (password: string): { valid: boolean; errors: string[] } => {
    const errors: string[] = []

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long')
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter')
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter')
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number')
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }
}

/**
 * Security headers middleware
 */
export const securityHeaders = {
  /**
   * Get security headers for API responses
   */
  getHeaders: () => ({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.youtube.com https://www.gstatic.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://api.supabase.co; frame-src 'self' https://www.youtube.com;"
  }),

  /**
   * Apply security headers to response
   */
  applyToResponse: (response: Response): Response => {
    const headers = securityHeaders.getHeaders()
    
    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value)
    })

    return response
  }
}

/**
 * Request validation utilities
 */
export const requestValidation = {
  /**
   * Validate request origin
   */
  validateOrigin: (request: NextRequest): boolean => {
    const origin = request.headers.get('origin')
    const referer = request.headers.get('referer')
    
    if (!origin && !referer) {
      return true // Allow requests without origin (e.g., direct API calls)
    }

    const allowedOrigins = [
      process.env.NEXT_PUBLIC_APP_URL,
      'http://localhost:3000',
      'https://localhost:3000'
    ].filter((url): url is string => Boolean(url))

    if (origin) {
      return allowedOrigins.some(allowed => origin.startsWith(allowed))
    }

    if (referer) {
      try {
        const refererUrl = new URL(referer)
        return allowedOrigins.some(allowed => refererUrl.origin === allowed)
      } catch {
        return false
      }
    }

    return false
  },

  /**
   * Validate request size
   */
  validateRequestSize: (request: NextRequest, maxSize: number = 1024 * 1024): boolean => {
    const contentLength = request.headers.get('content-length')
    if (contentLength) {
      return parseInt(contentLength) <= maxSize
    }
    return true
  },

  /**
   * Extract client IP
   */
  getClientIP: (request: NextRequest): string => {
    const forwarded = request.headers.get('x-forwarded-for')
    const realIP = request.headers.get('x-real-ip')
    const cfConnectingIP = request.headers.get('cf-connecting-ip')
    
    if (cfConnectingIP) return cfConnectingIP
    if (realIP) return realIP
    if (forwarded) return forwarded.split(',')[0].trim()
    
    return 'unknown'
  }
}

/**
 * Security middleware for API routes
 */
export const securityMiddleware = {
  /**
   * Rate limiting middleware
   */
  rateLimit: (limiter: RateLimiter, identifier?: string) => {
    return (request: NextRequest) => {
      const clientIP = requestValidation.getClientIP(request)
      const id = identifier || clientIP
      
      const result = limiter.isAllowed(id)
      
      if (!result.allowed) {
        logger.warn('Rate limit exceeded', { 
          identifier: id, 
          clientIP,
          userAgent: request.headers.get('user-agent')
        })
        
        return new Response(
          JSON.stringify({
            error: 'Rate limit exceeded',
            message: 'Too many requests. Please try again later.',
            retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000)
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString(),
              ...securityHeaders.getHeaders()
            }
          }
        )
      }

      return null // Allow request to proceed
    }
  },

  /**
   * Input validation middleware
   */
  validateInput: (_schema: unknown) => {
    return (request: NextRequest) => {
      // This would be implemented with Zod or similar validation library
      // For now, we'll do basic checks
      
      const contentType = request.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        // Validate JSON payload size
        if (!requestValidation.validateRequestSize(request)) {
          return new Response(
            JSON.stringify({
              error: 'Request too large',
              message: 'Request payload exceeds maximum size limit'
            }),
            {
              status: 413,
              headers: {
                'Content-Type': 'application/json',
                ...securityHeaders.getHeaders()
              }
            }
          )
        }
      }

      return null // Allow request to proceed
    }
  },

  /**
   * Origin validation middleware
   */
  validateOrigin: () => {
    return (request: NextRequest) => {
      if (!requestValidation.validateOrigin(request)) {
        logger.warn('Invalid request origin', {
          origin: request.headers.get('origin'),
          referer: request.headers.get('referer'),
          clientIP: requestValidation.getClientIP(request)
        })
        
        return new Response(
          JSON.stringify({
            error: 'Invalid origin',
            message: 'Request origin is not allowed'
          }),
          {
            status: 403,
            headers: {
              'Content-Type': 'application/json',
              ...securityHeaders.getHeaders()
            }
          }
        )
      }

      return null // Allow request to proceed
    }
  }
}

/**
 * Security monitoring and logging
 */
export const securityMonitoring = {
  /**
   * Log suspicious activity
   */
  logSuspiciousActivity: (type: string, details: Record<string, unknown>) => {
    logger.warn('Suspicious activity detected', {
      type,
      timestamp: new Date().toISOString(),
      ...details
    })
  },

  /**
   * Log security events
   */
  logSecurityEvent: (event: string, details: Record<string, unknown>) => {
    logger.info('Security event', {
      event,
      timestamp: new Date().toISOString(),
      ...details
    })
  },

  /**
   * Monitor failed authentication attempts
   */
  monitorAuthFailure: (email: string, clientIP: string, userAgent: string) => {
    securityMonitoring.logSuspiciousActivity('auth_failure', {
      email,
      clientIP,
      userAgent
    })
  },

  /**
   * Monitor rate limit violations
   */
  monitorRateLimitViolation: (identifier: string, endpoint: string, clientIP: string) => {
    securityMonitoring.logSuspiciousActivity('rate_limit_violation', {
      identifier,
      endpoint,
      clientIP
    })
  }
}

/**
 * Cleanup expired rate limiter entries periodically
 */
setInterval(() => {
  Object.values(rateLimiters).forEach(limiter => limiter.cleanup())
}, 5 * 60 * 1000) // Clean up every 5 minutes

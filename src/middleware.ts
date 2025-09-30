import { NextRequest, NextResponse } from 'next/server'
import { securityMiddleware, securityHeaders, requestValidation } from '@/lib/security'
import { createLogger } from '@/lib/logger'

const logger = createLogger('middleware')

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Apply security headers to all responses
  const response = NextResponse.next()
  
  // Add security headers
  Object.entries(securityHeaders.getHeaders()).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  // API route security
  if (pathname.startsWith('/api/')) {
    // Skip origin validation for certain routes that handle client-side requests
    const skipOriginValidation = [
      '/api/tracks',
      '/api/playlists',
      '/api/search',
      '/api/submissions'
    ].some(route => pathname.startsWith(route) && request.method === 'GET')
    
    if (!skipOriginValidation) {
      // Validate origin for API routes
      const originCheck = securityMiddleware.validateOrigin()(request)
      if (originCheck) {
        return originCheck
      }
    }

    // Apply rate limiting based on endpoint
    const clientIP = requestValidation.getClientIP(request)
    
    if (pathname.startsWith('/api/auth/')) {
      // More restrictive rate limiting for auth endpoints
      const { rateLimiters } = await import('@/lib/security')
      const rateLimitCheck = securityMiddleware.rateLimit(rateLimiters.auth, clientIP)(request)
      if (rateLimitCheck) {
        return rateLimitCheck
      }
    } else if (pathname.startsWith('/api/playlists/') && request.method !== 'GET') {
      // Rate limiting for playlist modifications
      const { rateLimiters } = await import('@/lib/security')
      const rateLimitCheck = securityMiddleware.rateLimit(rateLimiters.playlist, clientIP)(request)
      if (rateLimitCheck) {
        return rateLimitCheck
      }
    } else if (pathname.startsWith('/api/search')) {
      // Rate limiting for search endpoints
      const { rateLimiters } = await import('@/lib/security')
      const rateLimitCheck = securityMiddleware.rateLimit(rateLimiters.search, clientIP)(request)
      if (rateLimitCheck) {
        return rateLimitCheck
      }
    } else if (pathname.startsWith('/api/')) {
      // General API rate limiting
      const { rateLimiters } = await import('@/lib/security')
      const rateLimitCheck = securityMiddleware.rateLimit(rateLimiters.api, clientIP)(request)
      if (rateLimitCheck) {
        return rateLimitCheck
      }
    }

    // Log API requests for monitoring
    logger.info('API request', {
      method: request.method,
      pathname,
      clientIP: requestValidation.getClientIP(request),
      userAgent: request.headers.get('user-agent')
    })
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}

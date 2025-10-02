'use client'

import { useEffect } from 'react'

/**
 * Client-side Sentry initialization component
 * Must be a client component to run in the browser
 */
export default function SentryInit() {
  useEffect(() => {
    console.log('[SentryInit] Component mounted, attempting to initialize Sentry...')
    console.log('[SentryInit] DSN:', process.env.NEXT_PUBLIC_SENTRY_DSN ? 'SET' : 'NOT SET')

    // Dynamically import Sentry config only in browser
    import('../../sentry.client.config')
      .then(() => {
        console.log('[SentryInit] Sentry config imported successfully')
        // @ts-expect-error - Checking global Sentry
        console.log('[SentryInit] window.__SENTRY__ exists:', typeof window.__SENTRY__ !== 'undefined')
      })
      .catch((error) => {
        console.error('[SentryInit] Failed to initialize Sentry:', error)
      })
  }, [])

  // This component renders nothing
  return null
}

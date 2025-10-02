'use client'

import { useEffect } from 'react'

/**
 * Client-side Sentry initialization component
 * Must be a client component to run in the browser
 */
export default function SentryInit() {
  useEffect(() => {
    // Dynamically import Sentry config only in browser
    import('../../sentry.client.config').catch((error) => {
      console.error('[SentryInit] Failed to initialize Sentry:', error)
    })
  }, [])

  // This component renders nothing
  return null
}

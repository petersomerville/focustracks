'use client'

/**
 * Sentry Test Page with Diagnostics
 *
 * This page provides buttons to test Sentry error capture plus diagnostics.
 * DELETE THIS FILE after verifying Sentry is working.
 */

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function TestSentryPage() {
  const [lastError, setLastError] = useState<string>('')
  const [sentryStatus, setSentryStatus] = useState<{
    dsnConfigured: boolean
    dsnValue: string
    clientInitialized: boolean
  }>({
    dsnConfigured: false,
    dsnValue: '',
    clientInitialized: false
  })

  useEffect(() => {
    // Check Sentry configuration
    const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN
    const dsnConfigured = !!dsn
    const dsnValue = dsn ? `${dsn.substring(0, 30)}...` : 'NOT SET'

    // Check if Sentry client is initialized
    let clientInitialized = false
    try {
      // @ts-expect-error - Checking global Sentry
      clientInitialized = typeof window !== 'undefined' && typeof window.__SENTRY__ !== 'undefined'
    } catch {
      clientInitialized = false
    }

    setSentryStatus({
      dsnConfigured,
      dsnValue,
      clientInitialized
    })
  }, [])

  const triggerError = () => {
    setLastError('Client-side error triggered')
    console.log('Triggering Sentry test error...')
    throw new Error('Test Sentry Error - Client Side')
  }

  const triggerAsyncError = async () => {
    setLastError('Async error triggered')
    console.log('Triggering async Sentry test error...')
    await new Promise(resolve => setTimeout(resolve, 100))
    throw new Error('Test Sentry Error - Async Operation')
  }

  const triggerAPIError = async () => {
    setLastError('API error triggered')
    console.log('Calling test error API endpoint...')
    try {
      const response = await fetch('/api/test-sentry-error')
      if (!response.ok) {
        console.log('API returned error status:', response.status)
      }
    } catch (error) {
      console.error('API Error:', error)
    }
  }

  const triggerManualCapture = () => {
    setLastError('Manual capture triggered')
    console.log('Attempting manual Sentry capture...')

    import('@sentry/nextjs').then((Sentry) => {
      Sentry.captureMessage('Test Manual Sentry Capture', 'error')
      console.log('✅ Manual capture sent to Sentry')
      alert('Manual capture sent! Check Sentry dashboard in 30 seconds.')
    }).catch((err) => {
      console.error('❌ Failed to load Sentry:', err)
      alert('Failed to load Sentry SDK!')
    })
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-6 w-6 text-orange-500" />
              <span>Sentry Error Tracking Test</span>
            </CardTitle>
            <CardDescription>
              Test error capture and verify Sentry is working correctly.
              Check your Sentry dashboard at{' '}
              <a
                href="https://sentry.io/organizations/peter-l46/issues/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                sentry.io
              </a>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Diagnostics */}
            <div className="bg-muted/50 p-4 rounded-lg space-y-3">
              <h3 className="font-medium">Sentry Configuration Status:</h3>

              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  {sentryStatus.dsnConfigured ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  <span className="font-medium">NEXT_PUBLIC_SENTRY_DSN:</span>
                  <span className={sentryStatus.dsnConfigured ? 'text-green-600' : 'text-red-600'}>
                    {sentryStatus.dsnConfigured ? 'Configured' : 'NOT SET'}
                  </span>
                </div>

                {sentryStatus.dsnConfigured && (
                  <p className="text-xs text-muted-foreground ml-7">
                    {sentryStatus.dsnValue}
                  </p>
                )}

                <div className="flex items-center space-x-2">
                  {sentryStatus.clientInitialized ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  <span className="font-medium">Sentry Client:</span>
                  <span className={sentryStatus.clientInitialized ? 'text-green-600' : 'text-red-600'}>
                    {sentryStatus.clientInitialized ? 'Initialized' : 'Not Initialized'}
                  </span>
                </div>

                {!sentryStatus.dsnConfigured && (
                  <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
                    <p className="text-sm text-red-800 dark:text-red-200 font-medium">
                      ⚠️ DSN Not Configured
                    </p>
                    <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                      Check Vercel Environment Variables:<br />
                      Settings → Environment Variables → NEXT_PUBLIC_SENTRY_DSN
                    </p>
                  </div>
                )}
              </div>

              {lastError && (
                <p className="text-sm text-orange-600 mt-2">
                  Last action: {lastError}
                </p>
              )}
            </div>

            {/* Test Buttons */}
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Manual Capture (Recommended First)</h3>
                <Button onClick={triggerManualCapture} variant="outline" className="w-full">
                  Send Test Message to Sentry
                </Button>
                <p className="text-xs text-muted-foreground mt-1">
                  Directly calls Sentry.captureMessage(). Best for debugging DSN issues.
                </p>
              </div>

              <div>
                <h3 className="font-medium mb-2">Client-Side Error</h3>
                <Button onClick={triggerError} variant="destructive" className="w-full">
                  Trigger Client Error
                </Button>
                <p className="text-xs text-muted-foreground mt-1">
                  Throws an error immediately. Should appear in Sentry within 30 seconds.
                </p>
              </div>

              <div>
                <h3 className="font-medium mb-2">Async Error</h3>
                <Button onClick={triggerAsyncError} variant="destructive" className="w-full">
                  Trigger Async Error
                </Button>
                <p className="text-xs text-muted-foreground mt-1">
                  Throws an error in an async operation. Tests promise rejection tracking.
                </p>
              </div>

              <div>
                <h3 className="font-medium mb-2">API Error</h3>
                <Button onClick={triggerAPIError} variant="destructive" className="w-full">
                  Trigger API Error
                </Button>
                <p className="text-xs text-muted-foreground mt-1">
                  Calls a server endpoint that throws an error. Tests server-side tracking.
                </p>
              </div>
            </div>

            {/* Instructions */}
            <div className="border-t pt-4 space-y-2 text-sm text-muted-foreground">
              <p>
                <strong>Debugging Steps:</strong>
              </p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Check configuration status above</li>
                <li>Open browser DevTools (F12) → Console tab</li>
                <li>Click &ldquo;Send Test Message to Sentry&rdquo;</li>
                <li>Look for console logs about Sentry</li>
                <li>Check Sentry dashboard after 30 seconds</li>
              </ol>
              <p className="mt-4 text-orange-600 font-medium">
                ⚠️ Remember to DELETE this test page before deploying to production!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

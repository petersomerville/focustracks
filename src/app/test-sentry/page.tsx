'use client'

/**
 * Sentry Test Page
 *
 * This page provides buttons to test Sentry error capture.
 * DELETE THIS FILE after verifying Sentry is working.
 */

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, CheckCircle } from 'lucide-react'
import { useState } from 'react'

export default function TestSentryPage() {
  const [lastError, setLastError] = useState<string>('')

  const triggerError = () => {
    setLastError('Client-side error triggered')
    throw new Error('Test Sentry Error - Client Side')
  }

  const triggerAsyncError = async () => {
    setLastError('Async error triggered')
    await new Promise(resolve => setTimeout(resolve, 100))
    throw new Error('Test Sentry Error - Async Operation')
  }

  const triggerAPIError = async () => {
    setLastError('API error triggered')
    try {
      const response = await fetch('/api/test-sentry-error')
      if (!response.ok) {
        throw new Error('API returned error')
      }
    } catch (error) {
      console.error('API Error:', error)
    }
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
            {/* Status */}
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex items-center space-x-2 text-sm">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-medium">Sentry is configured</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                DSN: {process.env.NEXT_PUBLIC_SENTRY_DSN?.substring(0, 30)}...
              </p>
              {lastError && (
                <p className="text-sm text-orange-600 mt-2">
                  Last action: {lastError}
                </p>
              )}
            </div>

            {/* Test Buttons */}
            <div className="space-y-4">
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
                <strong>After clicking a button:</strong>
              </p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Wait 10-30 seconds for Sentry to process</li>
                <li>Check your browser console for the error</li>
                <li>Visit your Sentry dashboard to see the captured error</li>
                <li>Verify the error has full stack traces</li>
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

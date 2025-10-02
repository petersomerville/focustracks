/**
 * Sentry Test API Route
 *
 * This endpoint intentionally throws an error to test server-side Sentry capture.
 * DELETE THIS FILE after verifying Sentry is working.
 */

export async function GET() {
  // Intentionally throw an error for Sentry testing
  throw new Error('Test Sentry Error - Server Side API Route')
}

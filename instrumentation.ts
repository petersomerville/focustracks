/**
 * Next.js instrumentation file
 *
 * This file runs before any other code in your application,
 * making it the perfect place to initialize monitoring SDKs like Sentry.
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config')
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config')
  }
}

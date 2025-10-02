# Production Monitoring Setup Guide

This guide covers the production monitoring tools configured for FocusTracks: Sentry for error tracking and Vercel Analytics for user behavior and performance monitoring.

## Table of Contents
- [Sentry Error Tracking](#sentry-error-tracking)
- [Vercel Analytics](#vercel-analytics)
- [Environment Configuration](#environment-configuration)
- [Testing Error Capture](#testing-error-capture)
- [Monitoring Best Practices](#monitoring-best-practices)

---

## Sentry Error Tracking

### What It Does
Sentry automatically captures and reports:
- Unhandled JavaScript errors (client-side)
- API route errors (server-side)
- React component errors (via ErrorBoundary)
- Performance issues and slow transactions
- User context (authenticated users, session data)

### Free Tier Limits
- **5,000 events/month** (plenty for learning projects)
- Full error details with stack traces
- Source map support for production debugging
- Performance monitoring included

### Setup Steps

1. **Create a Sentry Account**
   - Go to [sentry.io](https://sentry.io)
   - Sign up for free account
   - Create a new project (select "Next.js")

2. **Get Your Configuration Values**
   ```
   Navigate to: Settings → Projects → [your-project] → Client Keys (DSN)
   ```

   You'll need:
   - **DSN**: Public key for error reporting
   - **Organization Slug**: Your org name in URLs
   - **Project Slug**: Your project name in URLs
   - **Auth Token**: For source map uploads (Settings → Auth Tokens)

3. **Add Environment Variables**

   Update `.env.local`:
   ```bash
   # Sentry Configuration
   NEXT_PUBLIC_SENTRY_DSN=https://YOUR_KEY@o123456.ingest.sentry.io/123456
   SENTRY_ORG=your-org-slug
   SENTRY_PROJECT=your-project-slug
   SENTRY_AUTH_TOKEN=your-auth-token
   ```

   For Vercel deployment, add these to your **Vercel project settings**:
   - Go to Project Settings → Environment Variables
   - Add each variable for Production, Preview, and Development
   - **Important**: Never commit `.env.local` to Git!

4. **Verify Configuration**

   Build the project to ensure Sentry is properly integrated:
   ```bash
   npm run build
   ```

   You should see Sentry plugin messages during build (source map uploads).

### Configuration Files

- **`sentry.client.config.ts`** - Client-side error tracking (browser)
- **`sentry.server.config.ts`** - Server-side error tracking (API routes, SSR)
- **`sentry.edge.config.ts`** - Edge runtime error tracking (middleware)
- **`instrumentation.ts`** - Early initialization hook for Sentry
- **`next.config.ts`** - Webpack plugin for source map uploads

### What Gets Tracked

✅ **Automatically Tracked:**
- Unhandled promise rejections
- Console errors
- React render errors (via ErrorBoundary)
- API route exceptions
- Middleware errors
- Network request failures

❌ **Not Tracked in Development:**
- The `beforeSend` hook filters out development errors
- This prevents noise in your Sentry dashboard while developing

### Viewing Errors

1. Log into [sentry.io](https://sentry.io)
2. Navigate to your project
3. View the "Issues" tab for all captured errors
4. Click an issue to see:
   - Full stack trace with source maps
   - User context (if authenticated)
   - Breadcrumbs (user actions leading to error)
   - Environment details

---

## Vercel Analytics

### What It Does

**Vercel Analytics** tracks:
- Page views and navigation
- Traffic sources (referrers, UTM parameters)
- Geographic distribution of users
- Device and browser statistics

**Vercel Speed Insights** monitors:
- Core Web Vitals (LCP, FID, CLS)
- Time to First Byte (TTFB)
- First Contentful Paint (FCP)
- Real user performance metrics

### Free Tier Limits
- **50,000 events/month** (20x increase in 2025!)
- Real-time analytics dashboard
- Core Web Vitals tracking
- No credit card required

### Setup Steps

1. **Deploy to Vercel**

   If you haven't already:
   ```bash
   npm install -g vercel
   vercel login
   vercel
   ```

2. **Enable Analytics**

   In Vercel dashboard:
   - Go to your project
   - Navigate to "Analytics" tab
   - Click "Enable Analytics" (free)
   - Analytics start tracking immediately

3. **Enable Speed Insights**

   In Vercel dashboard:
   - Go to "Speed Insights" tab
   - Click "Enable Speed Insights"
   - Real User Monitoring (RUM) begins automatically

### Configuration Files

- **`src/app/layout.tsx`** - Analytics and SpeedInsights components added to root layout

### What Gets Tracked

**Page Views:**
- Every route navigation (client-side and server-side)
- Time spent on each page
- Bounce rates

**Performance Metrics:**
- **LCP** (Largest Contentful Paint) - Loading performance
- **FID** (First Input Delay) - Interactivity
- **CLS** (Cumulative Layout Shift) - Visual stability
- **TTFB** (Time to First Byte) - Server response time

### Viewing Analytics

1. Go to your project in [vercel.com](https://vercel.com)
2. Click **Analytics** tab for:
   - Page views over time
   - Top pages by traffic
   - Audience demographics
   - Traffic sources
3. Click **Speed Insights** tab for:
   - Core Web Vitals scores
   - Performance trends
   - Slow page detection

---

## Environment Configuration

### Local Development (.env.local)

```bash
# Sentry (optional for local dev)
NEXT_PUBLIC_SENTRY_DSN=https://YOUR_KEY@o123456.ingest.sentry.io/123456
SENTRY_ORG=your-org-slug
SENTRY_PROJECT=your-project-slug
SENTRY_AUTH_TOKEN=your-auth-token
```

### Vercel Production

Add to **Project Settings → Environment Variables**:

| Variable | Scope | Description |
|----------|-------|-------------|
| `NEXT_PUBLIC_SENTRY_DSN` | All | Public Sentry DSN (safe to expose) |
| `SENTRY_ORG` | Production only | Organization slug |
| `SENTRY_PROJECT` | Production only | Project slug |
| `SENTRY_AUTH_TOKEN` | Production only | Auth token for source maps |

**Note**: Vercel Analytics works automatically on Vercel deployments - no env vars needed!

---

## Testing Error Capture

### Test Sentry Client-Side Error

Add a test button to any page (remove after testing):

```tsx
<button onClick={() => {
  throw new Error('Test Sentry error capture!')
}}>
  Trigger Test Error
</button>
```

Check Sentry dashboard within ~30 seconds to see the error.

### Test Sentry Server-Side Error

Add to any API route:

```typescript
// pages/api/test-sentry.ts
export async function GET() {
  throw new Error('Test server-side error!')
}
```

Visit `/api/test-sentry` and check Sentry dashboard.

### Test Vercel Analytics

Just browse your deployed site! Analytics are collected automatically. View the Vercel dashboard after 5-10 minutes to see data.

---

## Monitoring Best Practices

### 1. **Error Grouping**
Sentry groups similar errors together. Use meaningful error messages:

```typescript
// ❌ Bad
throw new Error('Error')

// ✅ Good
throw new Error('Failed to fetch user profile: Invalid user ID')
```

### 2. **User Context**
Add user context to errors for better debugging:

```typescript
import * as Sentry from '@sentry/nextjs'

// In authentication flow
Sentry.setUser({
  id: user.id,
  email: user.email,
  username: user.email
})

// On logout
Sentry.setUser(null)
```

### 3. **Custom Error Tags**
Add tags to categorize errors:

```typescript
Sentry.captureException(error, {
  tags: {
    feature: 'playlist-management',
    action: 'delete-track'
  }
})
```

### 4. **Performance Monitoring**
Monitor slow operations:

```typescript
import * as Sentry from '@sentry/nextjs'

const transaction = Sentry.startTransaction({
  name: 'Fetch Playlist Tracks',
  op: 'database.query'
})

try {
  const tracks = await fetchTracks()
  transaction.finish()
} catch (error) {
  transaction.finish()
  throw error
}
```

### 5. **Filter Sensitive Data**
Sentry automatically scrubs common sensitive fields (passwords, tokens), but you can add custom filtering in the `beforeSend` hook:

```typescript
// sentry.client.config.ts
beforeSend(event) {
  // Remove sensitive query parameters
  if (event.request?.url) {
    event.request.url = event.request.url.replace(/apiKey=[^&]+/, 'apiKey=REDACTED')
  }
  return event
}
```

### 6. **Alert Configuration**
Set up Sentry alerts:
- **Settings → Alerts → New Alert Rule**
- Common rules:
  - New issue appears
  - Issue frequency exceeds threshold
  - Error rate spikes

### 7. **Release Tracking**
Tag errors by release version:

```bash
# Set release in build
export SENTRY_RELEASE=$(git rev-parse --short HEAD)
npm run build
```

This helps identify which deployment introduced a bug.

---

## Troubleshooting

### Sentry Not Capturing Errors

1. **Check DSN configuration**
   ```bash
   echo $NEXT_PUBLIC_SENTRY_DSN
   ```

2. **Verify Sentry is initialized**
   - Check browser console for Sentry initialization logs
   - Look for network requests to `sentry.io`

3. **Development mode filtering**
   - Errors in development are filtered by default
   - Deploy to production or set `NODE_ENV=production` locally

### Vercel Analytics Not Showing Data

1. **Wait 5-10 minutes** - Analytics have a slight delay
2. **Check deployment** - Analytics only work on Vercel-hosted sites
3. **Verify Analytics component** - Should be in root layout
4. **Check browser console** - Look for any errors from `@vercel/analytics`

### Build Failures with Sentry

1. **Check auth token** - Must have "Project: Write" scope
2. **Verify org/project slugs** - Must match exactly (case-sensitive)
3. **Source map uploads** - May fail on slow connections (build continues anyway)

---

## Cost Monitoring

Both tools are free for learning projects, but monitor usage:

### Sentry
- Dashboard → Usage & Billing
- Alerts when approaching 5k events/month
- Spike protection automatically enabled

### Vercel Analytics
- Project → Analytics → Usage
- Grace period of 3 days after exceeding 50k events
- Collection pauses after grace period (no charges on Hobby plan)

---

## Next Steps

After setup, consider:

1. **Custom Events** - Track user actions with Vercel Analytics
2. **Performance Budgets** - Set thresholds for Core Web Vitals
3. **Error Alerts** - Configure Sentry to notify you of critical issues
4. **Release Health** - Track error rates per deployment
5. **User Feedback** - Add Sentry User Feedback widget

---

## Resources

- [Sentry Next.js Docs](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Vercel Analytics Docs](https://vercel.com/docs/analytics)
- [Core Web Vitals Guide](https://web.dev/vitals/)
- [Sentry Best Practices](https://docs.sentry.io/platforms/javascript/best-practices/)

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FocusTracks is a music discovery and playlist application built as a technical learning project. The primary purpose is to demonstrate proficiency with modern web technologies while creating a functional music platform for focus and productivity tracks.

**Key Technologies**: React 19.1, Next.js 15.5, TypeScript 5, Tailwind CSS v4, Supabase 2.57, Node.js

## Development Commands

### Core Development
- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build production bundle with Turbopack
- `npm start` - Start production server
- `npm run lint` - Run ESLint for code quality
- `npm run validate-youtube` - Validate all YouTube URLs in mock data

### Environment Setup
Ensure these environment variables are configured:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key

## Architecture Overview

### Frontend Architecture
- **App Router**: Uses Next.js 15 App Router (`src/app/` directory)
- **Component Structure**: Reusable components in `src/components/`
- **Context Providers**: Global state management via React Context
  - `AuthContext` - User authentication and session management
  - `ThemeContext` - Dark/light theme switching with system preference support
- **Custom Hooks**: Business logic abstraction in `src/hooks/`
- **TypeScript**: Full type safety with interface definitions in `src/lib/supabase.ts`

### Backend Integration
- **API Routes**: Next.js API routes in `src/app/api/`
  - `/api/auth/*` - Authentication endpoints (login, register, logout)
  - `/api/tracks` - Track listing and search
  - `/api/playlists/*` - Playlist CRUD operations
  - `/api/submissions/*` - Track submission workflow
- **Database**: Supabase PostgreSQL with real-time capabilities
  - Row Level Security (RLS) enabled on all tables
  - See `docs/migrations/README.md` for schema history
  - See `docs/migrations/archive/` for historical migration scripts
- **Authentication**: Supabase Auth with email/password
  - Service role vs anonymous key pattern (see Authentication Patterns below)

### Key Database Types
```typescript
interface Track {
  id: string
  title: string
  artist: string
  genre: string
  duration: number
  audio_url: string
  created_at: string
}

interface Playlist {
  id: string
  name: string
  user_id: string
  created_at: string
  updated_at: string
}
```

## Component Architecture

### Core Components
- **Header** - Navigation with search and auth controls
- **TrackCard** - Individual track display with play/playlist actions
- **YouTubePlayer** - Embedded YouTube player for audio playback
- **AuthModal** - Login/register modal forms
- **ProtectedRoute** - Route protection wrapper
- **ThemeToggle** - Theme switching component

### Context Usage
All components have access to:
- `useAuth()` - Current user state and auth methods
- `useTheme()` - Theme state and switching functionality

## Styling System

- **Tailwind CSS v4** - Utility-first CSS framework with new @variant syntax
- **Dark Mode Configuration**: Uses `@variant dark (.dark &);` in globals.css
- **No Config File**: Tailwind v4 uses CSS-based configuration, not tailwind.config.js
- **Theme Switching**: Automatic theme switching based on user preference
- **Responsive Design**: Mobile-first approach with responsive breakpoints
- **Theme Classes**: Uses `.light` and `.dark` classes on document root

## Authentication Flow

1. Supabase handles user registration/login
2. Auth state managed in `AuthContext` with real-time updates
3. Protected routes check authentication status
4. Session persistence handled automatically by Supabase

## Version Checking Protocol

**CRITICAL**: Before starting any new feature or making architectural changes, ALWAYS check current versions of key technologies:

### Universal Discovery Commands:
```bash
# Identify project type and check common config files
ls -la | grep -E "(package\.json|requirements\.txt|Pipfile|Cargo\.toml|go\.mod|composer\.json)"

# Check for language/runtime versions
python --version 2>/dev/null || echo "Python not found"
node --version 2>/dev/null || echo "Node.js not found"
php --version 2>/dev/null || echo "PHP not found"
go version 2>/dev/null || echo "Go not found"
```

### Project-Specific Checks (customize per project):
```bash
# For JavaScript/Node.js projects:
cat package.json | grep -E "(react|next|typescript|tailwindcss|@supabase)"

# For Python projects:
cat requirements.txt | head -10
cat pyproject.toml | grep -E "(python|flask|django|fastapi)" 2>/dev/null

# For any project - check README for version info:
head -20 README.md | grep -i version
```

**🚨 CLAUDE CODE REMINDER**: When working on a new project or unfamiliar tech stack, ASK THE USER to customize this section with project-specific version commands and considerations.

**Current Project-Specific Considerations:**
- **Tailwind CSS v4**: Uses `@variant` syntax in CSS, no config file needed
- **Next.js 15**: App Router is default, Turbopack enabled
- **React 19**: Updated TypeScript types, new hooks behavior
- **TypeScript 5**: New features and stricter type checking

## Development Guidelines

### File Organization
- Components: `src/components/ComponentName.tsx`
- Pages: `src/app/page-name/page.tsx`
- API Routes: `src/app/api/endpoint/route.ts`
- Types: Defined in `src/lib/supabase.ts`
- Hooks: `src/hooks/useHookName.ts`
- Documentation: `docs/` directory
  - `docs/ADRs/` - Architectural Decision Records
  - `docs/migrations/` - Database migration documentation
  - `docs/migrations/archive/` - Historical SQL migration scripts

### Code Standards
- All new code must be TypeScript with proper typing
- Use functional components with hooks
- Follow existing naming conventions (PascalCase for components, camelCase for functions)
- Implement proper error handling in API routes
- Use Tailwind classes for styling (avoid custom CSS)

### Music Integration
- Primary audio source: YouTube URLs in track records
- Player component handles YouTube iframe API integration
- Track metadata stored in Supabase database
- YouTube URL validation utilities in `src/lib/youtube-validator.ts`
- Run `npm run validate-youtube` to check all URLs before deployment

## Authentication Patterns (Lessons Learned)

### When to Use Service Role vs Anonymous Key

**Critical Decision Point**: Supabase provides two client types with different security implications.

#### Anonymous Key Client (Default)
Use for **user-scoped operations** where RLS policies should be enforced:
- User viewing their own playlists
- User submitting tracks
- User modifying their own data
- Any operation that should respect Row Level Security

#### Service Role Client (Admin Operations)
Use for **cross-user operations** that need to bypass RLS policies:
- Admin approving/rejecting submissions
- Admin operations affecting multiple users
- System-level operations
- Database migrations

#### Implementation Pattern

```typescript
// Step 1: Verify admin status using anonymous key client
const { data: { session } } = await supabase.auth.getSession()
if (!session) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

const { data: profile } = await supabase
  .from('user_profiles')
  .select('role')
  .eq('user_id', session.user.id)
  .single()

if (profile?.role !== 'admin') {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

// Step 2: Use service role for admin operations
const { createClient } = require('@supabase/supabase-js')
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

// Step 3: Perform cross-user operation
const { error } = await supabaseAdmin
  .from('submissions')
  .update({ status: 'approved' })
  .eq('id', submissionId)
```

**Reference Files**:
- `src/app/api/submissions/[id]/route.ts` - Admin approval implementation
- Commit: `92a9f53` - Fix for admin approval 403 errors

---

## Form Validation Patterns (Lessons Learned)

### Optional URL Fields and Zod Schemas

**Problem**: Zod schemas expect `undefined` for optional fields, but HTML forms submit empty strings `""`.

**Solution**: Filter out empty strings before API submission.

#### Implementation Pattern

```typescript
// ❌ WRONG - Sends empty strings to Zod schema
const submissionData = {
  title: formData.title,
  youtube_url: formData.youtube_url,  // May be ""
  spotify_url: formData.spotify_url   // May be ""
}

// ✅ CORRECT - Conditionally include only truthy values
const submissionData = {
  title: formData.title,
  artist: formData.artist,
  genre: formData.genre,
  duration: parseDurationToSeconds(formData.duration),
  description: formData.description,
  // Only spread if value exists after trimming
  ...(formData.youtube_url.trim() && { youtube_url: formData.youtube_url.trim() }),
  ...(formData.spotify_url.trim() && { spotify_url: formData.spotify_url.trim() })
}
```

**Why This Matters**:
- Zod's `.optional()` means "field can be undefined"
- Empty string `""` is NOT undefined
- This causes validation failures: "Expected undefined, received string"

**Reference Files**:
- `src/components/TrackSubmissionForm.tsx:72-80` - Correct implementation
- `src/lib/api-schemas.ts:104-114` - Schema definition with refinement
- Commit: `92a9f53` - Fix for track submission validation

---

## Testing Requirements (Lessons Learned)

### Test Coverage Standards

**Minimum Coverage Thresholds**:
- **Utility functions**: 90%+ coverage (`src/lib/**`)
- **API schemas**: 90%+ coverage (`src/lib/api-schemas.ts`)
- **Components**: 80%+ coverage (`src/components/**`)
- **API routes**: 70%+ coverage (`src/app/api/**`)

### Test-First Development Approach

**SOP**: Write tests BEFORE marking features complete:

1. **Write failing test** describing desired behavior
2. **Implement feature** to make test pass
3. **Refactor** with tests as safety net
4. **Verify coverage** meets threshold

### Accessibility Testing Requirements

**All forms MUST pass accessibility tests**:

```typescript
// ✅ CORRECT - Use getByLabelText (requires proper labels)
const titleInput = screen.getByLabelText(/track title/i)

// ❌ WRONG - Don't use getByPlaceholderText (accessibility anti-pattern)
const titleInput = screen.getByPlaceholderText('Enter title')
```

**Required Attributes**:
- Every `<input>` must have associated `<label>` with `htmlFor`
- Input must have `id` matching label's `htmlFor`
- Required fields must have `aria-required="true"`
- Form sections should use `<fieldset>` and `<legend>`

**Reference Files**:
- `src/components/__tests__/TrackSubmissionForm.test.tsx` - Accessibility test examples
- `src/components/TrackSubmissionForm.tsx:202-230` - Proper label implementation

### Test Organization

Use descriptive `describe` blocks to organize tests:

```typescript
describe('ComponentName', () => {
  describe('Rendering', () => {
    // Tests for initial render, conditional rendering
  })

  describe('Accessibility', () => {
    // Tests for ARIA labels, keyboard navigation
  })

  describe('Form Validation', () => {
    // Tests for validation rules, error messages
  })

  describe('User Interactions', () => {
    // Tests for clicks, typing, form submission
  })

  describe('API Integration', () => {
    // Tests for successful/failed API calls
  })
})
```

---

## API Route Testing Patterns (Lessons Learned)

### Test Infrastructure

**Mock Framework**: Built custom Supabase mocking infrastructure for isolated API route testing.

**Key Files**:
- `src/__tests__/helpers/supabase-mock.ts` - Mock Supabase client with chainable query builder
- `src/__tests__/helpers/api-test-utils.ts` - Utilities for creating requests and parsing responses
- Mock data factories for User, Track, Playlist, PlaylistTrack

### Testing Next.js 15 API Routes

**Environment Configuration**: API routes require `node` environment, while components need `jsdom`.

```typescript
/**
 * @jest-environment node
 */
```

Add this docblock to API route test files to override the default `jsdom` environment.

### Test Organization Pattern

```typescript
describe('/api/endpoint/[id]', () => {
  let mockSupabase: MockSupabaseClient
  const { createServerSupabaseClient } = require('@/lib/supabase-server')

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient()
    createServerSupabaseClient.mockResolvedValue(mockSupabase)
  })

  afterEach(() => {
    jest.clearAllMocks()
    mockSupabase.resetMocks()
  })

  describe('GET', () => {
    it('returns 401 when user is not authenticated', async () => {
      mockSupabase.auth.mockUser(null)
      // ... test implementation
    })

    it('successfully fetches resource', async () => {
      mockSupabase.auth.mockUser(createMockUser())
      mockSupabase.mockTable('table_name').mockResolvedValue(mockData)
      // ... test implementation
    })
  })
})
```

### Mock Configuration Pattern

**Critical**: Configure mocks BEFORE the API route executes:

```typescript
// ✅ CORRECT - Pre-configure table response
mockSupabase.mockTable('playlists').mockResolvedValue(mockPlaylist)

const response = await GET(request, { params })

// ❌ WRONG - Too late, route already executed
const response = await GET(request, { params })
mockSupabase.mockTable('playlists').mockResolvedValue(mockPlaylist)
```

### Error Response Assertions

FocusTracks uses this error format: `{ error: string, message?: string, code?: string }`

```typescript
expectErrorResponse(result, 401, {
  message: 'You must be logged in to view playlists',
  code: 'UNAUTHORIZED'
})
```

### Coverage Standards

- **API Routes**: 70%+ coverage (auth, validation, error handling, success paths)
- **Utility Functions**: 90%+ coverage
- **Components**: 80%+ coverage

**Current Status**: 158 tests passing, including 15 API route integration tests for `/api/playlists/[id]`

**Reference Files**:
- `src/app/api/playlists/[id]/__tests__/route.test.ts` - Complete API route test example
- `src/__tests__/helpers/supabase-mock.ts` - Mock implementation details

---

## Production Monitoring

### Sentry Error Tracking

**What**: Automatic error capture and reporting for production debugging

**Setup**: See `docs/MONITORING_SETUP.md` for complete configuration guide

**Key Files**:
- `sentry.client.config.ts` - Browser error tracking
- `sentry.server.config.ts` - Server-side error tracking
- `sentry.edge.config.ts` - Middleware error tracking
- `instrumentation.ts` - Early initialization hook

**Environment Variables Required**:
```bash
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
SENTRY_ORG=your-org-slug
SENTRY_PROJECT=your-project-slug
SENTRY_AUTH_TOKEN=your-auth-token
```

**What Gets Tracked**:
- Unhandled JavaScript errors (client-side)
- API route exceptions (server-side)
- React component errors (via ErrorBoundary)
- Performance issues and slow transactions
- User context for authenticated users

**Integration Points**:
- `src/components/ErrorBoundary.tsx` - Captures React errors and sends to Sentry
- `next.config.ts` - Webpack plugin for source map uploads

**Free Tier**: 5,000 events/month

### Vercel Analytics & Speed Insights

**What**: User behavior tracking and Core Web Vitals monitoring

**Setup**: Automatically enabled on Vercel deployments (no env vars needed)

**Key Files**:
- `src/app/layout.tsx` - Analytics and SpeedInsights components

**What Gets Tracked**:
- **Analytics**: Page views, traffic sources, user demographics
- **Speed Insights**: LCP, FID, CLS, TTFB (Core Web Vitals)

**Viewing Data**:
- Vercel Dashboard → Analytics tab
- Vercel Dashboard → Speed Insights tab
- Real-time data with ~5-10 minute delay

**Free Tier**: 50,000 events/month

### Monitoring Best Practices

1. **Meaningful Error Messages**: Use descriptive error messages for better Sentry grouping
2. **User Context**: Set user context in authentication flow for debugging
3. **Error Tags**: Categorize errors by feature/action
4. **Performance Monitoring**: Track slow database queries and API calls
5. **Alert Configuration**: Set up Sentry alerts for critical issues
6. **Release Tracking**: Tag errors by deployment version

**Reference Files**:
- `docs/MONITORING_SETUP.md` - Complete setup and troubleshooting guide

---

## Project Context

This is a learning-focused project designed to demonstrate full-stack development skills. The codebase prioritizes clean architecture and proper TypeScript usage over complex features. Refer to `focustracks_PRD.md` for detailed product requirements and learning objectives.
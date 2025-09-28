# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FocusTracks is a music discovery and playlist application built as a technical learning project. The primary purpose is to demonstrate proficiency with modern web technologies while creating a functional music platform for focus and productivity tracks.

**Key Technologies**: React 18, Next.js 15, TypeScript, Tailwind CSS, Supabase, Node.js

## Development Commands

### Core Development
- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build production bundle with Turbopack
- `npm start` - Start production server
- `npm run lint` - Run ESLint for code quality

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
- **Database**: Supabase PostgreSQL with real-time capabilities
- **Authentication**: Supabase Auth with email/password

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

- **Tailwind CSS v4** - Utility-first CSS framework
- **Dark Mode**: Automatic theme switching based on user preference
- **Responsive Design**: Mobile-first approach with responsive breakpoints
- **Theme Classes**: Uses `.light` and `.dark` classes on document root

## Authentication Flow

1. Supabase handles user registration/login
2. Auth state managed in `AuthContext` with real-time updates
3. Protected routes check authentication status
4. Session persistence handled automatically by Supabase

## Development Guidelines

### File Organization
- Components: `src/components/ComponentName.tsx`
- Pages: `src/app/page-name/page.tsx`
- API Routes: `src/app/api/endpoint/route.ts`
- Types: Defined in `src/lib/supabase.ts`
- Hooks: `src/hooks/useHookName.ts`

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

## Project Context

This is a learning-focused project designed to demonstrate full-stack development skills. The codebase prioritizes clean architecture and proper TypeScript usage over complex features. Refer to `focustracks_PRD.md` for detailed product requirements and learning objectives.
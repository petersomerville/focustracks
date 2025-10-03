# FocusTracks - Product Requirements Document

**Document Version:** 2.0
**Date Created:** 2025-09-12
**Last Updated:** 2025-01-15
**Author(s):** Peter Somerville
**Target Audience:** Development Team
**Status:** Production-Ready with Full Observability

## 1. Executive Summary

### 1.1 Product Vision

FocusTracks is a simple web application that demonstrates proficiency with modern web development technologies while providing a basic platform for discovering focus music. The primary purpose is to showcase technical skills and learn new frameworks.

### 1.2 Product Mission

To create a minimal viable product that demonstrates expertise in React, Next.js, TypeScript, Tailwind CSS, Supabase, and Node.js while keeping the feature set simple enough to focus on technical implementation rather than complex product requirements.

### 1.3 Success Metrics

- **Primary**: Technical demonstration (clean, well-structured code using all target technologies)
- **Secondary**: Learning objectives (successful implementation of new frameworks and tools)
- **Tertiary**: Basic functionality (users can discover and play music)

## 2. Product Overview

### 2.1 Target Audience

- **Primary**: Potential employers reviewing technical portfolio
- **Secondary**: Technical interviewers evaluating full-stack development skills
- **Tertiary**: Basic users who want to discover focus music

### 2.2 Learning Objectives

#### 2.2.1 Frontend Technologies

- **React 19.1**: Component-based architecture, hooks, state management, modern features
- **Next.js 15.5**: App router, server-side rendering, API routes, Turbopack
- **TypeScript**: Type safety, interfaces, generics
- **Tailwind CSS**: Utility-first styling, responsive design

#### 2.2.2 Backend Technologies

- **Node.js**: Server-side JavaScript runtime
- **Next.js API Routes**: Server-side API endpoints, middleware, routing
- **Supabase**: Database, authentication, real-time features

#### 2.2.3 Full-Stack Integration

- **API Design**: RESTful endpoints, error handling, validation
- **Database Design**: Schema design, relationships, queries
- **Authentication**: User management, protected routes
- **Deployment**: Production deployment, environment configuration

#### 2.2.4 Production Engineering (✅ Completed)

- **Testing**: Jest 30 with React Testing Library (158 tests, 70-90% coverage)
- **API Testing**: Mock Supabase infrastructure for integration tests
- **Security**: CSP, rate limiting, input validation, RLS policies
- **Error Tracking**: Sentry (client + server + edge runtime)
- **Analytics**: Vercel Analytics for user behavior insights
- **Performance**: Vercel Speed Insights for Core Web Vitals (LCP, FID, CLS)
- **Observability**: Full production monitoring and debugging capabilities

## 3. Product Goals & Objectives

### 3.1 Primary Goals

1. **Technical Learning**: Master React, Next.js, TypeScript, Tailwind CSS, Supabase, and Node.js
2. **Portfolio Demonstration**: Create a clean, well-architected codebase that showcases technical skills
3. **Simplicity**: Keep features minimal to focus on technical implementation and code quality
4. **Full-Stack Integration**: Demonstrate end-to-end development capabilities

### 3.2 Success Criteria

- **Code Quality**: Clean, well-documented, and properly typed TypeScript code
- **Technology Usage**: All target technologies implemented and demonstrated
- **Architecture**: Well-structured, scalable codebase with clear separation of concerns
- **Functionality**: Basic music discovery and playback working end-to-end
- **Deployment**: Successfully deployed and accessible online

## 4. Functional Requirements

### 4.1 Core Features (MVP)

#### 4.1.1 Music Discovery

- **Track List**: Display a curated list of focus music tracks
- **Basic Search**: Simple search by track title or artist
- **Category Filter**: Filter by basic categories (Study, Work, Ambient)
- **Track Details**: Show track information (title, artist, duration, genre)

#### 4.1.2 Music Player

- **Embedded Playback**: YouTube embedded player within the FocusTracks interface
- **External Links**: Direct links to Spotify tracks (opens in new tab/app)
- **Basic Controls**: Play/pause, skip forward/backward (via embedded player)
- **Track Display**: Current track title and artist
- **Volume Control**: Basic volume slider
- **Progress Bar**: Show playback progress
- **No File Storage**: All audio content served from external platforms

#### 4.1.3 User Authentication

- **Account Creation**: Email/password registration via Supabase
- **Login/Logout**: Basic authentication flow
- **Protected Routes**: Require authentication for certain features

#### 4.1.4 Simple Playlist

- **Create Playlist**: Basic playlist creation with name
- **Add Tracks**: Add tracks to playlist
- **View Playlist**: Display playlist with track list
- **Play Playlist**: Play all tracks in sequence

#### 4.1.5 User-Generated Content (Phase 4)

- **Track Submission**: Users can submit YouTube/Spotify links for focus music
- **Content Moderation**: Admin approval system for submitted tracks
- **User Roles**: Admin vs regular user permissions
- **Submission Guidelines**: Clear criteria for acceptable focus music

### 4.2 Technical Features (Learning Focus)

#### 4.2.1 Frontend Architecture

- **Component Structure**: Well-organized React components
- **State Management**: Proper use of React hooks and context
- **TypeScript**: Full type safety throughout the application
- **Responsive Design**: Mobile-first Tailwind CSS implementation

#### 4.2.2 Backend Architecture

- **API Routes**: Next.js API routes for backend functionality
- **Database Integration**: Supabase for data persistence
- **Authentication**: Supabase Auth integration
- **Error Handling**: Proper error handling and validation

#### 4.2.3 Full-Stack Integration

- **Data Flow**: Clean data flow between frontend and backend
- **Real-time Updates**: Supabase real-time subscriptions
- **File Structure**: Well-organized project structure
- **Environment Configuration**: Proper environment variable management

#### 4.2.4 Music Integration Architecture

- **No Local Audio Storage**: FocusTracks does not store or serve audio files directly
- **External Service Integration**: All music content sourced from YouTube and Spotify
- **Copyright Compliance**: Avoid copyright issues by linking to licensed platforms
- **Embedded Playback**: YouTube iframe API for in-app listening experience
- **Metadata Only**: Database stores track metadata and external service URLs
- **Dual Platform Support**: YouTube for embedded playback, Spotify for external links

## 5. Technical Requirements

### 5.1 Technology Stack

- **Frontend**: React 19.1, Next.js 15.5, TypeScript 5
- **Styling**: Tailwind CSS v4
- **Backend**: Node.js, Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Deployment**: Vercel
- **Music Integration**: YouTube embedded player (primary), Spotify Web API (secondary)
- **Audio Storage**: No local audio file storage - links to external services only

### 5.2 Database Schema (Simplified)

#### 5.2.1 Core Tables

```sql
-- Users table (handled by Supabase Auth)
users (id, email, created_at)

-- Tracks table (metadata linking to external services)
tracks (
  id, title, artist, genre, duration,
  youtube_url, spotify_url, external_id,
  created_at
)

-- Playlists table
playlists (
  id, name, user_id, created_at, updated_at
)

-- Playlist tracks junction table
playlist_tracks (
  id, playlist_id, track_id, position
)
```

### 5.3 API Endpoints (Simplified)

#### 5.3.1 Tracks

- `GET /api/tracks` - List all tracks with optional filtering
- `GET /api/tracks/[id]` - Get specific track details

#### 5.3.2 Playlists

- `GET /api/playlists` - Get user's playlists
- `POST /api/playlists` - Create new playlist
- `GET /api/playlists/[id]` - Get playlist with tracks
- `PUT /api/playlists/[id]` - Update playlist
- `DELETE /api/playlists/[id]` - Delete playlist
- `POST /api/playlists/[id]/tracks` - Add track to playlist
- `DELETE /api/playlists/[id]/tracks/[trackId]` - Remove track from playlist

#### 5.3.3 Search

- `GET /api/search` - Search tracks by title or artist

## 6. User Experience Requirements

### 6.1 Design Principles

- **Simplicity First**: Clean, minimal interface focused on core functionality
- **Mobile Responsive**: Works on all device sizes using Tailwind CSS
- **Fast Loading**: Optimized for quick page loads
- **Code Quality**: Well-structured, maintainable code

### 6.2 User Flows (Simplified)

#### 6.2.1 Basic User Flow

1. Land on homepage with track list
2. Browse and play tracks
3. Create account to save playlists
4. Create and manage playlists

### 6.3 Key Screens (MVP)

#### 6.3.1 Homepage

- Track list with play buttons
- Basic search bar
- Category filter buttons
- Login/signup buttons

#### 6.3.2 Playlist View

- Playlist name and track list
- Add/remove track buttons
- Play all button

#### 6.3.3 Music Player

- Fixed bottom player
- Current track info
- Play/pause and skip controls
- Volume slider

## 7. Non-Functional Requirements

### 7.1 Performance (Learning Focus)

- **Code Quality**: Clean, well-documented TypeScript code
- **Build Performance**: Fast development builds and hot reload
- **Runtime Performance**: Smooth user interactions
- **Bundle Size**: Optimized production bundle

### 7.2 Technical Standards

- **TypeScript**: Full type safety throughout the application
- **Code Organization**: Well-structured component and file organization
- **Error Handling**: Proper error boundaries and API error handling
- **Testing**: Basic unit tests for critical functionality

### 7.3 Security (Basic)

- **Authentication**: Secure user authentication via Supabase
- **Input Validation**: Basic input validation and sanitization
- **Environment Variables**: Proper environment variable management
- **HTTPS**: Secure connections in production

### 7.4 Code Quality

- **Documentation**: Clear code comments and README
- **Consistency**: Consistent coding style and patterns
- **Maintainability**: Easy to understand and modify code
- **Best Practices**: Following React, Next.js, and TypeScript best practices

## 8. Success Metrics & KPIs

### 8.1 Technical Learning Metrics

- **Technology Coverage**: All target technologies successfully implemented
- **Code Quality**: Clean, well-structured, and documented codebase
- **TypeScript Usage**: 100% TypeScript coverage with proper typing
- **Component Architecture**: Well-organized, reusable React components

### 8.2 Portfolio Demonstration

- **Deployment Success**: Successfully deployed and accessible online
- **Functionality**: Core features working end-to-end
- **Code Organization**: Clear project structure and file organization
- **Documentation**: Comprehensive README and code comments

### 8.3 Learning Objectives

- **React 19.1 Mastery**: Proper use of hooks, context, and component patterns
- **Next.js 15.5 Features**: App router, API routes, Turbopack, and SSR implementation
- **Database Integration**: Successful Supabase integration and queries
- **Full-Stack Flow**: Complete data flow from frontend to backend

## 9. Risk Assessment

### 9.1 Learning Risks

- **Technology Complexity**: Learning multiple new technologies simultaneously
- **Time Management**: Balancing feature development with learning objectives
- **Scope Creep**: Adding features that distract from learning goals

### 9.2 Mitigation Strategies

- **Incremental Learning**: Start with basic implementations and gradually add complexity
- **Focus on MVP**: Stick to minimal feature set to focus on technical implementation
- **Documentation**: Keep detailed notes on learning progress and challenges

## 10. Development Plan

### 10.1 Phase 1: Project Setup (Week 1)

- Initialize Next.js project with TypeScript
- Set up Tailwind CSS
- Configure Supabase project
- Create basic project structure
- Set up development environment

### 10.2 Phase 2: Core Features (Week 2-3)

- Implement basic track listing
- Create music player component
- Add user authentication
- Build playlist creation functionality
- Implement basic search

### 10.3 Phase 3: Polish & Deploy (Week 4)

- Add responsive design
- Implement error handling
- Add basic testing
- Deploy to Vercel
- Create documentation

### 10.4 Phase 4: User-Generated Content (Future Enhancement)

- Add track submission functionality
- Implement content moderation system
- Create admin interface for track approval
- Add user roles and permissions
- Enhance legal compliance for user-generated content

## 11. Success Criteria

### 11.1 Technical Success

- All target technologies successfully implemented
- Clean, well-documented codebase
- Successful deployment and accessibility
- Core functionality working end-to-end

### 11.2 Learning Success

- Demonstrated proficiency with React, Next.js, TypeScript
- Successful integration of Supabase and Next.js API routes
- Understanding of full-stack development patterns
- Portfolio-ready project showcasing technical skills

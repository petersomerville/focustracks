# FocusTracks 🎵

A modern music discovery and playlist application built with Next.js 15, React 19, TypeScript, and Supabase. FocusTracks helps you discover and organize music for focus and productivity.

## 🚀 Live Application

**Production URL:** [https://focustracks-5xenitgnv-petersomervilles-projects.vercel.app/](https://focustracks-5xenitgnv-petersomervilles-projects.vercel.app/)

## ✨ Features

- **🎵 Music Discovery**: Browse curated focus music tracks
- **🔍 Smart Search**: Search tracks by title or artist
- **🏷️ Genre Filtering**: Filter by Ambient, Classical, Electronic, Jazz, and more
- **🎧 YouTube Integration**: Embedded YouTube player for seamless listening
- **👤 User Authentication**: Secure login/register with Supabase Auth
- **📝 Playlist Management**: Create, manage, and organize personal playlists
- **✍️ Track Submissions**: Users can submit tracks for community review
- **👮 Admin Dashboard**: Content moderation and submission approval workflow
- **🔒 Row Level Security**: Database-level security with Supabase RLS policies
- **🌙 Dark Mode**: Light/dark/system theme switching
- **📱 Responsive Design**: Works perfectly on all devices
- **⚡ Real-time Updates**: Live data synchronization with Supabase

## 🛠️ Technology Stack

- **Frontend**: React 19.1, Next.js 15.5, TypeScript 5
- **Styling**: Tailwind CSS v4 with dark mode support
- **Backend**: Next.js API Routes with server-side rendering
- **Database**: Supabase (PostgreSQL) with Row Level Security (RLS)
- **Authentication**: Supabase Auth with role-based access control (user/admin)
- **Validation**: Zod schemas for type-safe API validation
- **Music Integration**: YouTube Iframe API for embedded playback
- **Testing**: Jest 30 with React Testing Library (142 tests, 90%+ coverage)
- **Logging**: Winston-style structured logging
- **Deployment**: Vercel with automatic deployments

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/focustracks.git
   cd focustracks
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create a `.env.local` file in the root directory:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

   > **Note**: The service role key is required for admin operations. See `docs/ADRs/001-service-role-pattern.md` for details.

4. **Run the development server**

   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

## 🏗️ Building for Production

```bash
# Build the application
npm run build

# Start production server
npm start
```

## 📁 Project Structure

```
focustracks/
├── .github/
│   └── PULL_REQUEST_TEMPLATE.md  # PR quality checklist
├── docs/
│   ├── ADRs/                     # Architectural Decision Records
│   │   └── 001-service-role-pattern.md
│   └── migrations/               # Database migration docs
│       ├── README.md             # Migration history
│       └── archive/              # Historical SQL scripts
├── scripts/
│   ├── migrate.js                # Database migration utility
│   └── validate-youtube-urls.js  # YouTube URL validator
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── api/                  # API routes
│   │   │   ├── auth/            # Authentication endpoints
│   │   │   ├── playlists/       # Playlist CRUD
│   │   │   ├── submissions/     # Track submission workflow
│   │   │   └── tracks/          # Track listing
│   │   ├── admin/               # Admin dashboard
│   │   ├── playlists/           # Playlist pages
│   │   └── page.tsx             # Home page
│   ├── components/              # React components
│   │   ├── __tests__/          # Component tests
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── AuthModal.tsx       # Authentication modal
│   │   ├── Header.tsx          # Navigation header
│   │   ├── TrackCard.tsx       # Track display
│   │   ├── TrackSubmissionForm.tsx  # Submission form
│   │   └── YouTubePlayer.tsx   # Music player
│   ├── contexts/               # React contexts
│   │   ├── AuthContext.tsx     # Auth state & session
│   │   └── ThemeContext.tsx    # Theme management
│   ├── hooks/                  # Custom React hooks
│   │   ├── __tests__/         # Hook tests
│   │   ├── useTracks.ts       # Track data
│   │   └── usePlaylists.ts    # Playlist management
│   └── lib/                    # Utilities
│       ├── __tests__/         # Utility tests
│       ├── api-schemas.ts     # Zod validation schemas
│       ├── logger.ts          # Winston-style logging
│       ├── supabase.ts        # Supabase client
│       └── utils.ts           # Helper functions
└── CLAUDE.md                   # AI development guide
```

## 🔧 API Endpoints

### Tracks
- `GET /api/tracks` - Fetch tracks with optional filtering and search

### Playlists
- `GET /api/playlists` - Get user playlists
- `POST /api/playlists` - Create new playlist
- `PATCH /api/playlists/[id]` - Update playlist
- `DELETE /api/playlists/[id]` - Delete playlist
- `POST /api/playlists/[id]/tracks` - Add track to playlist
- `DELETE /api/playlists/[id]/tracks/[trackId]` - Remove track from playlist

### Submissions
- `POST /api/submissions` - Submit track for review
- `GET /api/submissions` - Get user's submissions (admin sees all)
- `PATCH /api/submissions/[id]` - Approve/reject submission (admin only)

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout

## 🎯 Development Status

### ✅ Phase 1: Project Setup (Completed)

- [x] Next.js 15 with TypeScript
- [x] Tailwind CSS v4 setup
- [x] Supabase integration
- [x] Project structure

### ✅ Phase 2: Core Features (Completed)

- [x] Track listing with search and filtering
- [x] YouTube music player integration
- [x] User authentication system
- [x] Playlist creation and management
- [x] Dark/light theme system

### ✅ Phase 3: Polish & Deploy (Completed)

- [x] Enhanced error handling
- [x] Basic testing suite
- [x] Production deployment
- [x] Documentation

### ✅ Phase 4: User Submissions & Moderation (Completed)

- [x] Track submission form with validation
- [x] Admin dashboard for content moderation
- [x] Submission approval/rejection workflow
- [x] Row Level Security (RLS) policies
- [x] Service role authentication pattern

### ✅ Phase 5: Testing & Quality (Completed)

- [x] Comprehensive unit test suite (90 tests)
- [x] Component testing (52 tests)
- [x] Accessibility testing
- [x] Zod schema validation
- [x] Winston-style structured logging

### 🔮 Future Enhancements

- [ ] End-to-end testing with Playwright
- [ ] Advanced playlist features (collaborative playlists, sharing)
- [ ] Social features (likes, comments, user profiles)
- [ ] Spotify integration
- [ ] Advanced search with filters

## 📚 Documentation

- **`CLAUDE.md`** - Comprehensive guide for AI-assisted development
- **`docs/ADRs/`** - Architectural Decision Records documenting key technical decisions
- **`docs/migrations/`** - Database migration history and schema documentation
- **`.github/PULL_REQUEST_TEMPLATE.md`** - PR quality checklist

## ✅ Code Quality

- **142 Tests Passing**: 90 unit tests + 52 component tests
- **90%+ Coverage**: Utilities, schemas, and critical components
- **Zero Linter Errors**: ESLint compliance across entire codebase
- **100% TypeScript**: Full type safety with strict mode enabled
- **Accessibility First**: ARIA labels, keyboard navigation, screen reader support
- **Security**: Row Level Security, service role pattern, Zod validation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- YouTube for music integration
- Supabase for backend services
- Vercel for hosting and deployment
- The React and Next.js communities

---

**Built with ❤️ using modern web technologies**

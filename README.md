# FocusTracks 🎵

A modern music discovery and playlist application built with Next.js 15, React 19, TypeScript, and Supabase. FocusTracks helps you discover and organize music for focus and productivity.

## 🚀 Live Application

**Production URL:** [https://focustracks-5xenitgnv-petersomervilles-projects.vercel.app/](https://focustracks-5xenitgnv-petersomervilles-projects.vercel.app/)

## ✨ Features

- **🎵 Music Discovery**: Browse curated focus music tracks
- **🔍 Smart Search**: Search tracks by title or artist
- **🏷️ Genre Filtering**: Filter by Ambient, Classical, Electronic genres
- **🎧 YouTube Integration**: Embedded YouTube player for seamless listening
- **👤 User Authentication**: Secure login/register with Supabase Auth
- **📝 Playlist Management**: Create, manage, and organize personal playlists
- **🌙 Dark Mode**: Light/dark/system theme switching
- **📱 Responsive Design**: Works perfectly on all devices
- **⚡ Real-time Updates**: Live data synchronization with Supabase

## 🛠️ Technology Stack

- **Frontend**: React 19.1, Next.js 15.5, TypeScript 5
- **Styling**: Tailwind CSS v4 with dark mode support
- **Backend**: Next.js API Routes with server-side rendering
- **Database**: Supabase (PostgreSQL) with real-time capabilities
- **Authentication**: Supabase Auth with email/password
- **Music Integration**: YouTube Iframe API for embedded playback
- **Testing**: Jest with React Testing Library
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

   ```bash
   cp .env.example .env.local
   ```

   Add your Supabase credentials:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

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
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── playlists/         # Playlist pages
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── __tests__/        # Component tests
│   ├── AuthModal.tsx     # Authentication modal
│   ├── Header.tsx        # Navigation header
│   ├── TrackCard.tsx     # Track display component
│   └── YouTubePlayer.tsx # Music player
├── contexts/             # React contexts
│   ├── AuthContext.tsx   # Authentication state
│   └── ThemeContext.tsx  # Theme management
├── hooks/                # Custom React hooks
│   ├── __tests__/       # Hook tests
│   ├── useTracks.ts     # Track data management
│   └── usePlaylists.ts  # Playlist management
└── lib/                  # Utilities and configurations
    ├── supabase.ts      # Supabase client
    └── supabase-server.ts # Server-side Supabase
```

## 🔧 API Endpoints

- `GET /api/tracks` - Fetch tracks with optional filtering
- `GET /api/playlists` - Get user playlists
- `POST /api/playlists` - Create new playlist
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

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

### 🔮 Phase 4: Future Enhancements

- [ ] User-generated track submissions
- [ ] Content moderation system
- [ ] Advanced playlist features
- [ ] Social sharing capabilities

## ✅ Technical Debt Resolved

All technical debt and code quality issues have been resolved:

- ✅ **Jest Type Definitions**: Added `@types/jest` and proper TypeScript configuration
- ✅ **YouTube API Types**: Proper TypeScript types for YouTube Iframe API
- ✅ **Unused Variables**: Removed all unused imports and variables
- ✅ **useEffect Dependencies**: All hooks have proper dependency arrays
- ✅ **ESLint Compliance**: Zero linter errors across the entire codebase

### Code Quality Achievements

- **100% TypeScript Coverage**: Full type safety throughout the application
- **Zero Linter Errors**: Clean, consistent code following best practices
- **Comprehensive Testing**: 43 passing tests with proper Jest configuration
- **Modern Standards**: ES modules, proper dependency management, and clean architecture

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

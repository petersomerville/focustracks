'use client'

import { Music, Search, User, LogOut, List, Settings } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useState } from 'react'
import AuthModal from './AuthModal'
import ThemeToggle from './ThemeToggle'
import TrackSubmissionForm from './TrackSubmissionForm'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface HeaderProps {
  onSearch?: (query: string) => void
}

export default function Header({ onSearch }: HeaderProps) {
  const { user, userRole, signOut } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login')

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchQuery(query)
    onSearch?.(query)
  }

  const handleSignOut = async () => {
    await signOut()
  }

  const handleAuthClick = (mode: 'login' | 'signup') => {
    setAuthMode(mode)
    setShowAuthModal(true)
  }

  return (
    <header className="bg-card shadow-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Mobile Layout */}
        <div className="flex justify-between items-center h-16 md:hidden">
          {/* Logo - Mobile */}
          <Link href="/" className="flex items-center space-x-2">
            <Music className="h-6 w-6 text-blue-600" />
            <h1 className="text-lg font-bold text-foreground">FocusTracks</h1>
          </Link>

          {/* Right side - Mobile */}
          <div className="flex items-center space-x-2">
            <ThemeToggle />
            {user ? (
              <div className="flex items-center space-x-1">
                <TrackSubmissionForm compact />
                <Button
                  asChild
                  variant="ghost"
                  size="icon"
                  title="Playlists"
                >
                  <Link href="/playlists">
                    <List className="h-5 w-5" />
                  </Link>
                </Button>
                {userRole === 'admin' && (
                  <Button
                    asChild
                    variant="ghost"
                    size="icon"
                    className="text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-100"
                    title="Admin"
                  >
                    <Link href="/admin">
                      <Settings className="h-5 w-5" />
                    </Link>
                  </Button>
                )}
                <Button
                  onClick={handleSignOut}
                  variant="ghost"
                  size="icon"
                  title="Sign out"
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => handleAuthClick('login')}
                variant="outline"
                size="sm"
              >
                Sign In
              </Button>
            )}
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden md:flex justify-between items-center h-16">
          {/* Logo - Desktop */}
          <Link href="/" className="flex items-center space-x-2">
            <Music className="h-8 w-8 text-blue-600" />
            <h1 className="text-xl font-bold text-foreground">FocusTracks</h1>
          </Link>

          {/* Search Bar - Desktop */}
          <div className="flex-1 max-w-lg mx-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search tracks..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent text-foreground placeholder-muted-foreground"
              />
            </div>
          </div>

          {/* User Menu - Desktop */}
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            
            {user ? (
              <div className="flex items-center space-x-2">
                <TrackSubmissionForm />
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                >
                  <Link href="/playlists" className="flex items-center space-x-1">
                    <List className="h-4 w-4" />
                    <span>Playlists</span>
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  title="Profile"
                >
                  <Link href="/profile" className="flex items-center space-x-1">
                    <User className="h-4 w-4" />
                    <span className="hidden lg:inline">Profile</span>
                  </Link>
                </Button>
                {userRole === 'admin' && (
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900"
                  >
                    <Link href="/admin" className="flex items-center space-x-1">
                      <Settings className="h-4 w-4" />
                      <span>Admin</span>
                    </Link>
                  </Button>
                )}
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground hidden lg:inline">{user.email}</span>
                </div>
                <Button
                  onClick={handleSignOut}
                  variant="outline"
                  size="sm"
                  title="Sign out"
                >
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => handleAuthClick('login')}
                  variant="outline"
                  size="sm"
                >
                  Sign In
                </Button>
                <Button
                  onClick={() => handleAuthClick('signup')}
                  size="sm"
                >
                  Sign Up
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="md:hidden pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search tracks..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent text-foreground placeholder-muted-foreground"
            />
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authMode}
      />
    </header>
  )
}

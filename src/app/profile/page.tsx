'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'
import { User, Mail, Calendar, Shield, Edit3, Save, X } from 'lucide-react'
import { createLogger } from '@/lib/logger'

const logger = createLogger('ProfilePage')

export default function ProfilePage() {
  const { user, userRole, signOut } = useAuth()
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [_loading, _setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load user profile data
  useEffect(() => {
    if (user) {
      // For now, we'll use email as display name since we don't have a separate field
      setDisplayName(user.email?.split('@')[0] || '')
      setBio('') // We'll add bio functionality later
    }
  }, [user])

  const handleSave = async () => {
    if (!user) return

    try {
      setSaving(true)
      setError(null)

      // For now, we'll just simulate saving
      // In a real implementation, this would update the user profile in the database
      await new Promise(resolve => setTimeout(resolve, 1000))

      setIsEditing(false)
      logger.info('Profile updated successfully')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile')
      logger.error('Error saving profile', err instanceof Error ? err : String(err))
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setDisplayName(user?.email?.split('@')[0] || '')
    setBio('')
    setIsEditing(false)
    setError(null)
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (!user) {
    return null
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Profile</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Manage your account settings and preferences</p>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Profile Card */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-6">
                <div className="text-center">
                  <div className="mx-auto w-24 h-24 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
                    <User className="h-12 w-12 text-blue-600 dark:text-blue-400" />
                  </div>
                  
                  {isEditing ? (
                    <div className="space-y-4">
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                        placeholder="Display name"
                      />
                      <textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                        placeholder="Bio (optional)"
                      />
                    </div>
                  ) : (
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                        {displayName}
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400 mt-1">
                        {user.email}
                      </p>
                      {bio && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                          {bio}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="mt-6">
                    {isEditing ? (
                      <div className="flex space-x-2">
                        <button
                          onClick={handleSave}
                          disabled={saving}
                          className="flex items-center space-x-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        >
                          <Save className="h-4 w-4" />
                          <span>{saving ? 'Saving...' : 'Save'}</span>
                        </button>
                        <button
                          onClick={handleCancel}
                          disabled={saving}
                          className="flex items-center space-x-1 px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
                        >
                          <X className="h-4 w-4" />
                          <span>Cancel</span>
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center space-x-1 px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <Edit3 className="h-4 w-4" />
                        <span>Edit Profile</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Account Details */}
            <div className="lg:col-span-2">
              <div className="space-y-6">
                {/* Account Information */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                    Account Information
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <Mail className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Email</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <Calendar className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Member Since</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {formatDate(user.created_at)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <Shield className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Role</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                          {userRole || 'User'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Account Actions */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                    Account Actions
                  </h3>
                  
                  <div className="space-y-4">
                    <button
                      onClick={() => router.push('/playlists')}
                      className="w-full flex items-center justify-between p-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <span className="text-gray-900 dark:text-gray-100">Manage Playlists</span>
                      <span className="text-gray-400">→</span>
                    </button>

                    <button
                      onClick={() => router.push('/admin')}
                      className="w-full flex items-center justify-between p-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <span className="text-gray-900 dark:text-gray-100">Admin Dashboard</span>
                      <span className="text-gray-400">→</span>
                    </button>

                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center justify-center p-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>

                {/* Error Display */}
                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}

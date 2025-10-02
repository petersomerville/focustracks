'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'
import { User, Mail, Calendar, Shield, Edit3, Save, X } from 'lucide-react'
import { createLogger } from '@/lib/logger'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

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
      logger.error('Error saving profile', { error: err instanceof Error ? err : String(err) })
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
      <div className="min-h-screen bg-background">
        <Header />

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Profile</h1>
            <p className="text-muted-foreground mt-2">Manage your account settings and preferences</p>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Profile Card */}
            <div className="lg:col-span-1">
              <Card>
                <CardContent className="pt-6">
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
                          className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent text-foreground"
                          placeholder="Display name"
                        />
                        <textarea
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent text-foreground"
                          placeholder="Bio (optional)"
                        />
                      </div>
                    ) : (
                      <div>
                        <h2 className="text-xl font-semibold text-foreground">
                          {displayName}
                        </h2>
                        <p className="text-muted-foreground mt-1">
                          {user.email}
                        </p>
                        {bio && (
                          <p className="text-sm text-muted-foreground mt-2">
                            {bio}
                          </p>
                        )}
                      </div>
                    )}

                    <div className="mt-6 flex justify-center">
                      {isEditing ? (
                        <div className="flex space-x-2">
                          <Button
                            onClick={handleSave}
                            disabled={saving}
                            size="sm"
                          >
                            <Save className="h-4 w-4 mr-1" />
                            {saving ? 'Saving...' : 'Save'}
                          </Button>
                          <Button
                            onClick={handleCancel}
                            disabled={saving}
                            variant="outline"
                            size="sm"
                          >
                            <X className="h-4 w-4 mr-1" />
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <Button
                          onClick={() => setIsEditing(true)}
                          variant="outline"
                          size="sm"
                        >
                          <Edit3 className="h-4 w-4 mr-1" />
                          Edit Profile
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Account Details */}
            <div className="lg:col-span-2">
              <div className="space-y-6">
                {/* Account Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Account Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Email</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Member Since</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(user.created_at)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <Shield className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Role</p>
                        <p className="text-sm text-muted-foreground capitalize">
                          {userRole || 'User'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Account Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Account Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button
                      onClick={() => router.push('/playlists')}
                      variant="outline"
                      className="w-full justify-between"
                    >
                      <span>Manage Playlists</span>
                      <span>→</span>
                    </Button>

                    <Button
                      onClick={() => router.push('/admin')}
                      variant="outline"
                      className="w-full justify-between"
                    >
                      <span>Admin Dashboard</span>
                      <span>→</span>
                    </Button>

                    <Button
                      onClick={handleSignOut}
                      variant="destructive"
                      className="w-full"
                    >
                      Sign Out
                    </Button>
                  </CardContent>
                </Card>

                {/* Error Display */}
                {error && (
                  <Card className="border-destructive">
                    <CardContent className="pt-6">
                      <p className="text-destructive text-sm">{error}</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}

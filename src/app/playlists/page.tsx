'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import ProtectedRoute from '@/components/ProtectedRoute'
import ErrorMessage from '@/components/ErrorMessage'
import LoadingSpinner from '@/components/LoadingSpinner'
import { usePlaylists } from '@/hooks/usePlaylists'
import { Plus, Music, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function PlaylistsPage() {
  const router = useRouter()
  const { playlists, loading, error, createPlaylist, deletePlaylist } = usePlaylists()
  const [newPlaylistName, setNewPlaylistName] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const handleCreatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPlaylistName.trim()) return

    setCreating(true)
    const result = await createPlaylist(newPlaylistName.trim())

    if (result.success) {
      setNewPlaylistName('')
      setShowCreateForm(false)
    }
    setCreating(false)
  }

  const handleDeletePlaylist = async (playlistId: string) => {
    if (!confirm('Are you sure you want to delete this playlist? This action cannot be undone.')) {
      return
    }

    setDeleting(playlistId)
    const result = await deletePlaylist(playlistId)

    if (!result.success) {
      alert(result.error || 'Failed to delete playlist')
    }
    setDeleting(null)
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Header />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">My Playlists</h1>
              <p className="text-muted-foreground mt-2">Create and manage your music playlists</p>
            </div>

            <Button
              onClick={() => setShowCreateForm(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Playlist
            </Button>
          </div>

          {/* Create Playlist Form */}
          {showCreateForm && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Create New Playlist</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreatePlaylist} className="flex items-center space-x-4">
                  <input
                    type="text"
                    value={newPlaylistName}
                    onChange={(e) => setNewPlaylistName(e.target.value)}
                    placeholder="Enter playlist name..."
                    className="flex-1 px-3 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent text-foreground placeholder-muted-foreground"
                    disabled={creating}
                  />
                  <Button
                    type="submit"
                    disabled={creating || !newPlaylistName.trim()}
                  >
                    {creating ? 'Creating...' : 'Create'}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false)
                      setNewPlaylistName('')
                    }}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Loading State */}
          {loading && (
            <div className="py-12">
              <LoadingSpinner size="lg" text="Loading playlists..." />
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="py-8">
              <ErrorMessage
                title="Failed to load playlists"
                message={error}
                variant="error"
              />
            </div>
          )}

          {/* Playlists Grid */}
          {!loading && !error && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {playlists && playlists.length > 0 ? (
                playlists.map((playlist) => (
                  <Card key={playlist.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-3">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                              <Music className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <h3 className="text-lg font-medium text-foreground truncate">
                              {playlist.name}
                            </h3>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Created {new Date(playlist.created_at).toLocaleDateString()}
                          </p>
                        </div>

                        <Button
                          onClick={() => handleDeletePlaylist(playlist.id)}
                          disabled={deleting === playlist.id}
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-destructive"
                          title="Delete playlist"
                        >
                          {deleting === playlist.id ? (
                            <div className="h-4 w-4 border-2 border-destructive border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>

                      <div className="mt-4 pt-4 border-t border-border">
                        <Button
                          onClick={() => router.push(`/playlists/${playlist.id}`)}
                          variant="outline"
                          className="w-full"
                          size="sm"
                        >
                          View Playlist
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <Music className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No playlists yet</h3>
                  <p className="text-muted-foreground mb-4">Create your first playlist to get started</p>
                  <Button
                    onClick={() => setShowCreateForm(true)}
                  >
                    Create Playlist
                  </Button>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  )
}

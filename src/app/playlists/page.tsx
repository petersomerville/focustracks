'use client'

import { useState } from 'react'
import Header from '@/components/Header'
import ProtectedRoute from '@/components/ProtectedRoute'
import { usePlaylists } from '@/hooks/usePlaylists'
import { Plus, Music, Trash2 } from 'lucide-react'

export default function PlaylistsPage() {
  const { playlists, loading, error, createPlaylist } = usePlaylists()
  const [newPlaylistName, setNewPlaylistName] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [creating, setCreating] = useState(false)

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

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Header />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Playlists</h1>
              <p className="text-gray-600 mt-2">Create and manage your music playlists</p>
            </div>
            
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>New Playlist</span>
            </button>
          </div>

          {/* Create Playlist Form */}
          {showCreateForm && (
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Playlist</h3>
              <form onSubmit={handleCreatePlaylist} className="flex items-center space-x-4">
                <input
                  type="text"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  placeholder="Enter playlist name..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={creating}
                />
                <button
                  type="submit"
                  disabled={creating || !newPlaylistName.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {creating ? 'Creating...' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false)
                    setNewPlaylistName('')
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </form>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Loading playlists...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-8">
              <p className="text-red-600">Error: {error}</p>
            </div>
          )}

          {/* Playlists Grid */}
          {!loading && !error && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {playlists.length > 0 ? (
                playlists.map((playlist) => (
                  <div key={playlist.id} className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Music className="h-5 w-5 text-blue-600" />
                          </div>
                          <h3 className="text-lg font-medium text-gray-900 truncate">
                            {playlist.name}
                          </h3>
                        </div>
                        <p className="text-sm text-gray-500">
                          Created {new Date(playlist.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      
                      <button
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete playlist"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t">
                      <button className="w-full px-3 py-2 text-sm text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
                        View Playlist
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <Music className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No playlists yet</h3>
                  <p className="text-gray-600 mb-4">Create your first playlist to get started</p>
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Create Playlist
                  </button>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  )
}

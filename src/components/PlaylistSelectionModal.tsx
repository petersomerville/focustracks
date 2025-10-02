'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, Plus } from 'lucide-react'
import { Track, Playlist } from '@/lib/supabase'
import { createLogger } from '@/lib/logger'

interface PlaylistSelectionModalProps {
  isOpen: boolean
  track: Track | null
  onClose: () => void
  onSuccess: () => void
}

export default function PlaylistSelectionModal({
  isOpen,
  track,
  onClose,
  onSuccess
}: PlaylistSelectionModalProps) {
  const logger = createLogger('PlaylistSelectionModal')
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [loading, setLoading] = useState(false)
  const [addingToPlaylist, setAddingToPlaylist] = useState<string | null>(null)
  const [newPlaylistName, setNewPlaylistName] = useState('')
  const [creatingPlaylist, setCreatingPlaylist] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)

  const fetchPlaylists = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/playlists')
      const data = await response.json()
      // API returns { success: true, data: { playlists: ... } }
      const playlistsData = data.data?.playlists || data.playlists || []
      setPlaylists(playlistsData)
    } catch (error) {
      logger.error('Error fetching playlists', { error: error instanceof Error ? error : String(error) })
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (isOpen) {
      fetchPlaylists()
    }
  }, [isOpen, fetchPlaylists])

  const handleAddToPlaylist = async (playlistId: string) => {
    if (!track) return

    try {
      setAddingToPlaylist(playlistId)
      const response = await fetch(`/api/playlists/${playlistId}/tracks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          track_id: track.id,
        }),
      })

      if (response.ok) {
        onSuccess()
        onClose()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to add track to playlist')
      }
    } catch (error) {
      logger.error('Error adding track to playlist', { error: error instanceof Error ? error : String(error) })
      alert('Failed to add track to playlist')
    } finally {
      setAddingToPlaylist(null)
    }
  }

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) return

    try {
      setCreatingPlaylist(true)
      const response = await fetch('/api/playlists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newPlaylistName.trim(),
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setNewPlaylistName('')
        setShowCreateForm(false)
        await fetchPlaylists() // Refresh the list

        // Automatically add the track to the new playlist
        if (track) {
          // API returns { success: true, data: { playlist: ... } }
          const playlistId = data.data?.playlist?.id || data.playlist?.id
          if (playlistId) {
            await handleAddToPlaylist(playlistId)
          }
        }
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to create playlist')
      }
    } catch (error) {
      logger.error('Error creating playlist', { error: error instanceof Error ? error : String(error) })
      alert('Failed to create playlist')
    } finally {
      setCreatingPlaylist(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Add to Playlist
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Track Info */}
        {track && (
          <div className="p-4 bg-muted/50">
            <p className="text-sm text-muted-foreground">Adding track:</p>
            <p className="font-medium text-foreground">{track.title}</p>
            <p className="text-sm text-muted-foreground">{track.artist}</p>
          </div>
        )}

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-96">
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Loading playlists...</p>
            </div>
          ) : (
            <>
              {/* Create New Playlist */}
              <div className="mb-4">
                {!showCreateForm ? (
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                  >
                    <Plus className="h-4 w-4" />
                    Create New Playlist
                  </button>
                ) : (
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Playlist name"
                      value={newPlaylistName}
                      onChange={(e) => setNewPlaylistName(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleCreatePlaylist()}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleCreatePlaylist}
                        disabled={!newPlaylistName.trim() || creatingPlaylist}
                        className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {creatingPlaylist ? 'Creating...' : 'Create'}
                      </button>
                      <button
                        onClick={() => {
                          setShowCreateForm(false)
                          setNewPlaylistName('')
                        }}
                      className="px-3 py-2 border border-input rounded-md hover:bg-muted transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Existing Playlists */}
              {playlists.length > 0 ? (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Your Playlists
                  </h3>
                  {playlists.map((playlist) => (
                    <button
                      key={playlist.id}
                      onClick={() => handleAddToPlaylist(playlist.id)}
                      disabled={addingToPlaylist === playlist.id}
                      className="w-full flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
                    >
                      <div className="text-left">
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {playlist.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Created {new Date(playlist.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      {addingToPlaylist === playlist.id ? (
                        <div className="h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                !showCreateForm && (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">
                      No playlists yet. Create your first playlist!
                    </p>
                  </div>
                )
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
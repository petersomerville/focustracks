'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus } from 'lucide-react'
import { Track, Playlist } from '@/lib/supabase'
import { createLogger } from '@/lib/logger'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import LoadingSpinner from '@/components/LoadingSpinner'

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Add to Playlist</DialogTitle>
          {track && (
            <DialogDescription asChild>
              <div className="pt-2">
                <p className="text-sm text-muted-foreground">Adding track:</p>
                <p className="font-medium text-foreground">{track.title}</p>
                <p className="text-sm text-muted-foreground">{track.artist}</p>
              </div>
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="overflow-y-auto max-h-96">
          {loading ? (
            <div className="py-8">
              <LoadingSpinner size="md" text="Loading playlists..." />
            </div>
          ) : (
            <>
              {/* Create New Playlist */}
              <div className="mb-4">
                {!showCreateForm ? (
                  <Button
                    onClick={() => setShowCreateForm(true)}
                    variant="outline"
                    className="w-full border-dashed"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Playlist
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Playlist name"
                      value={newPlaylistName}
                      onChange={(e) => setNewPlaylistName(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleCreatePlaylist()}
                      className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={handleCreatePlaylist}
                        disabled={!newPlaylistName.trim() || creatingPlaylist}
                        className="flex-1"
                      >
                        {creatingPlaylist ? 'Creating...' : 'Create'}
                      </Button>
                      <Button
                        onClick={() => {
                          setShowCreateForm(false)
                          setNewPlaylistName('')
                        }}
                        variant="outline"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Existing Playlists */}
              {playlists.length > 0 ? (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-foreground mb-2">
                    Your Playlists
                  </h3>
                  {playlists.map((playlist) => (
                    <Button
                      key={playlist.id}
                      onClick={() => handleAddToPlaylist(playlist.id)}
                      disabled={addingToPlaylist === playlist.id}
                      variant="ghost"
                      className="w-full justify-between h-auto p-3"
                    >
                      <div className="text-left">
                        <p className="font-medium text-foreground">
                          {playlist.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Created {new Date(playlist.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      {addingToPlaylist === playlist.id ? (
                        <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  ))}
                </div>
              ) : (
                !showCreateForm && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      No playlists yet. Create your first playlist!
                    </p>
                  </div>
                )
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
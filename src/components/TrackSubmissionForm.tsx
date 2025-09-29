'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Plus } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { validateTrackSubmission } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import ContentPolicyModal from './ContentPolicyModal'

interface TrackSubmissionFormProps {
  onSubmissionSuccess?: () => void
}

export default function TrackSubmissionForm({ onSubmissionSuccess }: TrackSubmissionFormProps) {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    artist: '',
    genre: '',
    duration: '',
    youtube_url: '',
    spotify_url: '',
    description: ''
  })
  const [errors, setErrors] = useState<string[]>([])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors.length > 0) {
      setErrors([])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast.error('You must be logged in to submit tracks')
      return
    }

    setIsSubmitting(true)
    setErrors([])

    try {
      const submissionData = {
        ...formData,
        duration: parseInt(formData.duration) || 0
      }

      const validation = validateTrackSubmission(submissionData)
      if (!validation.valid) {
        setErrors(validation.errors)
        setIsSubmitting(false)
        return
      }

      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        toast.error('Authentication required')
        setIsSubmitting(false)
        return
      }

      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(submissionData)
      })

      const result = await response.json()

      if (!response.ok) {
        if (result.details) {
          setErrors(result.details)
        } else {
          toast.error(result.error || 'Failed to submit track')
        }
        return
      }

      toast.success('Track submitted successfully! It will be reviewed by our team.')
      setFormData({
        title: '',
        artist: '',
        genre: '',
        duration: '',
        youtube_url: '',
        spotify_url: '',
        description: ''
      })
      setIsOpen(false)
      onSubmissionSuccess?.()
    } catch (error) {
      console.error('Submission error:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const genres = [
    'Ambient',
    'Classical',
    'Electronic',
    'Lo-fi',
    'Nature Sounds',
    'Instrumental',
    'Jazz',
    'Other'
  ]

  if (!user) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Submit Track</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>Submit a Focus Track</DialogTitle>
              <DialogDescription>
                Share a track that helps with focus and productivity. Our team will review it before adding to the library.
              </DialogDescription>
            </div>
            <ContentPolicyModal />
          </div>
        </DialogHeader>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Track Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <h4 className="text-red-800 font-medium mb-2">Please fix the following errors:</h4>
                  <ul className="list-disc list-inside text-red-700 text-sm">
                    {errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Track Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. Peaceful Piano Study"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Artist *
                  </label>
                  <input
                    type="text"
                    value={formData.artist}
                    onChange={(e) => handleInputChange('artist', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. Classical Focus"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Genre *
                  </label>
                  <select
                    value={formData.genre}
                    onChange={(e) => handleInputChange('genre', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select a genre</option>
                    {genres.map(genre => (
                      <option key={genre} value={genre}>{genre}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Duration (seconds) *
                  </label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => handleInputChange('duration', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. 2400 (40 minutes)"
                    min="1"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  YouTube URL
                </label>
                <input
                  type="url"
                  value={formData.youtube_url}
                  onChange={(e) => handleInputChange('youtube_url', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://www.youtube.com/watch?v=..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Spotify URL
                </label>
                <input
                  type="url"
                  value={formData.spotify_url}
                  onChange={(e) => handleInputChange('spotify_url', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://open.spotify.com/track/..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Why does this track help with focus? *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Describe what makes this track good for focus and productivity..."
                  required
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <h4 className="text-blue-800 font-medium mb-2">Content Guidelines</h4>
                <ul className="text-blue-700 text-sm space-y-1">
                  <li>• Focus music only (ambient, classical, instrumental, lo-fi, etc.)</li>
                  <li>• Must be publicly available on YouTube/Spotify</li>
                  <li>• No copyrighted music without proper licensing</li>
                  <li>• Family-friendly content only</li>
                  <li>• At least one platform URL required</li>
                </ul>
              </div>

              <div className="flex space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Track'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  )
}
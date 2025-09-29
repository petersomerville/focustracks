'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, Clock, ExternalLink } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { TrackSubmission, supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export default function AdminDashboard() {
  const { user, userRole } = useAuth()
  const [submissions, setSubmissions] = useState<TrackSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)

  useEffect(() => {
    if (user && userRole === 'admin') {
      fetchSubmissions()
    } else {
      setLoading(false)
    }
  }, [user, userRole])

  const fetchSubmissions = async () => {
    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.access_token) {
        toast.error('Authentication required')
        return
      }

      const response = await fetch('/api/submissions?admin=true', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      const result = await response.json()

      if (!response.ok) {
        toast.error(result.error || 'Failed to fetch submissions')
        return
      }

      setSubmissions(result.submissions || [])
    } catch (error) {
      console.error('Error fetching submissions:', error)
      toast.error('Failed to load submissions')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmissionAction = async (submissionId: string, status: 'approved' | 'rejected', adminNotes?: string) => {
    try {
      setProcessing(submissionId)
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.access_token) {
        toast.error('Authentication required')
        return
      }

      const response = await fetch(`/api/submissions/${submissionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ status, admin_notes: adminNotes })
      })

      const result = await response.json()

      if (!response.ok) {
        toast.error(result.error || `Failed to ${status} submission`)
        return
      }

      toast.success(`Submission ${status} successfully`)
      await fetchSubmissions() // Refresh the list
    } catch (error) {
      console.error('Error processing submission:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setProcessing(null)
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getStatusBadge = (status: TrackSubmission['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="flex items-center space-x-1">
          <Clock className="h-3 w-3" />
          <span>Pending</span>
        </Badge>
      case 'approved':
        return <Badge variant="default" className="flex items-center space-x-1 bg-green-500">
          <CheckCircle className="h-3 w-3" />
          <span>Approved</span>
        </Badge>
      case 'rejected':
        return <Badge variant="destructive" className="flex items-center space-x-1">
          <XCircle className="h-3 w-3" />
          <span>Rejected</span>
        </Badge>
    }
  }

  if (!user || userRole !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-64">
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">Admin access required</p>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <p className="text-muted-foreground">Loading submissions...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <Button onClick={fetchSubmissions} variant="outline">
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{submissions.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {submissions.filter(s => s.status === 'pending').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {submissions.filter(s => s.status === 'approved').length}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Track Submissions</h2>

        {submissions.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">No submissions yet</p>
          </Card>
        ) : (
          submissions.map((submission) => (
            <Card key={submission.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{submission.title}</CardTitle>
                    <p className="text-muted-foreground">by {submission.artist}</p>
                  </div>
                  {getStatusBadge(submission.status)}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Genre:</strong> {submission.genre}
                  </div>
                  <div>
                    <strong>Duration:</strong> {formatDuration(submission.duration)}
                  </div>
                  <div>
                    <strong>Submitted:</strong> {new Date(submission.created_at).toLocaleDateString()}
                  </div>
                  <div>
                    <strong>Status:</strong> {submission.status}
                  </div>
                </div>

                <div>
                  <strong>Description:</strong>
                  <p className="text-muted-foreground mt-1">{submission.description}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {submission.youtube_url && (
                    <a
                      href={submission.youtube_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1 text-red-600 hover:underline"
                    >
                      <span>YouTube</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  {submission.spotify_url && (
                    <a
                      href={submission.spotify_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1 text-green-600 hover:underline"
                    >
                      <span>Spotify</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>

                {submission.admin_notes && (
                  <div className="bg-gray-50 p-3 rounded-md">
                    <strong>Admin Notes:</strong>
                    <p className="text-muted-foreground mt-1">{submission.admin_notes}</p>
                  </div>
                )}

                {submission.status === 'pending' && (
                  <div className="flex space-x-2 pt-2">
                    <Button
                      onClick={() => handleSubmissionAction(submission.id, 'approved')}
                      disabled={processing === submission.id}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {processing === submission.id ? 'Processing...' : 'Approve'}
                    </Button>
                    <Button
                      onClick={() => handleSubmissionAction(submission.id, 'rejected', 'Does not meet content guidelines')}
                      disabled={processing === submission.id}
                      variant="destructive"
                    >
                      {processing === submission.id ? 'Processing...' : 'Reject'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
'use client'

import { useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import AdminDashboard from '@/components/AdminDashboard'
import { Card } from '@/components/ui/card'

export default function AdminPage() {
  const { user, userRole, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/')
        return
      }
      if (userRole !== 'admin') {
        router.push('/')
        return
      }
    }
  }, [user, userRole, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!user || userRole !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8">
          <p className="text-muted-foreground">Access denied. Admin privileges required.</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AdminDashboard />
      </div>
    </div>
  )
}
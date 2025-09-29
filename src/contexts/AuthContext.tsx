'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { createLogger } from '@/lib/logger'

interface AuthContextType {
  user: User | null
  loading: boolean
  userRole: 'user' | 'admin' | null
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userRole, setUserRole] = useState<'user' | 'admin' | null>(null)
  const [loading, setLoading] = useState(true)
  const logger = createLogger('AuthContext')

  const fetchUserRole = useCallback(async (userId: string): Promise<'user' | 'admin'> => {
    try {
      logger.debug('Fetching role for user ID', { userId })
      const { data, error } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', userId)
        .single()

      if (error) {
        // If the table doesn't exist or there's a network error, default to 'user'
        if (error.code === 'PGRST116' || error.message?.includes('relation "public.user_profiles" does not exist')) {
          logger.warn('user_profiles table does not exist, defaulting to user role', { userId })
          return 'user'
        }

        // For other errors (like no matching row), still default to 'user' but log it
        logger.warn('Could not fetch user role, defaulting to user', { error: error.message, code: error.code })
        return 'user'
      }

      logger.debug('Fetched user role', { role: data?.role })
      return data?.role || 'user'
    } catch (error) {
      // Handle network errors, CORS issues, etc.
      const errorMessage = error instanceof Error ? error.message : String(error)
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('ERR_INSUFFICIENT_RESOURCES')) {
        logger.warn('Network error fetching user role, defaulting to user', { error: errorMessage })
      } else {
        logger.error('Unexpected error fetching user role', errorMessage)
      }
      return 'user'
    }
  }, [logger])

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      const currentUser = session?.user ?? null
      setUser(currentUser)

      if (currentUser) {
        const role = await fetchUserRole(currentUser.id)
        setUserRole(role)
      } else {
        setUserRole(null)
      }

      setLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const currentUser = session?.user ?? null
        setUser(currentUser)

        if (currentUser) {
          const role = await fetchUserRole(currentUser.id)
          setUserRole(role)
        } else {
          setUserRole(null)
        }

        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [fetchUserRole])

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      return { error: error?.message ?? null }
    } catch (error) {
      logger.error('SignIn error', error instanceof Error ? error : String(error))
      return { error: 'An unexpected error occurred' }
    }
  }

  const signUp = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      })
      return { error: error?.message ?? null }
    } catch (error) {
      logger.error('SignUp error', error instanceof Error ? error : String(error))
      return { error: 'An unexpected error occurred' }
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const value = {
    user,
    loading,
    userRole,
    signIn,
    signUp,
    signOut,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

'use client'

import { createContext, useContext, useEffect, useState, useCallback, useRef, useMemo } from 'react'
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
  const roleCache = useRef<Map<string, 'user' | 'admin'>>(new Map())

  const fetchUserRole = useCallback(async (userId: string): Promise<'user' | 'admin'> => {
    // Check cache first
    const cachedRole = roleCache.current.get(userId)
    if (cachedRole) {
      // Return cached role without logging to avoid spam
      return cachedRole
    }

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

      const role = data?.role || 'user'
      logger.debug('Fetched user role', { role })
      // Cache the role
      roleCache.current.set(userId, role)
      return role
    } catch (error) {
      // Handle network errors, CORS issues, etc.
      const errorMessage = error instanceof Error ? error.message : String(error)
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('ERR_INSUFFICIENT_RESOURCES')) {
        logger.warn('Network error fetching user role, defaulting to user', { error: errorMessage })
      } else {
        logger.error('Unexpected error fetching user role', { error: errorMessage })
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

        // Only update user and role if the user actually changed
        setUser(prevUser => {
          // If user ID hasn't changed, don't update (prevents re-render)
          if (prevUser?.id === currentUser?.id) {
            return prevUser
          }

          // User changed, update role
          if (currentUser) {
            fetchUserRole(currentUser.id).then(role => setUserRole(role))
          } else {
            setUserRole(null)
            roleCache.current.clear()
          }

          return currentUser
        })

        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [fetchUserRole])

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      return { error: error?.message ?? null }
    } catch (error) {
      logger.error('SignIn error', { error: error instanceof Error ? error : String(error) })
      return { error: 'An unexpected error occurred' }
    }
  }, [logger])

  const signUp = useCallback(async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      })
      return { error: error?.message ?? null }
    } catch (error) {
      logger.error('SignUp error', { error: error instanceof Error ? error : String(error) })
      return { error: 'An unexpected error occurred' }
    }
  }, [logger])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
  }, [])

  const value = useMemo(() => ({
    user,
    loading,
    userRole,
    signIn,
    signUp,
    signOut,
  }), [user, loading, userRole, signIn, signUp, signOut])

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

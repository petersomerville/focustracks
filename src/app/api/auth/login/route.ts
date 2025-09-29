import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createLogger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  const logger = createLogger('api:auth:login')
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      logger.error('Login error', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ user: data.user })
  } catch (error) {
    logger.error('Unexpected error during login', error instanceof Error ? error : String(error))
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

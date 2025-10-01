import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createLogger } from '@/lib/logger'
import { loginSchema, createErrorResponse, formatZodErrors } from '@/lib/api-schemas'

export async function POST(request: NextRequest) {
  const logger = createLogger('api:auth:login')
  try {
    const body = await request.json()
    
    // Validate request body using Zod schema
    const validation = loginSchema.safeParse(body)
    if (!validation.success) {
      logger.warn('Invalid login request', {
        errors: validation.error.issues
      })
      return NextResponse.json(
        formatZodErrors(validation.error),
        { status: 400 }
      )
    }

    const { email, password } = validation.data

    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      logger.error('Login error', { error })
      return NextResponse.json(
        createErrorResponse('Authentication failed', error.message, 'AUTH_ERROR'),
        { status: 400 }
      )
    }

    return NextResponse.json({ user: data.user })
  } catch (error) {
    logger.error('Unexpected error during login', { error: error instanceof Error ? error : String(error) })
    return NextResponse.json(
      createErrorResponse('Internal server error', 'An unexpected error occurred', 'INTERNAL_ERROR'),
      { status: 500 }
    )
  }
}

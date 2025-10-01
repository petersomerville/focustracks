import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createLogger } from '@/lib/logger'
import { registerSchema, createErrorResponse, formatZodErrors } from '@/lib/api-schemas'

export async function POST(request: NextRequest) {
  const logger = createLogger('api:auth:register')
  try {
    const body = await request.json()
    
    // Validate request body using Zod schema
    const validation = registerSchema.safeParse(body)
    if (!validation.success) {
      logger.warn('Invalid registration request', {
        errors: validation.error.issues
      })
      return NextResponse.json(
        formatZodErrors(validation.error),
        { status: 400 }
      )
    }

    const { email, password } = validation.data

    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      logger.error('Registration error', { error })
      return NextResponse.json(
        createErrorResponse('Registration failed', error.message, 'REGISTRATION_ERROR'),
        { status: 400 }
      )
    }

    return NextResponse.json({ user: data.user })
  } catch (error) {
    logger.error('Unexpected error during registration', { error: error instanceof Error ? error : String(error) })
    return NextResponse.json(
      createErrorResponse('Internal server error', 'An unexpected error occurred', 'INTERNAL_ERROR'),
      { status: 500 }
    )
  }
}

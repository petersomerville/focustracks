import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createLogger } from '@/lib/logger'

export async function POST(_request: NextRequest) {
  const logger = createLogger('api:auth:logout')
  try {
    const supabase = await createServerSupabaseClient()
    const { error } = await supabase.auth.signOut()

    if (error) {
      logger.error('Logout error', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Unexpected error during logout', error instanceof Error ? error : String(error))
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

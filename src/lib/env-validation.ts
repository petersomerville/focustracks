/**
 * Environment Variable Validation
 *
 * This utility validates required environment variables at startup
 * and provides clear error messages for missing or invalid configuration.
 */

export interface EnvironmentConfig {
  supabaseUrl: string
  supabaseAnonKey: string
  nodeEnv: 'development' | 'production' | 'test'
  nextPublicUrl?: string
}

export interface ValidationResult {
  isValid: boolean
  config?: EnvironmentConfig
  errors: string[]
  warnings: string[]
}

/**
 * Validate a URL format
 */
function validateUrl(url: string, name: string): { isValid: boolean; error?: string } {
  try {
    new URL(url)
    return { isValid: true }
  } catch {
    return { isValid: false, error: `${name} must be a valid URL` }
  }
}

/**
 * Validate Supabase URL format
 */
function validateSupabaseUrl(url: string): { isValid: boolean; error?: string } {
  const urlValidation = validateUrl(url, 'Supabase URL')
  if (!urlValidation.isValid) {
    return urlValidation
  }

  if (!url.includes('supabase.co') && !url.includes('localhost')) {
    return {
      isValid: false,
      error: 'Supabase URL should contain "supabase.co" or be localhost for development'
    }
  }

  return { isValid: true }
}

/**
 * Validate Supabase anonymous key format
 */
function validateSupabaseKey(key: string): { isValid: boolean; error?: string } {
  if (!key) {
    return { isValid: false, error: 'Supabase anonymous key is required' }
  }

  // Basic validation - Supabase keys are typically JWT tokens
  if (key.length < 100) {
    return {
      isValid: false,
      error: 'Supabase anonymous key appears to be too short (should be a JWT token)'
    }
  }

  // Check for JWT structure (header.payload.signature)
  const parts = key.split('.')
  if (parts.length !== 3) {
    return {
      isValid: false,
      error: 'Supabase anonymous key should be a JWT token (3 parts separated by dots)'
    }
  }

  return { isValid: true }
}

/**
 * Validate all required environment variables
 */
export function validateEnvironment(): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Required variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const nodeEnv = process.env.NODE_ENV as 'development' | 'production' | 'test' | undefined

  // Optional variables
  const nextPublicUrl = process.env.NEXT_PUBLIC_URL

  // Validate Supabase URL
  if (!supabaseUrl) {
    errors.push('NEXT_PUBLIC_SUPABASE_URL is required')
  } else {
    const validation = validateSupabaseUrl(supabaseUrl)
    if (!validation.isValid) {
      errors.push(`NEXT_PUBLIC_SUPABASE_URL: ${validation.error}`)
    }
  }

  // Validate Supabase key
  if (!supabaseAnonKey) {
    errors.push('NEXT_PUBLIC_SUPABASE_ANON_KEY is required')
  } else {
    const validation = validateSupabaseKey(supabaseAnonKey)
    if (!validation.isValid) {
      errors.push(`NEXT_PUBLIC_SUPABASE_ANON_KEY: ${validation.error}`)
    }
  }

  // Validate Node environment
  if (!nodeEnv) {
    warnings.push('NODE_ENV is not set, defaulting to "development"')
  } else if (!['development', 'production', 'test'].includes(nodeEnv)) {
    warnings.push(`NODE_ENV "${nodeEnv}" is not standard, expected development/production/test`)
  }

  // Validate optional Next.js public URL
  if (nextPublicUrl) {
    const validation = validateUrl(nextPublicUrl, 'NEXT_PUBLIC_URL')
    if (!validation.isValid) {
      warnings.push(`NEXT_PUBLIC_URL: ${validation.error}`)
    }
  }

  // Environment-specific validations
  if (nodeEnv === 'production') {
    if (!nextPublicUrl) {
      warnings.push('NEXT_PUBLIC_URL should be set in production for proper absolute URLs')
    }

    if (supabaseUrl && supabaseUrl.includes('localhost')) {
      errors.push('Production environment should not use localhost Supabase URL')
    }
  }

  const isValid = errors.length === 0

  if (isValid) {
    return {
      isValid: true,
      config: {
        supabaseUrl: supabaseUrl!,
        supabaseAnonKey: supabaseAnonKey!,
        nodeEnv: nodeEnv || 'development',
        nextPublicUrl
      },
      errors: [],
      warnings
    }
  }

  return {
    isValid: false,
    errors,
    warnings
  }
}

/**
 * Format validation results for display
 */
export function formatValidationResults(result: ValidationResult): string {
  const lines: string[] = []

  if (result.isValid) {
    lines.push('✅ Environment validation passed')

    if (result.warnings.length > 0) {
      lines.push('')
      lines.push('⚠️  Warnings:')
      result.warnings.forEach(warning => lines.push(`   - ${warning}`))
    }
  } else {
    lines.push('❌ Environment validation failed')
    lines.push('')
    lines.push('Errors:')
    result.errors.forEach(error => lines.push(`   - ${error}`))

    if (result.warnings.length > 0) {
      lines.push('')
      lines.push('Warnings:')
      result.warnings.forEach(warning => lines.push(`   - ${warning}`))
    }

    lines.push('')
    lines.push('💡 To fix these issues:')
    lines.push('   1. Create a .env.local file in your project root')
    lines.push('   2. Add the required environment variables')
    lines.push('   3. Restart your development server')
    lines.push('')
    lines.push('Example .env.local:')
    lines.push('NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co')
    lines.push('NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here')
    lines.push('NEXT_PUBLIC_URL=http://localhost:3000')
  }

  return lines.join('\n')
}

/**
 * Validate environment and exit process if invalid (for use in scripts)
 */
export function validateEnvironmentOrExit(): EnvironmentConfig {
  const result = validateEnvironment()

  if (!result.isValid) {
    console.error(formatValidationResults(result))
    process.exit(1)
  }

  if (result.warnings.length > 0) {
    console.warn(formatValidationResults(result))
  }

  return result.config!
}

/**
 * Runtime environment validation for Next.js apps
 */
export function validateRuntimeEnvironment(): {
  isValid: boolean
  missingVars: string[]
} {
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  ]

  const missingVars = requiredVars.filter(varName => !process.env[varName])

  return {
    isValid: missingVars.length === 0,
    missingVars
  }
}
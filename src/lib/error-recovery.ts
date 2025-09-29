/**
 * Error Recovery and Retry Mechanisms
 * 
 * Provides comprehensive error handling, retry logic, and recovery strategies
 * for API calls and database operations.
 */

import { createLogger } from './logger'

const logger = createLogger('error-recovery')

export interface RetryOptions {
  maxRetries?: number
  baseDelay?: number
  maxDelay?: number
  backoffMultiplier?: number
  retryCondition?: (error: unknown) => boolean
}

export interface ErrorRecoveryOptions extends RetryOptions {
  fallbackValue?: unknown
  onRetry?: (attempt: number, error: unknown) => void
  onFailure?: (error: unknown) => void
}

const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  retryCondition: (error) => {
    // Retry on network errors, timeouts, and 5xx server errors
    const errorObj = error as { code?: string; status?: number; message?: string }
    if (errorObj?.code === 'NETWORK_ERROR' || errorObj?.code === 'TIMEOUT') return true
    if (errorObj?.status && errorObj.status >= 500 && errorObj.status < 600) return true
    if (errorObj?.message?.includes('fetch')) return true
    return false
  }
}

/**
 * Sleep utility for delays
 */
const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Calculate delay with exponential backoff
 */
const calculateDelay = (attempt: number, baseDelay: number, maxDelay: number, multiplier: number): number => {
  const delay = baseDelay * Math.pow(multiplier, attempt - 1)
  return Math.min(delay, maxDelay)
}

/**
 * Retry a function with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const config = { ...DEFAULT_RETRY_OPTIONS, ...options }
  let lastError: unknown

  for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
    try {
      const result = await fn()
      
      if (attempt > 1) {
        logger.info('Operation succeeded after retry', { attempt, totalAttempts: attempt })
      }
      
      return result
    } catch (error) {
      lastError = error
      
      logger.warn('Operation failed', { 
        attempt, 
        maxRetries: config.maxRetries, 
        error: error instanceof Error ? error.message : String(error) 
      })

      // Check if we should retry
      if (attempt === config.maxRetries || !config.retryCondition(error)) {
        break
      }

      // Calculate delay and wait
      const delay = calculateDelay(attempt, config.baseDelay, config.maxDelay, config.backoffMultiplier)
      logger.debug('Retrying after delay', { attempt, delay })
      
      await sleep(delay)
    }
  }

      logger.error('Operation failed after all retries', lastError instanceof Error ? lastError : String(lastError), { 
        maxRetries: config.maxRetries, 
        errorMessage: lastError instanceof Error ? lastError.message : String(lastError) 
      })
  
  throw lastError
}

/**
 * Enhanced error recovery with fallback values
 */
export async function withErrorRecovery<T>(
  fn: () => Promise<T>,
  options: ErrorRecoveryOptions = {}
): Promise<T> {
  const { fallbackValue, onFailure, ...retryOptions } = options

  try {
    return await withRetry(fn, retryOptions)
  } catch (error) {
    logger.error('All retry attempts failed', error instanceof Error ? error : String(error), { 
      errorMessage: error instanceof Error ? error.message : String(error),
      hasFallback: fallbackValue !== undefined
    })

    if (onFailure) {
      onFailure(error)
    }

    if (fallbackValue !== undefined) {
      logger.info('Using fallback value', { fallbackType: typeof fallbackValue })
      return fallbackValue as T
    }

    throw error
  }
}

/**
 * Network request with automatic retry
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retryOptions: RetryOptions = {}
): Promise<Response> {
  return withRetry(async () => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30s timeout

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const error = new Error(`HTTP ${response.status}: ${response.statusText}`)
        ;(error as Error & { status: number }).status = response.status
        throw error
      }

      return response
    } catch (error) {
      clearTimeout(timeoutId)
      
      if (error instanceof Error && error.name === 'AbortError') {
        const timeoutError = new Error('Request timeout')
        ;(timeoutError as Error & { code: string }).code = 'TIMEOUT'
        throw timeoutError
      }

      if (error instanceof TypeError && error.message.includes('fetch')) {
        const networkError = new Error('Network error')
        ;(networkError as Error & { code: string }).code = 'NETWORK_ERROR'
        throw networkError
      }

      throw error
    }
  }, retryOptions)
}

/**
 * Database operation with retry
 */
export async function dbOperationWithRetry<T>(
  operation: () => Promise<T>,
  retryOptions: RetryOptions = {}
): Promise<T> {
  return withRetry(operation, {
    ...retryOptions,
    retryCondition: (error) => {
      // Retry on database connection errors, timeouts, and deadlocks
      const errorObj = error as { code?: string; message?: string }
      if (errorObj?.code === 'CONNECTION_ERROR') return true
      if (errorObj?.code === 'TIMEOUT') return true
      if (errorObj?.code === 'DEADLOCK') return true
      if (errorObj?.message?.includes('connection')) return true
      if (errorObj?.message?.includes('timeout')) return true
      return DEFAULT_RETRY_OPTIONS.retryCondition(error)
    }
  })
}

/**
 * Cache with error recovery
 */
export class ErrorRecoveryCache {
  private cache = new Map<string, { value: unknown; timestamp: number; ttl: number }>()

  constructor(private defaultTTL: number = 5 * 60 * 1000) {} // 5 minutes default

  async get<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: { ttl?: number; retryOptions?: RetryOptions } = {}
  ): Promise<T> {
    const { ttl = this.defaultTTL, retryOptions } = options
    const cached = this.cache.get(key)

    // Return cached value if still valid
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      logger.debug('Cache hit', { key })
      return cached.value as T
    }

    logger.debug('Cache miss, fetching fresh data', { key })

    try {
      const value = await withRetry(fetcher, retryOptions)
      
      // Cache the result
      this.cache.set(key, {
        value,
        timestamp: Date.now(),
        ttl
      })

      return value as T
    } catch (error) {
      // If we have stale cache data, return it as fallback
      if (cached) {
        logger.warn('Using stale cache data due to fetch failure', { 
          key, 
          errorMessage: error instanceof Error ? error.message : String(error) 
        })
        return cached.value as T
      }

      throw error
    }
  }

  set<T>(key: string, value: T, ttl: number = this.defaultTTL): void {
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl
    })
  }

  clear(): void {
    this.cache.clear()
  }

  delete(key: string): boolean {
    return this.cache.delete(key)
  }
}

/**
 * Global cache instance
 */
export const globalCache = new ErrorRecoveryCache()

/**
 * Circuit breaker pattern for preventing cascade failures
 */
export class CircuitBreaker {
  private failures = 0
  private lastFailureTime = 0
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED'

  constructor(
    private threshold: number = 5,
    private timeout: number = 60000, // 1 minute
    private resetTimeout: number = 30000 // 30 seconds
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
        this.state = 'HALF_OPEN'
        logger.info('Circuit breaker entering HALF_OPEN state')
      } else {
        throw new Error('Circuit breaker is OPEN - operation blocked')
      }
    }

    try {
      const result = await operation()
      
      if (this.state === 'HALF_OPEN') {
        this.state = 'CLOSED'
        this.failures = 0
        logger.info('Circuit breaker reset to CLOSED state')
      }
      
      return result
    } catch (error) {
      this.failures++
      this.lastFailureTime = Date.now()

      if (this.failures >= this.threshold) {
        this.state = 'OPEN'
        logger.warn('Circuit breaker opened due to failures', { 
          failures: this.failures, 
          threshold: this.threshold 
        })
      }

      throw error
    }
  }

  getState(): string {
    return this.state
  }

  getFailures(): number {
    return this.failures
  }
}

/**
 * Global circuit breaker instances for different services
 */
export const apiCircuitBreaker = new CircuitBreaker(5, 60000, 30000)
export const dbCircuitBreaker = new CircuitBreaker(3, 30000, 20000)

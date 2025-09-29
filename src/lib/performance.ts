/**
 * Performance Optimization Utilities
 * 
 * Provides caching, memoization, and performance monitoring utilities
 * for optimizing application performance.
 */

import { createLogger } from './logger'
import { ErrorRecoveryCache, globalCache } from './error-recovery'

const logger = createLogger('performance')

/**
 * Memoization utility for expensive computations
 */
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  options: {
    maxSize?: number
    ttl?: number
    keyGenerator?: (...args: Parameters<T>) => string
  } = {}
): T {
  const { maxSize = 100, ttl = 5 * 60 * 1000, keyGenerator } = options
  const cache = new Map<string, { value: ReturnType<T>; timestamp: number }>()

  return ((...args: Parameters<T>) => {
    const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args)
    const cached = cache.get(key)

    if (cached && Date.now() - cached.timestamp < ttl) {
      logger.debug('Memoization cache hit', { key })
      return cached.value
    }

    const result = fn(...args)
    cache.set(key, { value: result, timestamp: Date.now() })

    // Clean up old entries if cache is too large
    if (cache.size > maxSize) {
      const oldestKey = cache.keys().next().value
      cache.delete(oldestKey)
    }

    logger.debug('Memoization cache miss', { key })
    return result
  }) as T
}

/**
 * Debounce utility for limiting function calls
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): T {
  let timeoutId: NodeJS.Timeout

  return ((...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), delay)
  }) as T
}

/**
 * Throttle utility for limiting function calls
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  limit: number
): T {
  let inThrottle: boolean

  return ((...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }) as T
}

/**
 * Performance monitoring decorator
 */
export function measurePerformance<T extends (...args: any[]) => any>(
  fn: T,
  name?: string
): T {
  const functionName = name || fn.name || 'anonymous'

  return ((...args: Parameters<T>) => {
    const start = performance.now()
    const result = fn(...args)
    const end = performance.now()
    const duration = end - start

    logger.info('Function performance', {
      function: functionName,
      duration: `${duration.toFixed(2)}ms`,
      args: args.length
    })

    return result
  }) as T
}

/**
 * Async performance monitoring decorator
 */
export function measureAsyncPerformance<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  name?: string
): T {
  const functionName = name || fn.name || 'anonymous'

  return (async (...args: Parameters<T>) => {
    const start = performance.now()
    const result = await fn(...args)
    const end = performance.now()
    const duration = end - start

    logger.info('Async function performance', {
      function: functionName,
      duration: `${duration.toFixed(2)}ms`,
      args: args.length
    })

    return result
  }) as T
}

/**
 * Image optimization utilities
 */
export const imageOptimization = {
  /**
   * Generate optimized image URL with WebP support
   */
  getOptimizedImageUrl: (url: string, width?: number, height?: number): string => {
    const params = new URLSearchParams()
    if (width) params.set('w', width.toString())
    if (height) params.set('h', height.toString())
    params.set('f', 'webp') // Prefer WebP format
    params.set('q', '80') // Quality 80%

    return `${url}?${params.toString()}`
  },

  /**
   * Lazy load images with intersection observer
   */
  lazyLoadImages: (selector: string = 'img[data-src]') => {
    if (typeof window === 'undefined') return

    const images = document.querySelectorAll(selector)
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement
          img.src = img.dataset.src || ''
          img.classList.remove('lazy')
          imageObserver.unobserve(img)
        }
      })
    })

    images.forEach((img) => imageObserver.observe(img))
  }
}

/**
 * Bundle size optimization utilities
 */
export const bundleOptimization = {
  /**
   * Dynamic import with error handling
   */
  dynamicImport: async <T>(modulePath: string): Promise<T> => {
    try {
      const module = await import(modulePath)
      return module.default || module
    } catch (error) {
      logger.error('Dynamic import failed', { modulePath, error })
      throw error
    }
  },

  /**
   * Preload critical resources
   */
  preloadResource: (href: string, as: string = 'script') => {
    if (typeof window === 'undefined') return

    const link = document.createElement('link')
    link.rel = 'preload'
    link.href = href
    link.as = as
    document.head.appendChild(link)
  }
}

/**
 * Database query optimization
 */
export const dbOptimization = {
  /**
   * Cached database query
   */
  cachedQuery: async <T>(
    cacheKey: string,
    queryFn: () => Promise<T>,
    ttl: number = 5 * 60 * 1000 // 5 minutes
  ): Promise<T> => {
    return globalCache.get(cacheKey, queryFn, { ttl })
  },

  /**
   * Batch database operations
   */
  batchOperations: async <T>(
    operations: (() => Promise<T>)[],
    batchSize: number = 10
  ): Promise<T[]> => {
    const results: T[] = []
    
    for (let i = 0; i < operations.length; i += batchSize) {
      const batch = operations.slice(i, i + batchSize)
      const batchResults = await Promise.all(batch.map(op => op()))
      results.push(...batchResults)
    }
    
    return results
  }
}

/**
 * API response caching
 */
export const apiCaching = {
  /**
   * Cache API responses with automatic invalidation
   */
  cachedRequest: async <T>(
    url: string,
    options: RequestInit = {},
    ttl: number = 2 * 60 * 1000 // 2 minutes
  ): Promise<T> => {
    const cacheKey = `api:${url}:${JSON.stringify(options)}`
    
    return globalCache.get(cacheKey, async () => {
      const response = await fetch(url, options)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      return response.json()
    }, { ttl })
  },

  /**
   * Invalidate cache for specific patterns
   */
  invalidateCache: (pattern: string) => {
    // This would need to be implemented based on the cache implementation
    logger.info('Cache invalidation requested', { pattern })
  }
}

/**
 * Memory management utilities
 */
export const memoryManagement = {
  /**
   * Clean up unused resources
   */
  cleanup: () => {
    // Clear caches
    globalCache.clear()
    
    // Force garbage collection if available
    if (typeof window !== 'undefined' && (window as any).gc) {
      (window as any).gc()
    }
    
    logger.info('Memory cleanup completed')
  },

  /**
   * Monitor memory usage
   */
  getMemoryUsage: () => {
    if (typeof window === 'undefined') return null

    const memory = (performance as any).memory
    if (!memory) return null

    return {
      used: Math.round(memory.usedJSHeapSize / 1048576), // MB
      total: Math.round(memory.totalJSHeapSize / 1048576), // MB
      limit: Math.round(memory.jsHeapSizeLimit / 1048576) // MB
    }
  }
}

/**
 * Performance metrics collection
 */
export class PerformanceMetrics {
  private metrics: Map<string, number[]> = new Map()

  record(metric: string, value: number): void {
    if (!this.metrics.has(metric)) {
      this.metrics.set(metric, [])
    }
    this.metrics.get(metric)!.push(value)
  }

  getAverage(metric: string): number {
    const values = this.metrics.get(metric)
    if (!values || values.length === 0) return 0
    return values.reduce((sum, val) => sum + val, 0) / values.length
  }

  getMetrics(): Record<string, { average: number; count: number; min: number; max: number }> {
    const result: Record<string, { average: number; count: number; min: number; max: number }> = {}
    
    for (const [metric, values] of this.metrics) {
      if (values.length > 0) {
        result[metric] = {
          average: this.getAverage(metric),
          count: values.length,
          min: Math.min(...values),
          max: Math.max(...values)
        }
      }
    }
    
    return result
  }

  clear(): void {
    this.metrics.clear()
  }
}

/**
 * Global performance metrics instance
 */
export const performanceMetrics = new PerformanceMetrics()

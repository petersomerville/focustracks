/**
 * Structured Logging Utility
 *
 * This replaces console.log statements throughout the codebase with
 * structured logging that supports different levels, context, and
 * better debugging information.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context?: string
  metadata?: Record<string, unknown>
  error?: Error | string
}

export interface LoggerConfig {
  level: LogLevel
  enableConsole: boolean
  enableStructured: boolean
  includeTimestamp: boolean
  includeStack: boolean
}

/**
 * Default configuration based on environment
 */
function getDefaultConfig(): LoggerConfig {
  const isDevelopment = process.env.NODE_ENV === 'development'
  const isTest = process.env.NODE_ENV === 'test'

  return {
    level: isDevelopment ? 'debug' : 'info',
    enableConsole: !isTest, // Suppress logs in tests unless explicitly enabled
    enableStructured: !isDevelopment, // Use structured logs in production
    includeTimestamp: true,
    includeStack: isDevelopment,
  }
}

class Logger {
  private config: LoggerConfig
  private context?: string

  constructor(context?: string, config?: Partial<LoggerConfig>) {
    this.context = context
    this.config = { ...getDefaultConfig(), ...config }
  }

  /**
   * Create a child logger with additional context
   */
  child(context: string): Logger {
    const childContext = this.context ? `${this.context}:${context}` : context
    return new Logger(childContext, this.config)
  }

  /**
   * Check if log level should be output
   */
  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error']
    const configLevelIndex = levels.indexOf(this.config.level)
    const messageLevelIndex = levels.indexOf(level)
    return messageLevelIndex >= configLevelIndex
  }

  /**
   * Format log entry for console output
   */
  private formatConsoleMessage(entry: LogEntry): string {
    const parts: string[] = []

    // Timestamp
    if (this.config.includeTimestamp) {
      const timestamp = new Date(entry.timestamp).toLocaleTimeString()
      parts.push(`[${timestamp}]`)
    }

    // Level
    const levelEmoji = {
      debug: '🔍',
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌',
    }
    parts.push(`${levelEmoji[entry.level]} ${entry.level.toUpperCase()}`)

    // Context
    if (entry.context) {
      parts.push(`[${entry.context}]`)
    }

    // Message
    parts.push(entry.message)

    return parts.join(' ')
  }

  /**
   * Output log entry
   */
  private output(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) {
      return
    }

    if (this.config.enableConsole) {
      const message = this.formatConsoleMessage(entry)

      // Use appropriate console method
      switch (entry.level) {
        case 'debug':
          console.debug(message, entry.metadata || '')
          break
        case 'info':
          console.info(message, entry.metadata || '')
          break
        case 'warn':
          console.warn(message, entry.metadata || '')
          break
        case 'error':
          console.error(message, entry.metadata || '', entry.error || '')
          break
      }
    }

    // In production, you might send structured logs to a service like:
    // - Vercel Analytics
    // - Sentry
    // - DataDog
    // - CloudWatch
    if (this.config.enableStructured) {
      // For now, just output as JSON in non-development
      if (process.env.NODE_ENV !== 'development') {
        console.log(JSON.stringify(entry))
      }
    }
  }

  /**
   * Create log entry
   */
  private createEntry(
    level: LogLevel,
    message: string,
    metadata?: Record<string, unknown>,
    error?: Error | string
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
    }

    if (this.context) {
      entry.context = this.context
    }

    if (metadata && Object.keys(metadata).length > 0) {
      entry.metadata = metadata
    }

    if (error) {
      entry.error = error instanceof Error ? error.message : error

      // Include stack trace in development
      if (this.config.includeStack && error instanceof Error && error.stack) {
        entry.metadata = {
          ...entry.metadata,
          stack: error.stack
        }
      }
    }

    return entry
  }

  /**
   * Debug level logging
   */
  debug(message: string, metadata?: Record<string, unknown>): void {
    this.output(this.createEntry('debug', message, metadata))
  }

  /**
   * Info level logging
   */
  info(message: string, metadata?: Record<string, unknown>): void {
    this.output(this.createEntry('info', message, metadata))
  }

  /**
   * Warning level logging
   *
   * @example
   * logger.warn('Operation failed', { userId: '123', attempts: 3 })
   * logger.warn('Connection error', { error: err, endpoint: '/api/data' })
   */
  warn(message: string, metadata?: Record<string, unknown>): void {
    const error = metadata?.error as Error | string | undefined
    this.output(this.createEntry('warn', message, metadata, error))
  }

  /**
   * Error level logging
   *
   * @example
   * logger.error('Database query failed', { error: err, query: 'SELECT *' })
   * logger.error('Unexpected error', { error: err })
   */
  error(message: string, metadata?: Record<string, unknown>): void {
    const error = metadata?.error as Error | string | undefined
    this.output(this.createEntry('error', message, metadata, error))
  }

  /**
   * Log API request
   */
  apiRequest(method: string, path: string, metadata?: Record<string, unknown>): void {
    this.info(`${method} ${path}`, {
      type: 'api_request',
      method,
      path,
      ...metadata
    })
  }

  /**
   * Log API response
   */
  apiResponse(method: string, path: string, status: number, duration?: number): void {
    const message = `${method} ${path} - ${status}`
    const metadata = {
      type: 'api_response',
      method,
      path,
      status,
      duration
    }

    if (status >= 400) {
      this.error(message, metadata)
    } else {
      this.info(message, metadata)
    }
  }

  /**
   * Log database query
   */
  dbQuery(query: string, duration?: number, metadata?: Record<string, unknown>): void {
    this.debug('Database query executed', {
      type: 'db_query',
      query: query.substring(0, 100) + (query.length > 100 ? '...' : ''),
      duration,
      ...metadata
    })
  }

  /**
   * Log user action
   */
  userAction(userId: string, action: string, metadata?: Record<string, unknown>): void {
    this.info(`User action: ${action}`, {
      type: 'user_action',
      userId,
      action,
      ...metadata
    })
  }

  /**
   * Log performance metric
   */
  performance(metric: string, value: number, unit = 'ms'): void {
    this.info(`Performance: ${metric}`, {
      type: 'performance',
      metric,
      value,
      unit
    })
  }
}

// =============================================================================
// Default Logger Instance
// =============================================================================

/**
 * Default logger instance
 */
export const logger = new Logger()

/**
 * Create a logger for a specific context (component, service, etc.)
 */
export function createLogger(context: string, config?: Partial<LoggerConfig>): Logger {
  return new Logger(context, config)
}

// =============================================================================
// Convenience Functions
// =============================================================================

/**
 * Quick debug logging
 */
export const debug = (message: string, metadata?: Record<string, unknown>) =>
  logger.debug(message, metadata)

/**
 * Quick info logging
 */
export const info = (message: string, metadata?: Record<string, unknown>) =>
  logger.info(message, metadata)

/**
 * Quick warning logging
 */
export const warn = (message: string, metadata?: Record<string, unknown>) =>
  logger.warn(message, metadata)

/**
 * Quick error logging
 */
export const error = (message: string, metadata?: Record<string, unknown>) =>
  logger.error(message, metadata)

// =============================================================================
// Migration Helper: Replace console.log
// =============================================================================

/**
 * Temporary helper to gradually replace console.log statements
 * Usage: Replace console.log(msg) with log(msg)
 *
 * @deprecated Use structured logging methods instead
 */
export const log = (message: unknown, ...args: unknown[]) => {
  if (typeof message === 'string') {
    logger.info(message, args.length > 0 ? { args } : undefined)
  } else {
    logger.info('Console output', { message, args })
  }
}

/**
 * Helper to replace console.error
 *
 * @deprecated Use logger.error instead
 */
export const logError = (message: unknown, ...args: unknown[]) => {
  if (message instanceof Error) {
    logger.error(message.message, { error: message, ...(args.length > 0 ? { args } : {}) })
  } else if (typeof message === 'string') {
    logger.error(message, args.length > 0 ? { args } : undefined)
  } else {
    logger.error('Console error output', { message, args })
  }
}
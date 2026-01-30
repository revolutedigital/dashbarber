'use strict'

/**
 * Structured Logging Utility
 * Provides consistent, JSON-formatted logs for observability
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  context?: Record<string, unknown>
  error?: {
    name: string
    message: string
    stack?: string
  }
}

// Log level hierarchy for filtering
const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

// Current log level (can be set via environment)
const currentLevel: LogLevel = (process.env.NEXT_PUBLIC_LOG_LEVEL as LogLevel) || 'info'

/**
 * Checks if a log level should be output
 */
function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel]
}

/**
 * Formats a log entry as JSON
 */
function formatEntry(entry: LogEntry): string {
  return JSON.stringify(entry)
}

/**
 * Creates a log entry
 */
function createEntry(
  level: LogLevel,
  message: string,
  context?: Record<string, unknown>,
  error?: Error
): LogEntry {
  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
  }

  if (context && Object.keys(context).length > 0) {
    entry.context = context
  }

  if (error) {
    entry.error = {
      name: error.name,
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    }
  }

  return entry
}

/**
 * Structured logger with JSON output
 */
export const logger = {
  /**
   * Debug level log - verbose information for debugging
   */
  debug(message: string, context?: Record<string, unknown>): void {
    if (!shouldLog('debug')) return

    const entry = createEntry('debug', message, context)
    console.debug(formatEntry(entry))
  },

  /**
   * Info level log - general information about application flow
   */
  info(message: string, context?: Record<string, unknown>): void {
    if (!shouldLog('info')) return

    const entry = createEntry('info', message, context)
    console.log(formatEntry(entry))
  },

  /**
   * Warn level log - potentially problematic situations
   */
  warn(message: string, context?: Record<string, unknown>): void {
    if (!shouldLog('warn')) return

    const entry = createEntry('warn', message, context)
    console.warn(formatEntry(entry))
  },

  /**
   * Error level log - errors that need attention
   */
  error(message: string, error?: Error, context?: Record<string, unknown>): void {
    if (!shouldLog('error')) return

    const entry = createEntry('error', message, context, error)
    console.error(formatEntry(entry))
  },

  /**
   * Logs with a custom level
   */
  log(level: LogLevel, message: string, context?: Record<string, unknown>): void {
    switch (level) {
      case 'debug':
        this.debug(message, context)
        break
      case 'info':
        this.info(message, context)
        break
      case 'warn':
        this.warn(message, context)
        break
      case 'error':
        this.error(message, undefined, context)
        break
    }
  },

  /**
   * Creates a child logger with additional context
   */
  child(defaultContext: Record<string, unknown>) {
    return {
      debug: (message: string, context?: Record<string, unknown>) =>
        logger.debug(message, { ...defaultContext, ...context }),
      info: (message: string, context?: Record<string, unknown>) =>
        logger.info(message, { ...defaultContext, ...context }),
      warn: (message: string, context?: Record<string, unknown>) =>
        logger.warn(message, { ...defaultContext, ...context }),
      error: (message: string, error?: Error, context?: Record<string, unknown>) =>
        logger.error(message, error, { ...defaultContext, ...context }),
    }
  },

  /**
   * Measures and logs the duration of an async operation
   */
  async measure<T>(
    name: string,
    fn: () => Promise<T>,
    context?: Record<string, unknown>
  ): Promise<T> {
    const start = performance.now()

    try {
      const result = await fn()
      const duration = performance.now() - start

      this.info(`${name} completed`, {
        ...context,
        durationMs: Math.round(duration * 100) / 100,
      })

      return result
    } catch (error) {
      const duration = performance.now() - start

      this.error(`${name} failed`, error as Error, {
        ...context,
        durationMs: Math.round(duration * 100) / 100,
      })

      throw error
    }
  },
}

/**
 * Creates a request logger for API routes
 */
export function createRequestLogger(requestId: string) {
  return logger.child({ requestId })
}

/**
 * Log formatter for Next.js API routes
 */
export function logRequest(
  method: string,
  path: string,
  statusCode: number,
  durationMs: number,
  context?: Record<string, unknown>
): void {
  const level: LogLevel = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info'

  logger.log(level, `${method} ${path} ${statusCode}`, {
    method,
    path,
    statusCode,
    durationMs: Math.round(durationMs * 100) / 100,
    ...context,
  })
}

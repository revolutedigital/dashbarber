'use strict'

/**
 * Data Engineering Utilities
 * Retry, Circuit Breaker, Rate Limiting, and Fetch utilities
 * Enterprise-grade data pipeline patterns (2026)
 */

// ============================================
// RETRY WITH EXPONENTIAL BACKOFF
// ============================================

export interface RetryOptions {
  maxRetries: number
  baseDelayMs: number
  maxDelayMs: number
  shouldRetry?: (error: unknown, attempt: number) => boolean
}

const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 3,
  baseDelayMs: 500,
  maxDelayMs: 5000,
  shouldRetry: (error, attempt) => {
    // Retry on network errors or 5xx status codes
    if (error instanceof Error) {
      const message = error.message.toLowerCase()
      if (message.includes('network') || message.includes('timeout') || message.includes('5')) {
        return attempt < 3
      }
    }
    return false
  },
}

/**
 * Adds jitter to delay to prevent thundering herd
 */
function addJitter(delayMs: number): number {
  const jitter = delayMs * 0.2 * Math.random()
  return delayMs + jitter
}

/**
 * Calculates exponential backoff delay
 */
function calculateDelay(attempt: number, options: RetryOptions): number {
  const exponentialDelay = options.baseDelayMs * Math.pow(2, attempt)
  const cappedDelay = Math.min(exponentialDelay, options.maxDelayMs)
  return addJitter(cappedDelay)
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Executes a function with retry and exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options }
  let lastError: unknown

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error

      if (attempt < opts.maxRetries && opts.shouldRetry?.(error, attempt)) {
        const delay = calculateDelay(attempt, opts)
        if (process.env.NODE_ENV === 'development') {
          console.warn(`Retry attempt ${attempt + 1}/${opts.maxRetries} after ${delay}ms`)
        }
        await sleep(delay)
      } else {
        throw error
      }
    }
  }

  throw lastError
}

// ============================================
// CIRCUIT BREAKER PATTERN
// ============================================

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN'

export interface CircuitBreakerOptions {
  failureThreshold: number
  resetTimeoutMs: number
  halfOpenRequests: number
}

const DEFAULT_CIRCUIT_OPTIONS: CircuitBreakerOptions = {
  failureThreshold: 5,
  resetTimeoutMs: 30000, // 30 seconds
  halfOpenRequests: 3,
}

interface CircuitBreakerState {
  state: CircuitState
  failures: number
  lastFailureTime: number
  halfOpenSuccesses: number
}

const circuitBreakers = new Map<string, CircuitBreakerState>()

/**
 * Gets or creates circuit breaker state for a given key
 */
function getCircuitState(key: string): CircuitBreakerState {
  if (!circuitBreakers.has(key)) {
    circuitBreakers.set(key, {
      state: 'CLOSED',
      failures: 0,
      lastFailureTime: 0,
      halfOpenSuccesses: 0,
    })
  }
  return circuitBreakers.get(key)!
}

/**
 * Executes a function with circuit breaker protection
 */
export async function withCircuitBreaker<T>(
  key: string,
  fn: () => Promise<T>,
  options: Partial<CircuitBreakerOptions> = {}
): Promise<T> {
  const opts = { ...DEFAULT_CIRCUIT_OPTIONS, ...options }
  const circuit = getCircuitState(key)
  const now = Date.now()

  // Check if circuit should transition from OPEN to HALF_OPEN
  if (circuit.state === 'OPEN') {
    if (now - circuit.lastFailureTime >= opts.resetTimeoutMs) {
      circuit.state = 'HALF_OPEN'
      circuit.halfOpenSuccesses = 0
    } else {
      throw new Error(`Circuit breaker OPEN for ${key}. Retry after ${opts.resetTimeoutMs - (now - circuit.lastFailureTime)}ms`)
    }
  }

  try {
    const result = await fn()

    // Success handling
    if (circuit.state === 'HALF_OPEN') {
      circuit.halfOpenSuccesses++
      if (circuit.halfOpenSuccesses >= opts.halfOpenRequests) {
        // Fully recovered
        circuit.state = 'CLOSED'
        circuit.failures = 0
      }
    } else {
      // Reset failures on success in CLOSED state
      circuit.failures = 0
    }

    return result
  } catch (error) {
    // Failure handling
    circuit.failures++
    circuit.lastFailureTime = now

    if (circuit.state === 'HALF_OPEN' || circuit.failures >= opts.failureThreshold) {
      circuit.state = 'OPEN'
    }

    throw error
  }
}

/**
 * Gets current circuit breaker status (for monitoring)
 */
export function getCircuitStatus(key: string): CircuitBreakerState | null {
  return circuitBreakers.get(key) || null
}

/**
 * Resets circuit breaker (for testing/manual recovery)
 */
export function resetCircuit(key: string): void {
  circuitBreakers.delete(key)
}

// ============================================
// RATE LIMITER WITH CLEANUP
// ============================================

interface RateLimitRecord {
  count: number
  resetTime: number
}

const rateLimitMap = new Map<string, RateLimitRecord>()
let lastCleanup = Date.now()
const CLEANUP_INTERVAL = 60000 // 1 minute

/**
 * Cleans up expired rate limit records to prevent memory leak
 */
function cleanupRateLimits(): void {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL) return

  for (const [key, record] of rateLimitMap.entries()) {
    if (now > record.resetTime) {
      rateLimitMap.delete(key)
    }
  }
  lastCleanup = now
}

/**
 * Checks and updates rate limit for a given key
 */
export function checkRateLimit(
  key: string,
  windowMs: number = 60000,
  maxRequests: number = 30
): { allowed: boolean; remaining: number; resetIn: number } {
  // Cleanup expired entries periodically
  cleanupRateLimits()

  const now = Date.now()
  const record = rateLimitMap.get(key)

  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs })
    return { allowed: true, remaining: maxRequests - 1, resetIn: windowMs }
  }

  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetIn: record.resetTime - now }
  }

  record.count++
  return { allowed: true, remaining: maxRequests - record.count, resetIn: record.resetTime - now }
}

/**
 * Gets rate limiter stats (for monitoring)
 */
export function getRateLimitStats(): { totalKeys: number; oldestEntry: number } {
  let oldestEntry = Date.now()
  for (const record of rateLimitMap.values()) {
    if (record.resetTime < oldestEntry) {
      oldestEntry = record.resetTime
    }
  }
  return { totalKeys: rateLimitMap.size, oldestEntry }
}

// ============================================
// FETCH WITH TIMEOUT (AbortController)
// ============================================

export interface FetchWithTimeoutOptions extends RequestInit {
  timeoutMs?: number
}

/**
 * Fetch with automatic timeout using AbortController
 */
export async function fetchWithTimeout(
  url: string,
  options: FetchWithTimeoutOptions = {}
): Promise<Response> {
  const { timeoutMs = 30000, ...fetchOptions } = options

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
      redirect: 'follow',
    })
    return response
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeoutMs}ms`)
    }
    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}

// ============================================
// COMBINED: RESILIENT FETCH
// ============================================

export interface ResilientFetchOptions extends FetchWithTimeoutOptions {
  retryOptions?: Partial<RetryOptions>
  circuitBreakerKey?: string
  circuitBreakerOptions?: Partial<CircuitBreakerOptions>
}

/**
 * Enterprise-grade fetch with retry, circuit breaker, and timeout
 */
export async function resilientFetch(
  url: string,
  options: ResilientFetchOptions = {}
): Promise<Response> {
  const {
    retryOptions,
    circuitBreakerKey,
    circuitBreakerOptions,
    ...fetchOptions
  } = options

  const fetchFn = () => fetchWithTimeout(url, fetchOptions)

  // Apply retry
  const retryFn = () => withRetry(fetchFn, {
    ...retryOptions,
    shouldRetry: (error) => {
      if (error instanceof Error) {
        const message = error.message.toLowerCase()
        // Retry on timeout, network errors, and 5xx
        return message.includes('timeout') ||
               message.includes('network') ||
               message.includes('500') ||
               message.includes('502') ||
               message.includes('503') ||
               message.includes('504')
      }
      return false
    }
  })

  // Apply circuit breaker if key provided
  if (circuitBreakerKey) {
    return withCircuitBreaker(circuitBreakerKey, retryFn, circuitBreakerOptions)
  }

  return retryFn()
}

// ============================================
// DATA QUALITY HELPERS
// ============================================

/**
 * Validates logical constraints on Meta Ads data
 * Returns array of validation errors (empty if valid)
 */
export function validateMetaAdsLogic(data: {
  reach: number
  impressions: number
  clicksAll: number
  uniqueLinkClicks: number
  purchases: number
}): string[] {
  const errors: string[] = []

  // Reach should be <= impressions (can view multiple times)
  if (data.reach > data.impressions) {
    errors.push(`reach (${data.reach}) cannot exceed impressions (${data.impressions})`)
  }

  // Clicks should be <= impressions
  if (data.clicksAll > data.impressions) {
    errors.push(`clicksAll (${data.clicksAll}) cannot exceed impressions (${data.impressions})`)
  }

  // Unique link clicks should be <= total clicks
  if (data.uniqueLinkClicks > data.clicksAll) {
    errors.push(`uniqueLinkClicks (${data.uniqueLinkClicks}) cannot exceed clicksAll (${data.clicksAll})`)
  }

  // Purchases should be <= unique link clicks (typical funnel)
  // Note: This is a soft validation, may have edge cases
  if (data.purchases > data.uniqueLinkClicks && data.uniqueLinkClicks > 0) {
    errors.push(`purchases (${data.purchases}) typically should not exceed uniqueLinkClicks (${data.uniqueLinkClicks})`)
  }

  return errors
}

/**
 * Validates date format (DD/MM or YYYY-MM-DD)
 */
export function isValidDateFormat(dateStr: string): boolean {
  // DD/MM format
  const ddMmPattern = /^\d{1,2}\/\d{1,2}$/
  // YYYY-MM-DD format
  const isoPattern = /^\d{4}-\d{2}-\d{2}$/
  // DD/MM/YYYY format
  const fullPattern = /^\d{1,2}\/\d{1,2}\/\d{2,4}$/

  return ddMmPattern.test(dateStr) || isoPattern.test(dateStr) || fullPattern.test(dateStr)
}

/**
 * Detects anomalies using Z-score
 * Returns true if value is an outlier (> 3 standard deviations)
 */
export function isAnomaly(value: number, values: number[], threshold: number = 3): boolean {
  if (values.length < 3) return false

  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length
  const stdDev = Math.sqrt(variance)

  if (stdDev === 0) return false

  const zScore = Math.abs((value - mean) / stdDev)
  return zScore > threshold
}

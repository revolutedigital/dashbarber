'use strict'

/**
 * Audit Logging System
 * Tracks user actions for security and compliance purposes
 */

export type AuditAction =
  | 'config_update'
  | 'metric_create'
  | 'metric_delete'
  | 'goal_create'
  | 'goal_delete'
  | 'goal_update'
  | 'data_export'
  | 'data_refresh'
  | 'filter_change'
  | 'theme_toggle'
  | 'settings_toggle'
  | 'error_occurred'
  | 'session_start'
  | 'session_end'

export interface AuditEntry {
  id: string
  timestamp: string
  action: AuditAction
  metadata: Record<string, unknown>
  userAgent?: string
  sessionId: string
}

// In-memory audit log (limited to last 100 entries)
const MAX_ENTRIES = 100
let auditLog: AuditEntry[] = []
let sessionId = ''

/**
 * Initializes the audit session
 */
export function initAuditSession(): string {
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`
    logUserAction('session_start', { startedAt: new Date().toISOString() })
  }
  return sessionId
}

/**
 * Gets the current session ID
 */
export function getSessionId(): string {
  if (!sessionId) {
    return initAuditSession()
  }
  return sessionId
}

/**
 * Logs a user action
 * @param action - Type of action performed
 * @param metadata - Additional context about the action
 */
export function logUserAction(
  action: AuditAction,
  metadata: Record<string, unknown> = {}
): AuditEntry {
  const entry: AuditEntry = {
    id: `audit_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    timestamp: new Date().toISOString(),
    action,
    metadata: sanitizeMetadata(metadata),
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    sessionId: getSessionId(),
  }

  auditLog.push(entry)

  // Keep only the last MAX_ENTRIES
  if (auditLog.length > MAX_ENTRIES) {
    auditLog = auditLog.slice(-MAX_ENTRIES)
  }

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[AUDIT] ${action}:`, metadata)
  }

  return entry
}

/**
 * Sanitizes metadata to remove sensitive information
 */
function sanitizeMetadata(metadata: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(metadata)) {
    // Skip potentially sensitive keys
    if (key.toLowerCase().includes('password') ||
        key.toLowerCase().includes('secret') ||
        key.toLowerCase().includes('token') ||
        key.toLowerCase().includes('key')) {
      sanitized[key] = '[REDACTED]'
      continue
    }

    // Truncate long strings
    if (typeof value === 'string' && value.length > 500) {
      sanitized[key] = value.substring(0, 500) + '...[truncated]'
      continue
    }

    sanitized[key] = value
  }

  return sanitized
}

/**
 * Gets the audit log entries
 * @param limit - Maximum number of entries to return
 * @param action - Filter by action type
 */
export function getAuditLog(
  limit?: number,
  action?: AuditAction
): AuditEntry[] {
  let entries = [...auditLog]

  if (action) {
    entries = entries.filter(e => e.action === action)
  }

  if (limit && limit > 0) {
    entries = entries.slice(-limit)
  }

  return entries
}

/**
 * Gets audit log statistics
 */
export function getAuditStats(): {
  totalEntries: number
  actionCounts: Record<string, number>
  sessionId: string
  firstEntry: string | null
  lastEntry: string | null
} {
  const actionCounts: Record<string, number> = {}

  for (const entry of auditLog) {
    actionCounts[entry.action] = (actionCounts[entry.action] || 0) + 1
  }

  return {
    totalEntries: auditLog.length,
    actionCounts,
    sessionId: getSessionId(),
    firstEntry: auditLog[0]?.timestamp || null,
    lastEntry: auditLog[auditLog.length - 1]?.timestamp || null,
  }
}

/**
 * Exports the audit log as JSON
 */
export function exportAuditLog(): string {
  return JSON.stringify({
    exportedAt: new Date().toISOString(),
    sessionId: getSessionId(),
    stats: getAuditStats(),
    entries: auditLog,
  }, null, 2)
}

/**
 * Clears the audit log (use with caution)
 */
export function clearAuditLog(): void {
  logUserAction('session_end', {
    entriesCleared: auditLog.length,
    endedAt: new Date().toISOString(),
  })
  auditLog = []
}

/**
 * Creates an audit decorator for functions
 * @param action - Action to log when function is called
 */
export function withAudit<T extends (...args: unknown[]) => unknown>(
  action: AuditAction,
  fn: T,
  getMetadata?: (...args: Parameters<T>) => Record<string, unknown>
): T {
  return ((...args: Parameters<T>) => {
    const metadata = getMetadata ? getMetadata(...args) : {}
    logUserAction(action, metadata)
    return fn(...args)
  }) as T
}

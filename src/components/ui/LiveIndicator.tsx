'use client'

import { useState, useEffect, useCallback } from 'react'
import { RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LiveIndicatorProps {
  /**
   * Last update timestamp
   */
  lastUpdate?: Date | null
  /**
   * Whether data is currently being fetched
   */
  isLoading?: boolean
  /**
   * Callback to refresh data
   */
  onRefresh?: () => void
  /**
   * Auto-refresh interval in milliseconds (0 to disable)
   */
  autoRefreshInterval?: number
  /**
   * Additional CSS classes
   */
  className?: string
  /**
   * Show relative time (e.g., "2 min ago")
   */
  showRelativeTime?: boolean
}

/**
 * Formats a date as relative time (e.g., "2 min ago")
 */
function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffSec < 10) return 'agora'
  if (diffSec < 60) return `${diffSec}s atrás`
  if (diffMin < 60) return `${diffMin}min atrás`
  if (diffHour < 24) return `${diffHour}h atrás`
  return `${diffDay}d atrás`
}

/**
 * Formats a date as absolute time (e.g., "14:30")
 */
function formatAbsoluteTime(date: Date): string {
  return date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Live data indicator component
 * Shows when data was last updated and allows manual refresh
 */
export function LiveIndicator({
  lastUpdate,
  isLoading = false,
  onRefresh,
  autoRefreshInterval = 0,
  className,
  showRelativeTime = true,
}: LiveIndicatorProps) {
  const [relativeTime, setRelativeTime] = useState<string>('')
  const [isPulsing, setIsPulsing] = useState(false)

  // Update relative time every 10 seconds
  useEffect(() => {
    if (!lastUpdate || !showRelativeTime) return

    const updateRelativeTime = () => {
      setRelativeTime(formatRelativeTime(lastUpdate))
    }

    updateRelativeTime()
    const interval = setInterval(updateRelativeTime, 10000)

    return () => clearInterval(interval)
  }, [lastUpdate, showRelativeTime])

  // Auto-refresh functionality
  useEffect(() => {
    if (!onRefresh || autoRefreshInterval <= 0) return

    const interval = setInterval(() => {
      onRefresh()
    }, autoRefreshInterval)

    return () => clearInterval(interval)
  }, [onRefresh, autoRefreshInterval])

  // Trigger pulse animation when data updates
  useEffect(() => {
    if (lastUpdate) {
      setIsPulsing(true)
      const timeout = setTimeout(() => setIsPulsing(false), 1000)
      return () => clearTimeout(timeout)
    }
  }, [lastUpdate])

  const handleRefresh = useCallback(() => {
    if (onRefresh && !isLoading) {
      onRefresh()
    }
  }, [onRefresh, isLoading])

  const isRecent = lastUpdate && (Date.now() - lastUpdate.getTime()) < 60000 // Less than 1 minute

  return (
    <div
      className={cn(
        'live-indicator',
        isLoading && 'live-indicator--updating',
        className
      )}
      role="status"
      aria-live="polite"
      aria-label={lastUpdate ? `Última atualização: ${formatAbsoluteTime(lastUpdate)}` : 'Dados não carregados'}
    >
      {/* Pulse dot */}
      <span
        className={cn(
          'live-indicator__dot',
          isPulsing && 'live-indicator__dot--pulse',
          isRecent && 'live-indicator__dot--recent'
        )}
        aria-hidden="true"
      />

      {/* Time display */}
      <span className="live-indicator__time">
        {isLoading ? (
          'Atualizando...'
        ) : lastUpdate ? (
          showRelativeTime ? relativeTime : formatAbsoluteTime(lastUpdate)
        ) : (
          'Não atualizado'
        )}
      </span>

      {/* Refresh button */}
      {onRefresh && (
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className={cn(
            'live-indicator__refresh',
            isLoading && 'live-indicator__refresh--loading'
          )}
          aria-label="Atualizar dados"
          title="Atualizar dados"
        >
          <RefreshCw
            className={cn(
              'w-3.5 h-3.5 transition-transform',
              isLoading && 'animate-spin'
            )}
          />
        </button>
      )}

      {/* Screen reader announcement for updates */}
      {isPulsing && (
        <span className="sr-only">
          Dados atualizados às {lastUpdate ? formatAbsoluteTime(lastUpdate) : ''}
        </span>
      )}
    </div>
  )
}

/**
 * Simplified version for header usage
 */
export function LiveBadge({
  isLive = true,
  className
}: {
  isLive?: boolean
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium',
        isLive
          ? 'bg-emerald-500/20 text-emerald-500'
          : 'bg-muted text-muted-foreground',
        className
      )}
      role="status"
      aria-label={isLive ? 'Dados ao vivo' : 'Dados offline'}
    >
      <span
        className={cn(
          'w-1.5 h-1.5 rounded-full',
          isLive ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground'
        )}
        aria-hidden="true"
      />
      {isLive ? 'Live' : 'Offline'}
    </span>
  )
}

export default LiveIndicator

'use client'

import { useState, useCallback, useMemo } from 'react'
import {
  AlertTriangle,
  AlertOctagon,
  Info,
  X,
  ChevronDown,
  ChevronUp,
  Activity,
  DollarSign,
  Users,
  TrendingUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { type Alert, type AlertCategory, getAlertColors } from '@/lib/alerts'

interface AlertBannerProps {
  alerts: Alert[]
  onDismiss?: (alertId: string) => void
  onDismissAll?: () => void
  className?: string
  maxVisible?: number
}

function getIcon(category: AlertCategory) {
  switch (category) {
    case 'performance':
      return Activity
    case 'budget':
      return DollarSign
    case 'saturation':
      return Users
    case 'anomaly':
      return AlertTriangle
    case 'opportunity':
      return TrendingUp
  }
}

function getSeverityIcon(severity: Alert['severity']) {
  switch (severity) {
    case 'critical':
      return AlertOctagon
    case 'warning':
      return AlertTriangle
    case 'info':
      return Info
  }
}

/**
 * Alert banner component for displaying system alerts
 */
export function AlertBanner({
  alerts,
  onDismiss,
  onDismissAll,
  className,
  maxVisible = 3,
}: AlertBannerProps) {
  const [expanded, setExpanded] = useState(false)
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  const visibleAlerts = useMemo(() => {
    return alerts.filter(alert => !dismissed.has(alert.id))
  }, [alerts, dismissed])

  const displayedAlerts = useMemo(() => {
    return expanded ? visibleAlerts : visibleAlerts.slice(0, maxVisible)
  }, [visibleAlerts, expanded, maxVisible])

  const hiddenCount = visibleAlerts.length - displayedAlerts.length

  const handleDismiss = useCallback((alertId: string) => {
    setDismissed(prev => new Set(prev).add(alertId))
    onDismiss?.(alertId)
  }, [onDismiss])

  const handleDismissAll = useCallback(() => {
    setDismissed(new Set(visibleAlerts.map(a => a.id)))
    onDismissAll?.()
  }, [visibleAlerts, onDismissAll])

  const toggleExpanded = useCallback(() => {
    setExpanded(prev => !prev)
  }, [])

  if (visibleAlerts.length === 0) {
    return null
  }

  return (
    <div
      className={cn('space-y-2', className)}
      role="alert"
      aria-live="polite"
    >
      {displayedAlerts.map((alert) => {
        const colors = getAlertColors(alert.severity)
        const CategoryIcon = getIcon(alert.category)
        const SeverityIcon = getSeverityIcon(alert.severity)

        return (
          <div
            key={alert.id}
            className={cn(
              'relative flex items-start gap-3 p-3 rounded-xl border',
              colors.bg,
              colors.border
            )}
          >
            {/* Icon */}
            <div className={cn('flex-shrink-0 p-1.5 rounded-lg', colors.bg)}>
              <SeverityIcon className={cn('w-4 h-4', colors.icon)} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <CategoryIcon className={cn('w-3.5 h-3.5', colors.text)} />
                <h4 className={cn('text-sm font-medium', colors.text)}>
                  {alert.title}
                </h4>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                {alert.message}
              </p>
              {alert.action && (
                <p className="text-xs text-muted-foreground/80 mt-1 italic">
                  {alert.action}
                </p>
              )}
              {alert.currentValue !== undefined && alert.threshold !== undefined && (
                <p className="text-xs font-medium mt-1">
                  Valor atual: {alert.currentValue.toFixed(2)} | Limite: {alert.threshold.toFixed(2)}
                </p>
              )}
            </div>

            {/* Dismiss button */}
            {onDismiss && (
              <button
                onClick={() => handleDismiss(alert.id)}
                className="flex-shrink-0 p-1 rounded hover:bg-white/10 transition-colors"
                aria-label="Dispensar alerta"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>
        )
      })}

      {/* Show more / Show less */}
      {visibleAlerts.length > maxVisible && (
        <div className="flex items-center justify-between">
          <button
            onClick={toggleExpanded}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {expanded ? (
              <>
                <ChevronUp className="w-3 h-3" />
                Mostrar menos
              </>
            ) : (
              <>
                <ChevronDown className="w-3 h-3" />
                Mostrar mais {hiddenCount} alertas
              </>
            )}
          </button>

          {onDismissAll && (
            <button
              onClick={handleDismissAll}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Dispensar todos
            </button>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Compact alert indicator for header/status bar
 */
export function AlertIndicator({
  alerts,
  onClick,
  className,
}: {
  alerts: Alert[]
  onClick?: () => void
  className?: string
}) {
  const criticalCount = alerts.filter(a => a.severity === 'critical').length
  const warningCount = alerts.filter(a => a.severity === 'warning').length

  if (alerts.length === 0) {
    return null
  }

  const hasCritical = criticalCount > 0

  return (
    <button
      onClick={onClick}
      className={cn(
        'relative flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium transition-colors',
        hasCritical
          ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
          : 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20',
        className
      )}
      aria-label={`${alerts.length} alertas ativos`}
    >
      <AlertTriangle className="w-3.5 h-3.5" />
      <span>{alerts.length}</span>

      {/* Pulse indicator for critical alerts */}
      {hasCritical && (
        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
      )}
    </button>
  )
}

export default AlertBanner

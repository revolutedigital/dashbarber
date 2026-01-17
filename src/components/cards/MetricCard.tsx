'use client'

import { ReactNode, memo } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface MetricCardProps {
  title: string
  value: string
  subtitle?: string
  trend?: number
  icon?: ReactNode
  className?: string
}

export const MetricCard = memo(function MetricCard({
  title,
  value,
  subtitle,
  trend,
  icon,
  className = '',
}: MetricCardProps) {
  const isPositive = trend !== undefined && trend > 0
  const isNegative = trend !== undefined && trend < 0

  return (
    <div
      className={`
        relative bg-card rounded-xl p-5 border border-border
        transition-all duration-200 hover:border-primary/30 hover:shadow-lg
        group ${className}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {title}
        </span>
        {icon && (
          <div className="p-2 rounded-lg bg-primary/5 text-primary group-hover:bg-primary/10 transition-colors [&>svg]:w-4 [&>svg]:h-4">
            {icon}
          </div>
        )}
      </div>

      {/* Value */}
      <div className="text-3xl font-bold text-foreground number-display mb-1">
        {value}
      </div>

      {/* Footer */}
      <div className="flex items-center gap-2 mt-2">
        {trend !== undefined && (
          <div
            className={`
              flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full
              ${isPositive ? 'text-emerald-600 bg-emerald-500/10' : ''}
              ${isNegative ? 'text-red-600 bg-red-500/10' : ''}
              ${!isPositive && !isNegative ? 'text-muted-foreground bg-muted' : ''}
            `}
          >
            {isPositive && <TrendingUp className="w-3 h-3" />}
            {isNegative && <TrendingDown className="w-3 h-3" />}
            <span>{isPositive ? '+' : ''}{trend.toFixed(1)}%</span>
          </div>
        )}
        {subtitle && (
          <span className="text-xs text-muted-foreground">
            {subtitle}
          </span>
        )}
      </div>
    </div>
  )
})

MetricCard.displayName = 'MetricCard'

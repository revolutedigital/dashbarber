'use client'

import { ReactNode, memo } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

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
        relative bg-card/80 backdrop-blur-sm rounded-2xl p-5
        border border-border/50
        transition-all duration-300 ease-out
        hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5
        hover:-translate-y-1
        group ${className}
      `}
    >
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent rounded-2xl pointer-events-none" />

      {/* Header */}
      <div className="relative flex items-center justify-between mb-4">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {title}
        </span>
        {icon && (
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary group-hover:bg-primary/15 transition-all duration-300 group-hover:scale-110 [&>svg]:w-4 [&>svg]:h-4">
            {icon}
          </div>
        )}
      </div>

      {/* Value */}
      <div className="relative text-3xl font-bold text-foreground tabular-nums tracking-tight mb-1">
        {value}
      </div>

      {/* Footer */}
      <div className="relative flex items-center gap-2 mt-3">
        {trend !== undefined && (
          <div
            className={`
              flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full
              ${isPositive ? 'text-emerald-500 bg-emerald-500/10' : ''}
              ${isNegative ? 'text-red-500 bg-red-500/10' : ''}
              ${!isPositive && !isNegative ? 'text-muted-foreground bg-muted/50' : ''}
            `}
          >
            {isPositive && <TrendingUp className="w-3 h-3" />}
            {isNegative && <TrendingDown className="w-3 h-3" />}
            {!isPositive && !isNegative && <Minus className="w-3 h-3" />}
            <span>{isPositive ? '+' : ''}{trend.toFixed(1)}%</span>
          </div>
        )}
        {subtitle && (
          <span className="text-xs text-muted-foreground/70">
            {subtitle}
          </span>
        )}
      </div>
    </div>
  )
})

MetricCard.displayName = 'MetricCard'

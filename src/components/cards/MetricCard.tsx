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
  variant?: 'default' | 'outline' | 'ghost'
}

export const MetricCard = memo(function MetricCard({
  title,
  value,
  subtitle,
  trend,
  icon,
  className = '',
  variant = 'default',
}: MetricCardProps) {
  const getTrendIcon = () => {
    if (trend === undefined) return null
    if (trend > 0) return <TrendingUp className="w-4 h-4" />
    if (trend < 0) return <TrendingDown className="w-4 h-4" />
    return <Minus className="w-4 h-4" />
  }

  const getTrendColor = () => {
    if (trend === undefined) return 'text-muted-foreground'
    if (trend > 0) return 'text-emerald-500'
    if (trend < 0) return 'text-rose-500'
    return 'text-muted-foreground'
  }

  const variantClasses = {
    default: 'bg-card border border-border/50 shadow-sm',
    outline: 'bg-transparent border-2 border-border',
    ghost: 'bg-muted/30 border-0',
  }

  return (
    <div
      className={`
        relative rounded-xl p-5 overflow-hidden
        ${variantClasses[variant]}
        card-hover group
        ${className}
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <span className="text-[13px] font-semibold text-muted-foreground tracking-wide">
          {title}
        </span>
        {icon && (
          <div className="p-2 rounded-lg bg-muted/50 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors [&>svg]:w-5 [&>svg]:h-5">
            {icon}
          </div>
        )}
      </div>

      {/* Value */}
      <div className="text-[28px] font-bold tracking-tight text-foreground leading-none mb-2">
        {value}
      </div>

      {/* Subtitle & Trend */}
      {(subtitle || trend !== undefined) && (
        <div className="flex items-center gap-2">
          {trend !== undefined && (
            <div className={`flex items-center gap-1 text-sm font-medium ${getTrendColor()}`}>
              {getTrendIcon()}
              <span>{trend > 0 ? '+' : ''}{trend.toFixed(1)}%</span>
            </div>
          )}
          {subtitle && (
            <span className="text-[13px] text-muted-foreground">
              {subtitle}
            </span>
          )}
        </div>
      )}

      {/* Hover accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-primary/0 via-primary to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  )
})

MetricCard.displayName = 'MetricCard'

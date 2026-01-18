'use client'

import { memo, useEffect, useState, ReactNode } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface GlassMetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: ReactNode
  change?: number
  trend?: number[] // últimos valores para sparkline
  variant?: 'default' | 'success' | 'warning' | 'danger'
  size?: 'sm' | 'md' | 'lg'
}

// Mini Sparkline
function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  if (!data || data.length < 2) return null

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const width = 60
  const height = 24

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width
    const y = height - ((value - min) / range) * (height - 4) - 2
    return `${x},${y}`
  }).join(' ')

  return (
    <svg width={width} height={height} className="opacity-60">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// Animated number display
function AnimatedValue({ value, format }: { value: number; format?: 'currency' | 'percentage' | 'number' }) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    const duration = 800
    const startTime = performance.now()
    const startValue = displayValue

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      const easeOut = 1 - Math.pow(1 - progress, 3)

      setDisplayValue(startValue + (value - startValue) * easeOut)

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }, [value])

  if (format === 'currency') {
    return <>R$ {displayValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</>
  }
  if (format === 'percentage') {
    return <>{displayValue.toFixed(2)}%</>
  }
  return <>{Math.round(displayValue).toLocaleString('pt-BR')}</>
}

const variantStyles = {
  default: {
    iconBg: 'bg-primary/20',
    iconColor: 'text-primary',
    sparklineColor: '#818cf8',
  },
  success: {
    iconBg: 'bg-emerald-500/20',
    iconColor: 'text-emerald-500',
    sparklineColor: '#10b981',
  },
  warning: {
    iconBg: 'bg-amber-500/20',
    iconColor: 'text-amber-500',
    sparklineColor: '#f59e0b',
  },
  danger: {
    iconBg: 'bg-red-500/20',
    iconColor: 'text-red-500',
    sparklineColor: '#ef4444',
  },
}

export const GlassMetricCard = memo(function GlassMetricCard({
  title,
  value,
  subtitle,
  icon,
  change,
  trend,
  variant = 'default',
  size = 'md',
}: GlassMetricCardProps) {
  const styles = variantStyles[variant]
  const isPositive = change !== undefined && change > 0
  const isNegative = change !== undefined && change < 0

  const sizeClasses = {
    sm: 'p-4',
    md: 'p-5',
    lg: 'p-6',
  }

  const valueSizeClasses = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl',
  }

  return (
    <div className={`
      group relative overflow-hidden rounded-2xl
      bg-card/80 backdrop-blur-xl
      border border-white/10 dark:border-white/5
      shadow-lg shadow-black/5 dark:shadow-black/20
      hover:shadow-xl hover:shadow-primary/5 dark:hover:shadow-primary/10
      hover:border-primary/20
      transition-all duration-300 ease-out
      hover:-translate-y-1
      ${sizeClasses[size]}
    `}>
      {/* Glassmorphism gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent dark:from-white/[0.02] pointer-events-none" />

      {/* Hover glow effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/20 rounded-full blur-2xl" />
      </div>

      <div className="relative z-10">
        {/* Header row */}
        <div className="flex items-start justify-between mb-3">
          <div className={`p-2.5 rounded-xl ${styles.iconBg} transition-transform duration-300 group-hover:scale-110`}>
            <div className={`${styles.iconColor} [&>svg]:w-5 [&>svg]:h-5`}>
              {icon}
            </div>
          </div>

          {/* Change indicator */}
          {change !== undefined && (
            <div className={`
              flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold
              ${isPositive ? 'bg-emerald-500/10 text-emerald-500' : ''}
              ${isNegative ? 'bg-red-500/10 text-red-500' : ''}
              ${!isPositive && !isNegative ? 'bg-muted text-muted-foreground' : ''}
            `}>
              {isPositive && <TrendingUp className="w-3 h-3" />}
              {isNegative && <TrendingDown className="w-3 h-3" />}
              {!isPositive && !isNegative && <Minus className="w-3 h-3" />}
              <span>{isPositive ? '+' : ''}{change.toFixed(1)}%</span>
            </div>
          )}
        </div>

        {/* Value and Sparkline */}
        <div className="flex items-end justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className={`${valueSizeClasses[size]} font-bold text-foreground tabular-nums tracking-tight truncate`}>
              {typeof value === 'number' ? value.toLocaleString('pt-BR') : value}
            </p>
            <p className="text-sm text-muted-foreground mt-1 truncate">{title}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground/70 mt-0.5 truncate">{subtitle}</p>
            )}
          </div>

          {/* Sparkline */}
          {trend && trend.length > 1 && (
            <div className="flex-shrink-0">
              <MiniSparkline data={trend} color={styles.sparklineColor} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
})

GlassMetricCard.displayName = 'GlassMetricCard'

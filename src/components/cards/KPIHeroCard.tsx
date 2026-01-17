'use client'

import { ReactNode, memo } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface KPIHeroCardProps {
  title: string
  value: string
  change?: number
  changeLabel?: string
  icon: ReactNode
  gradient: 'primary' | 'success' | 'warning' | 'danger'
  size?: 'default' | 'large'
}

const gradientClasses = {
  primary: 'from-violet-600 to-indigo-600',
  success: 'from-emerald-500 to-teal-500',
  warning: 'from-amber-500 to-orange-500',
  danger: 'from-rose-500 to-pink-500',
}

const glowClasses = {
  primary: 'shadow-violet-500/25',
  success: 'shadow-emerald-500/25',
  warning: 'shadow-amber-500/25',
  danger: 'shadow-rose-500/25',
}

export const KPIHeroCard = memo(function KPIHeroCard({
  title,
  value,
  change,
  changeLabel,
  icon,
  gradient,
  size = 'default',
}: KPIHeroCardProps) {
  const isPositive = change && change > 0
  const isNegative = change && change < 0

  return (
    <div
      className={`
        relative overflow-hidden rounded-2xl p-6
        bg-gradient-to-br ${gradientClasses[gradient]}
        shadow-2xl ${glowClasses[gradient]}
        card-hover
        ${size === 'large' ? 'col-span-2 p-8' : ''}
      `}
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12" />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
            <div className="text-white [&>svg]:w-6 [&>svg]:h-6">
              {icon}
            </div>
          </div>
          {change !== undefined && (
            <div
              className={`
                flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium
                ${isPositive ? 'bg-white/20 text-white' : ''}
                ${isNegative ? 'bg-white/20 text-white' : ''}
                ${!isPositive && !isNegative ? 'bg-white/10 text-white/70' : ''}
              `}
              role="status"
              aria-label={`${isPositive ? 'Aumento de' : isNegative ? 'Reducao de' : 'Variacao de'} ${Math.abs(change).toFixed(1)} por cento`}
            >
              {isPositive && <TrendingUp className="w-4 h-4" aria-hidden="true" />}
              {isNegative && <TrendingDown className="w-4 h-4" aria-hidden="true" />}
              <span aria-hidden="true">{isPositive ? '+' : ''}{change?.toFixed(1)}%</span>
            </div>
          )}
        </div>

        {/* Value */}
        <div className={`font-extrabold text-white mb-1 tracking-tight ${size === 'large' ? 'text-5xl' : 'text-4xl'}`}>
          {value}
        </div>

        {/* Title */}
        <div className="text-white/80 font-medium text-base">
          {title}
        </div>

        {/* Change label */}
        {changeLabel && (
          <div className="text-white/60 text-sm mt-2">
            {changeLabel}
          </div>
        )}
      </div>
    </div>
  )
})

KPIHeroCard.displayName = 'KPIHeroCard'

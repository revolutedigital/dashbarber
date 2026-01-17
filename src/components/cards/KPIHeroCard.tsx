'use client'

import { ReactNode, memo } from 'react'
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'

interface KPIHeroCardProps {
  title: string
  value: string
  change?: number
  changeLabel?: string
  icon: ReactNode
  variant: 'blue' | 'green' | 'purple' | 'orange'
}

const variantStyles = {
  blue: {
    bg: 'bg-gradient-to-br from-blue-500 to-indigo-600',
    iconBg: 'bg-white/20',
    shadow: 'shadow-blue-500/20',
  },
  green: {
    bg: 'bg-gradient-to-br from-emerald-500 to-teal-600',
    iconBg: 'bg-white/20',
    shadow: 'shadow-emerald-500/20',
  },
  purple: {
    bg: 'bg-gradient-to-br from-violet-500 to-purple-600',
    iconBg: 'bg-white/20',
    shadow: 'shadow-violet-500/20',
  },
  orange: {
    bg: 'bg-gradient-to-br from-orange-500 to-red-500',
    iconBg: 'bg-white/20',
    shadow: 'shadow-orange-500/20',
  },
}

export const KPIHeroCard = memo(function KPIHeroCard({
  title,
  value,
  change,
  changeLabel,
  icon,
  variant,
}: KPIHeroCardProps) {
  const styles = variantStyles[variant]
  const isPositive = change !== undefined && change > 0
  const isNegative = change !== undefined && change < 0

  return (
    <div
      className={`
        relative overflow-hidden rounded-2xl p-6
        ${styles.bg}
        shadow-xl ${styles.shadow}
        transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]
      `}
    >
      {/* Background decoration */}
      <div className="absolute -top-12 -right-12 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
      <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-black/10 rounded-full blur-xl" />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className={`p-3 rounded-xl ${styles.iconBg} backdrop-blur-sm`}>
            <div className="text-white [&>svg]:w-6 [&>svg]:h-6">
              {icon}
            </div>
          </div>

          {change !== undefined && (
            <div
              className={`
                flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold
                ${isPositive ? 'bg-white/20 text-white' : ''}
                ${isNegative ? 'bg-red-500/30 text-white' : ''}
                ${!isPositive && !isNegative ? 'bg-white/10 text-white/80' : ''}
              `}
            >
              {isPositive && <ArrowUpRight className="w-3.5 h-3.5" />}
              {isNegative && <ArrowDownRight className="w-3.5 h-3.5" />}
              <span>{isPositive ? '+' : ''}{change?.toFixed(1)}%</span>
            </div>
          )}
        </div>

        {/* Value */}
        <div className="text-4xl font-extrabold text-white mb-2 number-display tracking-tight">
          {value}
        </div>

        {/* Title */}
        <div className="text-white/90 font-medium text-sm">
          {title}
        </div>

        {/* Subtitle */}
        {changeLabel && (
          <div className="text-white/60 text-xs mt-1.5 uppercase tracking-wider">
            {changeLabel}
          </div>
        )}
      </div>
    </div>
  )
})

KPIHeroCard.displayName = 'KPIHeroCard'

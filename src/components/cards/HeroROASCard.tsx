'use client'

import { memo, useEffect, useState, useRef } from 'react'
import { TrendingUp, TrendingDown, Minus, Sparkles, DollarSign } from 'lucide-react'

interface HeroROASCardProps {
  roas: number
  revenue: number
  spent: number
  previousRoas?: number
  trend?: number[] // últimos 7 valores para sparkline
}

// Animated counter hook
function useAnimatedCounter(end: number, duration: number = 1000) {
  const [count, setCount] = useState(0)
  const countRef = useRef(0)
  const startTimeRef = useRef<number | null>(null)

  useEffect(() => {
    const startValue = countRef.current
    const diff = end - startValue

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp
      const progress = Math.min((timestamp - startTimeRef.current) / duration, 1)

      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4)
      const currentValue = startValue + diff * easeOutQuart

      setCount(currentValue)
      countRef.current = currentValue

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    startTimeRef.current = null
    requestAnimationFrame(animate)
  }, [end, duration])

  return count
}

// Mini Sparkline component
function Sparkline({ data, color, height = 40 }: { data: number[]; color: string; height?: number }) {
  if (!data || data.length < 2) return null

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const width = 120

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width
    const y = height - ((value - min) / range) * (height - 8) - 4
    return `${x},${y}`
  }).join(' ')

  const areaPoints = `0,${height} ${points} ${width},${height}`

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id="sparklineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={areaPoints}
        fill="url(#sparklineGradient)"
      />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Último ponto destacado */}
      <circle
        cx={(data.length - 1) / (data.length - 1) * width}
        cy={height - ((data[data.length - 1] - min) / range) * (height - 8) - 4}
        r="4"
        fill={color}
        className="animate-pulse"
      />
    </svg>
  )
}

export const HeroROASCard = memo(function HeroROASCard({
  roas,
  revenue,
  spent,
  previousRoas,
  trend = [],
}: HeroROASCardProps) {
  const animatedRoas = useAnimatedCounter(roas, 1200)
  const animatedRevenue = useAnimatedCounter(revenue, 1000)
  const animatedSpent = useAnimatedCounter(spent, 1000)

  const change = previousRoas ? ((roas - previousRoas) / previousRoas) * 100 : undefined
  const isPositive = change !== undefined && change > 0
  const isNegative = change !== undefined && change < 0
  const profit = revenue - spent
  const profitMargin = spent > 0 ? (profit / spent) * 100 : 0

  // Determinar cor baseada no ROAS
  const getROASColor = (value: number) => {
    if (value >= 3) return { bg: 'from-emerald-500 via-emerald-400 to-teal-500', text: 'text-emerald-400', status: 'Excelente' }
    if (value >= 2) return { bg: 'from-green-500 via-green-400 to-emerald-500', text: 'text-green-400', status: 'Bom' }
    if (value >= 1) return { bg: 'from-amber-500 via-yellow-400 to-orange-500', text: 'text-amber-400', status: 'Neutro' }
    return { bg: 'from-red-500 via-red-400 to-orange-500', text: 'text-red-400', status: 'Atenção' }
  }

  const roasColor = getROASColor(roas)

  return (
    <div className="relative overflow-hidden rounded-3xl p-1 bg-gradient-to-br from-white/10 to-white/5">
      {/* Glassmorphism outer glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-purple-500/20 blur-xl" />

      <div className={`
        relative overflow-hidden rounded-[22px] p-6 sm:p-8
        bg-gradient-to-br ${roasColor.bg}
        shadow-2xl
      `}>
        {/* Animated background patterns */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-black/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/10 rounded-full blur-2xl animate-float" />
        </div>

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: '24px 24px',
          }}
        />

        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-white/20 backdrop-blur-sm shadow-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-white/90 font-semibold text-sm uppercase tracking-wider">
                  Return on Ad Spend
                </h2>
                <p className="text-white/60 text-xs mt-0.5">{roasColor.status}</p>
              </div>
            </div>

            {change !== undefined && (
              <div className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold
                ${isPositive ? 'bg-white/25 text-white' : ''}
                ${isNegative ? 'bg-red-900/40 text-white' : ''}
                ${!isPositive && !isNegative ? 'bg-white/15 text-white/80' : ''}
                backdrop-blur-sm
              `}>
                {isPositive && <TrendingUp className="w-4 h-4" />}
                {isNegative && <TrendingDown className="w-4 h-4" />}
                {!isPositive && !isNegative && <Minus className="w-4 h-4" />}
                <span>{isPositive ? '+' : ''}{change.toFixed(1)}%</span>
              </div>
            )}
          </div>

          {/* Main ROAS Value */}
          <div className="flex items-end gap-4 mb-6">
            <div className="flex items-baseline gap-2">
              <span className="text-6xl sm:text-7xl font-black text-white tracking-tight tabular-nums">
                {animatedRoas.toFixed(2)}
              </span>
              <span className="text-2xl sm:text-3xl font-bold text-white/70">x</span>
            </div>

            {/* Sparkline */}
            {trend.length > 1 && (
              <div className="mb-2 opacity-80">
                <Sparkline data={trend} color="rgba(255,255,255,0.9)" height={36} />
              </div>
            )}
          </div>

          {/* Revenue & Spent breakdown */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-emerald-500/30">
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
                <span className="text-white/70 text-xs font-medium uppercase tracking-wide">Receita</span>
              </div>
              <p className="text-2xl font-bold text-white tabular-nums">
                R$ {animatedRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-orange-500/30">
                  <DollarSign className="w-4 h-4 text-white" />
                </div>
                <span className="text-white/70 text-xs font-medium uppercase tracking-wide">Investido</span>
              </div>
              <p className="text-2xl font-bold text-white tabular-nums">
                R$ {animatedSpent.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>

          {/* Profit bar */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-white/70 text-xs font-medium uppercase tracking-wide">Lucro Bruto</span>
              <span className={`text-lg font-bold ${profit >= 0 ? 'text-white' : 'text-red-200'}`}>
                {profit >= 0 ? '+' : ''}R$ {profit.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
            </div>
            <div className="relative h-3 bg-black/20 rounded-full overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-white/90 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${Math.min(Math.max(profitMargin, 0), 100)}%` }}
              />
              <div
                className="absolute inset-y-0 left-0 bg-white/50 rounded-full animate-pulse"
                style={{ width: `${Math.min(Math.max(profitMargin, 0), 100)}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-white/50">
              <span>0%</span>
              <span className="font-semibold text-white/80">{profitMargin.toFixed(0)}% ROI</span>
              <span>100%+</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
})

HeroROASCard.displayName = 'HeroROASCard'

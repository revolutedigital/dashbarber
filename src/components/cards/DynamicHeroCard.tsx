'use client'

import { memo, useEffect, useState, useRef } from 'react'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  DollarSign,
  Target,
  Percent,
  ShoppingCart,
  Users,
  MousePointer,
  Eye,
  Zap,
  Settings2,
} from 'lucide-react'
import { FunnelTotals } from '@/types/metrics'
import { formatCurrency, formatPercentage, formatNumber } from '@/lib/calculations'

// Tipos de métricas suportadas como Hero
export type HeroMetricType =
  | 'roas'
  | 'roi'
  | 'cpa'
  | 'cpl'
  | 'purchases'
  | 'revenue'
  | 'ctr'
  | 'txConv'

export interface HeroMetricConfig {
  type: HeroMetricType
  label: string
  shortLabel: string
  icon: React.ReactNode
  getValue: (totals: FunnelTotals) => number
  getPreviousValue: (totals: FunnelTotals) => number
  format: (value: number) => string
  suffix?: string
  getColor: (value: number) => { bg: string; status: string }
  higherIsBetter: boolean
}

export const HERO_METRICS: Record<HeroMetricType, HeroMetricConfig> = {
  roas: {
    type: 'roas',
    label: 'Return on Ad Spend',
    shortLabel: 'ROAS',
    icon: <Sparkles className="w-6 h-6 text-white" />,
    getValue: (t) => t.avgRoas || 0,
    getPreviousValue: (t) => t.avgRoas || 0,
    format: (v) => v.toFixed(2),
    suffix: 'x',
    getColor: (v) => {
      if (v >= 3) return { bg: 'from-emerald-500 via-emerald-400 to-teal-500', status: 'Excelente' }
      if (v >= 2) return { bg: 'from-green-500 via-green-400 to-emerald-500', status: 'Bom' }
      if (v >= 1) return { bg: 'from-amber-500 via-yellow-400 to-orange-500', status: 'Neutro' }
      return { bg: 'from-red-500 via-red-400 to-orange-500', status: 'Atenção' }
    },
    higherIsBetter: true,
  },
  roi: {
    type: 'roi',
    label: 'Return on Investment',
    shortLabel: 'ROI',
    icon: <Percent className="w-6 h-6 text-white" />,
    getValue: (t) => t.totalSpent > 0 ? ((t.totalRevenue - t.totalSpent) / t.totalSpent) * 100 : 0,
    getPreviousValue: (t) => t.totalSpent > 0 ? ((t.totalRevenue - t.totalSpent) / t.totalSpent) * 100 : 0,
    format: (v) => v.toFixed(0),
    suffix: '%',
    getColor: (v) => {
      if (v >= 200) return { bg: 'from-emerald-500 via-emerald-400 to-teal-500', status: 'Excelente' }
      if (v >= 100) return { bg: 'from-green-500 via-green-400 to-emerald-500', status: 'Bom' }
      if (v >= 0) return { bg: 'from-amber-500 via-yellow-400 to-orange-500', status: 'Neutro' }
      return { bg: 'from-red-500 via-red-400 to-orange-500', status: 'Prejuízo' }
    },
    higherIsBetter: true,
  },
  cpa: {
    type: 'cpa',
    label: 'Custo por Aquisição',
    shortLabel: 'CPA',
    icon: <Target className="w-6 h-6 text-white" />,
    getValue: (t) => t.avgCpa || 0,
    getPreviousValue: (t) => t.avgCpa || 0,
    format: (v) => formatCurrency(v),
    getColor: (v) => {
      if (v <= 30) return { bg: 'from-emerald-500 via-emerald-400 to-teal-500', status: 'Excelente' }
      if (v <= 50) return { bg: 'from-green-500 via-green-400 to-emerald-500', status: 'Bom' }
      if (v <= 100) return { bg: 'from-amber-500 via-yellow-400 to-orange-500', status: 'Atenção' }
      return { bg: 'from-red-500 via-red-400 to-orange-500', status: 'Alto' }
    },
    higherIsBetter: false,
  },
  cpl: {
    type: 'cpl',
    label: 'Custo por Lead',
    shortLabel: 'CPL',
    icon: <Users className="w-6 h-6 text-white" />,
    getValue: (t) => t.avgCpl || 0,
    getPreviousValue: (t) => t.avgCpl || 0,
    format: (v) => formatCurrency(v),
    getColor: (v) => {
      if (v <= 10) return { bg: 'from-emerald-500 via-emerald-400 to-teal-500', status: 'Excelente' }
      if (v <= 25) return { bg: 'from-green-500 via-green-400 to-emerald-500', status: 'Bom' }
      if (v <= 50) return { bg: 'from-amber-500 via-yellow-400 to-orange-500', status: 'Atenção' }
      return { bg: 'from-red-500 via-red-400 to-orange-500', status: 'Alto' }
    },
    higherIsBetter: false,
  },
  purchases: {
    type: 'purchases',
    label: 'Total de Compras',
    shortLabel: 'Compras',
    icon: <ShoppingCart className="w-6 h-6 text-white" />,
    getValue: (t) => t.totalPurchases || 0,
    getPreviousValue: (t) => t.totalPurchases || 0,
    format: (v) => formatNumber(v),
    getColor: (v) => {
      if (v >= 100) return { bg: 'from-emerald-500 via-emerald-400 to-teal-500', status: 'Excelente' }
      if (v >= 50) return { bg: 'from-green-500 via-green-400 to-emerald-500', status: 'Bom' }
      if (v >= 10) return { bg: 'from-amber-500 via-yellow-400 to-orange-500', status: 'Crescendo' }
      return { bg: 'from-blue-500 via-blue-400 to-indigo-500', status: 'Iniciando' }
    },
    higherIsBetter: true,
  },
  revenue: {
    type: 'revenue',
    label: 'Receita Total',
    shortLabel: 'Receita',
    icon: <DollarSign className="w-6 h-6 text-white" />,
    getValue: (t) => t.totalRevenue || 0,
    getPreviousValue: (t) => t.totalRevenue || 0,
    format: (v) => formatCurrency(v),
    getColor: (v) => {
      if (v >= 10000) return { bg: 'from-emerald-500 via-emerald-400 to-teal-500', status: 'Excelente' }
      if (v >= 5000) return { bg: 'from-green-500 via-green-400 to-emerald-500', status: 'Bom' }
      if (v >= 1000) return { bg: 'from-amber-500 via-yellow-400 to-orange-500', status: 'Crescendo' }
      return { bg: 'from-blue-500 via-blue-400 to-indigo-500', status: 'Iniciando' }
    },
    higherIsBetter: true,
  },
  ctr: {
    type: 'ctr',
    label: 'Click-Through Rate',
    shortLabel: 'CTR',
    icon: <MousePointer className="w-6 h-6 text-white" />,
    getValue: (t) => t.avgCtr || 0,
    getPreviousValue: (t) => t.avgCtr || 0,
    format: (v) => v.toFixed(2),
    suffix: '%',
    getColor: (v) => {
      if (v >= 3) return { bg: 'from-emerald-500 via-emerald-400 to-teal-500', status: 'Excelente' }
      if (v >= 1.5) return { bg: 'from-green-500 via-green-400 to-emerald-500', status: 'Bom' }
      if (v >= 0.5) return { bg: 'from-amber-500 via-yellow-400 to-orange-500', status: 'Médio' }
      return { bg: 'from-red-500 via-red-400 to-orange-500', status: 'Baixo' }
    },
    higherIsBetter: true,
  },
  txConv: {
    type: 'txConv',
    label: 'Taxa de Conversão',
    shortLabel: 'Tx Conv',
    icon: <Zap className="w-6 h-6 text-white" />,
    getValue: (t) => t.avgTxConv || 0,
    getPreviousValue: (t) => t.avgTxConv || 0,
    format: (v) => v.toFixed(2),
    suffix: '%',
    getColor: (v) => {
      if (v >= 5) return { bg: 'from-emerald-500 via-emerald-400 to-teal-500', status: 'Excelente' }
      if (v >= 2) return { bg: 'from-green-500 via-green-400 to-emerald-500', status: 'Bom' }
      if (v >= 1) return { bg: 'from-amber-500 via-yellow-400 to-orange-500', status: 'Médio' }
      return { bg: 'from-red-500 via-red-400 to-orange-500', status: 'Baixo' }
    },
    higherIsBetter: true,
  },
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
        <linearGradient id="heroSparklineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill="url(#heroSparklineGradient)" />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={width}
        cy={height - ((data[data.length - 1] - min) / range) * (height - 8) - 4}
        r="4"
        fill={color}
        className="animate-pulse"
      />
    </svg>
  )
}

interface DynamicHeroCardProps {
  metricType: HeroMetricType
  totals: FunnelTotals
  previousTotals?: FunnelTotals | null
  trend?: number[]
  onChangeMetric?: () => void
}

export const DynamicHeroCard = memo(function DynamicHeroCard({
  metricType,
  totals,
  previousTotals,
  trend = [],
  onChangeMetric,
}: DynamicHeroCardProps) {
  const config = HERO_METRICS[metricType]
  const value = config.getValue(totals)
  const previousValue = previousTotals ? config.getPreviousValue(previousTotals) : undefined
  const animatedValue = useAnimatedCounter(value, 1200)

  const change = previousValue && previousValue > 0
    ? ((value - previousValue) / previousValue) * 100
    : undefined

  // Inverter lógica de positivo/negativo para métricas onde menor é melhor
  const isPositiveChange = change !== undefined && (config.higherIsBetter ? change > 0 : change < 0)
  const isNegativeChange = change !== undefined && (config.higherIsBetter ? change < 0 : change > 0)

  const colorConfig = config.getColor(value)
  const profit = totals.totalRevenue - totals.totalSpent
  const profitMargin = totals.totalSpent > 0 ? (profit / totals.totalSpent) * 100 : 0

  return (
    <div className="relative overflow-hidden rounded-3xl p-1 bg-gradient-to-br from-white/10 to-white/5">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-purple-500/20 blur-xl" />

      <div className={`
        relative overflow-hidden rounded-[22px] p-6 sm:p-8
        bg-gradient-to-br ${colorConfig.bg}
        shadow-2xl
      `}>
        {/* Background patterns */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-black/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/10 rounded-full blur-2xl animate-float" />
        </div>

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
                {config.icon}
              </div>
              <div>
                <h2 className="text-white/90 font-semibold text-sm uppercase tracking-wider">
                  {config.label}
                </h2>
                <p className="text-white/60 text-xs mt-0.5">{colorConfig.status}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {change !== undefined && (
                <div className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold
                  ${isPositiveChange ? 'bg-white/25 text-white' : ''}
                  ${isNegativeChange ? 'bg-red-900/40 text-white' : ''}
                  ${!isPositiveChange && !isNegativeChange ? 'bg-white/15 text-white/80' : ''}
                  backdrop-blur-sm
                `}>
                  {isPositiveChange && <TrendingUp className="w-4 h-4" />}
                  {isNegativeChange && <TrendingDown className="w-4 h-4" />}
                  {!isPositiveChange && !isNegativeChange && <Minus className="w-4 h-4" />}
                  <span>{change > 0 ? '+' : ''}{change.toFixed(1)}%</span>
                </div>
              )}

              {onChangeMetric && (
                <button
                  onClick={onChangeMetric}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-colors"
                  title="Trocar métrica principal"
                >
                  <Settings2 className="w-4 h-4 text-white" />
                </button>
              )}
            </div>
          </div>

          {/* Main Value */}
          <div className="flex items-end gap-4 mb-6">
            <div className="flex items-baseline gap-2">
              <span className="text-6xl sm:text-7xl font-black text-white tracking-tight tabular-nums">
                {config.format(animatedValue)}
              </span>
              {config.suffix && (
                <span className="text-2xl sm:text-3xl font-bold text-white/70">{config.suffix}</span>
              )}
            </div>

            {trend.length > 1 && (
              <div className="mb-2 opacity-80">
                <Sparkline data={trend} color="rgba(255,255,255,0.9)" height={36} />
              </div>
            )}
          </div>

          {/* Secondary metrics */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-emerald-500/30">
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
                <span className="text-white/70 text-xs font-medium uppercase tracking-wide">Receita</span>
              </div>
              <p className="text-2xl font-bold text-white tabular-nums">
                {formatCurrency(totals.totalRevenue)}
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
                {formatCurrency(totals.totalSpent)}
              </p>
            </div>
          </div>

          {/* Profit bar */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-white/70 text-xs font-medium uppercase tracking-wide">Lucro Bruto</span>
              <span className={`text-lg font-bold ${profit >= 0 ? 'text-white' : 'text-red-200'}`}>
                {profit >= 0 ? '+' : ''}{formatCurrency(profit)}
              </span>
            </div>
            <div className="relative h-3 bg-black/20 rounded-full overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-white/90 rounded-full transition-all duration-1000 ease-out"
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

DynamicHeroCard.displayName = 'DynamicHeroCard'

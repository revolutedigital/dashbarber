'use client'

import { memo } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface TooltipPayloadItem {
  value?: number | string
  name?: string
  color?: string
  dataKey?: string
  payload?: Record<string, unknown>
}

interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipPayloadItem[]
  label?: string
  formatValue?: (value: number) => string
  showTotal?: boolean
  showComparison?: boolean
}

export const CustomTooltip = memo(function CustomTooltip({
  active,
  payload,
  label,
  formatValue = (v) => v.toLocaleString('pt-BR'),
  showTotal = false,
  showComparison = true,
}: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null

  // Separate current and previous period data
  const currentData = payload.filter((p) => !p.dataKey?.startsWith('prev_'))
  const previousData = payload.filter((p) => p.dataKey?.startsWith('prev_'))

  const total = showTotal
    ? currentData.reduce((sum, entry) => sum + (Number(entry.value) || 0), 0)
    : null

  return (
    <div className="bg-popover/95 backdrop-blur-xl border border-border/50 rounded-xl shadow-2xl shadow-black/20 p-4 min-w-[200px]">
      {/* Header with date */}
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border/50">
        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        <span className="text-sm font-semibold text-foreground">{label}</span>
      </div>

      {/* Values */}
      <div className="space-y-2.5">
        {currentData.map((entry, index) => {
          // Find corresponding previous value
          const prevEntry = previousData.find(
            (p) => p.dataKey === `prev_${entry.dataKey}`
          )
          const prevValue = prevEntry ? Number(prevEntry.value) || 0 : null
          const currentValue = Number(entry.value) || 0

          // Calculate change if previous exists
          let change: number | null = null
          if (prevValue !== null && prevValue !== 0) {
            change = ((currentValue - prevValue) / prevValue) * 100
          }

          return (
            <div key={index} className="space-y-1">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-xs text-muted-foreground">{entry.name}</span>
                </div>
                <span className="text-sm font-semibold text-foreground tabular-nums">
                  {formatValue(currentValue)}
                </span>
              </div>

              {/* Comparison with previous period */}
              {showComparison && prevValue !== null && change !== null && (
                <div className="flex items-center justify-between pl-5">
                  <span className="text-[10px] text-muted-foreground/70">
                    vs anterior: {formatValue(prevValue)}
                  </span>
                  <div
                    className={`
                      flex items-center gap-1 text-[10px] font-medium
                      ${change > 0 ? 'text-emerald-500' : ''}
                      ${change < 0 ? 'text-red-500' : ''}
                      ${change === 0 ? 'text-muted-foreground' : ''}
                    `}
                  >
                    {change > 0 && <TrendingUp className="w-3 h-3" />}
                    {change < 0 && <TrendingDown className="w-3 h-3" />}
                    {change === 0 && <Minus className="w-3 h-3" />}
                    <span>{change > 0 ? '+' : ''}{change.toFixed(1)}%</span>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Total */}
      {showTotal && total !== null && currentData.length > 1 && (
        <div className="mt-3 pt-2 border-t border-border/50 flex items-center justify-between">
          <span className="text-xs text-muted-foreground font-medium">Total</span>
          <span className="text-sm font-bold text-foreground tabular-nums">
            {formatValue(total)}
          </span>
        </div>
      )}
    </div>
  )
})

CustomTooltip.displayName = 'CustomTooltip'

// Tooltip para PieChart
interface PieTooltipProps {
  active?: boolean
  payload?: TooltipPayloadItem[]
  formatValue?: (value: number) => string
}

export const PieTooltip = memo(function PieTooltip({
  active,
  payload,
  formatValue = (v) => v.toLocaleString('pt-BR'),
}: PieTooltipProps) {
  if (!active || !payload || payload.length === 0) return null

  const data = payload[0]
  const payloadData = data.payload as Record<string, unknown> | undefined
  const percentage = payloadData?.percent ? (Number(payloadData.percent) * 100).toFixed(1) : '0'

  return (
    <div className="bg-popover/95 backdrop-blur-xl border border-border/50 rounded-xl shadow-2xl shadow-black/20 p-4">
      <div className="flex items-center gap-3">
        <div
          className="w-4 h-4 rounded-full"
          style={{ backgroundColor: (payloadData?.color as string) || data.color }}
        />
        <div>
          <p className="text-sm font-semibold text-foreground">{data.name}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-lg font-bold text-foreground tabular-nums">
              {formatValue(Number(data.value) || 0)}
            </span>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {percentage}%
            </span>
          </div>
        </div>
      </div>
    </div>
  )
})

PieTooltip.displayName = 'PieTooltip'

// Tooltip para BarChart com comparativo
interface BarTooltipProps {
  active?: boolean
  payload?: TooltipPayloadItem[]
  label?: string
  formatValue?: (value: number) => string
  previousPayload?: TooltipPayloadItem[]
}

export const BarTooltip = memo(function BarTooltip({
  active,
  payload,
  label,
  formatValue = (v) => v.toLocaleString('pt-BR'),
}: BarTooltipProps) {
  if (!active || !payload || payload.length === 0) return null

  return (
    <div className="bg-popover/95 backdrop-blur-xl border border-border/50 rounded-xl shadow-2xl shadow-black/20 p-4 min-w-[160px]">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border/50">
        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        <span className="text-sm font-semibold text-foreground">{label}</span>
      </div>

      {/* Values */}
      <div className="space-y-2">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-xs text-muted-foreground">{entry.name}</span>
            </div>
            <span className="text-sm font-semibold text-foreground tabular-nums">
              {formatValue(Number(entry.value) || 0)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
})

BarTooltip.displayName = 'BarTooltip'

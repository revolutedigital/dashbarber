'use client'

import { useCallback, useMemo } from 'react'
import { X, TrendingUp, TrendingDown, Calendar, DollarSign, Target, Percent } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { MetaAdsData } from '@/types/metrics'

interface ChartDrilldownProps {
  data: MetaAdsData
  previousData?: MetaAdsData | null
  onClose: () => void
  className?: string
}

interface MetricDisplay {
  key: keyof MetaAdsData
  label: string
  format: 'currency' | 'number' | 'percentage'
  icon: React.ReactNode
  higherIsBetter: boolean
}

const METRICS_TO_DISPLAY: MetricDisplay[] = [
  { key: 'amountSpent', label: 'Investimento', format: 'currency', icon: <DollarSign className="w-4 h-4" />, higherIsBetter: false },
  { key: 'purchases', label: 'Compras', format: 'number', icon: <Target className="w-4 h-4" />, higherIsBetter: true },
  { key: 'cpa', label: 'CPA', format: 'currency', icon: <DollarSign className="w-4 h-4" />, higherIsBetter: false },
  { key: 'cpc', label: 'CPC', format: 'currency', icon: <DollarSign className="w-4 h-4" />, higherIsBetter: false },
  { key: 'cpm', label: 'CPM', format: 'currency', icon: <DollarSign className="w-4 h-4" />, higherIsBetter: false },
  { key: 'ctrLink', label: 'CTR', format: 'percentage', icon: <Percent className="w-4 h-4" />, higherIsBetter: true },
  { key: 'txConv', label: 'Taxa de Conversão', format: 'percentage', icon: <Percent className="w-4 h-4" />, higherIsBetter: true },
  { key: 'impressions', label: 'Impressões', format: 'number', icon: <Target className="w-4 h-4" />, higherIsBetter: true },
  { key: 'reach', label: 'Alcance', format: 'number', icon: <Target className="w-4 h-4" />, higherIsBetter: true },
]

function formatValue(value: number, format: 'currency' | 'number' | 'percentage'): string {
  if (typeof value !== 'number' || isNaN(value)) return '-'

  switch (format) {
    case 'currency':
      return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    case 'percentage':
      return `${(value * 100).toFixed(2)}%`
    case 'number':
      return value.toLocaleString('pt-BR')
  }
}

function calculateChange(current: number, previous: number): number | null {
  if (typeof previous !== 'number' || previous === 0) return null
  return ((current - previous) / previous) * 100
}

/**
 * Drill-down modal for detailed data point analysis
 */
export function ChartDrilldown({ data, previousData, onClose, className }: ChartDrilldownProps) {
  const formattedDate = useMemo(() => {
    const date = new Date(data.day)
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }, [data.day])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }, [onClose])

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="drilldown-title"
    >
      <div
        className={cn(
          'relative bg-card border border-border rounded-2xl shadow-2xl max-w-lg w-full mx-4 max-h-[90vh] overflow-hidden',
          'animate-in zoom-in-95 fade-in duration-200',
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 id="drilldown-title" className="text-lg font-semibold text-foreground">
                Detalhes do Dia
              </h2>
              <p className="text-sm text-muted-foreground capitalize">
                {formattedDate}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-muted transition-colors"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-80px)]">
          <div className="grid gap-3">
            {METRICS_TO_DISPLAY.map((metric) => {
              const currentValue = data[metric.key] as number
              const previousValue = previousData ? previousData[metric.key] as number : null
              const change = previousValue !== null ? calculateChange(currentValue, previousValue) : null

              const isPositiveChange = change !== null && (
                (metric.higherIsBetter && change > 0) ||
                (!metric.higherIsBetter && change < 0)
              )

              return (
                <div
                  key={metric.key}
                  className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted text-muted-foreground">
                      {metric.icon}
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      {metric.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold tabular-nums text-foreground">
                      {formatValue(currentValue, metric.format)}
                    </span>

                    {change !== null && (
                      <div
                        className={cn(
                          'flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full',
                          isPositiveChange
                            ? 'bg-emerald-500/10 text-emerald-500'
                            : 'bg-red-500/10 text-red-500'
                        )}
                      >
                        {change > 0 ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                        {Math.abs(change).toFixed(1)}%
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Comparison note */}
          {previousData && (
            <p className="mt-4 text-xs text-center text-muted-foreground">
              Comparado com {new Date(previousData.day).toLocaleDateString('pt-BR')}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Hook for managing drill-down state
 */
export function useDrilldown(data: MetaAdsData[]) {
  const [selectedPoint, setSelectedPoint] = useState<string | null>(null)

  const openDrilldown = useCallback((day: string) => {
    setSelectedPoint(day)
  }, [])

  const closeDrilldown = useCallback(() => {
    setSelectedPoint(null)
  }, [])

  const selectedData = useMemo(() => {
    if (!selectedPoint) return null
    return data.find(d => d.day === selectedPoint) || null
  }, [data, selectedPoint])

  const previousData = useMemo(() => {
    if (!selectedPoint || !selectedData) return null
    const index = data.findIndex(d => d.day === selectedPoint)
    if (index <= 0) return null
    return data[index - 1]
  }, [data, selectedPoint, selectedData])

  return {
    selectedPoint,
    selectedData,
    previousData,
    openDrilldown,
    closeDrilldown,
    isOpen: selectedPoint !== null,
  }
}

// Need to import useState
import { useState } from 'react'

export default ChartDrilldown

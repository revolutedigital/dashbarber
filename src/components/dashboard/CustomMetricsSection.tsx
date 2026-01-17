'use client'

import { memo } from 'react'
import { Zap } from 'lucide-react'
import { MetricCard } from '@/components/cards/MetricCard'
import { CustomMetric, FunnelTotals } from '@/types/metrics'
import { formatCurrency, formatPercentage, formatNumber } from '@/lib/calculations'

interface CustomMetricsSectionProps {
  customMetrics: CustomMetric[]
  totals: FunnelTotals
  calculateCustomMetric: (formula: string, totals: FunnelTotals) => number
}

function formatCustomMetricValue(value: number, format: string): string {
  switch (format) {
    case 'currency': return formatCurrency(value)
    case 'percentage': return formatPercentage(value)
    case 'decimal': return value.toFixed(2)
    default: return formatNumber(value)
  }
}

export const CustomMetricsSection = memo(function CustomMetricsSection({
  customMetrics,
  totals,
  calculateCustomMetric,
}: CustomMetricsSectionProps) {
  if (customMetrics.length === 0) return null

  return (
    <section>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-primary/10">
          <Zap className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Metricas Personalizadas</h2>
          <p className="text-sm text-muted-foreground">Suas metricas customizadas</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {customMetrics.map(metric => {
          const value = calculateCustomMetric(metric.formula, totals)
          return (
            <MetricCard
              key={metric.id}
              title={metric.name}
              value={formatCustomMetricValue(value, metric.format)}
              subtitle={metric.description}
              icon={<Zap />}
            />
          )
        })}
      </div>
    </section>
  )
})

CustomMetricsSection.displayName = 'CustomMetricsSection'

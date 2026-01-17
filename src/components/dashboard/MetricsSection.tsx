'use client'

import { memo } from 'react'
import { Users, Eye, MousePointer, TrendingUp, Zap, BarChart3 } from 'lucide-react'
import { MetricCard } from '@/components/cards/MetricCard'
import { FunnelTotals } from '@/types/metrics'
import { formatCurrency, formatPercentage, formatCompact } from '@/lib/calculations'

interface MetricsSectionProps {
  totals: FunnelTotals
}

export const MetricsSection = memo(function MetricsSection({ totals }: MetricsSectionProps) {
  return (
    <div className="space-y-6">
      {/* Alcance e Engajamento */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-5 bg-blue-500 rounded-full" />
          <h3 className="text-lg font-semibold text-foreground">Alcance e Engajamento</h3>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <MetricCard
            title="Alcance"
            value={formatCompact(totals.totalReach)}
            subtitle="Total"
            icon={<Users />}
          />
          <MetricCard
            title="Impressoes"
            value={formatCompact(totals.totalImpressions)}
            subtitle="Total"
            icon={<Eye />}
          />
          <MetricCard
            title="Cliques"
            value={formatCompact(totals.totalClicks)}
            subtitle="Todos"
            icon={<MousePointer />}
          />
          <MetricCard
            title="Link Clicks"
            value={formatCompact(totals.totalLinkClicks)}
            subtitle="Unicos"
            icon={<Zap />}
          />
        </div>
      </section>

      {/* Performance */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-5 bg-emerald-500 rounded-full" />
          <h3 className="text-lg font-semibold text-foreground">Performance</h3>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <MetricCard
            title="CTR"
            value={formatPercentage(totals.avgCtr)}
            subtitle="Taxa de Clique"
            icon={<TrendingUp />}
          />
          <MetricCard
            title="CPC"
            value={formatCurrency(totals.avgCpc)}
            subtitle="Custo por Clique"
            icon={<MousePointer />}
          />
          <MetricCard
            title="CPM"
            value={formatCurrency(totals.avgCpm)}
            subtitle="Custo por Mil"
            icon={<BarChart3 />}
          />
        </div>
      </section>
    </div>
  )
})

MetricsSection.displayName = 'MetricsSection'

'use client'

import { memo } from 'react'
import { Users, Eye, MousePointer, TrendingUp } from 'lucide-react'
import { MetricCard } from '@/components/cards/MetricCard'
import { FunnelTotals } from '@/types/metrics'
import { formatCurrency, formatPercentage, formatCompact } from '@/lib/calculations'

interface MetricsSectionProps {
  totals: FunnelTotals
}

export const MetricsSection = memo(function MetricsSection({ totals }: MetricsSectionProps) {
  return (
    <>
      {/* Alcance e Engajamento */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-blue-500/10">
            <Users className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Alcance e Engajamento</h2>
            <p className="text-sm text-muted-foreground">Metricas de audiencia e interacao</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Alcance Total"
            value={formatCompact(totals.totalReach)}
            subtitle="Reach"
            icon={<Users />}
          />
          <MetricCard
            title="Impressoes"
            value={formatCompact(totals.totalImpressions)}
            subtitle="Impressions"
            icon={<Eye />}
          />
          <MetricCard
            title="Cliques Totais"
            value={formatCompact(totals.totalClicks)}
            subtitle="Clicks (All)"
            icon={<MousePointer />}
          />
          <MetricCard
            title="Link Clicks"
            value={formatCompact(totals.totalLinkClicks)}
            subtitle="Unique Link Clicks"
            icon={<MousePointer />}
          />
        </div>
      </section>

      {/* Métricas de Performance */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-emerald-500/10">
            <TrendingUp className="h-5 w-5 text-emerald-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Performance</h2>
            <p className="text-sm text-muted-foreground">Indicadores de eficiencia</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard
            title="CTR (Link)"
            value={formatPercentage(totals.avgCtr)}
            subtitle="Taxa de Clique no Link"
            icon={<TrendingUp />}
          />
          <MetricCard
            title="CPC Medio"
            value={formatCurrency(totals.avgCpc)}
            subtitle="Custo por Clique"
            icon={<MousePointer />}
          />
          <MetricCard
            title="CPM Medio"
            value={formatCurrency(totals.avgCpm)}
            subtitle="Custo por Mil Impressoes"
            icon={<Eye />}
          />
        </div>
      </section>
    </>
  )
})

MetricsSection.displayName = 'MetricsSection'

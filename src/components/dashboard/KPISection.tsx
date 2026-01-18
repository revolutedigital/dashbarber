'use client'

import { memo, useMemo, useState, useEffect, useCallback } from 'react'
import { DollarSign, ShoppingCart, Target, Percent, TrendingUp, Users, MousePointer } from 'lucide-react'
import { DynamicHeroCard, HeroMetricType } from '@/components/cards/DynamicHeroCard'
import { HeroMetricSelector } from '@/components/modals/HeroMetricSelector'
import { GlassMetricCard } from '@/components/cards/GlassMetricCard'
import { FunnelTotals } from '@/types/metrics'
import { formatCurrency, formatPercentage, formatNumber, formatCompact } from '@/lib/calculations'

interface KPISectionProps {
  totals: FunnelTotals
  previousTotals?: FunnelTotals | null
  chartData?: Array<{ day: string; [key: string]: string | number }>
}

const HERO_METRIC_STORAGE_KEY = 'dashbarber_hero_metric'

// Calcula variacao percentual
function calcChange(current: number, previous: number): number | undefined {
  if (!previous || previous === 0) return undefined
  return ((current - previous) / previous) * 100
}

// Extrai trend de um campo específico
function extractTrend(data: Array<{ [key: string]: string | number }> | undefined, field: string): number[] {
  if (!data || data.length === 0) return []
  return data.slice(-7).map(d => Number(d[field]) || 0)
}

export const KPISection = memo(function KPISection({ totals, previousTotals, chartData }: KPISectionProps) {
  const [heroMetric, setHeroMetric] = useState<HeroMetricType>('roas')
  const [showMetricSelector, setShowMetricSelector] = useState(false)

  // Load saved hero metric preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(HERO_METRIC_STORAGE_KEY)
      if (saved && ['roas', 'roi', 'cpa', 'cpl', 'purchases', 'revenue', 'ctr', 'txConv'].includes(saved)) {
        setHeroMetric(saved as HeroMetricType)
      }
    }
  }, [])

  // Save hero metric preference
  const handleSelectMetric = useCallback((metric: HeroMetricType) => {
    setHeroMetric(metric)
    if (typeof window !== 'undefined') {
      localStorage.setItem(HERO_METRIC_STORAGE_KEY, metric)
    }
  }, [])

  const changes = previousTotals ? {
    spent: calcChange(totals.totalSpent, previousTotals.totalSpent),
    purchases: calcChange(totals.totalPurchases, previousTotals.totalPurchases),
    cpa: calcChange(totals.avgCpa, previousTotals.avgCpa),
    txConv: calcChange(totals.avgTxConv, previousTotals.avgTxConv),
    roas: calcChange(totals.avgRoas, previousTotals.avgRoas),
    ctr: calcChange(totals.avgCtr, previousTotals.avgCtr),
    cpc: calcChange(totals.avgCpc, previousTotals.avgCpc),
  } : {}

  // Extract trends for sparklines
  const trends = useMemo(() => ({
    spent: extractTrend(chartData, 'amountSpent'),
    purchases: extractTrend(chartData, 'purchases'),
    cpa: extractTrend(chartData, 'cpa'),
    cpc: extractTrend(chartData, 'cpc'),
    roas: chartData?.slice(-7).map(d => {
      const spent = Number(d.amountSpent) || 1
      const purchases = Number(d.purchases) || 0
      // Simular ROAS baseado em purchases * ticket médio estimado
      return purchases > 0 ? (purchases * 100) / spent : 0
    }) || [],
  }), [chartData])

  return (
    <div className="space-y-6">
      {/* Dynamic Hero Card - Configurable metric */}
      <DynamicHeroCard
        metricType={heroMetric}
        totals={totals}
        previousTotals={previousTotals || undefined}
        trend={trends.roas}
        onChangeMetric={() => setShowMetricSelector(true)}
      />

      {/* Hero Metric Selector Modal */}
      <HeroMetricSelector
        isOpen={showMetricSelector}
        onClose={() => setShowMetricSelector(false)}
        currentMetric={heroMetric}
        onSelect={handleSelectMetric}
      />

      {/* Secondary KPIs Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassMetricCard
          title="Total Investido"
          value={formatCurrency(totals.totalSpent)}
          icon={<DollarSign />}
          change={changes.spent}
          trend={trends.spent}
          variant="warning"
          subtitle="Periodo selecionado"
        />
        <GlassMetricCard
          title="Compras"
          value={formatNumber(totals.totalPurchases)}
          icon={<ShoppingCart />}
          change={changes.purchases}
          trend={trends.purchases}
          variant="success"
          subtitle="Conversoes"
        />
        <GlassMetricCard
          title="CPA Medio"
          value={formatCurrency(totals.avgCpa)}
          icon={<Target />}
          change={changes.cpa}
          trend={trends.cpa}
          variant={totals.avgCpa > 100 ? 'danger' : 'default'}
          subtitle="Custo por aquisicao"
        />
        <GlassMetricCard
          title="Taxa de Conversao"
          value={formatPercentage(totals.avgTxConv)}
          icon={<Percent />}
          change={changes.txConv}
          variant={totals.avgTxConv > 2 ? 'success' : 'default'}
          subtitle="Cliques -> Compras"
        />
      </div>

      {/* Tertiary metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-xl p-4 hover:bg-card/80 transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground font-medium">Alcance</span>
          </div>
          <p className="text-lg font-bold text-foreground tabular-nums">{formatCompact(totals.totalReach)}</p>
        </div>
        <div className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-xl p-4 hover:bg-card/80 transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground font-medium">CTR</span>
          </div>
          <p className="text-lg font-bold text-foreground tabular-nums">{formatPercentage(totals.avgCtr)}</p>
        </div>
        <div className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-xl p-4 hover:bg-card/80 transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <MousePointer className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground font-medium">CPC</span>
          </div>
          <p className="text-lg font-bold text-foreground tabular-nums">{formatCurrency(totals.avgCpc)}</p>
        </div>
        <div className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-xl p-4 hover:bg-card/80 transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground font-medium">CPM</span>
          </div>
          <p className="text-lg font-bold text-foreground tabular-nums">{formatCurrency(totals.avgCpm)}</p>
        </div>
      </div>
    </div>
  )
})

KPISection.displayName = 'KPISection'

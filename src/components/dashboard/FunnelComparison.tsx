'use client'

import { memo } from 'react'
import { Filter, Target } from 'lucide-react'
import { Funnel } from '@/types/metrics'
import { calculateFunnelTotals, formatCurrency, formatPercentage } from '@/lib/calculations'

interface FunnelComparisonProps {
  funnels: Funnel[]
  selectedFunnel: string
}

export const FunnelComparison = memo(function FunnelComparison({
  funnels,
  selectedFunnel,
}: FunnelComparisonProps) {
  if (selectedFunnel !== 'all' || funnels.length <= 1) {
    return null
  }

  return (
    <section>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-cyan-500/10">
          <Filter className="h-5 w-5 text-cyan-500" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Comparativo por Funil</h2>
          <p className="text-sm text-muted-foreground">Performance individual de cada funil</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {funnels.map(funnel => {
          const funnelTotals = calculateFunnelTotals(funnel.data)
          return (
            <div
              key={funnel.id}
              className="bg-card border border-border/50 rounded-2xl p-5 card-hover group"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Target className="h-4 w-4 text-primary" />
                </div>
                <h3 className="font-bold text-base truncate">{funnel.name}</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Investido</span>
                  <span className="font-semibold text-rose-500">{formatCurrency(funnelTotals.totalSpent)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Compras</span>
                  <span className="font-semibold text-emerald-500">{funnelTotals.totalPurchases}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">CPA</span>
                  <span className="font-semibold">{formatCurrency(funnelTotals.avgCpa)}</span>
                </div>
                <div className="h-px bg-border/50 my-2" />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">TX Conv</span>
                  <span className="font-bold text-primary">{formatPercentage(funnelTotals.avgTxConv)}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
})

FunnelComparison.displayName = 'FunnelComparison'

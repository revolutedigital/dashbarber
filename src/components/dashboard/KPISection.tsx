'use client'

import { memo } from 'react'
import { DollarSign, ShoppingCart, Target, Percent } from 'lucide-react'
import { KPIHeroCard } from '@/components/cards/KPIHeroCard'
import { FunnelTotals } from '@/types/metrics'
import { formatCurrency, formatPercentage, formatNumber } from '@/lib/calculations'

interface KPISectionProps {
  totals: FunnelTotals
  previousTotals?: FunnelTotals | null
}

// Calcula variacao percentual
function calcChange(current: number, previous: number): number | undefined {
  if (!previous || previous === 0) return undefined
  return ((current - previous) / previous) * 100
}

export const KPISection = memo(function KPISection({ totals, previousTotals }: KPISectionProps) {
  const changes = previousTotals ? {
    spent: calcChange(totals.totalSpent, previousTotals.totalSpent),
    purchases: calcChange(totals.totalPurchases, previousTotals.totalPurchases),
    cpa: calcChange(totals.avgCpa, previousTotals.avgCpa),
    txConv: calcChange(totals.avgTxConv, previousTotals.avgTxConv),
  } : {}

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
      <KPIHeroCard
        title="Total Investido"
        value={formatCurrency(totals.totalSpent)}
        icon={<DollarSign />}
        variant="orange"
        change={changes.spent}
        changeLabel="vs periodo anterior"
      />
      <KPIHeroCard
        title="Compras"
        value={formatNumber(totals.totalPurchases)}
        icon={<ShoppingCart />}
        variant="green"
        change={changes.purchases}
        changeLabel="vs periodo anterior"
      />
      <KPIHeroCard
        title="CPA Medio"
        value={formatCurrency(totals.avgCpa)}
        icon={<Target />}
        variant="blue"
        change={changes.cpa}
        changeLabel="vs periodo anterior"
      />
      <KPIHeroCard
        title="Taxa de Conversao"
        value={formatPercentage(totals.avgTxConv)}
        icon={<Percent />}
        variant="purple"
        change={changes.txConv}
        changeLabel="vs periodo anterior"
      />
    </div>
  )
})

KPISection.displayName = 'KPISection'

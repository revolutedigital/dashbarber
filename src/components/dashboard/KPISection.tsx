'use client'

import { memo } from 'react'
import { DollarSign, ShoppingCart, Target, Percent } from 'lucide-react'
import { KPIHeroCard } from '@/components/cards/KPIHeroCard'
import { FunnelTotals } from '@/types/metrics'
import { formatCurrency, formatPercentage, formatNumber } from '@/lib/calculations'

interface KPISectionProps {
  totals: FunnelTotals
}

export const KPISection = memo(function KPISection({ totals }: KPISectionProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <KPIHeroCard
        title="Total Investido"
        value={formatCurrency(totals.totalSpent)}
        icon={<DollarSign />}
        variant="orange"
        changeLabel="Amount Spent"
      />
      <KPIHeroCard
        title="Compras"
        value={formatNumber(totals.totalPurchases)}
        icon={<ShoppingCart />}
        variant="green"
        changeLabel="Purchases"
      />
      <KPIHeroCard
        title="CPA Medio"
        value={formatCurrency(totals.avgCpa)}
        icon={<Target />}
        variant="blue"
        changeLabel="Custo por Aquisicao"
      />
      <KPIHeroCard
        title="Taxa de Conversao"
        value={formatPercentage(totals.avgTxConv)}
        icon={<Percent />}
        variant="purple"
        changeLabel="TX CONV"
      />
    </div>
  )
})

KPISection.displayName = 'KPISection'

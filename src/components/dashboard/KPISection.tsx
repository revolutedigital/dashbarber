'use client'

import { memo } from 'react'
import { DollarSign, ShoppingCart, Target, Percent, TrendingUp } from 'lucide-react'
import { KPIHeroCard } from '@/components/cards/KPIHeroCard'
import { FunnelTotals } from '@/types/metrics'
import { formatCurrency, formatPercentage, formatNumber } from '@/lib/calculations'

interface KPISectionProps {
  totals: FunnelTotals
}

export const KPISection = memo(function KPISection({ totals }: KPISectionProps) {
  return (
    <section>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-primary/10">
          <TrendingUp className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Visao Geral</h2>
          <p className="text-sm text-muted-foreground">Principais indicadores de performance</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPIHeroCard
          title="Total Investido"
          value={formatCurrency(totals.totalSpent)}
          icon={<DollarSign />}
          gradient="danger"
          changeLabel="Amount Spent"
        />
        <KPIHeroCard
          title="Compras"
          value={formatNumber(totals.totalPurchases)}
          icon={<ShoppingCart />}
          gradient="success"
          changeLabel="Purchases"
        />
        <KPIHeroCard
          title="CPA Medio"
          value={formatCurrency(totals.avgCpa)}
          icon={<Target />}
          gradient="primary"
          changeLabel="Custo por Aquisicao"
        />
        <KPIHeroCard
          title="Taxa de Conversao"
          value={formatPercentage(totals.avgTxConv)}
          icon={<Percent />}
          gradient="warning"
          changeLabel="TX CONV"
        />
      </div>
    </section>
  )
})

KPISection.displayName = 'KPISection'

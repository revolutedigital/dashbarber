'use client'

import { memo, Suspense, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { formatCurrency, formatNumber } from '@/lib/calculations'

const LineChart = dynamic(
  () => import('@/components/charts/LineChart').then(mod => ({ default: mod.LineChart })),
  {
    loading: () => <ChartSkeleton />,
    ssr: false,
  }
)

const BarChart = dynamic(
  () => import('@/components/charts/BarChart').then(mod => ({ default: mod.BarChart })),
  {
    loading: () => <ChartSkeleton />,
    ssr: false,
  }
)

const AreaChart = dynamic(
  () => import('@/components/charts/AreaChart').then(mod => ({ default: mod.AreaChart })),
  {
    loading: () => <ChartSkeleton />,
    ssr: false,
  }
)

const PieChart = dynamic(
  () => import('@/components/charts/PieChart').then(mod => ({ default: mod.PieChart })),
  {
    loading: () => <ChartSkeleton />,
    ssr: false,
  }
)

interface ChartData {
  day: string
  amountSpent: number
  purchases: number
  cpa: number
  cpc: number
  cpm: number
  ctrLink: number
  txConv: number
  impressions: number
  reach: number
  [key: string]: string | number
}

interface ChartsSectionProps {
  chartData: ChartData[]
}

function ChartSkeleton() {
  return (
    <div className="h-[280px] w-full skeleton rounded-lg" />
  )
}

export const ChartsSection = memo(function ChartsSection({ chartData }: ChartsSectionProps) {
  // Calcular totais para o grafico de pizza
  const pieData = useMemo(() => {
    const totalReach = chartData.reduce((sum, d) => sum + d.reach, 0)
    const totalImpressions = chartData.reduce((sum, d) => sum + d.impressions, 0)
    const totalClicks = chartData.reduce((sum, d) => sum + (d.amountSpent / d.cpc || 0), 0)
    const totalPurchases = chartData.reduce((sum, d) => sum + d.purchases, 0)

    return [
      { name: 'Alcance', value: totalReach, color: '#6366f1' },
      { name: 'Impressoes', value: totalImpressions, color: '#22c55e' },
      { name: 'Cliques', value: Math.round(totalClicks), color: '#f59e0b' },
      { name: 'Compras', value: totalPurchases, color: '#ec4899' },
    ]
  }, [chartData])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-1 h-5 bg-indigo-500 rounded-full" />
        <h3 className="text-lg font-semibold text-foreground">Analytics</h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl p-5 hover-glow transition-all">
          <Suspense fallback={<ChartSkeleton />}>
            <LineChart
              title="Investimento Diario"
              data={chartData}
              lines={[
                { key: 'amountSpent', label: 'Investimento', color: '#ef4444' },
              ]}
              formatValue={(v) => formatCurrency(v)}
            />
          </Suspense>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 hover-glow transition-all">
          <Suspense fallback={<ChartSkeleton />}>
            <BarChart
              title="Compras por Dia"
              data={chartData}
              bars={[
                { key: 'purchases', label: 'Compras', color: '#22c55e' },
              ]}
            />
          </Suspense>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl p-5 hover-glow transition-all">
          <Suspense fallback={<ChartSkeleton />}>
            <AreaChart
              title="Alcance e Impressoes"
              data={chartData}
              areas={[
                { key: 'reach', label: 'Alcance', color: '#6366f1' },
                { key: 'impressions', label: 'Impressoes', color: '#22c55e' },
              ]}
              formatValue={(v) => formatNumber(v)}
            />
          </Suspense>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 hover-glow transition-all">
          <Suspense fallback={<ChartSkeleton />}>
            <PieChart
              title="Distribuicao do Funil"
              data={pieData}
              formatValue={(v) => formatNumber(v)}
            />
          </Suspense>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl p-5 hover-glow transition-all">
          <Suspense fallback={<ChartSkeleton />}>
            <LineChart
              title="CPA ao Longo do Tempo"
              data={chartData}
              lines={[
                { key: 'cpa', label: 'CPA', color: '#8b5cf6' },
              ]}
              formatValue={(v) => formatCurrency(v)}
            />
          </Suspense>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 hover-glow transition-all">
          <Suspense fallback={<ChartSkeleton />}>
            <LineChart
              title="CPC e CPM"
              data={chartData}
              lines={[
                { key: 'cpc', label: 'CPC', color: '#f59e0b' },
                { key: 'cpm', label: 'CPM', color: '#6366f1' },
              ]}
              formatValue={(v) => formatCurrency(v)}
            />
          </Suspense>
        </div>
      </div>
    </div>
  )
})

ChartsSection.displayName = 'ChartsSection'

'use client'

import { memo, Suspense } from 'react'
import dynamic from 'next/dynamic'
import { BarChart3 } from 'lucide-react'
import { formatCurrency } from '@/lib/calculations'

// Lazy load dos gráficos para melhor performance
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
  return (
    <section>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-indigo-500/10">
          <BarChart3 className="h-5 w-5 text-indigo-500" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Analytics</h2>
          <p className="text-sm text-muted-foreground">Visualizacao detalhada dos dados</p>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
          <Suspense fallback={<ChartSkeleton />}>
            <LineChart
              title="Investimento Diario"
              data={chartData}
              lines={[
                { key: 'amountSpent', label: 'Investimento', color: '#f43f5e' },
              ]}
              formatValue={(v) => formatCurrency(v)}
            />
          </Suspense>
        </div>
        <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
          <Suspense fallback={<ChartSkeleton />}>
            <BarChart
              title="Compras por Dia"
              data={chartData}
              bars={[
                { key: 'purchases', label: 'Compras', color: '#10b981' },
              ]}
            />
          </Suspense>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
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
        <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
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
    </section>
  )
})

ChartsSection.displayName = 'ChartsSection'

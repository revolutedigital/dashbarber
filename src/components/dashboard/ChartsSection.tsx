'use client'

import { memo, Suspense } from 'react'
import dynamic from 'next/dynamic'
import { formatCurrency } from '@/lib/calculations'

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
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-1 h-5 bg-indigo-500 rounded-full" />
        <h3 className="text-lg font-semibold text-foreground">Analytics</h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl p-5">
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

        <div className="bg-card border border-border rounded-xl p-5">
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
        <div className="bg-card border border-border rounded-xl p-5">
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

        <div className="bg-card border border-border rounded-xl p-5">
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

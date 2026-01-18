'use client'

import { memo, Suspense, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { formatCurrency, formatNumber } from '@/lib/calculations'
import { BarChart3, Flame } from 'lucide-react'

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

const WeekdayHeatmap = dynamic(
  () => import('@/components/charts/WeekdayHeatmap').then(mod => ({ default: mod.WeekdayHeatmap })),
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
    <div className="space-y-3">
      <div className="h-4 w-32 skeleton-enhanced rounded" />
      <div className="h-[200px] w-full skeleton-enhanced rounded-lg" />
    </div>
  )
}

// Card wrapper with glassmorphism
function ChartCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`
      bg-card/80 backdrop-blur-sm
      border border-border/50
      rounded-2xl p-5
      transition-all duration-300 ease-out
      hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5
      group
      ${className}
    `}>
      {children}
    </div>
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
    <section className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-indigo-500/10">
          <BarChart3 className="w-5 h-5 text-indigo-500" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Analytics</h2>
          <p className="text-sm text-muted-foreground">Visualizacao detalhada das metricas</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 stagger-cards">
        <ChartCard>
          <Suspense fallback={<ChartSkeleton />}>
            <LineChart
              title="Investimento Diario"
              data={chartData}
              lines={[
                { key: 'amountSpent', label: 'Investimento', color: '#ef4444' },
              ]}
              formatValue={(v) => formatCurrency(v)}
              showAverage
              showAnnotations
            />
          </Suspense>
        </ChartCard>

        <ChartCard>
          <Suspense fallback={<ChartSkeleton />}>
            <BarChart
              title="Compras por Dia"
              data={chartData}
              bars={[
                { key: 'purchases', label: 'Compras', color: '#22c55e' },
              ]}
            />
          </Suspense>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard>
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
        </ChartCard>

        <ChartCard>
          <Suspense fallback={<ChartSkeleton />}>
            <PieChart
              title="Distribuicao do Funil"
              data={pieData}
              formatValue={(v) => formatNumber(v)}
            />
          </Suspense>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard>
          <Suspense fallback={<ChartSkeleton />}>
            <LineChart
              title="CPA ao Longo do Tempo"
              data={chartData}
              lines={[
                { key: 'cpa', label: 'CPA', color: '#8b5cf6' },
              ]}
              formatValue={(v) => formatCurrency(v)}
              showAverage
              showAnnotations
            />
          </Suspense>
        </ChartCard>

        <ChartCard>
          <Suspense fallback={<ChartSkeleton />}>
            <LineChart
              title="CPC e CPM"
              data={chartData}
              lines={[
                { key: 'cpc', label: 'CPC', color: '#f59e0b' },
                { key: 'cpm', label: 'CPM', color: '#6366f1' },
              ]}
              formatValue={(v) => formatCurrency(v)}
              showAnnotations={false}
            />
          </Suspense>
        </ChartCard>
      </div>

      {/* Heatmap Section */}
      <div className="mt-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-xl bg-orange-500/10">
            <Flame className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Analise Semanal</h2>
            <p className="text-sm text-muted-foreground">Performance por dia da semana</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartCard>
            <Suspense fallback={<ChartSkeleton />}>
              <WeekdayHeatmap
                data={chartData}
                metricKey="purchases"
                title="Compras por Dia da Semana"
                formatValue={(v) => v.toFixed(1)}
                colorScheme="green"
                higherIsBetter={true}
              />
            </Suspense>
          </ChartCard>

          <ChartCard>
            <Suspense fallback={<ChartSkeleton />}>
              <WeekdayHeatmap
                data={chartData}
                metricKey="cpa"
                title="CPA por Dia da Semana"
                formatValue={(v) => formatCurrency(v)}
                colorScheme="purple"
                higherIsBetter={false}
              />
            </Suspense>
          </ChartCard>
        </div>
      </div>
    </section>
  )
})

ChartsSection.displayName = 'ChartsSection'

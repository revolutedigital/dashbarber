'use client'

import React, { useEffect, useState, useCallback, useMemo, Suspense } from 'react'
import dynamic from 'next/dynamic'
import { Activity } from 'lucide-react'

import {
  DashboardHeader,
  SettingsPanel,
  GoalsSection,
  KPISection,
  MetricsSection,
  ChartsSection,
  FunnelComparison,
  CustomMetricsSection,
  DataTable,
  filterDataByDateRange,
  filterDataByPreviousPeriod,
} from '@/components/dashboard'
import type { DateRange } from '@/components/dashboard'

import { useDashboardConfig } from '@/hooks/useDashboardConfig'
import { useDashboardData } from '@/hooks/useDashboardData'
import { useToast } from '@/components/ui/toast'
import { calculateFunnelTotals } from '@/lib/calculations'
import { exportToCSV } from '@/lib/export'
import { Funnel, MetaAdsData, FunnelTotals, CustomMetric } from '@/types/metrics'

interface FunnelWithColor extends Funnel {
  color?: string
}

const CreateMetricModal = dynamic(
  () => import('@/components/modals/CreateMetricModal').then(mod => ({ default: mod.CreateMetricModal })),
  { ssr: false }
)

const CreateGoalModal = dynamic(
  () => import('@/components/modals/CreateGoalModal').then(mod => ({ default: mod.CreateGoalModal })),
  { ssr: false }
)

// Dados mock para demonstracao (30 dias de dados realistas)
const generateMockData = (): MetaAdsData[] => {
  const data: MetaAdsData[] = []
  const baseDate = new Date()
  baseDate.setDate(baseDate.getDate() - 30)

  for (let i = 0; i < 30; i++) {
    const date = new Date(baseDate)
    date.setDate(date.getDate() + i)
    const dayStr = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`

    // Variacao realista baseada no dia da semana (fins de semana tem menos performance)
    const dayOfWeek = date.getDay()
    const weekendFactor = dayOfWeek === 0 || dayOfWeek === 6 ? 0.7 : 1
    const randomFactor = 0.8 + Math.random() * 0.4 // 80% a 120%

    const baseSpent = 450 + Math.random() * 150
    const spent = baseSpent * weekendFactor * randomFactor
    const reach = Math.floor((8000 + Math.random() * 4000) * weekendFactor)
    const impressions = Math.floor(reach * (2.2 + Math.random() * 0.5))
    const clicksAll = Math.floor((250 + Math.random() * 150) * weekendFactor * randomFactor)
    const uniqueLinkClicks = Math.floor(clicksAll * (0.65 + Math.random() * 0.15))
    const purchases = Math.floor((8 + Math.random() * 15) * weekendFactor * randomFactor)

    data.push({
      day: dayStr,
      amountSpent: Math.round(spent * 100) / 100,
      reach,
      impressions,
      clicksAll,
      uniqueLinkClicks,
      costPerLandingPageView: Math.round((spent / uniqueLinkClicks) * 100) / 100,
      purchases,
      cpm: Math.round((spent / impressions * 1000) * 100) / 100,
      ctrLink: Math.round((uniqueLinkClicks / impressions) * 10000) / 10000,
      connectRate: Math.round((purchases / uniqueLinkClicks * 100) * 100) / 100,
      cpa: purchases > 0 ? Math.round((spent / purchases) * 100) / 100 : 0,
      cpc: Math.round((spent / clicksAll) * 100) / 100,
      txConv: uniqueLinkClicks > 0 ? Math.round((purchases / uniqueLinkClicks) * 10000) / 10000 : 0,
    })
  }
  return data
}

const mockFunnels: Funnel[] = [
  {
    id: 'playbook_conv_frio',
    name: 'Playbook (Conv Frio)',
    data: generateMockData(),
  },
  {
    id: 'remarketing_quente',
    name: 'Remarketing (Quente)',
    data: generateMockData().map(d => ({
      ...d,
      amountSpent: d.amountSpent * 0.6,
      purchases: Math.floor(d.purchases * 1.3),
      cpa: d.cpa * 0.5,
      txConv: d.txConv * 1.5,
    })),
  },
  {
    id: 'lookalike_top',
    name: 'Lookalike (Top 1%)',
    data: generateMockData().map(d => ({
      ...d,
      amountSpent: d.amountSpent * 0.8,
      reach: Math.floor(d.reach * 0.7),
      purchases: Math.floor(d.purchases * 1.1),
      ctrLink: d.ctrLink * 1.2,
    })),
  },
]

export default function DashboardPage() {
  const [selectedFunnel, setSelectedFunnel] = useState<string>('all')
  const [dateRange, setDateRange] = useState<DateRange>('all')
  const [isDark, setIsDark] = useState(true)

  // Modais
  const [showMetricModal, setShowMetricModal] = useState(false)
  const [showGoalModal, setShowGoalModal] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  // Dark mode effect
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDark])

  const {
    config,
    isLoaded,
    addCustomMetric,
    removeCustomMetric,
    addGoal,
    removeGoal,
    calculateCustomMetric,
    calculateGoalProgress,
  } = useDashboardConfig()

  const { addToast } = useToast()

  // SWR para buscar dados
  const { data: apiData, error: apiError, isLoading, isValidating, refresh } = useDashboardData()

  // Mostrar toasts baseado no estado do SWR
  const prevLoadingRef = React.useRef(false)
  useEffect(() => {
    if (prevLoadingRef.current && !isLoading && !apiError && apiData) {
      addToast('Dados atualizados com sucesso', 'success', 3000)
    }
    if (apiError) {
      addToast('Usando dados de demonstracao', 'warning', 4000)
    }
    prevLoadingRef.current = isLoading
  }, [isLoading, apiError, apiData, addToast])

  // Dados efetivos (API ou mock)
  const funnels: FunnelWithColor[] = apiData?.funnels || mockFunnels
  const lastUpdated = apiData?.lastUpdated || ''
  const usingMock = !apiData?.funnels
  const loading = isLoading || isValidating

  const filteredData = useMemo((): MetaAdsData[] => {
    let data: MetaAdsData[]
    if (selectedFunnel === 'all') {
      data = funnels.flatMap(f => f.data)
    } else {
      const funnel = funnels.find(f => f.id === selectedFunnel)
      data = funnel?.data || []
    }
    // Aplicar filtro de periodo
    return filterDataByDateRange(data, dateRange)
  }, [funnels, selectedFunnel, dateRange])

  const totals = useMemo((): FunnelTotals => {
    return calculateFunnelTotals(filteredData)
  }, [filteredData])

  // Dados do periodo anterior para comparacao
  const previousData = useMemo((): MetaAdsData[] => {
    let data: MetaAdsData[]
    if (selectedFunnel === 'all') {
      data = funnels.flatMap(f => f.data)
    } else {
      const funnel = funnels.find(f => f.id === selectedFunnel)
      data = funnel?.data || []
    }
    return filterDataByPreviousPeriod(data, dateRange)
  }, [funnels, selectedFunnel, dateRange])

  const previousTotals = useMemo((): FunnelTotals | null => {
    if (previousData.length === 0 || dateRange === 'all') return null
    return calculateFunnelTotals(previousData)
  }, [previousData, dateRange])

  const chartData = useMemo(() => {
    return filteredData.map(d => ({
      day: d.day,
      amountSpent: d.amountSpent,
      purchases: d.purchases,
      cpa: d.cpa,
      cpc: d.cpc,
      cpm: d.cpm,
      ctrLink: d.ctrLink * 100,
      txConv: d.txConv * 100,
      impressions: d.impressions,
      reach: d.reach,
    }))
  }, [filteredData])

  const getMetricValue = useCallback((metricKey: string): number => {
    const customMetric = config.customMetrics.find(m => m.id === metricKey)
    if (customMetric) {
      return calculateCustomMetric(customMetric.formula, totals)
    }
    return totals[metricKey as keyof FunnelTotals] || 0
  }, [config.customMetrics, calculateCustomMetric, totals])

  const handleFunnelChange = useCallback((value: string) => {
    setSelectedFunnel(value)
  }, [])

  const handleToggleSettings = useCallback(() => {
    setShowSettings(prev => !prev)
  }, [])

  const handleDateRangeChange = useCallback((value: DateRange) => {
    setDateRange(value)
  }, [])

  const handleToggleTheme = useCallback(() => {
    setIsDark(prev => !prev)
  }, [])

  const handleExport = useCallback(() => {
    exportToCSV(filteredData, `dashbarber-${dateRange}-${new Date().toISOString().split('T')[0]}`)
    addToast('Dados exportados com sucesso', 'success', 3000)
  }, [filteredData, dateRange, addToast])

  const handleOpenMetricModal = useCallback(() => {
    setShowMetricModal(true)
  }, [])

  const handleCloseMetricModal = useCallback(() => {
    setShowMetricModal(false)
  }, [])

  const handleOpenGoalModal = useCallback(() => {
    setShowGoalModal(true)
  }, [])

  const handleCloseGoalModal = useCallback(() => {
    setShowGoalModal(false)
  }, [])

  const handleAddMetric = useCallback((metric: Omit<CustomMetric, 'id'>) => {
    addCustomMetric(metric)
  }, [addCustomMetric])

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-3 border-primary border-t-transparent animate-spin" />
          <p className="text-muted-foreground font-medium text-sm">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader
        funnels={funnels}
        selectedFunnel={selectedFunnel}
        onFunnelChange={handleFunnelChange}
        dateRange={dateRange}
        onDateRangeChange={handleDateRangeChange}
        showSettings={showSettings}
        onToggleSettings={handleToggleSettings}
        loading={loading}
        onRefresh={refresh}
        usingMock={usingMock}
        isDark={isDark}
        onToggleTheme={handleToggleTheme}
        onExport={handleExport}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Status Bar */}
        <div className="flex items-center justify-between text-sm mb-6">
          <div className="flex items-center gap-3 text-muted-foreground">
            <span>{usingMock ? 'Dados de demonstracao' : `${funnels.length} funis`}</span>
            {lastUpdated && (
              <>
                <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                <span>Atualizado: {new Date(lastUpdated).toLocaleString('pt-BR')}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Activity className="w-4 h-4" />
            <span>{filteredData.length} registros</span>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-8">
          {/* KPIs */}
          <KPISection totals={totals} previousTotals={previousTotals} chartData={chartData} />

          {/* Settings Panel */}
          {showSettings && (
            <SettingsPanel
              customMetrics={config.customMetrics}
              onAddMetric={handleOpenMetricModal}
              onAddGoal={handleOpenGoalModal}
              onRemoveMetric={removeCustomMetric}
            />
          )}

          {/* Goals */}
          <GoalsSection
            goals={config.goals}
            selectedFunnel={selectedFunnel}
            getMetricValue={getMetricValue}
            calculateGoalProgress={calculateGoalProgress}
            onRemoveGoal={removeGoal}
          />

          {/* Custom Metrics */}
          <CustomMetricsSection
            customMetrics={config.customMetrics}
            totals={totals}
            calculateCustomMetric={calculateCustomMetric}
          />

          {/* Metrics */}
          <MetricsSection totals={totals} />

          {/* Charts */}
          <ChartsSection chartData={chartData} />

          {/* Data Table */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-4">Dados Detalhados</h2>
            <DataTable data={filteredData} />
          </section>

          {/* Funnel Comparison */}
          <FunnelComparison funnels={funnels} selectedFunnel={selectedFunnel} />
        </div>
      </main>

      {/* Modals */}
      {showMetricModal && (
        <Suspense fallback={null}>
          <CreateMetricModal
            open={showMetricModal}
            onClose={handleCloseMetricModal}
            onSave={handleAddMetric}
          />
        </Suspense>
      )}

      {showGoalModal && (
        <Suspense fallback={null}>
          <CreateGoalModal
            open={showGoalModal}
            onClose={handleCloseGoalModal}
            onSave={addGoal}
            funnels={funnels}
            customMetrics={config.customMetrics}
          />
        </Suspense>
      )}
    </div>
  )
}

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

// Dados mock para demonstracao
const mockFunnels: Funnel[] = [
  {
    id: 'playbook_conv_frio',
    name: 'Playbook (Conv Frio)',
    data: [
      { day: '11/01', amountSpent: 456.67, reach: 8483, impressions: 18764, clicksAll: 341, uniqueLinkClicks: 225, costPerLandingPageView: 2.84, purchases: 19, cpm: 24.34, ctrLink: 0.012, connectRate: 1.26, cpa: 24.04, cpc: 1.34, txConv: 0.0844 },
      { day: '12/01', amountSpent: 470.82, reach: 11076, impressions: 17029, clicksAll: 261, uniqueLinkClicks: 167, costPerLandingPageView: 3.86, purchases: 7, cpm: 27.65, ctrLink: 0.0098, connectRate: 2.31, cpa: 67.26, cpc: 1.80, txConv: 0.0419 },
    ],
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

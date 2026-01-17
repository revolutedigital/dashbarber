'use client'

import { useEffect, useState, useCallback, useMemo, Suspense } from 'react'
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
} from '@/components/dashboard'

import { useDashboardConfig } from '@/hooks/useDashboardConfig'
import { calculateFunnelTotals } from '@/lib/calculations'
import { Funnel, MetaAdsData, FunnelTotals, ApiResponse, CustomMetric } from '@/types/metrics'
import { FilterRule } from '@/types/funnel'

// Funnel com cor
interface FunnelWithColor extends Funnel {
  color?: string
}

// Lazy load dos modais para reduzir bundle inicial
const CreateMetricModal = dynamic(
  () => import('@/components/modals/CreateMetricModal').then(mod => ({ default: mod.CreateMetricModal })),
  { ssr: false }
)

const CreateGoalModal = dynamic(
  () => import('@/components/modals/CreateGoalModal').then(mod => ({ default: mod.CreateGoalModal })),
  { ssr: false }
)

const CreateFunnelModal = dynamic(
  () => import('@/components/modals/CreateFunnelModal').then(mod => ({ default: mod.CreateFunnelModal })),
  { ssr: false }
)

// Dados mock para demonstração
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
  const [funnels, setFunnels] = useState<FunnelWithColor[]>(mockFunnels)
  const [selectedFunnel, setSelectedFunnel] = useState<string>('all')
  const [lastUpdated, setLastUpdated] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [usingMock, setUsingMock] = useState(true)

  // Modais
  const [showMetricModal, setShowMetricModal] = useState(false)
  const [showGoalModal, setShowGoalModal] = useState(false)
  const [showFunnelModal, setShowFunnelModal] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  // Hook de configuração
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

  // Fetch data com useCallback e AbortController para cleanup
  const fetchData = useCallback(async (signal?: AbortSignal) => {
    setLoading(true)
    try {
      const response = await fetch('/api/data', { signal })
      if (response.ok) {
        const result: ApiResponse = await response.json()
        if (result.funnels && result.funnels.length > 0) {
          setFunnels(result.funnels)
          setLastUpdated(result.lastUpdated)
          setUsingMock(false)
        }
      }
    } catch (error) {
      // Ignore abort errors (expected on unmount)
      if (error instanceof Error && error.name === 'AbortError') {
        return
      }
      console.log('Usando dados de demonstração')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const abortController = new AbortController()
    fetchData(abortController.signal)

    const interval = setInterval(() => {
      fetchData(abortController.signal)
    }, 5 * 60 * 1000)

    return () => {
      abortController.abort()
      clearInterval(interval)
    }
  }, [fetchData])

  // Memoize filtered data para evitar recálculos desnecessários
  const filteredData = useMemo((): MetaAdsData[] => {
    if (selectedFunnel === 'all') {
      return funnels.flatMap(f => f.data)
    }
    const funnel = funnels.find(f => f.id === selectedFunnel)
    return funnel?.data || []
  }, [funnels, selectedFunnel])

  // Memoize totals calculation
  const totals = useMemo((): FunnelTotals => {
    return calculateFunnelTotals(filteredData)
  }, [filteredData])

  // Memoize chart data transformation
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

  // Memoize getMetricValue para passar para componentes filhos
  const getMetricValue = useCallback((metricKey: string): number => {
    const customMetric = config.customMetrics.find(m => m.id === metricKey)
    if (customMetric) {
      return calculateCustomMetric(customMetric.formula, totals)
    }
    return totals[metricKey as keyof FunnelTotals] || 0
  }, [config.customMetrics, calculateCustomMetric, totals])

  // Callbacks memoizados para handlers
  const handleFunnelChange = useCallback((value: string) => {
    setSelectedFunnel(value)
  }, [])

  const handleToggleSettings = useCallback(() => {
    setShowSettings(prev => !prev)
  }, [])

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

  // Funnel Modal handlers
  const handleOpenFunnelModal = useCallback(() => {
    setShowFunnelModal(true)
  }, [])

  const handleCloseFunnelModal = useCallback(() => {
    setShowFunnelModal(false)
  }, [])

  const handleCreateFunnel = useCallback(async (funnelData: {
    name: string
    description?: string
    color?: string
    conversionMetric: string
    rules: FilterRule[]
  }) => {
    try {
      const response = await fetch('/api/funnels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(funnelData),
      })

      if (response.ok) {
        // Refresh data to include new funnel
        fetchData()
      }
    } catch (error) {
      console.error('Error creating funnel:', error)
    }
  }, [fetchData])

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <p className="text-muted-foreground font-medium">Carregando dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Premium Header */}
      <DashboardHeader
        funnels={funnels}
        selectedFunnel={selectedFunnel}
        onFunnelChange={handleFunnelChange}
        showSettings={showSettings}
        onToggleSettings={handleToggleSettings}
        loading={loading}
        onRefresh={fetchData}
        usingMock={usingMock}
        onCreateFunnel={handleOpenFunnelModal}
      />

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto px-6 py-8">
        {/* Status Bar */}
        <div className="flex items-center justify-between text-sm mb-8">
          <div className="flex items-center gap-4">
            <span className="text-muted-foreground">
              {usingMock ? 'Dados de demonstracao' : `${funnels.length} funis conectados`}
            </span>
            {lastUpdated && (
              <span className="text-muted-foreground">
                Atualizado: {new Date(lastUpdated).toLocaleString('pt-BR')}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Activity className="w-4 h-4" aria-hidden="true" />
            <span>{filteredData.length} registros</span>
          </div>
        </div>

        {/* Content sections with mobile-first priority ordering */}
        <div className="flex flex-col gap-8">
          {/* KPI Hero Cards - First on mobile (most important) */}
          <div className="order-1">
            <KPISection totals={totals} />
          </div>

          {/* Painel de Configurações */}
          {showSettings && (
            <div className="order-2 md:order-first">
              <SettingsPanel
                customMetrics={config.customMetrics}
                onAddMetric={handleOpenMetricModal}
                onAddGoal={handleOpenGoalModal}
                onRemoveMetric={removeCustomMetric}
              />
            </div>
          )}

          {/* Metas */}
          <div className="order-3 md:order-2">
            <GoalsSection
              goals={config.goals}
              selectedFunnel={selectedFunnel}
              getMetricValue={getMetricValue}
              calculateGoalProgress={calculateGoalProgress}
              onRemoveGoal={removeGoal}
            />
          </div>

          {/* Métricas Customizadas */}
          <div className="order-4 md:order-3">
            <CustomMetricsSection
              customMetrics={config.customMetrics}
              totals={totals}
              calculateCustomMetric={calculateCustomMetric}
            />
          </div>

          {/* Alcance, Engajamento e Performance */}
          <div className="order-5 md:order-5">
            <MetricsSection totals={totals} />
          </div>

          {/* Gráficos com Lazy Loading */}
          <div className="order-6 md:order-6">
            <ChartsSection chartData={chartData} />
          </div>

          {/* Comparativo de Funis */}
          <div className="order-7 md:order-7">
            <FunnelComparison funnels={funnels} selectedFunnel={selectedFunnel} />
          </div>
        </div>
      </main>

      {/* Modais com Lazy Loading */}
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

      {showFunnelModal && (
        <Suspense fallback={null}>
          <CreateFunnelModal
            open={showFunnelModal}
            onClose={handleCloseFunnelModal}
            onSave={handleCreateFunnel}
          />
        </Suspense>
      )}
    </div>
  )
}

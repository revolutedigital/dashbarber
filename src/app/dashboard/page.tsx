'use client'

import React, { useEffect, useCallback, Suspense } from 'react'
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
} from '@/components/dashboard'

import { ErrorBoundary } from '@/components/ErrorBoundary'
import { InsightsNarrative } from '@/components/dashboard/InsightsNarrative'
import { DashboardSkeleton } from '@/components/skeletons'
import { LiveIndicator } from '@/components/ui/LiveIndicator'
import { SkipLinkTarget } from '@/components/a11y'
import { useDashboardState } from '@/hooks/useDashboardState'
import { useDashboardFilters } from '@/hooks/useDashboardFilters'
import { useDashboardConfig } from '@/hooks/useDashboardConfig'
import { useDashboardData } from '@/hooks/useDashboardData'
import { useToast } from '@/components/ui/toast'
import { mockFunnels } from '@/lib/mock-data'
import { exportToCSV } from '@/lib/export'
import { Funnel, FunnelTotals, CustomMetric } from '@/types/metrics'

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

export default function DashboardPage() {
  // State management
  const state = useDashboardState()
  const { addToast } = useToast()

  // Config (custom metrics, goals)
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

  // Data fetching
  const { data: apiData, error: apiError, isLoading, isValidating, refresh } = useDashboardData()

  // Effective data (API or mock)
  const funnels: FunnelWithColor[] = apiData?.funnels || mockFunnels
  const lastUpdated = apiData?.lastUpdated || ''
  const usingMock = !apiData?.funnels
  const loading = isLoading || isValidating

  // Data filtering and calculations
  const { filteredData, totals, previousTotals, chartData } = useDashboardFilters({
    funnels,
    selectedFunnel: state.selectedFunnel,
    dateRange: state.dateRange,
  })

  // Toast notifications for data loading
  const prevLoadingRef = React.useRef(false)
  useEffect(() => {
    if (prevLoadingRef.current && !isLoading && !apiError && apiData) {
      addToast('Dados atualizados com sucesso', 'success', 3000)
    }
    if (apiError) {
      addToast('Usando dados de demonstração', 'warning', 4000)
    }
    prevLoadingRef.current = isLoading
  }, [isLoading, apiError, apiData, addToast])

  // Handlers
  const getMetricValue = useCallback((metricKey: string): number => {
    const customMetric = config.customMetrics.find(m => m.id === metricKey)
    if (customMetric) {
      return calculateCustomMetric(customMetric.formula, totals)
    }
    return totals[metricKey as keyof FunnelTotals] || 0
  }, [config.customMetrics, calculateCustomMetric, totals])

  const handleExport = useCallback(() => {
    exportToCSV(filteredData, `dashbarber-${state.dateRange}-${new Date().toISOString().split('T')[0]}`)
    addToast('Dados exportados com sucesso', 'success', 3000)
  }, [filteredData, state.dateRange, addToast])

  const handleAddMetric = useCallback((metric: Omit<CustomMetric, 'id'>) => {
    addCustomMetric(metric)
  }, [addCustomMetric])

  // Loading state
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background p-6">
        <DashboardSkeleton />
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background">
        <DashboardHeader
          funnels={funnels}
          selectedFunnel={state.selectedFunnel}
          onFunnelChange={state.handleFunnelChange}
          dateRange={state.dateRange}
          onDateRangeChange={state.handleDateRangeChange}
          showSettings={state.showSettings}
          onToggleSettings={state.handleToggleSettings}
          loading={loading}
          onRefresh={refresh}
          usingMock={usingMock}
          isDark={state.isDark}
          onToggleTheme={state.handleToggleTheme}
          onExport={handleExport}
        />

        <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 py-6" tabIndex={-1}>
          {/* Status Bar */}
          <div className="flex items-center justify-between text-sm mb-6">
            <div className="flex items-center gap-3 text-muted-foreground">
              <span>{usingMock ? 'Dados de demonstração' : `${funnels.length} funis`}</span>
              <LiveIndicator
                lastUpdate={lastUpdated ? new Date(lastUpdated) : null}
                isLoading={loading}
                onRefresh={refresh}
              />
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Activity className="w-4 h-4" />
              <span>{filteredData.length} registros</span>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-8">
            <SkipLinkTarget id="kpi-section" label="Métricas principais">
              <KPISection totals={totals} previousTotals={previousTotals} chartData={chartData} />
            </SkipLinkTarget>

            {/* AI-Generated Insights */}
            <InsightsNarrative totals={totals} previousTotals={previousTotals} />

            {state.showSettings && (
              <SettingsPanel
                customMetrics={config.customMetrics}
                onAddMetric={state.handleOpenMetricModal}
                onAddGoal={state.handleOpenGoalModal}
                onRemoveMetric={removeCustomMetric}
              />
            )}

            <GoalsSection
              goals={config.goals}
              selectedFunnel={state.selectedFunnel}
              getMetricValue={getMetricValue}
              calculateGoalProgress={calculateGoalProgress}
              onRemoveGoal={removeGoal}
            />

            <CustomMetricsSection
              customMetrics={config.customMetrics}
              totals={totals}
              calculateCustomMetric={calculateCustomMetric}
            />

            <MetricsSection totals={totals} />
            <SkipLinkTarget id="charts-section" label="Gráficos de análise">
              <ChartsSection chartData={chartData} />
            </SkipLinkTarget>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-4">Dados Detalhados</h2>
              <DataTable data={filteredData} />
            </section>

            <FunnelComparison funnels={funnels} selectedFunnel={state.selectedFunnel} />
          </div>
        </main>

        {/* Modals */}
        {state.showMetricModal && (
          <Suspense fallback={null}>
            <CreateMetricModal
              open={state.showMetricModal}
              onClose={state.handleCloseMetricModal}
              onSave={handleAddMetric}
            />
          </Suspense>
        )}

        {state.showGoalModal && (
          <Suspense fallback={null}>
            <CreateGoalModal
              open={state.showGoalModal}
              onClose={state.handleCloseGoalModal}
              onSave={addGoal}
              funnels={funnels}
              customMetrics={config.customMetrics}
            />
          </Suspense>
        )}
      </div>
    </ErrorBoundary>
  )
}

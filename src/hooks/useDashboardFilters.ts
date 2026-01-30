'use client'

import { useMemo } from 'react'
import { calculateFunnelTotals } from '@/lib/calculations'
import {
  filterDataByDateRange,
  filterDataByPreviousPeriod,
} from '@/components/dashboard'
import type { DateRange } from '@/components/dashboard'
import type { Funnel, MetaAdsData, FunnelTotals } from '@/types/metrics'

export interface ChartDataPoint {
  [key: string]: string | number
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
}

interface UseDashboardFiltersOptions {
  funnels: Funnel[]
  selectedFunnel: string
  dateRange: DateRange
}

interface UseDashboardFiltersReturn {
  filteredData: MetaAdsData[]
  totals: FunnelTotals
  previousData: MetaAdsData[]
  previousTotals: FunnelTotals | null
  chartData: ChartDataPoint[]
}

/**
 * Manages data filtering and calculations for the dashboard
 */
export function useDashboardFilters({
  funnels,
  selectedFunnel,
  dateRange,
}: UseDashboardFiltersOptions): UseDashboardFiltersReturn {
  // Filter data by funnel and date range
  const filteredData = useMemo((): MetaAdsData[] => {
    let data: MetaAdsData[]
    if (selectedFunnel === 'all') {
      data = funnels.flatMap(f => f.data)
    } else {
      const funnel = funnels.find(f => f.id === selectedFunnel)
      data = funnel?.data || []
    }
    return filterDataByDateRange(data, dateRange)
  }, [funnels, selectedFunnel, dateRange])

  // Calculate totals from filtered data
  const totals = useMemo((): FunnelTotals => {
    return calculateFunnelTotals(filteredData)
  }, [filteredData])

  // Get previous period data for comparison
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

  // Calculate previous period totals
  const previousTotals = useMemo((): FunnelTotals | null => {
    if (previousData.length === 0 || dateRange === 'all') return null
    return calculateFunnelTotals(previousData)
  }, [previousData, dateRange])

  // Prepare data for charts
  const chartData = useMemo((): ChartDataPoint[] => {
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

  return {
    filteredData,
    totals,
    previousData,
    previousTotals,
    chartData,
  }
}

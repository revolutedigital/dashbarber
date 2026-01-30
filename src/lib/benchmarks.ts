'use strict'

import type { FunnelTotals } from '@/types/metrics'

export type IndustryType =
  | 'ecommerce'
  | 'infoproducts'
  | 'saas'
  | 'leadgen'
  | 'local_business'
  | 'app_install'

export interface IndustryBenchmark {
  industry: IndustryType
  label: string
  roas: { good: number; average: number; bad: number }
  cpa: { good: number; average: number; bad: number }
  ctr: { good: number; average: number; bad: number }
  cpc: { good: number; average: number; bad: number }
  cpm: { good: number; average: number; bad: number }
  txConv: { good: number; average: number; bad: number }
  frequency: { good: number; average: number; bad: number }
}

/**
 * Industry benchmarks for Meta Ads
 * Based on 2024-2025 market data
 */
export const INDUSTRY_BENCHMARKS: Record<IndustryType, IndustryBenchmark> = {
  ecommerce: {
    industry: 'ecommerce',
    label: 'E-commerce',
    roas: { good: 4, average: 2.5, bad: 1.5 },
    cpa: { good: 25, average: 50, bad: 100 },
    ctr: { good: 1.5, average: 1.0, bad: 0.5 },
    cpc: { good: 0.5, average: 1.0, bad: 2.0 },
    cpm: { good: 8, average: 15, bad: 25 },
    txConv: { good: 3, average: 1.5, bad: 0.5 },
    frequency: { good: 2, average: 4, bad: 7 },
  },
  infoproducts: {
    industry: 'infoproducts',
    label: 'Infoprodutos',
    roas: { good: 3, average: 2, bad: 1 },
    cpa: { good: 50, average: 100, bad: 200 },
    ctr: { good: 2.0, average: 1.2, bad: 0.6 },
    cpc: { good: 0.8, average: 1.5, bad: 3.0 },
    cpm: { good: 10, average: 20, bad: 35 },
    txConv: { good: 2, average: 1, bad: 0.3 },
    frequency: { good: 2.5, average: 5, bad: 8 },
  },
  saas: {
    industry: 'saas',
    label: 'SaaS',
    roas: { good: 5, average: 3, bad: 1.5 },
    cpa: { good: 100, average: 250, bad: 500 },
    ctr: { good: 1.2, average: 0.8, bad: 0.4 },
    cpc: { good: 1.5, average: 3.0, bad: 6.0 },
    cpm: { good: 15, average: 30, bad: 50 },
    txConv: { good: 5, average: 2, bad: 0.5 },
    frequency: { good: 3, average: 5, bad: 8 },
  },
  leadgen: {
    industry: 'leadgen',
    label: 'Geração de Leads',
    roas: { good: 3, average: 2, bad: 1 },
    cpa: { good: 15, average: 35, bad: 75 },
    ctr: { good: 2.5, average: 1.5, bad: 0.7 },
    cpc: { good: 0.4, average: 0.8, bad: 1.5 },
    cpm: { good: 6, average: 12, bad: 20 },
    txConv: { good: 10, average: 5, bad: 2 },
    frequency: { good: 2, average: 4, bad: 6 },
  },
  local_business: {
    industry: 'local_business',
    label: 'Negócio Local',
    roas: { good: 5, average: 3, bad: 1.5 },
    cpa: { good: 20, average: 40, bad: 80 },
    ctr: { good: 2.0, average: 1.2, bad: 0.5 },
    cpc: { good: 0.3, average: 0.6, bad: 1.2 },
    cpm: { good: 5, average: 10, bad: 18 },
    txConv: { good: 8, average: 4, bad: 1.5 },
    frequency: { good: 3, average: 5, bad: 8 },
  },
  app_install: {
    industry: 'app_install',
    label: 'Instalação de App',
    roas: { good: 2, average: 1.2, bad: 0.7 },
    cpa: { good: 2, average: 5, bad: 10 },
    ctr: { good: 3, average: 1.8, bad: 0.8 },
    cpc: { good: 0.2, average: 0.5, bad: 1.0 },
    cpm: { good: 4, average: 8, bad: 15 },
    txConv: { good: 15, average: 8, bad: 3 },
    frequency: { good: 2, average: 4, bad: 6 },
  },
}

export type BenchmarkLevel = 'good' | 'average' | 'bad'

export interface BenchmarkComparison {
  metric: string
  currentValue: number
  benchmarkValue: number
  level: BenchmarkLevel
  percentageDiff: number
  recommendation?: string
}

/**
 * Compares funnel totals against industry benchmarks
 */
export function compareToBenchmarks(
  totals: FunnelTotals,
  industry: IndustryType
): BenchmarkComparison[] {
  const benchmark = INDUSTRY_BENCHMARKS[industry]
  const comparisons: BenchmarkComparison[] = []

  // ROAS comparison
  if (totals.avgRoas > 0) {
    const level = getBenchmarkLevel(totals.avgRoas, benchmark.roas, true)
    comparisons.push({
      metric: 'ROAS',
      currentValue: totals.avgRoas,
      benchmarkValue: benchmark.roas.average,
      level,
      percentageDiff: ((totals.avgRoas - benchmark.roas.average) / benchmark.roas.average) * 100,
      recommendation: level === 'bad'
        ? 'Considere revisar segmentação de público e criativos'
        : undefined,
    })
  }

  // CPA comparison
  if (totals.avgCpa > 0) {
    const level = getBenchmarkLevel(totals.avgCpa, benchmark.cpa, false)
    comparisons.push({
      metric: 'CPA',
      currentValue: totals.avgCpa,
      benchmarkValue: benchmark.cpa.average,
      level,
      percentageDiff: ((totals.avgCpa - benchmark.cpa.average) / benchmark.cpa.average) * 100,
      recommendation: level === 'bad'
        ? 'CPA acima do esperado - analise os anúncios com baixa performance'
        : undefined,
    })
  }

  // CTR comparison
  if (totals.avgCtr > 0) {
    const level = getBenchmarkLevel(totals.avgCtr, benchmark.ctr, true)
    comparisons.push({
      metric: 'CTR',
      currentValue: totals.avgCtr,
      benchmarkValue: benchmark.ctr.average,
      level,
      percentageDiff: ((totals.avgCtr - benchmark.ctr.average) / benchmark.ctr.average) * 100,
      recommendation: level === 'bad'
        ? 'Teste novos criativos e headlines para aumentar engajamento'
        : undefined,
    })
  }

  // CPC comparison
  if (totals.avgCpc > 0) {
    const level = getBenchmarkLevel(totals.avgCpc, benchmark.cpc, false)
    comparisons.push({
      metric: 'CPC',
      currentValue: totals.avgCpc,
      benchmarkValue: benchmark.cpc.average,
      level,
      percentageDiff: ((totals.avgCpc - benchmark.cpc.average) / benchmark.cpc.average) * 100,
      recommendation: level === 'bad'
        ? 'Considere ajustar lances ou melhorar relevância dos anúncios'
        : undefined,
    })
  }

  // CPM comparison
  if (totals.avgCpm > 0) {
    const level = getBenchmarkLevel(totals.avgCpm, benchmark.cpm, false)
    comparisons.push({
      metric: 'CPM',
      currentValue: totals.avgCpm,
      benchmarkValue: benchmark.cpm.average,
      level,
      percentageDiff: ((totals.avgCpm - benchmark.cpm.average) / benchmark.cpm.average) * 100,
      recommendation: level === 'bad'
        ? 'CPM alto pode indicar público muito competitivo ou narrow'
        : undefined,
    })
  }

  // Conversion Rate comparison
  if (totals.avgTxConv > 0) {
    const level = getBenchmarkLevel(totals.avgTxConv, benchmark.txConv, true)
    comparisons.push({
      metric: 'Taxa de Conversão',
      currentValue: totals.avgTxConv,
      benchmarkValue: benchmark.txConv.average,
      level,
      percentageDiff: ((totals.avgTxConv - benchmark.txConv.average) / benchmark.txConv.average) * 100,
      recommendation: level === 'bad'
        ? 'Revise a landing page e a jornada de conversão'
        : undefined,
    })
  }

  // Frequency comparison
  if (totals.avgFrequency > 0) {
    const level = getBenchmarkLevel(totals.avgFrequency, benchmark.frequency, false)
    comparisons.push({
      metric: 'Frequência',
      currentValue: totals.avgFrequency,
      benchmarkValue: benchmark.frequency.average,
      level,
      percentageDiff: ((totals.avgFrequency - benchmark.frequency.average) / benchmark.frequency.average) * 100,
      recommendation: level === 'bad'
        ? 'Alta frequência indica saturação - considere expandir o público'
        : undefined,
    })
  }

  return comparisons
}

/**
 * Determines benchmark level based on value and thresholds
 */
function getBenchmarkLevel(
  value: number,
  thresholds: { good: number; average: number; bad: number },
  higherIsBetter: boolean
): BenchmarkLevel {
  if (higherIsBetter) {
    if (value >= thresholds.good) return 'good'
    if (value >= thresholds.average) return 'average'
    return 'bad'
  } else {
    if (value <= thresholds.good) return 'good'
    if (value <= thresholds.average) return 'average'
    return 'bad'
  }
}

/**
 * Gets color for benchmark level
 */
export function getBenchmarkColor(level: BenchmarkLevel): string {
  switch (level) {
    case 'good':
      return 'text-emerald-500'
    case 'average':
      return 'text-amber-500'
    case 'bad':
      return 'text-red-500'
  }
}

/**
 * Gets background color for benchmark level
 */
export function getBenchmarkBgColor(level: BenchmarkLevel): string {
  switch (level) {
    case 'good':
      return 'bg-emerald-500/10'
    case 'average':
      return 'bg-amber-500/10'
    case 'bad':
      return 'bg-red-500/10'
  }
}

'use strict'

import type { FunnelTotals, MetaAdsData } from '@/types/metrics'

export type InsightType = 'anomaly' | 'trend' | 'opportunity' | 'warning' | 'achievement'
export type InsightSeverity = 'low' | 'medium' | 'high' | 'critical'

export interface Insight {
  id: string
  type: InsightType
  severity: InsightSeverity
  title: string
  description: string
  metric: string
  value: number
  change?: number
  benchmark?: number
  recommendation?: string
  timestamp: Date
}

// Industry benchmarks for comparison
const BENCHMARKS = {
  cpa: { good: 50, average: 100, bad: 200 },
  ctr: { good: 2.5, average: 1.5, bad: 0.5 },
  roas: { good: 3, average: 2, bad: 1 },
  cpc: { good: 0.5, average: 1.5, bad: 3 },
  txConv: { good: 5, average: 2, bad: 0.5 },
  frequency: { good: 2, average: 4, bad: 7 },
}

/**
 * Generates insights from funnel totals
 */
export function generateInsights(
  totals: FunnelTotals,
  previousTotals?: FunnelTotals | null
): Insight[] {
  const insights: Insight[] = []
  const timestamp = new Date()

  // ROAS Analysis
  if (totals.avgRoas > 0) {
    if (totals.avgRoas >= BENCHMARKS.roas.good) {
      insights.push({
        id: `roas-achievement-${Date.now()}`,
        type: 'achievement',
        severity: 'low',
        title: 'ROAS Excelente',
        description: `Seu ROAS de ${totals.avgRoas.toFixed(2)}x está acima do benchmark de ${BENCHMARKS.roas.good}x`,
        metric: 'avgRoas',
        value: totals.avgRoas,
        benchmark: BENCHMARKS.roas.good,
        timestamp,
      })
    } else if (totals.avgRoas < BENCHMARKS.roas.bad) {
      insights.push({
        id: `roas-warning-${Date.now()}`,
        type: 'warning',
        severity: 'high',
        title: 'ROAS Abaixo do Esperado',
        description: `ROAS de ${totals.avgRoas.toFixed(2)}x está abaixo do mínimo recomendado de ${BENCHMARKS.roas.bad}x`,
        metric: 'avgRoas',
        value: totals.avgRoas,
        benchmark: BENCHMARKS.roas.bad,
        recommendation: 'Revise a segmentação de público e criativos para melhorar o retorno',
        timestamp,
      })
    }
  }

  // CPA Analysis
  if (totals.avgCpa > 0) {
    if (totals.avgCpa <= BENCHMARKS.cpa.good) {
      insights.push({
        id: `cpa-achievement-${Date.now()}`,
        type: 'achievement',
        severity: 'low',
        title: 'CPA Eficiente',
        description: `CPA de R$${totals.avgCpa.toFixed(2)} está abaixo do benchmark de R$${BENCHMARKS.cpa.good}`,
        metric: 'avgCpa',
        value: totals.avgCpa,
        benchmark: BENCHMARKS.cpa.good,
        timestamp,
      })
    } else if (totals.avgCpa > BENCHMARKS.cpa.bad) {
      insights.push({
        id: `cpa-warning-${Date.now()}`,
        type: 'warning',
        severity: 'critical',
        title: 'CPA Muito Alto',
        description: `CPA de R$${totals.avgCpa.toFixed(2)} está acima do limite de R$${BENCHMARKS.cpa.bad}`,
        metric: 'avgCpa',
        value: totals.avgCpa,
        benchmark: BENCHMARKS.cpa.bad,
        recommendation: 'Considere pausar anúncios com baixa performance ou ajustar lances',
        timestamp,
      })
    }
  }

  // CTR Analysis
  if (totals.avgCtr > 0) {
    if (totals.avgCtr >= BENCHMARKS.ctr.good) {
      insights.push({
        id: `ctr-achievement-${Date.now()}`,
        type: 'achievement',
        severity: 'low',
        title: 'CTR Acima da Média',
        description: `CTR de ${(totals.avgCtr).toFixed(2)}% indica criativos atrativos`,
        metric: 'avgCtr',
        value: totals.avgCtr,
        benchmark: BENCHMARKS.ctr.good,
        timestamp,
      })
    } else if (totals.avgCtr < BENCHMARKS.ctr.bad) {
      insights.push({
        id: `ctr-opportunity-${Date.now()}`,
        type: 'opportunity',
        severity: 'medium',
        title: 'Oportunidade de Melhoria no CTR',
        description: `CTR de ${(totals.avgCtr).toFixed(2)}% pode ser otimizado`,
        metric: 'avgCtr',
        value: totals.avgCtr,
        benchmark: BENCHMARKS.ctr.bad,
        recommendation: 'Teste novos criativos e headlines para aumentar engajamento',
        timestamp,
      })
    }
  }

  // Frequency Analysis (saturation detection)
  if (totals.avgFrequency > BENCHMARKS.frequency.bad) {
    insights.push({
      id: `frequency-warning-${Date.now()}`,
      type: 'warning',
      severity: 'high',
      title: 'Saturação de Audiência',
      description: `Frequência de ${totals.avgFrequency.toFixed(1)}x indica que o público está saturado`,
      metric: 'avgFrequency',
      value: totals.avgFrequency,
      benchmark: BENCHMARKS.frequency.bad,
      recommendation: 'Expanda o público-alvo ou pause a campanha para evitar fadiga',
      timestamp,
    })
  }

  // Trend Analysis (comparison with previous period)
  if (previousTotals) {
    // ROAS trend
    if (previousTotals.avgRoas > 0 && totals.avgRoas > 0) {
      const roasChange = ((totals.avgRoas - previousTotals.avgRoas) / previousTotals.avgRoas) * 100
      if (roasChange > 20) {
        insights.push({
          id: `roas-trend-up-${Date.now()}`,
          type: 'trend',
          severity: 'low',
          title: 'ROAS em Alta',
          description: `ROAS aumentou ${roasChange.toFixed(1)}% em relação ao período anterior`,
          metric: 'avgRoas',
          value: totals.avgRoas,
          change: roasChange,
          timestamp,
        })
      } else if (roasChange < -20) {
        insights.push({
          id: `roas-trend-down-${Date.now()}`,
          type: 'trend',
          severity: 'high',
          title: 'ROAS em Queda',
          description: `ROAS diminuiu ${Math.abs(roasChange).toFixed(1)}% em relação ao período anterior`,
          metric: 'avgRoas',
          value: totals.avgRoas,
          change: roasChange,
          recommendation: 'Investigue mudanças recentes nas campanhas ou no mercado',
          timestamp,
        })
      }
    }

    // CPA trend
    if (previousTotals.avgCpa > 0 && totals.avgCpa > 0) {
      const cpaChange = ((totals.avgCpa - previousTotals.avgCpa) / previousTotals.avgCpa) * 100
      if (cpaChange < -15) {
        insights.push({
          id: `cpa-trend-down-${Date.now()}`,
          type: 'trend',
          severity: 'low',
          title: 'CPA Melhorando',
          description: `CPA reduziu ${Math.abs(cpaChange).toFixed(1)}% - eficiência está aumentando`,
          metric: 'avgCpa',
          value: totals.avgCpa,
          change: cpaChange,
          timestamp,
        })
      } else if (cpaChange > 30) {
        insights.push({
          id: `cpa-trend-up-${Date.now()}`,
          type: 'trend',
          severity: 'critical',
          title: 'CPA Subindo Rapidamente',
          description: `CPA aumentou ${cpaChange.toFixed(1)}% - ação imediata recomendada`,
          metric: 'avgCpa',
          value: totals.avgCpa,
          change: cpaChange,
          recommendation: 'Revise lances, segmentação e criativos urgentemente',
          timestamp,
        })
      }
    }

    // Investment efficiency
    if (previousTotals.totalSpent > 0 && totals.totalSpent > 0) {
      const spendChange = ((totals.totalSpent - previousTotals.totalSpent) / previousTotals.totalSpent) * 100
      const purchaseChange = previousTotals.totalPurchases > 0
        ? ((totals.totalPurchases - previousTotals.totalPurchases) / previousTotals.totalPurchases) * 100
        : 0

      if (spendChange > 20 && purchaseChange < 10) {
        insights.push({
          id: `efficiency-warning-${Date.now()}`,
          type: 'anomaly',
          severity: 'high',
          title: 'Eficiência em Queda',
          description: `Investimento aumentou ${spendChange.toFixed(1)}% mas conversões cresceram apenas ${purchaseChange.toFixed(1)}%`,
          metric: 'efficiency',
          value: purchaseChange - spendChange,
          recommendation: 'Revise a alocação de orçamento entre campanhas',
          timestamp,
        })
      }
    }
  }

  // Sort by severity (critical first)
  const severityOrder: Record<InsightSeverity, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  }

  return insights.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])
}

/**
 * Detects anomalies in time series data
 */
export function detectAnomalies(data: MetaAdsData[]): Insight[] {
  if (data.length < 3) return []

  const insights: Insight[] = []
  const timestamp = new Date()

  // Calculate statistics for each metric
  const metrics: (keyof MetaAdsData)[] = ['amountSpent', 'purchases', 'cpa', 'cpc']

  for (const metric of metrics) {
    const values = data.map(d => d[metric] as number).filter(v => typeof v === 'number' && !isNaN(v))
    if (values.length < 3) continue

    const mean = values.reduce((a, b) => a + b, 0) / values.length
    const stdDev = Math.sqrt(values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length)

    // Check for outliers (values > 2 standard deviations from mean)
    const threshold = 2

    for (let i = 0; i < data.length; i++) {
      const value = data[i][metric] as number
      if (typeof value !== 'number' || isNaN(value)) continue

      const zScore = Math.abs((value - mean) / stdDev)
      if (zScore > threshold) {
        insights.push({
          id: `anomaly-${metric}-${data[i].day}-${Date.now()}`,
          type: 'anomaly',
          severity: zScore > 3 ? 'critical' : 'high',
          title: `Valor Atípico em ${getMetricLabel(metric)}`,
          description: `Valor de ${formatMetricValue(metric, value)} em ${data[i].day} está ${zScore.toFixed(1)} desvios padrão da média`,
          metric,
          value,
          benchmark: mean,
          timestamp,
        })
      }
    }
  }

  return insights
}

function getMetricLabel(metric: string): string {
  const labels: Record<string, string> = {
    amountSpent: 'Investimento',
    purchases: 'Compras',
    cpa: 'CPA',
    cpc: 'CPC',
    cpm: 'CPM',
    ctrLink: 'CTR',
    txConv: 'Taxa de Conversão',
  }
  return labels[metric] || metric
}

function formatMetricValue(metric: string, value: number): string {
  if (metric.includes('cpa') || metric.includes('cpc') || metric.includes('cpm') || metric.includes('Spent')) {
    return `R$${value.toFixed(2)}`
  }
  if (metric.includes('ctr') || metric.includes('Conv') || metric.includes('Rate')) {
    return `${(value * 100).toFixed(2)}%`
  }
  return value.toLocaleString('pt-BR')
}

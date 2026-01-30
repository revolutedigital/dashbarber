'use strict'

import type { FunnelTotals } from '@/types/metrics'

export type AlertSeverity = 'info' | 'warning' | 'critical'
export type AlertCategory = 'performance' | 'budget' | 'saturation' | 'anomaly' | 'opportunity'

export interface Alert {
  id: string
  severity: AlertSeverity
  category: AlertCategory
  title: string
  message: string
  metric?: string
  currentValue?: number
  threshold?: number
  action?: string
  timestamp: Date
}

export interface AlertRule {
  id: string
  name: string
  enabled: boolean
  metric: keyof FunnelTotals | 'custom'
  condition: 'above' | 'below' | 'change'
  threshold: number
  changePercent?: number // For 'change' condition
  severity: AlertSeverity
  category: AlertCategory
  message: string
  action?: string
}

// Default alert rules
const DEFAULT_RULES: AlertRule[] = [
  {
    id: 'high-cpa',
    name: 'CPA Alto',
    enabled: true,
    metric: 'avgCpa',
    condition: 'above',
    threshold: 150,
    severity: 'critical',
    category: 'performance',
    message: 'CPA está muito acima do esperado',
    action: 'Revise os anúncios com baixa performance ou ajuste a segmentação',
  },
  {
    id: 'low-roas',
    name: 'ROAS Baixo',
    enabled: true,
    metric: 'avgRoas',
    condition: 'below',
    threshold: 1.5,
    severity: 'critical',
    category: 'performance',
    message: 'ROAS está abaixo do ponto de equilíbrio',
    action: 'Analise os produtos/ofertas e considere pausar campanhas não rentáveis',
  },
  {
    id: 'high-frequency',
    name: 'Saturação de Audiência',
    enabled: true,
    metric: 'avgFrequency',
    condition: 'above',
    threshold: 6,
    severity: 'warning',
    category: 'saturation',
    message: 'Frequência alta indica que o público está saturado',
    action: 'Expanda o público-alvo ou pause a campanha para evitar fadiga',
  },
  {
    id: 'low-ctr',
    name: 'CTR Baixo',
    enabled: true,
    metric: 'avgCtr',
    condition: 'below',
    threshold: 0.8,
    severity: 'warning',
    category: 'performance',
    message: 'Taxa de cliques está abaixo da média',
    action: 'Teste novos criativos e headlines para aumentar engajamento',
  },
  {
    id: 'high-cpm',
    name: 'CPM Elevado',
    enabled: true,
    metric: 'avgCpm',
    condition: 'above',
    threshold: 30,
    severity: 'warning',
    category: 'budget',
    message: 'CPM está alto - pode impactar a eficiência do investimento',
    action: 'Considere ajustar segmentação ou testar novos públicos',
  },
  {
    id: 'low-conversion-rate',
    name: 'Taxa de Conversão Baixa',
    enabled: true,
    metric: 'avgTxConv',
    condition: 'below',
    threshold: 1,
    severity: 'warning',
    category: 'performance',
    message: 'Taxa de conversão está abaixo do esperado',
    action: 'Revise a landing page e a jornada de conversão',
  },
]

/**
 * Checks funnel totals against alert rules and returns triggered alerts
 */
export function checkAlerts(
  totals: FunnelTotals,
  previousTotals?: FunnelTotals | null,
  customRules?: AlertRule[]
): Alert[] {
  const rules = customRules || DEFAULT_RULES
  const alerts: Alert[] = []
  const timestamp = new Date()

  for (const rule of rules) {
    if (!rule.enabled) continue

    const metricKey = rule.metric as keyof FunnelTotals
    const value = totals[metricKey]
    if (typeof value !== 'number' || isNaN(value)) continue

    let triggered = false

    switch (rule.condition) {
      case 'above':
        triggered = value > rule.threshold
        break
      case 'below':
        triggered = value < rule.threshold
        break
      case 'change':
        if (previousTotals && rule.changePercent !== undefined) {
          const prevValue = previousTotals[rule.metric as keyof FunnelTotals]
          if (typeof prevValue === 'number' && prevValue !== 0) {
            const change = Math.abs((value - prevValue) / prevValue * 100)
            triggered = change > rule.changePercent
          }
        }
        break
    }

    if (triggered) {
      alerts.push({
        id: `${rule.id}-${Date.now()}`,
        severity: rule.severity,
        category: rule.category,
        title: rule.name,
        message: rule.message,
        metric: String(rule.metric),
        currentValue: value,
        threshold: rule.threshold,
        action: rule.action,
        timestamp,
      })
    }
  }

  // Sort by severity (critical first)
  const severityOrder: Record<AlertSeverity, number> = {
    critical: 0,
    warning: 1,
    info: 2,
  }

  return alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])
}

/**
 * Gets color classes for alert severity
 */
export function getAlertColors(severity: AlertSeverity): {
  bg: string
  text: string
  border: string
  icon: string
} {
  switch (severity) {
    case 'critical':
      return {
        bg: 'bg-red-500/10',
        text: 'text-red-500',
        border: 'border-red-500/30',
        icon: 'text-red-500',
      }
    case 'warning':
      return {
        bg: 'bg-amber-500/10',
        text: 'text-amber-500',
        border: 'border-amber-500/30',
        icon: 'text-amber-500',
      }
    case 'info':
      return {
        bg: 'bg-blue-500/10',
        text: 'text-blue-500',
        border: 'border-blue-500/30',
        icon: 'text-blue-500',
      }
  }
}

/**
 * Gets icon name for alert category
 */
export function getAlertIcon(category: AlertCategory): string {
  switch (category) {
    case 'performance':
      return 'activity'
    case 'budget':
      return 'dollar-sign'
    case 'saturation':
      return 'users'
    case 'anomaly':
      return 'alert-triangle'
    case 'opportunity':
      return 'trending-up'
  }
}

/**
 * Formats alert for display
 */
export function formatAlertValue(metric: string | undefined, value: number | undefined): string {
  if (value === undefined || metric === undefined) return ''

  if (metric.includes('Cpa') || metric.includes('Cpc') || metric.includes('Cpm') || metric.includes('Spent')) {
    return `R$ ${value.toFixed(2)}`
  }
  if (metric.includes('Roas')) {
    return `${value.toFixed(2)}x`
  }
  if (metric.includes('Ctr') || metric.includes('Conv') || metric.includes('Rate')) {
    return `${value.toFixed(2)}%`
  }
  if (metric.includes('Frequency')) {
    return `${value.toFixed(1)}x`
  }

  return value.toLocaleString('pt-BR')
}

/**
 * Storage key for alert rules
 */
const STORAGE_KEY = 'dashbarber_alert_rules'

/**
 * Saves custom alert rules to localStorage
 */
export function saveAlertRules(rules: AlertRule[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rules))
  } catch (error) {
    console.warn('Failed to save alert rules:', error)
  }
}

/**
 * Loads alert rules from localStorage or returns defaults
 */
export function loadAlertRules(): AlertRule[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.warn('Failed to load alert rules:', error)
  }
  return DEFAULT_RULES
}

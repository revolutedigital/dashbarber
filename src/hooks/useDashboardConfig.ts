'use client'

import { useState, useEffect, useCallback } from 'react'
import { CustomMetric, Goal, DashboardConfig, FunnelTotals } from '@/types/metrics'
import { safeEvaluate, EvalScope } from '@/lib/safe-eval'
import { DashboardConfigSchema, CONFIG_VERSION } from '@/lib/schemas'
import { ESSENTIAL_METRICS } from '@/lib/predefined-metrics'

const STORAGE_KEY = 'dashboard_config_v3' // Bumped version for new defaults

// ============================================
// VERSIONED CONFIG WITH MIGRATION
// ============================================

interface VersionedConfig extends DashboardConfig {
  version: number
}

const defaultConfig: VersionedConfig = {
  version: CONFIG_VERSION,
  customMetrics: ESSENTIAL_METRICS,
  goals: [],
}

/**
 * Simple XOR-based obfuscation for localStorage
 * Note: This is NOT encryption, just obfuscation to prevent casual inspection
 * For true security, use server-side storage with proper auth
 */
function obfuscate(data: string): string {
  const key = 'dashbarber_2026'
  let result = ''
  for (let i = 0; i < data.length; i++) {
    result += String.fromCharCode(data.charCodeAt(i) ^ key.charCodeAt(i % key.length))
  }
  return btoa(result) // Base64 encode
}

function deobfuscate(data: string): string {
  const key = 'dashbarber_2026'
  try {
    const decoded = atob(data) // Base64 decode
    let result = ''
    for (let i = 0; i < decoded.length; i++) {
      result += String.fromCharCode(decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length))
    }
    return result
  } catch {
    return ''
  }
}

/**
 * Migrates old config versions to current version
 */
function migrateConfig(config: unknown): VersionedConfig {
  // Type guard
  if (!config || typeof config !== 'object') {
    return defaultConfig
  }

  const rawConfig = config as Record<string, unknown>

  // Check version
  const version = typeof rawConfig.version === 'number' ? rawConfig.version : 1

  // Already current version
  if (version >= CONFIG_VERSION) {
    // Validate with schema
    const result = DashboardConfigSchema.safeParse(config)
    if (result.success) {
      const validConfig = result.data as VersionedConfig
      // Se não tem métricas customizadas, adiciona as pré-definidas
      if (validConfig.customMetrics.length === 0) {
        validConfig.customMetrics = ESSENTIAL_METRICS
      }
      return validConfig
    }
    console.warn('Config validation failed, using defaults')
    return defaultConfig
  }

  // Migration from v1/v2 to v3 (with predefined metrics)
  if (version === 1 || version === 2) {
    console.info(`Migrating config from v${version} to v3`)
    const existingMetrics = Array.isArray(rawConfig.customMetrics) ? rawConfig.customMetrics as CustomMetric[] : []

    // Combina métricas existentes com as pré-definidas (evitando duplicatas)
    const existingIds = new Set(existingMetrics.map(m => m.id))
    const newMetrics = ESSENTIAL_METRICS.filter(m => !existingIds.has(m.id))

    return {
      version: CONFIG_VERSION,
      customMetrics: [...newMetrics, ...existingMetrics],
      goals: Array.isArray(rawConfig.goals) ? rawConfig.goals as Goal[] : [],
    }
  }

  return defaultConfig
}

/**
 * Loads config from localStorage with validation and migration
 */
function getInitialConfig(): VersionedConfig {
  if (typeof window === 'undefined') {
    return defaultConfig
  }

  try {
    // Try new storage key first (obfuscated)
    let saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const deobfuscated = deobfuscate(saved)
      if (deobfuscated) {
        const parsed = JSON.parse(deobfuscated)
        return migrateConfig(parsed)
      }
    }

    // Fallback: try legacy key (plain JSON)
    const legacyKey = 'dashboard_config'
    saved = localStorage.getItem(legacyKey)
    if (saved) {
      const parsed = JSON.parse(saved)
      const migrated = migrateConfig(parsed)
      // Remove legacy key after migration
      localStorage.removeItem(legacyKey)
      return migrated
    }
  } catch (error) {
    console.error('Error loading config:', error)
  }

  return defaultConfig
}

/**
 * Saves config to localStorage with obfuscation
 */
function saveConfig(config: VersionedConfig): void {
  if (typeof window === 'undefined') return

  try {
    const serialized = JSON.stringify(config)
    const obfuscated = obfuscate(serialized)
    localStorage.setItem(STORAGE_KEY, obfuscated)
  } catch (error) {
    console.error('Error saving config:', error)
  }
}

// ============================================
// MAIN HOOK
// ============================================

export function useDashboardConfig() {
  // Usa lazy initialization - config e carregado do localStorage na primeira renderizacao
  const [config, setConfig] = useState<VersionedConfig>(getInitialConfig)
  // isLoaded sempre true no cliente porque usamos lazy init
  const isLoaded = typeof window !== 'undefined'

  // Salva no localStorage quando config muda (com debounce implicit via useEffect)
  useEffect(() => {
    saveConfig(config)
  }, [config])

  // Adiciona metrica customizada
  const addCustomMetric = useCallback((metric: Omit<CustomMetric, 'id'>) => {
    const newMetric: CustomMetric = {
      ...metric,
      id: `custom_${Date.now()}`,
    }
    setConfig(prev => ({
      ...prev,
      customMetrics: [...prev.customMetrics, newMetric],
    }))
    return newMetric
  }, [])

  // Remove metrica customizada
  const removeCustomMetric = useCallback((id: string) => {
    setConfig(prev => ({
      ...prev,
      customMetrics: prev.customMetrics.filter(m => m.id !== id),
      // Remove metas associadas
      goals: prev.goals.filter(g => g.metricKey !== id),
    }))
  }, [])

  // Adiciona meta
  const addGoal = useCallback((goal: Omit<Goal, 'id'>) => {
    const newGoal: Goal = {
      ...goal,
      id: `goal_${Date.now()}`,
    }
    setConfig(prev => ({
      ...prev,
      goals: [...prev.goals, newGoal],
    }))
    return newGoal
  }, [])

  // Remove meta
  const removeGoal = useCallback((id: string) => {
    setConfig(prev => ({
      ...prev,
      goals: prev.goals.filter(g => g.id !== id),
    }))
  }, [])

  // Atualiza meta
  const updateGoal = useCallback((id: string, updates: Partial<Goal>) => {
    setConfig(prev => ({
      ...prev,
      goals: prev.goals.map(g => g.id === id ? { ...g, ...updates } : g),
    }))
  }, [])

  // Calcula valor de uma metrica customizada usando avaliador seguro
  const calculateCustomMetric = useCallback((formula: string, totals: FunnelTotals): number => {
    // Converte FunnelTotals para EvalScope (objeto com valores numericos)
    const scope: EvalScope = {}
    Object.keys(totals).forEach(key => {
      scope[key] = totals[key as keyof FunnelTotals] || 0
    })

    // Usa avaliador seguro (mathjs) em vez de new Function()
    return safeEvaluate(formula, scope)
  }, [])

  // Calcula progresso de uma meta
  const calculateGoalProgress = useCallback((goal: Goal, currentValue: number): number => {
    if (goal.targetValue === 0) return 0

    // Handle NaN and Infinity
    if (!Number.isFinite(currentValue)) return 0

    if (goal.targetType === 'max') {
      // Quanto maior, melhor (ex: vendas)
      return Math.min((currentValue / goal.targetValue) * 100, 100)
    } else {
      // Quanto menor, melhor (ex: CPA)
      if (currentValue <= goal.targetValue) return 100
      return Math.max(0, (goal.targetValue / currentValue) * 100)
    }
  }, [])

  // Clear all data (for "right to be forgotten")
  const clearAllData = useCallback(() => {
    setConfig(defaultConfig)
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem('dashboard_config') // Legacy key
    }
  }, [])

  // Export config (for data portability)
  const exportConfig = useCallback((): string => {
    return JSON.stringify({
      ...config,
      exportedAt: new Date().toISOString(),
    }, null, 2)
  }, [config])

  return {
    config,
    isLoaded,
    addCustomMetric,
    removeCustomMetric,
    addGoal,
    removeGoal,
    updateGoal,
    calculateCustomMetric,
    calculateGoalProgress,
    clearAllData,
    exportConfig,
  }
}

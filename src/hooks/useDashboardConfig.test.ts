import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useDashboardConfig } from './useDashboardConfig'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    }),
    get length() {
      return Object.keys(store).length
    },
    key: vi.fn((i: number) => Object.keys(store)[i] || null),
  }
})()

Object.defineProperty(window, 'localStorage', { value: localStorageMock })

describe('useDashboardConfig', () => {
  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('should return default config when localStorage is empty', () => {
      const { result } = renderHook(() => useDashboardConfig())

      expect(result.current.config).toBeDefined()
      expect(result.current.config.customMetrics).toBeDefined()
      expect(result.current.isLoaded).toBe(true)
    })

    it('should have predefined essential metrics by default', () => {
      const { result } = renderHook(() => useDashboardConfig())

      // Should have some default metrics
      expect(result.current.config.customMetrics.length).toBeGreaterThan(0)
    })

    it('should have empty goals by default', () => {
      const { result } = renderHook(() => useDashboardConfig())

      expect(result.current.config.goals).toEqual([])
    })
  })

  describe('addCustomMetric', () => {
    it('should add a new custom metric', () => {
      const { result } = renderHook(() => useDashboardConfig())

      const initialCount = result.current.config.customMetrics.length

      act(() => {
        result.current.addCustomMetric({
          name: 'Test Metric',
          formula: 'totalSpent + totalRevenue',
          format: 'currency',
          description: 'Test description',
        })
      })

      expect(result.current.config.customMetrics.length).toBe(initialCount + 1)
    })

    it('should generate id starting with custom_ prefix', () => {
      const { result } = renderHook(() => useDashboardConfig())

      let newMetric: ReturnType<typeof result.current.addCustomMetric>

      act(() => {
        newMetric = result.current.addCustomMetric({
          name: 'Metric 1',
          formula: 'a + b',
          format: 'number',
        })
      })

      expect(newMetric!.id).toMatch(/^custom_\d+$/)
    })

    it('should return the created metric', () => {
      const { result } = renderHook(() => useDashboardConfig())

      let newMetric: ReturnType<typeof result.current.addCustomMetric>

      act(() => {
        newMetric = result.current.addCustomMetric({
          name: 'My Metric',
          formula: 'totalSpent * 2',
          format: 'currency',
        })
      })

      expect(newMetric!.id).toContain('custom_')
      expect(newMetric!.name).toBe('My Metric')
    })
  })

  describe('removeCustomMetric', () => {
    it('should remove a custom metric by id', () => {
      const { result } = renderHook(() => useDashboardConfig())

      let newMetric: ReturnType<typeof result.current.addCustomMetric>

      act(() => {
        newMetric = result.current.addCustomMetric({
          name: 'To Remove',
          formula: 'a',
          format: 'number',
        })
      })

      const countAfterAdd = result.current.config.customMetrics.length

      act(() => {
        result.current.removeCustomMetric(newMetric!.id)
      })

      expect(result.current.config.customMetrics.length).toBe(countAfterAdd - 1)
      expect(result.current.config.customMetrics.find(m => m.id === newMetric!.id)).toBeUndefined()
    })

    it('should also remove associated goals when removing a metric', () => {
      const { result } = renderHook(() => useDashboardConfig())

      let metric: ReturnType<typeof result.current.addCustomMetric>

      act(() => {
        metric = result.current.addCustomMetric({
          name: 'Metric with Goal',
          formula: 'a',
          format: 'number',
        })
      })

      act(() => {
        result.current.addGoal({
          metricKey: metric!.id,
          metricName: 'Metric with Goal',
          targetValue: 100,
          targetType: 'max',
        })
      })

      expect(result.current.config.goals.length).toBe(1)

      act(() => {
        result.current.removeCustomMetric(metric!.id)
      })

      expect(result.current.config.goals.length).toBe(0)
    })
  })

  describe('addGoal', () => {
    it('should add a new goal', () => {
      const { result } = renderHook(() => useDashboardConfig())

      act(() => {
        result.current.addGoal({
          metricKey: 'totalSpent',
          metricName: 'Total Investido',
          targetValue: 1000,
          targetType: 'max',
        })
      })

      expect(result.current.config.goals.length).toBe(1)
      expect(result.current.config.goals[0].targetValue).toBe(1000)
    })

    it('should generate id starting with goal_ prefix', () => {
      const { result } = renderHook(() => useDashboardConfig())

      let goal: ReturnType<typeof result.current.addGoal>

      act(() => {
        goal = result.current.addGoal({
          metricKey: 'a',
          metricName: 'Test Metric',
          targetValue: 100,
          targetType: 'max',
        })
      })

      expect(goal!.id).toMatch(/^goal_\d+$/)
    })
  })

  describe('removeGoal', () => {
    it('should remove a goal by id', () => {
      const { result } = renderHook(() => useDashboardConfig())

      let goal: ReturnType<typeof result.current.addGoal>

      act(() => {
        goal = result.current.addGoal({
          metricKey: 'test',
          metricName: 'Test Goal',
          targetValue: 50,
          targetType: 'min',
        })
      })

      expect(result.current.config.goals.length).toBe(1)

      act(() => {
        result.current.removeGoal(goal!.id)
      })

      expect(result.current.config.goals.length).toBe(0)
    })
  })

  describe('updateGoal', () => {
    it('should update a goal', () => {
      const { result } = renderHook(() => useDashboardConfig())

      let goal: ReturnType<typeof result.current.addGoal>

      act(() => {
        goal = result.current.addGoal({
          metricKey: 'test',
          metricName: 'Test Goal',
          targetValue: 100,
          targetType: 'max',
        })
      })

      act(() => {
        result.current.updateGoal(goal!.id, { targetValue: 200 })
      })

      const updatedGoal = result.current.config.goals.find(g => g.id === goal!.id)
      expect(updatedGoal?.targetValue).toBe(200)
    })

    it('should preserve other goal properties when updating', () => {
      const { result } = renderHook(() => useDashboardConfig())

      let goal: ReturnType<typeof result.current.addGoal>

      act(() => {
        goal = result.current.addGoal({
          metricKey: 'test',
          metricName: 'Test Goal',
          targetValue: 100,
          targetType: 'max',
        })
      })

      act(() => {
        result.current.updateGoal(goal!.id, { targetValue: 200 })
      })

      const updatedGoal = result.current.config.goals.find(g => g.id === goal!.id)
      expect(updatedGoal?.metricKey).toBe('test')
      expect(updatedGoal?.targetType).toBe('max')
    })
  })

  describe('calculateCustomMetric', () => {
    it('should calculate metric using formula', () => {
      const { result } = renderHook(() => useDashboardConfig())

      const totals = {
        totalSpent: 1000,
        totalRevenue: 3000,
        totalPurchases: 30,
        totalImpressions: 100000,
        totalClicks: 500,
        totalLinkClicks: 300,
        totalReach: 50000,
        totalLeads: 50,
        totalAddToCart: 40,
        totalInitiateCheckout: 35,
        totalLandingPageViews: 250,
        totalVideoViews3s: 10000,
        totalVideoThruPlays: 5000,
        avgCpm: 10,
        avgCtr: 0.3,
        avgCpa: 33.33,
        avgCpc: 2,
        avgTxConv: 10,
        avgRoas: 3,
        avgCpl: 20,
        avgFrequency: 2,
        avgHookRate: 10,
        avgHoldRate: 50,
        avgLpViewRate: 83.33,
      }

      const value = result.current.calculateCustomMetric('totalRevenue / totalSpent', totals)
      expect(value).toBe(3) // ROAS
    })

    it('should return 0 for invalid formula', () => {
      const { result } = renderHook(() => useDashboardConfig())

      const totals = {
        totalSpent: 1000,
        totalRevenue: 3000,
      } as any

      const value = result.current.calculateCustomMetric('invalid formula!!!', totals)
      expect(value).toBe(0)
    })
  })

  describe('calculateGoalProgress', () => {
    it('should calculate progress for max type goal', () => {
      const { result } = renderHook(() => useDashboardConfig())

      const goal = {
        id: 'test',
        metricKey: 'test',
        metricName: 'Test Goal',
        targetValue: 100,
        targetType: 'max' as const,
      }

      const progress = result.current.calculateGoalProgress(goal, 75)
      expect(progress).toBe(75)
    })

    it('should cap progress at 100% for max type', () => {
      const { result } = renderHook(() => useDashboardConfig())

      const goal = {
        id: 'test',
        metricKey: 'test',
        metricName: 'Test Goal',
        targetValue: 100,
        targetType: 'max' as const,
      }

      const progress = result.current.calculateGoalProgress(goal, 150)
      expect(progress).toBe(100)
    })

    it('should calculate progress for min type goal (below target = 100%)', () => {
      const { result } = renderHook(() => useDashboardConfig())

      const goal = {
        id: 'test',
        metricKey: 'test',
        metricName: 'Test Goal',
        targetValue: 50,
        targetType: 'min' as const,
      }

      const progress = result.current.calculateGoalProgress(goal, 30)
      expect(progress).toBe(100) // Below target is 100%
    })

    it('should calculate progress for min type goal (above target)', () => {
      const { result } = renderHook(() => useDashboardConfig())

      const goal = {
        id: 'test',
        metricKey: 'test',
        metricName: 'Test Goal',
        targetValue: 50,
        targetType: 'min' as const,
      }

      const progress = result.current.calculateGoalProgress(goal, 100)
      expect(progress).toBe(50) // 50/100 * 100 = 50%
    })

    it('should handle zero target value', () => {
      const { result } = renderHook(() => useDashboardConfig())

      const goal = {
        id: 'test',
        metricKey: 'test',
        metricName: 'Test Goal',
        targetValue: 0,
        targetType: 'max' as const,
      }

      const progress = result.current.calculateGoalProgress(goal, 100)
      expect(progress).toBe(0)
    })

    it('should handle NaN current value', () => {
      const { result } = renderHook(() => useDashboardConfig())

      const goal = {
        id: 'test',
        metricKey: 'test',
        metricName: 'Test Goal',
        targetValue: 100,
        targetType: 'max' as const,
      }

      const progress = result.current.calculateGoalProgress(goal, NaN)
      expect(progress).toBe(0)
    })

    it('should handle Infinity current value', () => {
      const { result } = renderHook(() => useDashboardConfig())

      const goal = {
        id: 'test',
        metricKey: 'test',
        metricName: 'Test Goal',
        targetValue: 100,
        targetType: 'max' as const,
      }

      const progress = result.current.calculateGoalProgress(goal, Infinity)
      expect(progress).toBe(0)
    })
  })

  describe('clearAllData', () => {
    it('should reset config to defaults', () => {
      const { result } = renderHook(() => useDashboardConfig())

      act(() => {
        result.current.addGoal({
          metricKey: 'test',
          metricName: 'Test Goal',
          targetValue: 100,
          targetType: 'max',
        })
      })

      expect(result.current.config.goals.length).toBe(1)

      act(() => {
        result.current.clearAllData()
      })

      expect(result.current.config.goals.length).toBe(0)
    })

    it('should clear localStorage', () => {
      const { result } = renderHook(() => useDashboardConfig())

      act(() => {
        result.current.addGoal({
          metricKey: 'test',
          metricName: 'Test Goal',
          targetValue: 100,
          targetType: 'max',
        })
      })

      act(() => {
        result.current.clearAllData()
      })

      expect(localStorageMock.removeItem).toHaveBeenCalled()
    })
  })

  describe('exportConfig', () => {
    it('should export config as JSON string', () => {
      const { result } = renderHook(() => useDashboardConfig())

      const exported = result.current.exportConfig()
      const parsed = JSON.parse(exported)

      expect(parsed).toHaveProperty('customMetrics')
      expect(parsed).toHaveProperty('goals')
      expect(parsed).toHaveProperty('exportedAt')
    })

    it('should include timestamp in export', () => {
      const { result } = renderHook(() => useDashboardConfig())

      const exported = result.current.exportConfig()
      const parsed = JSON.parse(exported)

      expect(parsed.exportedAt).toMatch(/\d{4}-\d{2}-\d{2}/)
    })
  })

  describe('localStorage persistence', () => {
    it('should save config to localStorage on change', async () => {
      const { result } = renderHook(() => useDashboardConfig())

      act(() => {
        result.current.addGoal({
          metricKey: 'test',
          metricName: 'Test Goal',
          targetValue: 100,
          targetType: 'max',
        })
      })

      // Wait for useEffect to run
      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalled()
      })
    })
  })
})

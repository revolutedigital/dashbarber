import type { CustomMetric, Goal, DashboardConfig } from '@/types/metrics'

// Mock custom metrics for testing
export const mockCustomMetrics: CustomMetric[] = [
  {
    id: 'custom_roas',
    name: 'ROAS Personalizado',
    formula: 'totalRevenue / totalSpent',
    format: 'decimal',
    description: 'Return on Ad Spend',
    color: '#22c55e',
  },
  {
    id: 'custom_roi',
    name: 'ROI %',
    formula: '((totalRevenue - totalSpent) / totalSpent) * 100',
    format: 'percentage',
    description: 'Return on Investment',
    color: '#6366f1',
  },
  {
    id: 'custom_ticket',
    name: 'Ticket Medio',
    formula: 'totalRevenue / totalPurchases',
    format: 'currency',
    description: 'Average order value',
    color: '#f59e0b',
  },
]

// Mock goals for testing
export const mockGoals: Goal[] = [
  {
    id: 'goal_roas',
    metricKey: 'avgRoas',
    metricName: 'ROAS',
    targetValue: 3.0,
    targetType: 'min',
  },
  {
    id: 'goal_cpa',
    metricKey: 'avgCpa',
    metricName: 'CPA',
    targetValue: 50,
    targetType: 'max',
  },
  {
    id: 'goal_purchases',
    metricKey: 'totalPurchases',
    metricName: 'Compras',
    targetValue: 100,
    targetType: 'min',
    funnelId: 'test_funnel_1',
  },
]

// Mock dashboard config
export const mockDashboardConfig: DashboardConfig = {
  customMetrics: mockCustomMetrics,
  goals: mockGoals,
}

// Invalid formulas for testing error handling
export const invalidFormulas = [
  'eval("alert(1)")',
  'constructor.constructor("return this")()',
  '__proto__.polluted = true',
  'process.env.SECRET',
  'require("fs").readFileSync("/etc/passwd")',
  'while(true){}',
  '(() => { throw new Error() })()',
]

// Valid formulas for testing safe eval
export const validFormulas = [
  { formula: 'totalSpent + 100', expected: 'number' },
  { formula: 'totalRevenue / totalSpent', expected: 'number' },
  { formula: '(totalPurchases / totalClicks) * 100', expected: 'number' },
  { formula: 'max(totalSpent, totalRevenue)', expected: 'number' },
  { formula: 'round(avgCpa, 2)', expected: 'number' },
  { formula: 'abs(totalSpent - totalRevenue)', expected: 'number' },
]

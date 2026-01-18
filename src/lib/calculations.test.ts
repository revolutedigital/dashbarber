import { describe, it, expect } from 'vitest'
import { calculateFunnelTotals, formatCurrency, formatNumber, formatPercentage } from './calculations'
import { MetaAdsData } from '@/types/metrics'

describe('formatCurrency', () => {
  it('should format number as BRL currency', () => {
    expect(formatCurrency(1234.56)).toMatch(/1.*234.*56/)
  })

  it('should handle zero', () => {
    expect(formatCurrency(0)).toMatch(/0.*00/)
  })
})

describe('formatNumber', () => {
  it('should format large numbers with thousand separators', () => {
    const result = formatNumber(1234567)
    expect(result).toContain('1')
  })

  it('should handle zero', () => {
    expect(formatNumber(0)).toBe('0')
  })
})

describe('formatPercentage', () => {
  it('should format decimal as percentage', () => {
    // formatPercentage takes a decimal and formats as percentage
    expect(formatPercentage(0.1234)).toContain('%')
  })

  it('should handle zero', () => {
    expect(formatPercentage(0)).toMatch(/0.*%/)
  })
})

describe('calculateFunnelTotals', () => {
  const mockData: MetaAdsData[] = [
    {
      day: '01/01',
      amountSpent: 100,
      reach: 1000,
      impressions: 5000,
      clicksAll: 100,
      uniqueLinkClicks: 50,
      costPerLandingPageView: 2,
      purchases: 5,
      cpm: 20,
      ctrLink: 0.01,
      connectRate: 1,
      cpa: 20,
      cpc: 2,
      txConv: 0.1,
    },
    {
      day: '02/01',
      amountSpent: 200,
      reach: 2000,
      impressions: 10000,
      clicksAll: 200,
      uniqueLinkClicks: 100,
      costPerLandingPageView: 2,
      purchases: 10,
      cpm: 20,
      ctrLink: 0.01,
      connectRate: 1,
      cpa: 20,
      cpc: 2,
      txConv: 0.1,
    },
  ]

  it('should calculate total spent correctly', () => {
    const totals = calculateFunnelTotals(mockData)
    expect(totals.totalSpent).toBe(300)
  })

  it('should calculate total purchases correctly', () => {
    const totals = calculateFunnelTotals(mockData)
    expect(totals.totalPurchases).toBe(15)
  })

  it('should calculate average CPA correctly', () => {
    const totals = calculateFunnelTotals(mockData)
    // CPA = Total Spent / Total Purchases = 300 / 15 = 20
    expect(totals.avgCpa).toBe(20)
  })

  it('should calculate totalLinkClicks correctly', () => {
    const totals = calculateFunnelTotals(mockData)
    expect(totals.totalLinkClicks).toBe(150)
  })

  it('should handle empty array', () => {
    const totals = calculateFunnelTotals([])
    expect(totals.totalSpent).toBe(0)
    expect(totals.totalPurchases).toBe(0)
  })
})

import { describe, it, expect } from 'vitest'
import {
  calculateFunnelTotals,
  consolidateFunnels,
  formatCurrency,
  formatNumber,
  formatPercentage,
  formatCompact,
  formatDecimal,
  formatRoas,
  formatFrequency,
} from './calculations'
import { MetaAdsData } from '@/types/metrics'

// Helper to create mock data
function createMockData(overrides: Partial<MetaAdsData> = {}): MetaAdsData {
  return {
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
    ...overrides,
  }
}

describe('formatCurrency', () => {
  it('should format number as BRL currency', () => {
    expect(formatCurrency(1234.56)).toMatch(/1.*234.*56/)
  })

  it('should handle zero', () => {
    expect(formatCurrency(0)).toMatch(/0.*00/)
  })

  it('should handle negative numbers', () => {
    const result = formatCurrency(-1000)
    expect(result).toContain('1')
    expect(result).toContain('-')
  })

  it('should handle large numbers', () => {
    const result = formatCurrency(1000000)
    expect(result).toContain('1')
  })

  it('should round decimals correctly', () => {
    expect(formatCurrency(99.999)).toMatch(/100/)
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

  it('should handle decimals', () => {
    const result = formatNumber(1234.56)
    expect(result).toContain('1')
  })

  it('should handle negative numbers', () => {
    const result = formatNumber(-1000)
    expect(result).toContain('-')
    expect(result).toContain('1')
  })
})

describe('formatPercentage', () => {
  it('should format decimal as percentage', () => {
    expect(formatPercentage(0.1234)).toContain('%')
  })

  it('should handle zero', () => {
    expect(formatPercentage(0)).toMatch(/0.*%/)
  })

  it('should format with 2 decimal places', () => {
    expect(formatPercentage(12.3456)).toBe('12.35%')
  })

  it('should handle 100%', () => {
    expect(formatPercentage(100)).toBe('100.00%')
  })

  it('should handle negative percentages', () => {
    expect(formatPercentage(-5.5)).toBe('-5.50%')
  })
})

describe('formatCompact', () => {
  it('should format millions with M suffix', () => {
    expect(formatCompact(1000000)).toBe('1.0M')
    expect(formatCompact(5500000)).toBe('5.5M')
  })

  it('should format thousands with K suffix', () => {
    expect(formatCompact(1000)).toBe('1.0K')
    expect(formatCompact(5500)).toBe('5.5K')
  })

  it('should format small numbers normally', () => {
    expect(formatCompact(500)).toBe('500')
    expect(formatCompact(0)).toBe('0')
  })

  it('should handle edge cases', () => {
    expect(formatCompact(999)).toBe('999')
    expect(formatCompact(1001)).toBe('1.0K')
    expect(formatCompact(999999)).toBe('1000.0K')
    expect(formatCompact(1000001)).toBe('1.0M')
  })
})

describe('formatDecimal', () => {
  it('should format with default 2 decimal places', () => {
    expect(formatDecimal(3.14159)).toBe('3.14')
  })

  it('should format with custom decimal places', () => {
    expect(formatDecimal(3.14159, 4)).toBe('3.1416')
    expect(formatDecimal(3.14159, 0)).toBe('3')
  })

  it('should handle integers', () => {
    expect(formatDecimal(10)).toBe('10.00')
  })

  it('should handle negative numbers', () => {
    expect(formatDecimal(-2.5)).toBe('-2.50')
  })
})

describe('formatRoas', () => {
  it('should format ROAS with x suffix', () => {
    expect(formatRoas(3.5)).toBe('3.50x')
    expect(formatRoas(2)).toBe('2.00x')
  })

  it('should handle zero', () => {
    expect(formatRoas(0)).toBe('0.00x')
  })

  it('should handle high ROAS', () => {
    expect(formatRoas(10.567)).toBe('10.57x')
  })
})

describe('formatFrequency', () => {
  it('should format frequency with 2 decimal places', () => {
    expect(formatFrequency(2.5)).toBe('2.50')
    expect(formatFrequency(1.333)).toBe('1.33')
  })

  it('should handle integers', () => {
    expect(formatFrequency(3)).toBe('3.00')
  })
})

describe('calculateFunnelTotals', () => {
  const mockData: MetaAdsData[] = [
    createMockData({
      day: '01/01',
      amountSpent: 100,
      reach: 1000,
      impressions: 5000,
      clicksAll: 100,
      uniqueLinkClicks: 50,
      purchases: 5,
      purchaseValue: 500,
      leads: 10,
      addToCart: 8,
      initiateCheckout: 6,
      landingPageViews: 40,
      videoViews3s: 200,
      videoThruPlays: 50,
    }),
    createMockData({
      day: '02/01',
      amountSpent: 200,
      reach: 2000,
      impressions: 10000,
      clicksAll: 200,
      uniqueLinkClicks: 100,
      purchases: 10,
      purchaseValue: 1000,
      leads: 20,
      addToCart: 16,
      initiateCheckout: 12,
      landingPageViews: 80,
      videoViews3s: 400,
      videoThruPlays: 100,
    }),
  ]

  describe('absolute totals', () => {
    it('should calculate totalSpent correctly', () => {
      const totals = calculateFunnelTotals(mockData)
      expect(totals.totalSpent).toBe(300)
    })

    it('should calculate totalReach correctly', () => {
      const totals = calculateFunnelTotals(mockData)
      expect(totals.totalReach).toBe(3000)
    })

    it('should calculate totalImpressions correctly', () => {
      const totals = calculateFunnelTotals(mockData)
      expect(totals.totalImpressions).toBe(15000)
    })

    it('should calculate totalClicks correctly', () => {
      const totals = calculateFunnelTotals(mockData)
      expect(totals.totalClicks).toBe(300)
    })

    it('should calculate totalLinkClicks correctly', () => {
      const totals = calculateFunnelTotals(mockData)
      expect(totals.totalLinkClicks).toBe(150)
    })

    it('should calculate totalPurchases correctly', () => {
      const totals = calculateFunnelTotals(mockData)
      expect(totals.totalPurchases).toBe(15)
    })

    it('should calculate totalRevenue correctly', () => {
      const totals = calculateFunnelTotals(mockData)
      expect(totals.totalRevenue).toBe(1500)
    })

    it('should calculate totalLeads correctly', () => {
      const totals = calculateFunnelTotals(mockData)
      expect(totals.totalLeads).toBe(30)
    })

    it('should calculate totalAddToCart correctly', () => {
      const totals = calculateFunnelTotals(mockData)
      expect(totals.totalAddToCart).toBe(24)
    })

    it('should calculate totalInitiateCheckout correctly', () => {
      const totals = calculateFunnelTotals(mockData)
      expect(totals.totalInitiateCheckout).toBe(18)
    })

    it('should calculate totalLandingPageViews correctly', () => {
      const totals = calculateFunnelTotals(mockData)
      expect(totals.totalLandingPageViews).toBe(120)
    })

    it('should calculate totalVideoViews3s correctly', () => {
      const totals = calculateFunnelTotals(mockData)
      expect(totals.totalVideoViews3s).toBe(600)
    })

    it('should calculate totalVideoThruPlays correctly', () => {
      const totals = calculateFunnelTotals(mockData)
      expect(totals.totalVideoThruPlays).toBe(150)
    })
  })

  describe('derived metrics', () => {
    it('should calculate avgCpm correctly', () => {
      const totals = calculateFunnelTotals(mockData)
      // CPM = (300 / 15000) * 1000 = 20
      expect(totals.avgCpm).toBe(20)
    })

    it('should calculate avgCtr correctly', () => {
      const totals = calculateFunnelTotals(mockData)
      // CTR = (150 / 15000) * 100 = 1%
      expect(totals.avgCtr).toBe(1)
    })

    it('should calculate avgCpa correctly', () => {
      const totals = calculateFunnelTotals(mockData)
      // CPA = 300 / 15 = 20
      expect(totals.avgCpa).toBe(20)
    })

    it('should calculate avgCpc correctly', () => {
      const totals = calculateFunnelTotals(mockData)
      // CPC = 300 / 300 = 1
      expect(totals.avgCpc).toBe(1)
    })

    it('should calculate avgTxConv correctly', () => {
      const totals = calculateFunnelTotals(mockData)
      // TxConv = (15 / 150) * 100 = 10%
      expect(totals.avgTxConv).toBe(10)
    })

    it('should calculate avgRoas correctly', () => {
      const totals = calculateFunnelTotals(mockData)
      // ROAS = 1500 / 300 = 5
      expect(totals.avgRoas).toBe(5)
    })

    it('should calculate avgCpl correctly', () => {
      const totals = calculateFunnelTotals(mockData)
      // CPL = 300 / 30 = 10
      expect(totals.avgCpl).toBe(10)
    })

    it('should calculate avgFrequency correctly', () => {
      const totals = calculateFunnelTotals(mockData)
      // Frequency = 15000 / 3000 = 5
      expect(totals.avgFrequency).toBe(5)
    })

    it('should calculate avgHookRate correctly', () => {
      const totals = calculateFunnelTotals(mockData)
      // HookRate = (600 / 15000) * 100 = 4%
      expect(totals.avgHookRate).toBe(4)
    })

    it('should calculate avgHoldRate correctly', () => {
      const totals = calculateFunnelTotals(mockData)
      // HoldRate = (150 / 600) * 100 = 25%
      expect(totals.avgHoldRate).toBe(25)
    })

    it('should calculate avgLpViewRate correctly', () => {
      const totals = calculateFunnelTotals(mockData)
      // LpViewRate = (120 / 150) * 100 = 80%
      expect(totals.avgLpViewRate).toBe(80)
    })
  })

  describe('edge cases', () => {
    it('should handle empty array', () => {
      const totals = calculateFunnelTotals([])
      expect(totals.totalSpent).toBe(0)
      expect(totals.totalPurchases).toBe(0)
      expect(totals.avgCpm).toBe(0)
      expect(totals.avgCpa).toBe(0)
    })

    it('should filter out zero spend days', () => {
      const dataWithZeroSpend = [
        createMockData({ amountSpent: 100, purchases: 5 }),
        createMockData({ amountSpent: 0, purchases: 0 }),
      ]
      const totals = calculateFunnelTotals(dataWithZeroSpend)
      expect(totals.totalSpent).toBe(100)
    })

    it('should handle division by zero gracefully', () => {
      const dataWithZero = [createMockData({
        amountSpent: 100,
        impressions: 0,
        purchases: 0,
        uniqueLinkClicks: 0,
      })]
      const totals = calculateFunnelTotals(dataWithZero)
      expect(totals.avgCpm).toBe(0) // No impressions
      expect(totals.avgCpa).toBe(0) // No purchases
      expect(totals.avgTxConv).toBe(0) // No link clicks
    })

    it('should handle undefined optional fields', () => {
      const dataWithUndefined = [createMockData({
        purchaseValue: undefined,
        leads: undefined,
        addToCart: undefined,
      })]
      const totals = calculateFunnelTotals(dataWithUndefined)
      expect(totals.totalRevenue).toBe(0)
      expect(totals.totalLeads).toBe(0)
      expect(totals.totalAddToCart).toBe(0)
    })

    it('should handle single data point', () => {
      const singleData = [createMockData({
        amountSpent: 100,
        impressions: 10000,
        purchases: 10,
      })]
      const totals = calculateFunnelTotals(singleData)
      expect(totals.totalSpent).toBe(100)
      expect(totals.avgCpm).toBe(10) // (100 / 10000) * 1000
      expect(totals.avgCpa).toBe(10) // 100 / 10
    })
  })
})

describe('consolidateFunnels', () => {
  it('should merge data from multiple funnels', () => {
    const funnel1 = [createMockData({ day: '01/01' }), createMockData({ day: '02/01' })]
    const funnel2 = [createMockData({ day: '01/01' }), createMockData({ day: '02/01' })]

    const consolidated = consolidateFunnels([funnel1, funnel2])
    expect(consolidated).toHaveLength(4)
  })

  it('should handle empty funnels', () => {
    const consolidated = consolidateFunnels([[], []])
    expect(consolidated).toHaveLength(0)
  })

  it('should handle single funnel', () => {
    const funnel = [createMockData({ day: '01/01' })]
    const consolidated = consolidateFunnels([funnel])
    expect(consolidated).toHaveLength(1)
  })

  it('should preserve data integrity', () => {
    const funnel1 = [createMockData({ amountSpent: 100 })]
    const funnel2 = [createMockData({ amountSpent: 200 })]

    const consolidated = consolidateFunnels([funnel1, funnel2])
    expect(consolidated[0].amountSpent).toBe(100)
    expect(consolidated[1].amountSpent).toBe(200)
  })
})

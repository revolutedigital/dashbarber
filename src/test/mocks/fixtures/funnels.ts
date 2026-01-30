import type { Funnel, MetaAdsData } from '@/types/metrics'

// Generate realistic mock data for testing
export function generateMockDayData(day: string, seed: number = 1): MetaAdsData {
  const random = (min: number, max: number) => min + ((seed * 9301 + 49297) % 233280) / 233280 * (max - min)

  const spent = 300 + random(0, 300)
  const reach = Math.floor(5000 + random(0, 5000))
  const impressions = Math.floor(reach * (2 + random(0, 1)))
  const clicksAll = Math.floor(150 + random(0, 150))
  const uniqueLinkClicks = Math.floor(clicksAll * 0.7)
  const purchases = Math.floor(5 + random(0, 15))

  return {
    day,
    amountSpent: Math.round(spent * 100) / 100,
    reach,
    impressions,
    clicksAll,
    uniqueLinkClicks,
    costPerLandingPageView: Math.round((spent / uniqueLinkClicks) * 100) / 100,
    purchases,
    cpm: Math.round((spent / impressions * 1000) * 100) / 100,
    ctrLink: Math.round((uniqueLinkClicks / impressions) * 10000) / 10000,
    connectRate: Math.round((purchases / uniqueLinkClicks * 100) * 100) / 100,
    cpa: purchases > 0 ? Math.round((spent / purchases) * 100) / 100 : 0,
    cpc: Math.round((spent / clicksAll) * 100) / 100,
    txConv: uniqueLinkClicks > 0 ? Math.round((purchases / uniqueLinkClicks) * 10000) / 10000 : 0,
  }
}

// Mock funnel data
export const mockFunnel1: Funnel = {
  id: 'test_funnel_1',
  name: 'Test Funnel 1',
  data: [
    generateMockDayData('01/01', 1),
    generateMockDayData('02/01', 2),
    generateMockDayData('03/01', 3),
    generateMockDayData('04/01', 4),
    generateMockDayData('05/01', 5),
    generateMockDayData('06/01', 6),
    generateMockDayData('07/01', 7),
  ],
}

export const mockFunnel2: Funnel = {
  id: 'test_funnel_2',
  name: 'Test Funnel 2',
  data: [
    generateMockDayData('01/01', 10),
    generateMockDayData('02/01', 11),
    generateMockDayData('03/01', 12),
    generateMockDayData('04/01', 13),
    generateMockDayData('05/01', 14),
  ],
}

export const mockFunnels: Funnel[] = [mockFunnel1, mockFunnel2]

export const mockFunnelsData = {
  funnels: mockFunnels,
  lastUpdated: '2026-01-25T12:00:00.000Z',
}

export const mockEmptyData = {
  funnels: [],
  lastUpdated: '2026-01-25T12:00:00.000Z',
}

// Mock totals for testing
export const mockTotals = {
  totalSpent: 3500,
  totalReach: 45000,
  totalImpressions: 95000,
  totalClicks: 2100,
  totalLinkClicks: 1470,
  totalPurchases: 75,
  totalRevenue: 8500,
  totalLeads: 120,
  totalAddToCart: 200,
  totalInitiateCheckout: 150,
  totalLandingPageViews: 1200,
  totalVideoViews3s: 5000,
  totalVideoThruPlays: 2000,
  avgCpm: 36.84,
  avgCtr: 1.55,
  avgCpa: 46.67,
  avgCpc: 1.67,
  avgTxConv: 5.1,
  avgRoas: 2.43,
  avgCpl: 29.17,
  avgFrequency: 2.11,
  avgHookRate: 5.26,
  avgHoldRate: 40.0,
  avgLpViewRate: 81.63,
}

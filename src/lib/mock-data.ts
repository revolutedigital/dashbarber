'use strict'

import { MetaAdsData, Funnel } from '@/types/metrics'

/**
 * Generates mock Meta Ads data for a specified number of days
 * Creates realistic data with weekend variations and random factors
 */
export function generateMockData(days: number = 30): MetaAdsData[] {
  const data: MetaAdsData[] = []
  const baseDate = new Date()
  baseDate.setDate(baseDate.getDate() - days)

  for (let i = 0; i < days; i++) {
    const date = new Date(baseDate)
    date.setDate(date.getDate() + i)
    const dayStr = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`

    // Realistic variation based on day of week (weekends have less performance)
    const dayOfWeek = date.getDay()
    const weekendFactor = dayOfWeek === 0 || dayOfWeek === 6 ? 0.7 : 1
    const randomFactor = 0.8 + Math.random() * 0.4 // 80% to 120%

    const baseSpent = 450 + Math.random() * 150
    const spent = baseSpent * weekendFactor * randomFactor
    const reach = Math.floor((8000 + Math.random() * 4000) * weekendFactor)
    const impressions = Math.floor(reach * (2.2 + Math.random() * 0.5))
    const clicksAll = Math.floor((250 + Math.random() * 150) * weekendFactor * randomFactor)
    const uniqueLinkClicks = Math.floor(clicksAll * (0.65 + Math.random() * 0.15))
    const purchases = Math.floor((8 + Math.random() * 15) * weekendFactor * randomFactor)

    data.push({
      day: dayStr,
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
    })
  }
  return data
}

/**
 * Default mock funnels for demonstration
 */
export const mockFunnels: Funnel[] = [
  {
    id: 'playbook_conv_frio',
    name: 'Playbook (Conv Frio)',
    data: generateMockData(),
  },
  {
    id: 'remarketing_quente',
    name: 'Remarketing (Quente)',
    data: generateMockData().map(d => ({
      ...d,
      amountSpent: d.amountSpent * 0.6,
      purchases: Math.floor(d.purchases * 1.3),
      cpa: d.cpa * 0.5,
      txConv: d.txConv * 1.5,
    })),
  },
  {
    id: 'lookalike_top',
    name: 'Lookalike (Top 1%)',
    data: generateMockData().map(d => ({
      ...d,
      amountSpent: d.amountSpent * 0.8,
      reach: Math.floor(d.reach * 0.7),
      purchases: Math.floor(d.purchases * 1.1),
      ctrLink: d.ctrLink * 1.2,
    })),
  },
]

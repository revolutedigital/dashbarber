import { decrypt } from '@/lib/crypto'
import { prisma } from '@/lib/prisma'

// Meta Marketing API version
const META_API_VERSION = 'v18.0'
const META_API_BASE = `https://graph.facebook.com/${META_API_VERSION}`

interface MetaAdsCredentials {
  accessToken: string
  accountId: string
}

interface MetaAdsInsight {
  date_start: string
  date_stop: string
  campaign_id?: string
  campaign_name?: string
  adset_id?: string
  adset_name?: string
  ad_id?: string
  ad_name?: string
  spend: string
  reach: string
  impressions: string
  clicks: string
  unique_link_clicks?: string
  actions?: Array<{ action_type: string; value: string }>
  action_values?: Array<{ action_type: string; value: string }>
  video_p25_watched_actions?: Array<{ value: string }>
  video_p50_watched_actions?: Array<{ value: string }>
  video_p75_watched_actions?: Array<{ value: string }>
  video_p100_watched_actions?: Array<{ value: string }>
  video_thruplay_watched_actions?: Array<{ value: string }>
}

/**
 * Meta Ads API Client
 * Handles data fetching from Meta Marketing API
 */
export class MetaAdsClient {
  private credentials: MetaAdsCredentials

  constructor(credentials: MetaAdsCredentials) {
    this.credentials = credentials
  }

  /**
   * Create a client from an AdAccountConnection
   */
  static async fromConnection(connectionId: string): Promise<MetaAdsClient> {
    const connection = await prisma.adAccountConnection.findUnique({
      where: { id: connectionId },
    })

    if (!connection) {
      throw new Error('Ad account connection not found')
    }

    if (connection.platform !== 'META_ADS') {
      throw new Error('Connection is not a Meta Ads account')
    }

    // Decrypt token
    const accessToken = await decrypt(connection.accessToken)

    return new MetaAdsClient({
      accessToken,
      accountId: connection.accountId,
    })
  }

  /**
   * Make an authenticated request to Meta API
   */
  private async request<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
    const url = new URL(`${META_API_BASE}/${endpoint}`)
    url.searchParams.set('access_token', this.credentials.accessToken)

    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value)
    }

    const response = await fetch(url.toString())

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Meta API error: ${error.error?.message || 'Unknown error'}`)
    }

    return response.json()
  }

  /**
   * Fetch daily insights for a date range
   */
  async getDailyInsights(startDate: string, endDate: string): Promise<MetaAdsInsight[]> {
    const accountId = this.credentials.accountId.replace('act_', '')

    const fields = [
      'date_start',
      'date_stop',
      'campaign_id',
      'campaign_name',
      'adset_id',
      'adset_name',
      'ad_id',
      'ad_name',
      'spend',
      'reach',
      'impressions',
      'clicks',
      'unique_link_clicks',
      'actions',
      'action_values',
      'video_p25_watched_actions',
      'video_p50_watched_actions',
      'video_p75_watched_actions',
      'video_p100_watched_actions',
      'video_thruplay_watched_actions',
    ].join(',')

    const response = await this.request<{
      data: MetaAdsInsight[]
      paging?: { next?: string }
    }>(`act_${accountId}/insights`, {
      fields,
      time_range: JSON.stringify({ since: startDate, until: endDate }),
      time_increment: '1',
      level: 'ad',
      limit: '500',
    })

    return response.data || []
  }

  /**
   * Get account info
   */
  async getAccountInfo(): Promise<{
    id: string
    name: string
    currency: string
    timezone_name: string
  }> {
    const accountId = this.credentials.accountId.replace('act_', '')

    return this.request(`act_${accountId}`, {
      fields: 'id,name,currency,timezone_name',
    })
  }
}

/**
 * Transform Meta Ads insights to DailyMetric format
 */
export function transformMetaAdsInsights(
  insights: MetaAdsInsight[],
  workspaceId: string,
  adAccountId: string
) {
  // Group by date
  const byDate = new Map<string, {
    amountSpent: number
    reach: number
    impressions: number
    clicks: number
    uniqueLinkClicks: number
    purchases: number
    purchaseValue: number
    leads: number
    addToCart: number
    initiateCheckout: number
    landingPageViews: number
    videoP25: number
    videoP50: number
    videoP75: number
    videoP100: number
    videoThruPlays: number
  }>()

  for (const insight of insights) {
    const date = insight.date_start
    const existing = byDate.get(date) || {
      amountSpent: 0,
      reach: 0,
      impressions: 0,
      clicks: 0,
      uniqueLinkClicks: 0,
      purchases: 0,
      purchaseValue: 0,
      leads: 0,
      addToCart: 0,
      initiateCheckout: 0,
      landingPageViews: 0,
      videoP25: 0,
      videoP50: 0,
      videoP75: 0,
      videoP100: 0,
      videoThruPlays: 0,
    }

    existing.amountSpent += parseFloat(insight.spend || '0')
    existing.reach += parseInt(insight.reach || '0', 10)
    existing.impressions += parseInt(insight.impressions || '0', 10)
    existing.clicks += parseInt(insight.clicks || '0', 10)
    existing.uniqueLinkClicks += parseInt(insight.unique_link_clicks || '0', 10)

    // Parse actions
    if (insight.actions) {
      for (const action of insight.actions) {
        const value = parseInt(action.value, 10)
        switch (action.action_type) {
          case 'purchase':
          case 'omni_purchase':
            existing.purchases += value
            break
          case 'lead':
          case 'omni_lead':
            existing.leads += value
            break
          case 'add_to_cart':
          case 'omni_add_to_cart':
            existing.addToCart += value
            break
          case 'initiate_checkout':
          case 'omni_initiate_checkout':
            existing.initiateCheckout += value
            break
          case 'landing_page_view':
            existing.landingPageViews += value
            break
        }
      }
    }

    // Parse action values (purchase value)
    if (insight.action_values) {
      for (const actionValue of insight.action_values) {
        if (actionValue.action_type === 'purchase' || actionValue.action_type === 'omni_purchase') {
          existing.purchaseValue += parseFloat(actionValue.value)
        }
      }
    }

    // Video metrics
    if (insight.video_p25_watched_actions?.[0]) {
      existing.videoP25 += parseInt(insight.video_p25_watched_actions[0].value, 10)
    }
    if (insight.video_p50_watched_actions?.[0]) {
      existing.videoP50 += parseInt(insight.video_p50_watched_actions[0].value, 10)
    }
    if (insight.video_p75_watched_actions?.[0]) {
      existing.videoP75 += parseInt(insight.video_p75_watched_actions[0].value, 10)
    }
    if (insight.video_p100_watched_actions?.[0]) {
      existing.videoP100 += parseInt(insight.video_p100_watched_actions[0].value, 10)
    }
    if (insight.video_thruplay_watched_actions?.[0]) {
      existing.videoThruPlays += parseInt(insight.video_thruplay_watched_actions[0].value, 10)
    }

    byDate.set(date, existing)
  }

  // Convert to DailyMetric format
  return Array.from(byDate.entries()).map(([date, data]) => ({
    workspaceId,
    adAccountId,
    date: new Date(date),
    amountSpent: data.amountSpent,
    reach: data.reach,
    impressions: data.impressions,
    clicksAll: data.clicks,
    uniqueLinkClicks: data.uniqueLinkClicks,
    purchases: data.purchases,
    purchaseValue: data.purchaseValue,
    leads: data.leads,
    addToCart: data.addToCart,
    initiateCheckout: data.initiateCheckout,
    landingPageViews: data.landingPageViews,
    videoP25: data.videoP25,
    videoP50: data.videoP50,
    videoP75: data.videoP75,
    videoP100: data.videoP100,
    videoThruPlays: data.videoThruPlays,
    // Calculated metrics
    ctr: data.impressions > 0 ? (data.clicks / data.impressions) * 100 : 0,
    cpc: data.clicks > 0 ? data.amountSpent / data.clicks : 0,
    cpm: data.impressions > 0 ? (data.amountSpent / data.impressions) * 1000 : 0,
    roas: data.amountSpent > 0 ? data.purchaseValue / data.amountSpent : 0,
  }))
}

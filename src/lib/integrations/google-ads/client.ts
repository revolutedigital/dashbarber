import { decrypt } from '@/lib/crypto'
import { prisma } from '@/lib/prisma'

// Google Ads API base URL
const GOOGLE_ADS_API_VERSION = 'v17'
const GOOGLE_ADS_API_BASE = `https://googleads.googleapis.com/${GOOGLE_ADS_API_VERSION}`

interface GoogleAdsCredentials {
  accessToken: string
  refreshToken?: string
  customerId: string
  developerToken: string
}

interface GoogleAdsMetric {
  date: string
  customerId: string
  campaignId: string
  campaignName: string
  impressions: number
  clicks: number
  costMicros: number
  conversions: number
  conversionsValue: number
}

/**
 * Google Ads API Client
 * Handles authentication and data fetching from Google Ads API
 */
export class GoogleAdsClient {
  private credentials: GoogleAdsCredentials

  constructor(credentials: GoogleAdsCredentials) {
    this.credentials = credentials
  }

  /**
   * Create a client from an AdAccountConnection
   */
  static async fromConnection(connectionId: string): Promise<GoogleAdsClient> {
    const connection = await prisma.adAccountConnection.findUnique({
      where: { id: connectionId },
    })

    if (!connection) {
      throw new Error('Ad account connection not found')
    }

    if (connection.platform !== 'GOOGLE_ADS') {
      throw new Error('Connection is not a Google Ads account')
    }

    // Decrypt tokens
    const accessToken = await decrypt(connection.accessToken)
    const refreshToken = connection.refreshToken
      ? await decrypt(connection.refreshToken)
      : undefined

    const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN
    if (!developerToken) {
      throw new Error('GOOGLE_ADS_DEVELOPER_TOKEN not configured')
    }

    return new GoogleAdsClient({
      accessToken,
      refreshToken,
      customerId: connection.accountId,
      developerToken,
    })
  }

  /**
   * Refresh the access token using the refresh token
   */
  async refreshAccessToken(): Promise<string> {
    if (!this.credentials.refreshToken) {
      throw new Error('No refresh token available')
    }

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_ADS_CLIENT_ID!,
        client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET!,
        refresh_token: this.credentials.refreshToken,
        grant_type: 'refresh_token',
      }),
    })

    const data = await response.json()

    if (data.error) {
      throw new Error(`Failed to refresh token: ${data.error_description || data.error}`)
    }

    this.credentials.accessToken = data.access_token
    return data.access_token
  }

  /**
   * Make an authenticated request to Google Ads API
   */
  private async request<T>(endpoint: string, body: Record<string, unknown>): Promise<T> {
    const customerId = this.credentials.customerId.replace(/-/g, '')

    const response = await fetch(`${GOOGLE_ADS_API_BASE}/${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.credentials.accessToken}`,
        'developer-token': this.credentials.developerToken,
        'login-customer-id': customerId,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (response.status === 401) {
      // Token expired, try to refresh
      await this.refreshAccessToken()
      return this.request(endpoint, body)
    }

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Google Ads API error: ${error}`)
    }

    return response.json()
  }

  /**
   * Fetch daily metrics for a date range
   */
  async getDailyMetrics(startDate: string, endDate: string): Promise<GoogleAdsMetric[]> {
    const customerId = this.credentials.customerId.replace(/-/g, '')

    const query = `
      SELECT
        segments.date,
        customer.id,
        campaign.id,
        campaign.name,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions,
        metrics.conversions_value
      FROM campaign
      WHERE segments.date BETWEEN '${startDate}' AND '${endDate}'
        AND campaign.status != 'REMOVED'
      ORDER BY segments.date DESC
    `

    const response = await this.request<{
      results?: Array<{
        segments: { date: string }
        customer: { id: string }
        campaign: { id: string; name: string }
        metrics: {
          impressions: string
          clicks: string
          costMicros: string
          conversions: string
          conversionsValue: string
        }
      }>
    }>(`customers/${customerId}/googleAds:searchStream`, { query })

    if (!response.results) {
      return []
    }

    return response.results.map((row) => ({
      date: row.segments.date,
      customerId: row.customer.id,
      campaignId: row.campaign.id,
      campaignName: row.campaign.name,
      impressions: parseInt(row.metrics.impressions || '0', 10),
      clicks: parseInt(row.metrics.clicks || '0', 10),
      costMicros: parseInt(row.metrics.costMicros || '0', 10),
      conversions: parseFloat(row.metrics.conversions || '0'),
      conversionsValue: parseFloat(row.metrics.conversionsValue || '0'),
    }))
  }

  /**
   * Get accessible customer IDs (manager accounts)
   */
  async getAccessibleCustomers(): Promise<string[]> {
    const response = await fetch(
      `${GOOGLE_ADS_API_BASE}/customers:listAccessibleCustomers`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.credentials.accessToken}`,
          'developer-token': this.credentials.developerToken,
        },
      }
    )

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to get accessible customers: ${error}`)
    }

    const data = await response.json()
    return data.resourceNames?.map((name: string) => name.replace('customers/', '')) || []
  }
}

/**
 * Transform Google Ads metrics to DailyMetric format
 */
export function transformGoogleAdsMetrics(
  metrics: GoogleAdsMetric[],
  workspaceId: string,
  adAccountId: string
) {
  // Group by date and aggregate
  const byDate = new Map<string, {
    amountSpent: number
    impressions: number
    clicks: number
    purchases: number
    purchaseValue: number
    campaigns: Map<string, { id: string; name: string }>
  }>()

  for (const m of metrics) {
    const existing = byDate.get(m.date) || {
      amountSpent: 0,
      impressions: 0,
      clicks: 0,
      purchases: 0,
      purchaseValue: 0,
      campaigns: new Map(),
    }

    existing.amountSpent += m.costMicros / 1_000_000 // Convert micros to currency
    existing.impressions += m.impressions
    existing.clicks += m.clicks
    existing.purchases += m.conversions
    existing.purchaseValue += m.conversionsValue
    existing.campaigns.set(m.campaignId, { id: m.campaignId, name: m.campaignName })

    byDate.set(m.date, existing)
  }

  // Convert to DailyMetric format
  return Array.from(byDate.entries()).map(([date, data]) => ({
    workspaceId,
    adAccountId,
    date: new Date(date),
    amountSpent: data.amountSpent,
    reach: 0, // Google Ads doesn't have reach metric directly
    impressions: data.impressions,
    clicksAll: data.clicks,
    uniqueLinkClicks: data.clicks, // Approximate
    purchases: Math.round(data.purchases),
    purchaseValue: data.purchaseValue,
    leads: 0,
    addToCart: 0,
    initiateCheckout: 0,
    landingPageViews: 0,
    // Calculated metrics
    ctr: data.impressions > 0 ? (data.clicks / data.impressions) * 100 : 0,
    cpc: data.clicks > 0 ? data.amountSpent / data.clicks : 0,
    cpm: data.impressions > 0 ? (data.amountSpent / data.impressions) * 1000 : 0,
    roas: data.amountSpent > 0 ? data.purchaseValue / data.amountSpent : 0,
  }))
}

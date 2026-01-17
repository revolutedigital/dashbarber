import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'

// ============================================
// WEBHOOK SECRET VALIDATION
// ============================================

function validateWebhookSecret(request: NextRequest): boolean {
  const secret = request.headers.get('x-webhook-secret')
  const expectedSecret = process.env.PABBLY_WEBHOOK_SECRET

  if (!expectedSecret) {
    // Em desenvolvimento, permite sem secret
    return process.env.NODE_ENV === 'development'
  }

  if (!secret) {
    return false
  }

  // Timing-safe comparison
  if (secret.length !== expectedSecret.length) {
    return false
  }

  let result = 0
  for (let i = 0; i < secret.length; i++) {
    result |= secret.charCodeAt(i) ^ expectedSecret.charCodeAt(i)
  }
  return result === 0
}

// ============================================
// PAYLOAD SCHEMA (Pabbly -> Meta Ads)
// ============================================

// Helper para extrair valor de actions do Pabbly
// Formato: { "purchase": { "action_type": "purchase", "value": "2" } }
function extractActionValue(actions: unknown, actionType: string): number {
  if (!actions || typeof actions !== 'object') return 0
  const actionsObj = actions as Record<string, { value?: string | number }>
  const action = actionsObj[actionType]
  if (action?.value) {
    return parseInt(String(action.value)) || 0
  }
  return 0
}

const MetaInsightSchema = z.object({
  // Identificadores
  date_start: z.string(),
  account_id: z.string().optional(),
  account_name: z.string().optional(),
  campaign_id: z.string().optional(),
  campaign_name: z.string().optional(),
  adset_id: z.string().optional(),
  adset_name: z.string().optional(),
  ad_id: z.string().optional(),
  ad_name: z.string().optional(),

  // Métricas básicas
  spend: z.union([z.string(), z.number()]).transform(v => parseFloat(String(v)) || 0),
  reach: z.union([z.string(), z.number()]).transform(v => parseInt(String(v)) || 0),
  impressions: z.union([z.string(), z.number()]).transform(v => parseInt(String(v)) || 0),
  clicks: z.union([z.string(), z.number()]).transform(v => parseInt(String(v)) || 0),
  unique_link_clicks: z.union([z.string(), z.number()]).transform(v => parseInt(String(v)) || 0).optional(),
  inline_link_clicks: z.union([z.string(), z.number()]).transform(v => parseInt(String(v)) || 0).optional(),

  // Actions object from Pabbly (contains conversions)
  actions: z.unknown().optional(),

  // Conversões diretas (fallback)
  purchases: z.union([z.string(), z.number()]).transform(v => parseInt(String(v)) || 0).optional(),
  purchase_value: z.union([z.string(), z.number()]).transform(v => parseFloat(String(v)) || 0).optional(),
  leads: z.union([z.string(), z.number()]).transform(v => parseInt(String(v)) || 0).optional(),
  registrations: z.union([z.string(), z.number()]).transform(v => parseInt(String(v)) || 0).optional(),
  complete_registration: z.union([z.string(), z.number()]).transform(v => parseInt(String(v)) || 0).optional(),
  add_to_cart: z.union([z.string(), z.number()]).transform(v => parseInt(String(v)) || 0).optional(),
  initiate_checkout: z.union([z.string(), z.number()]).transform(v => parseInt(String(v)) || 0).optional(),

  // Landing Page
  landing_page_views: z.union([z.string(), z.number()]).transform(v => parseInt(String(v)) || 0).optional(),
  cost_per_landing_page_view: z.union([z.string(), z.number()]).transform(v => parseFloat(String(v)) || 0).optional(),

  // Video metrics
  video_views_3s: z.union([z.string(), z.number()]).transform(v => parseInt(String(v)) || 0).optional(),
  video_thru_plays: z.union([z.string(), z.number()]).transform(v => parseInt(String(v)) || 0).optional(),
  video_p25_watched: z.union([z.string(), z.number()]).transform(v => parseInt(String(v)) || 0).optional(),
  video_p50_watched: z.union([z.string(), z.number()]).transform(v => parseInt(String(v)) || 0).optional(),
  video_p75_watched: z.union([z.string(), z.number()]).transform(v => parseInt(String(v)) || 0).optional(),
  video_p100_watched: z.union([z.string(), z.number()]).transform(v => parseInt(String(v)) || 0).optional(),
  video_avg_time_watched: z.union([z.string(), z.number()]).transform(v => parseFloat(String(v)) || 0).optional(),

  // Meta-calculated
  frequency: z.union([z.string(), z.number()]).transform(v => parseFloat(String(v)) || 0).optional(),
  cpm: z.union([z.string(), z.number()]).transform(v => parseFloat(String(v)) || 0).optional(),
  cpc: z.union([z.string(), z.number()]).transform(v => parseFloat(String(v)) || 0).optional(),
  ctr: z.union([z.string(), z.number()]).transform(v => parseFloat(String(v)) || 0).optional(),
})

const WebhookPayloadSchema = z.object({
  data: z.array(MetaInsightSchema).or(MetaInsightSchema.transform(d => [d])),
})

// ============================================
// UPSERT HELPERS
// ============================================

async function upsertAdAccount(accountId: string, accountName: string) {
  return prisma.adAccount.upsert({
    where: { metaAccountId: accountId },
    update: { name: accountName },
    create: {
      metaAccountId: accountId,
      name: accountName,
    },
  })
}

async function upsertCampaign(
  adAccountId: string,
  campaignId: string,
  campaignName: string
) {
  return prisma.campaign.upsert({
    where: {
      adAccountId_metaCampaignId: {
        adAccountId,
        metaCampaignId: campaignId,
      },
    },
    update: { name: campaignName },
    create: {
      adAccountId,
      metaCampaignId: campaignId,
      name: campaignName,
    },
  })
}

async function upsertAdSet(
  campaignId: string,
  adSetId: string,
  adSetName: string
) {
  return prisma.adSet.upsert({
    where: {
      campaignId_metaAdSetId: {
        campaignId,
        metaAdSetId: adSetId,
      },
    },
    update: { name: adSetName },
    create: {
      campaignId,
      metaAdSetId: adSetId,
      name: adSetName,
    },
  })
}

async function upsertAd(
  adSetId: string,
  adId: string,
  adName: string
) {
  return prisma.ad.upsert({
    where: {
      adSetId_metaAdId: {
        adSetId,
        metaAdId: adId,
      },
    },
    update: { name: adName },
    create: {
      adSetId,
      metaAdId: adId,
      name: adName,
    },
  })
}

// ============================================
// WEBHOOK HANDLER
// ============================================

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  // Validate webhook secret
  if (!validateWebhookSecret(request)) {
    await logWebhook(request, 401, null, 'Invalid webhook secret')
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  let payload: unknown

  try {
    payload = await request.json()
  } catch {
    await logWebhook(request, 400, null, 'Invalid JSON payload')
    return NextResponse.json(
      { error: 'Invalid JSON payload' },
      { status: 400 }
    )
  }

  // Validate payload structure
  const validation = WebhookPayloadSchema.safeParse(payload)

  if (!validation.success) {
    await logWebhook(request, 422, payload, validation.error.message)
    return NextResponse.json(
      {
        error: 'Invalid payload structure',
        details: validation.error.issues,
      },
      { status: 422 }
    )
  }

  const { data } = validation.data
  let processedCount = 0
  let errorCount = 0

  for (const insight of data) {
    try {
      // Parse date
      const date = new Date(insight.date_start)

      // Get or create hierarchy
      let dbCampaignId: string | null = null
      let dbAdSetId: string | null = null
      let dbAdId: string | null = null

      if (insight.account_id && insight.campaign_id) {
        const account = await upsertAdAccount(
          insight.account_id,
          insight.account_name || `Account ${insight.account_id}`
        )

        const campaign = await upsertCampaign(
          account.id,
          insight.campaign_id,
          insight.campaign_name || `Campaign ${insight.campaign_id}`
        )
        dbCampaignId = campaign.id

        if (insight.adset_id) {
          const adSet = await upsertAdSet(
            campaign.id,
            insight.adset_id,
            insight.adset_name || `AdSet ${insight.adset_id}`
          )
          dbAdSetId = adSet.id

          if (insight.ad_id) {
            const ad = await upsertAd(
              adSet.id,
              insight.ad_id,
              insight.ad_name || `Ad ${insight.ad_id}`
            )
            dbAdId = ad.id
          }
        }
      }

      // Dados da métrica
      // Extrair conversões do objeto actions (formato Pabbly) ou usar campos diretos
      const metricData = {
        spend: insight.spend,
        reach: insight.reach,
        impressions: insight.impressions,
        clicks: insight.clicks,
        linkClicks: extractActionValue(insight.actions, 'link_click') || insight.inline_link_clicks || insight.unique_link_clicks || 0,
        purchases: extractActionValue(insight.actions, 'purchase') || insight.purchases || 0,
        purchaseValue: insight.purchase_value || 0,
        leads: extractActionValue(insight.actions, 'lead') || insight.leads || 0,
        registrations: extractActionValue(insight.actions, 'complete_registration') || insight.registrations || insight.complete_registration || 0,
        addToCart: extractActionValue(insight.actions, 'add_to_cart') || insight.add_to_cart || 0,
        initiateCheckout: extractActionValue(insight.actions, 'initiate_checkout') || insight.initiate_checkout || 0,
        landingPageViews: extractActionValue(insight.actions, 'landing_page_view') || insight.landing_page_views || 0,
        costPerLandingPageView: insight.cost_per_landing_page_view || 0,
        videoViews3s: insight.video_views_3s || 0,
        videoThruPlays: insight.video_thru_plays || 0,
        videoP25: insight.video_p25_watched || 0,
        videoP50: insight.video_p50_watched || 0,
        videoP75: insight.video_p75_watched || 0,
        videoP100: insight.video_p100_watched || 0,
        videoAvgWatchTime: insight.video_avg_time_watched || 0,
        frequency: insight.frequency || 0,
        cpm: insight.cpm || 0,
        cpc: insight.cpc || 0,
        ctr: insight.ctr || 0,
        source: 'pabbly',
        rawPayload: insight as object,
      }

      // Find existing metric or create new one
      const existingMetric = await prisma.dailyMetric.findFirst({
        where: {
          date,
          campaignId: dbCampaignId,
          adSetId: dbAdSetId,
          adId: dbAdId,
        },
      })

      if (existingMetric) {
        await prisma.dailyMetric.update({
          where: { id: existingMetric.id },
          data: metricData,
        })
      } else {
        await prisma.dailyMetric.create({
          data: {
            date,
            campaignId: dbCampaignId,
            adSetId: dbAdSetId,
            adId: dbAdId,
            ...metricData,
          },
        })
      }

      processedCount++
    } catch (error) {
      console.error('Error processing insight:', error)
      errorCount++
    }
  }

  const duration = Date.now() - startTime

  await logWebhook(request, 200, payload)

  return NextResponse.json({
    success: true,
    processed: processedCount,
    errors: errorCount,
    duration: `${duration}ms`,
  })
}

// ============================================
// WEBHOOK LOGGING
// ============================================

async function logWebhook(
  request: NextRequest,
  statusCode: number,
  payload: unknown,
  error?: string
) {
  try {
    await prisma.webhookLog.create({
      data: {
        source: 'pabbly',
        endpoint: '/api/webhook/meta',
        method: request.method,
        statusCode,
        payload: payload as object,
        error,
      },
    })
  } catch (e) {
    console.error('Failed to log webhook:', e)
  }
}

// ============================================
// HEALTH CHECK
// ============================================

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`
    return NextResponse.json({ status: 'healthy', database: 'connected' })
  } catch {
    return NextResponse.json(
      { status: 'unhealthy', database: 'disconnected' },
      { status: 503 }
    )
  }
}

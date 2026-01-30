import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { hashData } from '@/lib/crypto'

type Params = { params: Promise<{ workspaceId: string; webhookId: string }> }

// Webhook normalization types
interface NormalizedSale {
  transactionId: string
  status: 'PENDING' | 'APPROVED' | 'REFUNDED' | 'CHARGEBACK' | 'CANCELLED'
  amount: number
  currency: string
  productId?: string
  productName?: string
  customerEmail?: string
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  utmContent?: string
  utmTerm?: string
  saleDate: Date
  rawPayload: Record<string, unknown>
}

/**
 * POST /api/v1/webhooks/:workspaceId/:webhookId
 * Public endpoint - receives webhook payloads from external platforms
 */
export async function POST(request: NextRequest, { params }: Params) {
  const { workspaceId, webhookId } = await params

  // Get webhook configuration
  const webhook = await prisma.webhookEndpoint.findUnique({
    where: { id: webhookId, workspaceId },
  })

  if (!webhook) {
    return NextResponse.json({ error: 'Webhook not found' }, { status: 404 })
  }

  if (!webhook.isActive) {
    return NextResponse.json({ error: 'Webhook is inactive' }, { status: 403 })
  }

  // Parse body
  let payload: Record<string, unknown>
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
  }

  // Verify signature (if configured)
  const signature = request.headers.get('x-webhook-signature') ||
    request.headers.get('x-hotmart-hottok') ||
    request.headers.get('x-kiwify-signature') ||
    request.headers.get('stripe-signature')

  if (webhook.secretKey && signature) {
    const isValid = await verifySignature(webhook.platform, webhook.secretKey, signature, payload)
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }
  }

  // Normalize payload based on platform
  let normalized: NormalizedSale | null = null
  try {
    normalized = await normalizePayload(webhook.platform, payload)
  } catch (error) {
    console.error(`Failed to normalize ${webhook.platform} payload:`, error)
    // Still store the raw data even if normalization fails
  }

  // Hash email for privacy
  const emailHash = normalized?.customerEmail
    ? await hashData(normalized.customerEmail.toLowerCase())
    : null

  // Store the sale data
  await prisma.salesData.create({
    data: {
      workspaceId,
      webhookId,
      transactionId: normalized?.transactionId || `unknown_${Date.now()}`,
      status: normalized?.status || 'PENDING',
      amount: normalized?.amount || 0,
      currency: normalized?.currency || 'BRL',
      productId: normalized?.productId,
      productName: normalized?.productName,
      customerEmail: emailHash,
      utmSource: normalized?.utmSource,
      utmMedium: normalized?.utmMedium,
      utmCampaign: normalized?.utmCampaign,
      utmContent: normalized?.utmContent,
      utmTerm: normalized?.utmTerm,
      saleDate: normalized?.saleDate || new Date(),
      rawPayload: payload as Prisma.InputJsonValue,
    },
  })

  // Update webhook stats
  await prisma.webhookEndpoint.update({
    where: { id: webhookId },
    data: {
      lastReceivedAt: new Date(),
      totalReceived: { increment: 1 },
    },
  })

  return NextResponse.json({ success: true }, { status: 200 })
}

/**
 * Verify webhook signature based on platform
 */
async function verifySignature(
  platform: string,
  secret: string,
  signature: string,
  payload: Record<string, unknown>
): Promise<boolean> {
  const payloadString = JSON.stringify(payload)

  switch (platform) {
    case 'HOTMART': {
      // Hotmart uses hottok in the payload
      return payload.hottok === secret
    }
    case 'STRIPE': {
      // Stripe uses HMAC-SHA256
      const expectedSig = await computeHmac(secret, payloadString)
      return signature.includes(expectedSig)
    }
    case 'KIWIFY':
    case 'EDUZZ':
    case 'SHOPIFY':
    default: {
      // Generic HMAC-SHA256 verification
      const expectedSig = await computeHmac(secret, payloadString)
      return signature === expectedSig
    }
  }
}

/**
 * Compute HMAC-SHA256 signature
 */
async function computeHmac(secret: string, data: string): Promise<string> {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data))
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Normalize payload from different platforms
 */
async function normalizePayload(
  platform: string,
  payload: Record<string, unknown>
): Promise<NormalizedSale> {
  switch (platform) {
    case 'HOTMART':
      return normalizeHotmart(payload)
    case 'KIWIFY':
      return normalizeKiwify(payload)
    case 'EDUZZ':
      return normalizeEduzz(payload)
    case 'SHOPIFY':
      return normalizeShopify(payload)
    case 'STRIPE':
      return normalizeStripe(payload)
    default:
      return normalizeCustom(payload)
  }
}

function normalizeHotmart(payload: Record<string, unknown>): NormalizedSale {
  const data = payload.data as Record<string, unknown> | undefined
  const purchase = data?.purchase as Record<string, unknown> | undefined
  const buyer = data?.buyer as Record<string, unknown> | undefined
  const product = data?.product as Record<string, unknown> | undefined

  const statusMap: Record<string, NormalizedSale['status']> = {
    approved: 'APPROVED',
    completed: 'APPROVED',
    refunded: 'REFUNDED',
    chargeback: 'CHARGEBACK',
    cancelled: 'CANCELLED',
    billet_printed: 'PENDING',
    waiting_payment: 'PENDING',
  }

  return {
    transactionId: (purchase?.transaction as string) || String(Date.now()),
    status: statusMap[(purchase?.status as string)?.toLowerCase()] || 'PENDING',
    amount: (purchase?.price as Record<string, unknown>)?.value as number || 0,
    currency: (purchase?.price as Record<string, unknown>)?.currency_code as string || 'BRL',
    productId: String(product?.id || ''),
    productName: product?.name as string,
    customerEmail: buyer?.email as string,
    utmSource: (purchase?.tracking as Record<string, unknown>)?.source as string,
    utmMedium: (purchase?.tracking as Record<string, unknown>)?.medium as string,
    utmCampaign: (purchase?.tracking as Record<string, unknown>)?.campaign as string,
    saleDate: purchase?.approved_date
      ? new Date(purchase.approved_date as string)
      : new Date(),
    rawPayload: payload,
  }
}

function normalizeKiwify(payload: Record<string, unknown>): NormalizedSale {
  const statusMap: Record<string, NormalizedSale['status']> = {
    paid: 'APPROVED',
    refunded: 'REFUNDED',
    chargedback: 'CHARGEBACK',
    waiting_payment: 'PENDING',
  }

  const comissoes = payload.Comissoes as Record<string, unknown> | undefined
  const customer = payload.Customer as Record<string, unknown> | undefined
  const tracking = payload.TrackingParameters as Record<string, unknown> | undefined

  return {
    transactionId: (payload.order_id as string) || String(Date.now()),
    status: statusMap[(payload.order_status as string)?.toLowerCase()] || 'PENDING',
    amount: (comissoes?.produto_base as number) || (payload.product_price as number) || 0,
    currency: 'BRL',
    productId: payload.product_id as string,
    productName: payload.product_name as string,
    customerEmail: customer?.email as string,
    utmSource: tracking?.src as string,
    utmMedium: tracking?.utm_medium as string,
    utmCampaign: tracking?.utm_campaign as string,
    saleDate: payload.sale_date ? new Date(payload.sale_date as string) : new Date(),
    rawPayload: payload,
  }
}

function normalizeEduzz(payload: Record<string, unknown>): NormalizedSale {
  const statusMap: Record<string, NormalizedSale['status']> = {
    paid: 'APPROVED',
    refunded: 'REFUNDED',
    chargeback: 'CHARGEBACK',
    waiting_payment: 'PENDING',
  }

  return {
    transactionId: (payload.trans_cod as string) || String(Date.now()),
    status: statusMap[(payload.trans_status as string)?.toLowerCase()] || 'PENDING',
    amount: payload.trans_value as number || 0,
    currency: payload.trans_currency as string || 'BRL',
    productId: String(payload.product_cod || ''),
    productName: payload.product_name as string,
    customerEmail: payload.cus_email as string,
    utmSource: payload.tracker_source as string,
    saleDate: payload.trans_createdate
      ? new Date(payload.trans_createdate as string)
      : new Date(),
    rawPayload: payload,
  }
}

function normalizeShopify(payload: Record<string, unknown>): NormalizedSale {
  const statusMap: Record<string, NormalizedSale['status']> = {
    paid: 'APPROVED',
    refunded: 'REFUNDED',
    pending: 'PENDING',
  }

  const customer = payload.customer as Record<string, unknown> | undefined
  const lineItems = payload.line_items as Array<Record<string, unknown>> | undefined

  return {
    transactionId: String(payload.id || Date.now()),
    status: statusMap[(payload.financial_status as string)?.toLowerCase()] || 'PENDING',
    amount: parseFloat(payload.total_price as string) || 0,
    currency: payload.currency as string || 'USD',
    productId: lineItems?.[0]?.product_id ? String(lineItems[0].product_id) : undefined,
    productName: lineItems?.[0]?.title as string,
    customerEmail: customer?.email as string,
    utmSource: (payload.landing_site as string)?.includes('utm_source')
      ? new URL(payload.landing_site as string).searchParams.get('utm_source') || undefined
      : undefined,
    saleDate: payload.created_at ? new Date(payload.created_at as string) : new Date(),
    rawPayload: payload,
  }
}

function normalizeStripe(payload: Record<string, unknown>): NormalizedSale {
  const data = payload.data as Record<string, unknown> | undefined
  const object = data?.object as Record<string, unknown> | undefined
  const charges = object?.charges as Record<string, unknown> | undefined
  const chargeData = (charges?.data as Array<Record<string, unknown>>)?.[0]
  const customer = chargeData?.billing_details as Record<string, unknown> | undefined

  const statusMap: Record<string, NormalizedSale['status']> = {
    succeeded: 'APPROVED',
    'payment_intent.succeeded': 'APPROVED',
    'charge.refunded': 'REFUNDED',
    'charge.dispute.created': 'CHARGEBACK',
  }

  return {
    transactionId: (object?.id as string) || String(Date.now()),
    status: statusMap[payload.type as string] || 'PENDING',
    amount: ((object?.amount as number) || 0) / 100, // Stripe uses cents
    currency: (object?.currency as string)?.toUpperCase() || 'USD',
    productId: object?.metadata
      ? (object.metadata as Record<string, unknown>).product_id as string
      : undefined,
    productName: object?.metadata
      ? (object.metadata as Record<string, unknown>).product_name as string
      : undefined,
    customerEmail: customer?.email as string,
    utmSource: object?.metadata
      ? (object.metadata as Record<string, unknown>).utm_source as string
      : undefined,
    utmMedium: object?.metadata
      ? (object.metadata as Record<string, unknown>).utm_medium as string
      : undefined,
    utmCampaign: object?.metadata
      ? (object.metadata as Record<string, unknown>).utm_campaign as string
      : undefined,
    saleDate: object?.created
      ? new Date((object.created as number) * 1000)
      : new Date(),
    rawPayload: payload,
  }
}

function normalizeCustom(payload: Record<string, unknown>): NormalizedSale {
  // Generic normalization for custom webhooks
  // Tries to find common field names
  return {
    transactionId:
      (payload.transaction_id as string) ||
      (payload.transactionId as string) ||
      (payload.order_id as string) ||
      (payload.id as string) ||
      String(Date.now()),
    status:
      ((payload.status as string)?.toUpperCase() as NormalizedSale['status']) || 'PENDING',
    amount:
      (payload.amount as number) ||
      (payload.value as number) ||
      (payload.total as number) ||
      0,
    currency: (payload.currency as string) || 'BRL',
    productId: (payload.product_id as string) || (payload.productId as string),
    productName: (payload.product_name as string) || (payload.productName as string),
    customerEmail: (payload.email as string) || (payload.customer_email as string),
    utmSource: (payload.utm_source as string),
    utmMedium: (payload.utm_medium as string),
    utmCampaign: (payload.utm_campaign as string),
    saleDate: payload.date
      ? new Date(payload.date as string)
      : payload.created_at
        ? new Date(payload.created_at as string)
        : new Date(),
    rawPayload: payload,
  }
}

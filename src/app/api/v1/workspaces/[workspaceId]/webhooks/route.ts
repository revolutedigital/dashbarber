import { NextRequest } from 'next/server'
import type { WebhookPlatform } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/api/response'
import { requireWorkspaceAuth, isAuthError } from '@/lib/api/auth-guard'
import { generateSecureId } from '@/lib/crypto'

type Params = { params: Promise<{ workspaceId: string }> }

/**
 * GET /api/v1/workspaces/:id/webhooks - List webhook endpoints
 */
export async function GET(request: NextRequest, { params }: Params) {
  const { workspaceId } = await params
  const authResult = await requireWorkspaceAuth(request, workspaceId, 'webhooks.read')
  if (isAuthError(authResult)) return authResult

  const webhooks = await prisma.webhookEndpoint.findMany({
    where: { workspaceId },
    select: {
      id: true,
      name: true,
      platform: true,
      isActive: true,
      lastReceivedAt: true,
      totalReceived: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  // Add URL to each webhook
  const baseUrl = process.env.NEXTAUTH_URL || 'https://revdata.app'
  const webhooksWithUrl = webhooks.map((w) => ({
    ...w,
    url: `${baseUrl}/api/v1/webhooks/${workspaceId}/${w.id}`,
  }))

  return successResponse(webhooksWithUrl)
}

/**
 * POST /api/v1/workspaces/:id/webhooks - Create a webhook endpoint
 */
export async function POST(request: NextRequest, { params }: Params) {
  const { workspaceId } = await params
  const authResult = await requireWorkspaceAuth(request, workspaceId, 'webhooks.create')
  if (isAuthError(authResult)) return authResult

  const body = await request.json()
  const { name, platform } = body as { name: string; platform: string }

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return errorResponse('VALIDATION', 'Nome do webhook deve ter pelo menos 2 caracteres')
  }

  const validPlatforms: WebhookPlatform[] = ['HOTMART', 'KIWIFY', 'EDUZZ', 'SHOPIFY', 'STRIPE', 'CUSTOM']
  if (!validPlatforms.includes(platform as WebhookPlatform)) {
    return errorResponse('VALIDATION', `Plataforma inválida. Use: ${validPlatforms.join(', ')}`)
  }

  // Generate secure secret for signature verification
  const secretKey = generateSecureId(32)

  const webhook = await prisma.webhookEndpoint.create({
    data: {
      workspaceId,
      name: name.trim(),
      platform: platform as WebhookPlatform,
      secretKey,
    },
    select: {
      id: true,
      name: true,
      platform: true,
      secretKey: true,
      isActive: true,
      createdAt: true,
    },
  })

  // Return with URL
  const baseUrl = process.env.NEXTAUTH_URL || 'https://revdata.app'

  return successResponse(
    {
      ...webhook,
      url: `${baseUrl}/api/v1/webhooks/${workspaceId}/${webhook.id}`,
    },
    undefined,
    201
  )
}

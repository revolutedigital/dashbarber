import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, notFoundResponse } from '@/lib/api/response'
import { requireWorkspaceAuth, isAuthError } from '@/lib/api/auth-guard'
import { generateSecureId } from '@/lib/crypto'

type Params = { params: Promise<{ workspaceId: string; webhookId: string }> }

/**
 * GET /api/v1/workspaces/:id/webhooks/:webhookId - Get webhook details
 */
export async function GET(request: NextRequest, { params }: Params) {
  const { workspaceId, webhookId } = await params
  const authResult = await requireWorkspaceAuth(request, workspaceId, 'webhooks.read')
  if (isAuthError(authResult)) return authResult

  const webhook = await prisma.webhookEndpoint.findUnique({
    where: { id: webhookId, workspaceId },
  })

  if (!webhook) {
    return notFoundResponse('Webhook')
  }

  const baseUrl = process.env.NEXTAUTH_URL || 'https://revdata.app'

  return successResponse({
    ...webhook,
    url: `${baseUrl}/api/v1/webhooks/${workspaceId}/${webhook.id}`,
  })
}

/**
 * PATCH /api/v1/workspaces/:id/webhooks/:webhookId - Update webhook
 */
export async function PATCH(request: NextRequest, { params }: Params) {
  const { workspaceId, webhookId } = await params
  const authResult = await requireWorkspaceAuth(request, workspaceId, 'webhooks.update')
  if (isAuthError(authResult)) return authResult

  const existing = await prisma.webhookEndpoint.findUnique({
    where: { id: webhookId, workspaceId },
  })

  if (!existing) {
    return notFoundResponse('Webhook')
  }

  const body = await request.json()
  const { name, isActive, regenerateSecret } = body

  const updateData: Record<string, unknown> = {}
  if (name && typeof name === 'string') updateData.name = name.trim()
  if (typeof isActive === 'boolean') updateData.isActive = isActive
  if (regenerateSecret === true) updateData.secretKey = generateSecureId(32)

  if (Object.keys(updateData).length === 0) {
    return errorResponse('VALIDATION', 'Nenhum campo para atualizar')
  }

  const webhook = await prisma.webhookEndpoint.update({
    where: { id: webhookId },
    data: updateData,
  })

  const baseUrl = process.env.NEXTAUTH_URL || 'https://revdata.app'

  return successResponse({
    ...webhook,
    url: `${baseUrl}/api/v1/webhooks/${workspaceId}/${webhook.id}`,
  })
}

/**
 * DELETE /api/v1/workspaces/:id/webhooks/:webhookId - Delete webhook
 */
export async function DELETE(request: NextRequest, { params }: Params) {
  const { workspaceId, webhookId } = await params
  const authResult = await requireWorkspaceAuth(request, workspaceId, 'webhooks.delete')
  if (isAuthError(authResult)) return authResult

  const existing = await prisma.webhookEndpoint.findUnique({
    where: { id: webhookId, workspaceId },
  })

  if (!existing) {
    return notFoundResponse('Webhook')
  }

  await prisma.webhookEndpoint.delete({ where: { id: webhookId } })

  return successResponse({ deleted: true })
}

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse } from '@/lib/api/response'
import { requireWorkspaceAuth, isAuthError } from '@/lib/api/auth-guard'

type Params = { params: Promise<{ workspaceId: string }> }

/**
 * GET /api/v1/workspaces/:id/sales - Get sales data
 * Query params:
 *   - startDate: YYYY-MM-DD
 *   - endDate: YYYY-MM-DD
 *   - status: PENDING | APPROVED | REFUNDED | CHARGEBACK | CANCELLED
 *   - webhookId: filter by specific webhook
 *   - page: number (default 1)
 *   - limit: number (default 50)
 */
export async function GET(request: NextRequest, { params }: Params) {
  const { workspaceId } = await params
  const authResult = await requireWorkspaceAuth(request, workspaceId, 'sales.read')
  if (isAuthError(authResult)) return authResult

  const { searchParams } = request.nextUrl

  // Parse date range
  const endDate = searchParams.get('endDate')
    ? new Date(searchParams.get('endDate')!)
    : new Date()
  const startDate = searchParams.get('startDate')
    ? new Date(searchParams.get('startDate')!)
    : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  // Pagination
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50')))
  const skip = (page - 1) * limit

  // Optional filters
  const status = searchParams.get('status')
  const webhookId = searchParams.get('webhookId')

  // Build where clause
  const where: Record<string, unknown> = {
    workspaceId,
    saleDate: {
      gte: startDate,
      lte: endDate,
    },
  }

  if (status) where.status = status
  if (webhookId) where.webhookId = webhookId

  // Get sales with count
  const [sales, total] = await Promise.all([
    prisma.salesData.findMany({
      where,
      orderBy: { saleDate: 'desc' },
      skip,
      take: limit,
      include: {
        webhook: {
          select: { name: true, platform: true },
        },
      },
    }),
    prisma.salesData.count({ where }),
  ])

  // Calculate totals by status
  const statusTotals = await prisma.salesData.groupBy({
    by: ['status'],
    where: {
      workspaceId,
      saleDate: { gte: startDate, lte: endDate },
    },
    _sum: { amount: true },
    _count: true,
  })

  const totals = {
    total: 0,
    approved: 0,
    refunded: 0,
    pending: 0,
    count: {
      total: total,
      approved: 0,
      refunded: 0,
      pending: 0,
    },
  }

  for (const s of statusTotals) {
    const amount = Number(s._sum.amount) || 0
    totals.total += amount
    totals.count.total += s._count

    if (s.status === 'APPROVED') {
      totals.approved = amount
      totals.count.approved = s._count
    } else if (s.status === 'REFUNDED' || s.status === 'CHARGEBACK') {
      totals.refunded += amount
      totals.count.refunded += s._count
    } else {
      totals.pending += amount
      totals.count.pending += s._count
    }
  }

  return successResponse({
    period: {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    },
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
    totals,
    sales,
  })
}

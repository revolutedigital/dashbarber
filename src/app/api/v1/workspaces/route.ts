import { NextRequest } from 'next/server'
import { auth } from '@/auth/auth'
import { prisma } from '@/lib/prisma'
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
} from '@/lib/api/response'

/**
 * GET /api/v1/workspaces - List user's workspaces
 */
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return unauthorizedResponse()

  const memberships = await prisma.workspaceMember.findMany({
    where: { userId: session.user.id },
    include: {
      workspace: {
        include: {
          _count: {
            select: {
              members: true,
              adAccounts: true,
              webhookEndpoints: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  })

  const workspaces = memberships.map((m) => ({
    id: m.workspace.id,
    name: m.workspace.name,
    slug: m.workspace.slug,
    plan: m.workspace.plan,
    role: m.role,
    membersCount: m.workspace._count.members,
    adAccountsCount: m.workspace._count.adAccounts,
    webhooksCount: m.workspace._count.webhookEndpoints,
    createdAt: m.workspace.createdAt,
  }))

  return successResponse(workspaces)
}

/**
 * POST /api/v1/workspaces - Create a new workspace
 */
export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return unauthorizedResponse()

  const body = await request.json()
  const { name } = body

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return errorResponse('VALIDATION', 'Nome do workspace deve ter pelo menos 2 caracteres')
  }

  // Generate slug
  const baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 30)

  const slug = `${baseSlug}-${Math.random().toString(36).slice(2, 8)}`

  const workspace = await prisma.workspace.create({
    data: {
      name: name.trim(),
      slug,
      members: {
        create: {
          userId: session.user.id,
          role: 'OWNER',
        },
      },
    },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true, image: true } } },
      },
    },
  })

  return successResponse(workspace, undefined, 201)
}

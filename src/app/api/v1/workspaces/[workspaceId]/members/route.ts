import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, notFoundResponse } from '@/lib/api/response'
import { requireWorkspaceAuth, isAuthError } from '@/lib/api/auth-guard'
import { isRoleHigherThan } from '@/lib/auth/permissions'
import type { Role } from '@prisma/client'

type Params = { params: Promise<{ workspaceId: string }> }

/**
 * GET /api/v1/workspaces/:id/members - List workspace members
 */
export async function GET(request: NextRequest, { params }: Params) {
  const { workspaceId } = await params
  const authResult = await requireWorkspaceAuth(request, workspaceId, 'members.read')
  if (isAuthError(authResult)) return authResult

  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId },
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
    },
    orderBy: { createdAt: 'asc' },
  })

  return successResponse(members)
}

/**
 * POST /api/v1/workspaces/:id/members - Invite a member
 */
export async function POST(request: NextRequest, { params }: Params) {
  const { workspaceId } = await params
  const authResult = await requireWorkspaceAuth(request, workspaceId, 'members.invite')
  if (isAuthError(authResult)) return authResult

  const body = await request.json()
  const { email, role = 'VIEWER' } = body as { email: string; role?: Role }

  if (!email || typeof email !== 'string') {
    return errorResponse('VALIDATION', 'Email é obrigatório')
  }

  // Validate role
  const validRoles: Role[] = ['ADMIN', 'EDITOR', 'VIEWER']
  if (!validRoles.includes(role)) {
    return errorResponse('VALIDATION', 'Role inválida')
  }

  // Cannot assign role higher than own
  if (isRoleHigherThan(role, authResult.role)) {
    return errorResponse('FORBIDDEN', 'Não pode atribuir role superior à sua')
  }

  // Find user by email
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    return notFoundResponse('Usuário com esse email')
  }

  // Check if already a member
  const existing = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId: user.id } },
  })

  if (existing) {
    return errorResponse('CONFLICT', 'Usuário já é membro deste workspace', 409)
  }

  const member = await prisma.workspaceMember.create({
    data: {
      workspaceId,
      userId: user.id,
      role,
    },
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
    },
  })

  return successResponse(member, undefined, 201)
}

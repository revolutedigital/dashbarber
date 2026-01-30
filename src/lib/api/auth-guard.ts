import { NextRequest } from 'next/server'
import { auth } from '@/auth/auth'
import { prisma } from '@/lib/prisma'
import { type Permission, hasPermission } from '@/lib/auth/permissions'
import { unauthorizedResponse, forbiddenResponse, notFoundResponse } from './response'
import type { Role } from '@prisma/client'

export interface AuthContext {
  userId: string
  workspaceId: string
  role: Role
}

/**
 * Validates that the request is authenticated and the user has access to the workspace
 * Returns the auth context or a NextResponse error
 */
export async function requireWorkspaceAuth(
  request: NextRequest,
  workspaceId: string,
  requiredPermission?: Permission
): Promise<AuthContext | ReturnType<typeof unauthorizedResponse>> {
  // Get session
  const session = await auth()

  if (!session?.user?.id) {
    return unauthorizedResponse()
  }

  // Check workspace membership
  const member = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId,
        userId: session.user.id,
      },
    },
  })

  if (!member) {
    return notFoundResponse('Workspace')
  }

  // Check permission if required
  if (requiredPermission && !hasPermission(member.role, requiredPermission)) {
    return forbiddenResponse('Você não tem permissão para esta ação')
  }

  return {
    userId: session.user.id,
    workspaceId,
    role: member.role,
  }
}

/**
 * Check if the result is an error response
 */
export function isAuthError(
  result: AuthContext | ReturnType<typeof unauthorizedResponse>
): result is ReturnType<typeof unauthorizedResponse> {
  return result instanceof Response
}

/**
 * Simple auth check (no workspace required)
 */
export async function requireAuth(): Promise<
  { userId: string } | ReturnType<typeof unauthorizedResponse>
> {
  const session = await auth()

  if (!session?.user?.id) {
    return unauthorizedResponse()
  }

  return { userId: session.user.id }
}

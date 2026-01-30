'use client'

import { createContext, useContext, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { useParams } from 'next/navigation'
import type { Role } from '@prisma/client'

interface WorkspaceContext {
  workspaceId: string | null
  workspaceSlug: string | null
  workspaceName: string | null
  role: Role | null
  workspaces: Array<{
    id: string
    name: string
    slug: string
    role: Role
  }>
  isLoading: boolean
}

const WorkspaceCtx = createContext<WorkspaceContext>({
  workspaceId: null,
  workspaceSlug: null,
  workspaceName: null,
  role: null,
  workspaces: [],
  isLoading: true,
})

export function useWorkspace() {
  return useContext(WorkspaceCtx)
}

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const params = useParams()
  const workspaceSlug = params?.workspaceSlug as string | undefined

  const value = useMemo<WorkspaceContext>(() => {
    const workspaces = session?.user?.workspaces ?? []
    const current = workspaceSlug
      ? workspaces.find((w) => w.slug === workspaceSlug)
      : workspaces[0] || null

    return {
      workspaceId: current?.id ?? null,
      workspaceSlug: current?.slug ?? null,
      workspaceName: current?.name ?? null,
      role: current?.role ?? null,
      workspaces,
      isLoading: status === 'loading',
    }
  }, [session, workspaceSlug, status])

  return <WorkspaceCtx.Provider value={value}>{children}</WorkspaceCtx.Provider>
}

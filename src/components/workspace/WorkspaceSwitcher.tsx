'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check, Plus, LogOut } from 'lucide-react'
import { useWorkspace } from '@/components/providers/WorkspaceProvider'
import { signOut } from 'next-auth/react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export function WorkspaceSwitcher() {
  const { workspaceSlug, workspaceName, workspaces } = useWorkspace()
  const { data: session } = useSession()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-secondary transition-colors text-sm"
      >
        <div className="w-6 h-6 rounded-md bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
          {(workspaceName || 'W')[0].toUpperCase()}
        </div>
        <span className="font-medium text-foreground max-w-[120px] truncate">
          {workspaceName || 'Workspace'}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-64 rounded-lg border border-border bg-popover shadow-lg z-50">
          {/* User info */}
          <div className="px-3 py-2 border-b border-border">
            <p className="text-sm font-medium text-foreground truncate">{session?.user?.name}</p>
            <p className="text-xs text-muted-foreground truncate">{session?.user?.email}</p>
          </div>

          {/* Workspaces */}
          <div className="py-1">
            <p className="px-3 py-1 text-xs text-muted-foreground font-medium">Workspaces</p>
            {workspaces.map((w) => (
              <button
                key={w.id}
                onClick={() => {
                  router.push(`/${w.slug}`)
                  setOpen(false)
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-secondary transition-colors"
              >
                <div className="w-5 h-5 rounded bg-gradient-to-br from-indigo-500/80 to-purple-600/80 flex items-center justify-center text-white text-[10px] font-bold">
                  {w.name[0].toUpperCase()}
                </div>
                <span className="flex-1 text-left truncate text-foreground">{w.name}</span>
                {w.slug === workspaceSlug && (
                  <Check className="w-4 h-4 text-primary" />
                )}
                <span className="text-[10px] text-muted-foreground">{w.role}</span>
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="border-t border-border py-1">
            <button
              onClick={() => {
                router.push(`/${workspaceSlug}/settings`)
                setOpen(false)
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-secondary transition-colors"
            >
              <Plus className="w-4 h-4" />
              Novo workspace
            </button>
            <button
              onClick={() => signOut({ callbackUrl: '/auth/signin' })}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-secondary transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

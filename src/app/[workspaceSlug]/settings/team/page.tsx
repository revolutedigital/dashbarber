'use client'

import { useState, useEffect, useCallback } from 'react'
import { useWorkspace } from '@/components/providers/WorkspaceProvider'
import { ArrowLeft, UserPlus, Trash2, Shield } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

interface Member {
  id: string
  role: string
  user: {
    id: string
    name: string | null
    email: string
    image: string | null
  }
}

const ROLE_LABELS: Record<string, string> = {
  OWNER: 'Proprietário',
  ADMIN: 'Administrador',
  EDITOR: 'Editor',
  VIEWER: 'Visualizador',
}

export default function TeamPage() {
  const { workspaceId, role: currentRole } = useWorkspace()
  const params = useParams()
  const slug = params.workspaceSlug as string
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('VIEWER')
  const [inviting, setInviting] = useState(false)

  const canManage = currentRole === 'OWNER' || currentRole === 'ADMIN'

  const fetchMembers = useCallback(async () => {
    if (!workspaceId) return
    try {
      const res = await fetch(`/api/v1/workspaces/${workspaceId}/members`)
      const json = await res.json()
      if (json.data) setMembers(json.data)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [workspaceId])

  useEffect(() => {
    fetchMembers()
  }, [fetchMembers])

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!workspaceId || !inviteEmail) return
    setInviting(true)
    try {
      await fetch(`/api/v1/workspaces/${workspaceId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      })
      setInviteEmail('')
      await fetchMembers()
    } finally {
      setInviting(false)
    }
  }

  const handleRemove = async (memberId: string) => {
    if (!workspaceId || !confirm('Remover este membro?')) return
    await fetch(`/api/v1/workspaces/${workspaceId}/members`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId }),
    })
    await fetchMembers()
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Link href={`/${slug}/settings`} className="p-2 rounded-lg hover:bg-secondary transition-colors">
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-foreground">Equipe</h1>
            <p className="text-sm text-muted-foreground">Membros do workspace</p>
          </div>
        </div>

        {/* Invite form */}
        {canManage && (
          <form onSubmit={handleInvite} className="flex gap-2 mb-6">
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="email@exemplo.com"
              className="flex-1 px-3 py-2 rounded-lg border border-border bg-secondary text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="px-3 py-2 rounded-lg border border-border bg-secondary text-foreground text-sm"
            >
              <option value="VIEWER">Visualizador</option>
              <option value="EDITOR">Editor</option>
              <option value="ADMIN">Admin</option>
            </select>
            <button
              type="submit"
              disabled={inviting}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50"
            >
              <UserPlus className="w-4 h-4" />
              Convidar
            </button>
          </form>
        )}

        {/* Members list */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Carregando...</div>
        ) : (
          <div className="space-y-2">
            {members.map((m) => (
              <div key={m.id} className="flex items-center justify-between p-4 rounded-lg border border-border bg-card">
                <div className="flex items-center gap-3">
                  {m.user.image ? (
                    <img src={m.user.image} alt="" className="w-8 h-8 rounded-full" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                      {(m.user.name || m.user.email)[0].toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-foreground text-sm">{m.user.name || m.user.email}</p>
                    <p className="text-xs text-muted-foreground">{m.user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground px-2 py-1 rounded bg-secondary">
                    <Shield className="w-3 h-3" />
                    {ROLE_LABELS[m.role] || m.role}
                  </span>
                  {canManage && m.role !== 'OWNER' && (
                    <button
                      onClick={() => handleRemove(m.id)}
                      className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useWorkspace } from '@/components/providers/WorkspaceProvider'
import { ArrowLeft, Plug, RefreshCw, Trash2, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

interface AdAccountConnection {
  id: string
  platform: 'GOOGLE_ADS' | 'META_ADS'
  accountId: string
  accountName: string | null
  syncStatus: string
  lastSyncAt: string | null
  createdAt: string
}

export default function ConnectionsPage() {
  const { workspaceId } = useWorkspace()
  const params = useParams()
  const slug = params.workspaceSlug as string
  const [connections, setConnections] = useState<AdAccountConnection[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState<string | null>(null)

  const fetchConnections = useCallback(async () => {
    if (!workspaceId) return
    try {
      const res = await fetch(`/api/v1/workspaces/${workspaceId}/ad-accounts`)
      const json = await res.json()
      if (json.data) setConnections(json.data)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [workspaceId])

  useEffect(() => {
    fetchConnections()
  }, [fetchConnections])

  const handleSync = async (accountId: string) => {
    if (!workspaceId) return
    setSyncing(accountId)
    try {
      await fetch(`/api/v1/workspaces/${workspaceId}/ad-accounts/${accountId}/sync`, {
        method: 'POST',
      })
      await fetchConnections()
    } finally {
      setSyncing(null)
    }
  }

  const handleDisconnect = async (accountId: string) => {
    if (!workspaceId || !confirm('Desconectar esta conta?')) return
    await fetch(`/api/v1/workspaces/${workspaceId}/ad-accounts/${accountId}`, {
      method: 'DELETE',
    })
    await fetchConnections()
  }

  const platformLabel = (p: string) => p === 'GOOGLE_ADS' ? 'Google Ads' : 'Meta Ads'
  const platformColor = (p: string) => p === 'GOOGLE_ADS' ? 'text-blue-500' : 'text-blue-600'

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Link href={`/${slug}/settings`} className="p-2 rounded-lg hover:bg-secondary transition-colors">
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-foreground">Conexões</h1>
            <p className="text-sm text-muted-foreground">Contas de anúncio conectadas</p>
          </div>
        </div>

        {/* Connect buttons */}
        <div className="flex gap-3 mb-6">
          <a
            href={`/api/v1/workspaces/${workspaceId}/ad-accounts/connect/google`}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border bg-card hover:bg-secondary transition-colors text-sm font-medium"
          >
            <ExternalLink className="w-4 h-4" />
            Conectar Google Ads
          </a>
          <a
            href={`/api/v1/workspaces/${workspaceId}/ad-accounts/connect/meta`}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border bg-card hover:bg-secondary transition-colors text-sm font-medium"
          >
            <ExternalLink className="w-4 h-4" />
            Conectar Meta Ads
          </a>
        </div>

        {/* Connections list */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Carregando...</div>
        ) : connections.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-border rounded-lg">
            <Plug className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground">Nenhuma conta conectada</p>
            <p className="text-sm text-muted-foreground mt-1">Conecte sua conta de Google Ads ou Meta Ads</p>
          </div>
        ) : (
          <div className="space-y-3">
            {connections.map((conn) => (
              <div key={conn.id} className="flex items-center justify-between p-4 rounded-lg border border-border bg-card">
                <div className="flex items-center gap-3">
                  <div className={`text-sm font-bold ${platformColor(conn.platform)}`}>
                    {conn.platform === 'GOOGLE_ADS' ? 'G' : 'M'}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{conn.accountName || conn.accountId}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{platformLabel(conn.platform)}</span>
                      <span>·</span>
                      <span className={conn.syncStatus === 'SYNCED' ? 'text-emerald-500' : conn.syncStatus === 'SYNCING' ? 'text-amber-500' : 'text-muted-foreground'}>
                        {conn.syncStatus}
                      </span>
                      {conn.lastSyncAt && (
                        <>
                          <span>·</span>
                          <span>Sync: {new Date(conn.lastSyncAt).toLocaleString('pt-BR')}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleSync(conn.id)}
                    disabled={syncing === conn.id}
                    className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                    title="Sincronizar"
                  >
                    <RefreshCw className={`w-4 h-4 ${syncing === conn.id ? 'animate-spin' : ''}`} />
                  </button>
                  <button
                    onClick={() => handleDisconnect(conn.id)}
                    className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-destructive"
                    title="Desconectar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

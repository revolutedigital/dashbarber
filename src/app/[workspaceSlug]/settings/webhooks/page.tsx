'use client'

import { useState, useEffect, useCallback } from 'react'
import { useWorkspace } from '@/components/providers/WorkspaceProvider'
import { ArrowLeft, Plus, Trash2, Copy, Check, Webhook as WebhookIcon } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

interface WebhookEndpoint {
  id: string
  name: string
  platform: string
  isActive: boolean
  url: string
  secretKey: string
  createdAt: string
  _count?: { salesData: number }
}

const PLATFORMS = [
  { value: 'HOTMART', label: 'Hotmart' },
  { value: 'KIWIFY', label: 'Kiwify' },
  { value: 'EDUZZ', label: 'Eduzz' },
  { value: 'SHOPIFY', label: 'Shopify' },
  { value: 'STRIPE', label: 'Stripe' },
  { value: 'CUSTOM', label: 'Custom' },
]

export default function WebhooksPage() {
  const { workspaceId } = useWorkspace()
  const params = useParams()
  const slug = params.workspaceSlug as string
  const [webhooks, setWebhooks] = useState<WebhookEndpoint[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newPlatform, setNewPlatform] = useState('HOTMART')
  const [creating, setCreating] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)

  const fetchWebhooks = useCallback(async () => {
    if (!workspaceId) return
    try {
      const res = await fetch(`/api/v1/workspaces/${workspaceId}/webhooks`)
      const json = await res.json()
      if (json.data) setWebhooks(json.data)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [workspaceId])

  useEffect(() => {
    fetchWebhooks()
  }, [fetchWebhooks])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!workspaceId || !newName) return
    setCreating(true)
    try {
      await fetch(`/api/v1/workspaces/${workspaceId}/webhooks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, platform: newPlatform }),
      })
      setNewName('')
      setShowCreate(false)
      await fetchWebhooks()
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (webhookId: string) => {
    if (!workspaceId || !confirm('Excluir este webhook?')) return
    await fetch(`/api/v1/workspaces/${workspaceId}/webhooks/${webhookId}`, {
      method: 'DELETE',
    })
    await fetchWebhooks()
  }

  const copyUrl = (id: string, url: string) => {
    navigator.clipboard.writeText(url)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Link href={`/${slug}/settings`} className="p-2 rounded-lg hover:bg-secondary transition-colors">
              <ArrowLeft className="w-5 h-5 text-muted-foreground" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-foreground">Webhooks</h1>
              <p className="text-sm text-muted-foreground">Receba dados de vendas automaticamente</p>
            </div>
          </div>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90"
          >
            <Plus className="w-4 h-4" />
            Novo
          </button>
        </div>

        {/* Create form */}
        {showCreate && (
          <form onSubmit={handleCreate} className="p-4 rounded-lg border border-border bg-card mb-6 space-y-3">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nome do webhook"
              className="w-full px-3 py-2 rounded-lg border border-border bg-secondary text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
            <select
              value={newPlatform}
              onChange={(e) => setNewPlatform(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-secondary text-foreground text-sm"
            >
              {PLATFORMS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-secondary"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={creating}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
              >
                Criar
              </button>
            </div>
          </form>
        )}

        {/* Webhooks list */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Carregando...</div>
        ) : webhooks.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-border rounded-lg">
            <WebhookIcon className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground">Nenhum webhook configurado</p>
            <p className="text-sm text-muted-foreground mt-1">Crie um webhook para receber dados de vendas</p>
          </div>
        ) : (
          <div className="space-y-3">
            {webhooks.map((wh) => (
              <div key={wh.id} className="p-4 rounded-lg border border-border bg-card space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">{wh.name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="px-1.5 py-0.5 rounded bg-secondary">{wh.platform}</span>
                      <span className={wh.isActive ? 'text-emerald-500' : 'text-red-500'}>
                        {wh.isActive ? 'Ativo' : 'Inativo'}
                      </span>
                      {wh._count && <span>{wh._count.salesData} vendas</span>}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(wh.id)}
                    className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-secondary px-3 py-2 rounded truncate text-muted-foreground">
                    {wh.url || `${typeof window !== 'undefined' ? window.location.origin : ''}/api/v1/webhooks/${workspaceId}/${wh.id}`}
                  </code>
                  <button
                    onClick={() => copyUrl(wh.id, wh.url || `${window.location.origin}/api/v1/webhooks/${workspaceId}/${wh.id}`)}
                    className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground"
                  >
                    {copied === wh.id ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
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

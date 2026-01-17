'use client'

import { memo } from 'react'
import { BarChart3, Filter, Settings, RefreshCw, Plus } from 'lucide-react'
import { Funnel } from '@/types/metrics'

interface FunnelWithColor extends Funnel {
  color?: string
}

interface DashboardHeaderProps {
  funnels: FunnelWithColor[]
  selectedFunnel: string
  onFunnelChange: (value: string) => void
  showSettings: boolean
  onToggleSettings: () => void
  loading: boolean
  onRefresh: () => void
  usingMock: boolean
  onCreateFunnel?: () => void
}

export const DashboardHeader = memo(function DashboardHeader({
  funnels,
  selectedFunnel,
  onFunnelChange,
  showSettings,
  onToggleSettings,
  loading,
  onRefresh,
  usingMock,
  onCreateFunnel,
}: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-50 glass border-b border-border/50">
      <div className="max-w-[1600px] mx-auto px-6 py-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Branding */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/25">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">
                  <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                    Traffic
                  </span>
                  <span className="text-foreground">Hub</span>
                </h1>
                <p className="text-xs text-muted-foreground font-medium">
                  Meta Ads Analytics
                </p>
              </div>
            </div>

            {/* Status Badge */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <div className="w-2 h-2 rounded-full bg-emerald-500 pulse-live" />
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                {usingMock ? 'Demo' : 'Live'}
              </span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            {/* Funnel Selector - Touch target compliant */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-2 min-h-[44px] rounded-lg bg-muted/50 border border-border/50">
                <Filter className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <select
                  value={selectedFunnel}
                  onChange={(e) => onFunnelChange(e.target.value)}
                  className="bg-transparent text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer min-h-[44px]"
                  aria-label="Selecionar funil"
                >
                  <option value="all">Todos os Funis</option>
                  {funnels.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.color && '● '}{f.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Create Funnel Button */}
              {onCreateFunnel && (
                <button
                  onClick={onCreateFunnel}
                  className="min-w-[44px] min-h-[44px] p-2.5 rounded-lg border border-dashed border-border/50 hover:bg-muted/50 hover:border-primary/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  aria-label="Criar novo funil"
                  title="Criar novo funil"
                >
                  <Plus className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                </button>
              )}
            </div>

            <button
              onClick={onToggleSettings}
              className={`min-w-[44px] min-h-[44px] p-2.5 rounded-lg border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                showSettings
                  ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/25'
                  : 'border-border/50 hover:bg-muted/50 hover:border-border'
              }`}
              aria-label={showSettings ? 'Fechar configuracoes' : 'Abrir configuracoes'}
              aria-expanded={showSettings}
            >
              <Settings className="h-5 w-5" aria-hidden="true" />
            </button>

            <button
              onClick={onRefresh}
              disabled={loading}
              className="flex items-center gap-2 px-4 min-h-[44px] bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-lg font-medium text-sm shadow-lg shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/30 transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50"
              aria-label={loading ? 'Atualizando dados' : 'Atualizar dados'}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
              <span>{loading ? 'Atualizando...' : 'Atualizar'}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  )
})

DashboardHeader.displayName = 'DashboardHeader'

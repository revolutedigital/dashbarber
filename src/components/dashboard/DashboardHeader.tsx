'use client'

import { memo } from 'react'
import { BarChart3, ChevronDown, RefreshCw, Settings } from 'lucide-react'
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
}: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-lg border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">
                DashBarber
              </h1>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground">by RevData</span>
                <span className="text-muted-foreground/30">|</span>
                <div className={`w-1.5 h-1.5 rounded-full ${usingMock ? 'bg-amber-500' : 'bg-emerald-500'} pulse-live`} />
                <span className="text-[10px] text-muted-foreground">
                  {usingMock ? 'Demo' : 'Live'}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Funnel Selector */}
            <div className="relative">
              <select
                value={selectedFunnel}
                onChange={(e) => onFunnelChange(e.target.value)}
                className="appearance-none bg-secondary text-foreground text-sm font-medium px-4 py-2.5 pr-9 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent cursor-pointer"
              >
                <option value="all">Todos os Funis</option>
                {funnels.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>

            {/* Settings */}
            <button
              onClick={onToggleSettings}
              className={`
                p-2.5 rounded-lg border transition-all
                ${showSettings
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-secondary text-foreground border-border hover:bg-muted'
                }
              `}
              title="Configuracoes"
            >
              <Settings className="w-5 h-5" />
            </button>

            {/* Refresh */}
            <button
              onClick={onRefresh}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{loading ? 'Atualizando...' : 'Atualizar'}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  )
})

DashboardHeader.displayName = 'DashboardHeader'

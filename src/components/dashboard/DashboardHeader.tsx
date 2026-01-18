'use client'

import { memo, useState } from 'react'
import { BarChart3, ChevronDown, RefreshCw, Settings, Sun, Moon, Download, Menu, X } from 'lucide-react'
import { Funnel } from '@/types/metrics'
import { DateFilter, DateRange } from './DateFilter'

interface FunnelWithColor extends Funnel {
  color?: string
}

interface DashboardHeaderProps {
  funnels: FunnelWithColor[]
  selectedFunnel: string
  onFunnelChange: (value: string) => void
  dateRange: DateRange
  onDateRangeChange: (value: DateRange) => void
  showSettings: boolean
  onToggleSettings: () => void
  loading: boolean
  onRefresh: () => void
  usingMock: boolean
  isDark: boolean
  onToggleTheme: () => void
  onExport?: () => void
}

export const DashboardHeader = memo(function DashboardHeader({
  funnels,
  selectedFunnel,
  onFunnelChange,
  dateRange,
  onDateRangeChange,
  showSettings,
  onToggleSettings,
  loading,
  onRefresh,
  usingMock,
  isDark,
  onToggleTheme,
  onExport,
}: DashboardHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-lg border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25">
              <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-foreground">
                DashBarber
              </h1>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-[9px] sm:text-[10px] text-muted-foreground">by RevData</span>
                <span className="text-muted-foreground/30">|</span>
                <div className={`w-1.5 h-1.5 rounded-full ${usingMock ? 'bg-amber-500' : 'bg-emerald-500'} pulse-live`} />
                <span className="text-[9px] sm:text-[10px] text-muted-foreground">
                  {usingMock ? 'Demo' : 'Live'}
                </span>
              </div>
            </div>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-2">
            <DateFilter value={dateRange} onChange={onDateRangeChange} />

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

            <button
              onClick={onToggleTheme}
              className="p-2.5 rounded-lg border border-border bg-secondary text-foreground hover:bg-muted transition-all"
              title={isDark ? 'Modo claro' : 'Modo escuro'}
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {onExport && (
              <button
                onClick={onExport}
                className="p-2.5 rounded-lg border border-border bg-secondary text-foreground hover:bg-muted transition-all"
                title="Exportar dados"
              >
                <Download className="w-5 h-5" />
              </button>
            )}

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

            <button
              onClick={onRefresh}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Atualizando...' : 'Atualizar'}</span>
            </button>
          </div>

          {/* Mobile Actions */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={onRefresh}
              disabled={loading}
              className="p-2 bg-primary text-primary-foreground rounded-lg"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg border border-border bg-secondary text-foreground"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pt-4 border-t border-border space-y-3 animate-slide-in">
            <div className="flex items-center gap-2">
              <DateFilter value={dateRange} onChange={onDateRangeChange} />
            </div>

            <div className="relative">
              <select
                value={selectedFunnel}
                onChange={(e) => onFunnelChange(e.target.value)}
                className="w-full appearance-none bg-secondary text-foreground text-sm font-medium px-4 py-2.5 pr-9 rounded-lg border border-border"
              >
                <option value="all">Todos os Funis</option>
                {funnels.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onToggleTheme}
                className="flex-1 flex items-center justify-center gap-2 p-2.5 rounded-lg border border-border bg-secondary text-foreground"
              >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                <span className="text-sm">{isDark ? 'Modo Claro' : 'Modo Escuro'}</span>
              </button>

              {onExport && (
                <button
                  onClick={() => { onExport(); setMobileMenuOpen(false) }}
                  className="flex-1 flex items-center justify-center gap-2 p-2.5 rounded-lg border border-border bg-secondary text-foreground"
                >
                  <Download className="w-5 h-5" />
                  <span className="text-sm">Exportar</span>
                </button>
              )}
            </div>

            <button
              onClick={() => { onToggleSettings(); setMobileMenuOpen(false) }}
              className={`
                w-full flex items-center justify-center gap-2 p-2.5 rounded-lg border transition-all
                ${showSettings
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-secondary text-foreground border-border'
                }
              `}
            >
              <Settings className="w-5 h-5" />
              <span className="text-sm">Configuracoes</span>
            </button>
          </div>
        )}
      </div>
    </header>
  )
})

DashboardHeader.displayName = 'DashboardHeader'

'use client'

import { memo } from 'react'
import { Settings, Plus, Zap, Trash2 } from 'lucide-react'
import { CustomMetric } from '@/types/metrics'

interface SettingsPanelProps {
  customMetrics: CustomMetric[]
  onAddMetric: () => void
  onAddGoal: () => void
  onRemoveMetric: (id: string) => void
}

export const SettingsPanel = memo(function SettingsPanel({
  customMetrics,
  onAddMetric,
  onAddGoal,
  onRemoveMetric,
}: SettingsPanelProps) {
  return (
    <div className="bg-card border border-border/50 rounded-2xl p-6 space-y-6 shadow-lg animate-count">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Settings className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Configuracoes</h2>
            <p className="text-sm text-muted-foreground">Personalize suas metricas e metas</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onAddMetric}
            className="flex items-center gap-2 px-4 min-h-[44px] bg-muted/50 hover:bg-muted rounded-lg text-sm font-medium transition-colors border border-border/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label="Criar nova metrica personalizada"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Nova Metrica
          </button>
          <button
            onClick={onAddGoal}
            className="flex items-center gap-2 px-4 min-h-[44px] bg-primary text-primary-foreground rounded-lg text-sm font-medium shadow-lg shadow-primary/25 hover:bg-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label="Criar nova meta"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Nova Meta
          </button>
        </div>
      </div>

      {/* Lista de Métricas Customizadas */}
      {customMetrics.length > 0 && (
        <div className="pt-4 border-t border-border/50">
          <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">Metricas Personalizadas</h3>
          <div className="flex flex-wrap gap-2">
            {customMetrics.map(metric => (
              <div
                key={metric.id}
                className="flex items-center gap-2 px-4 py-2 bg-muted/50 hover:bg-muted rounded-lg text-sm font-medium transition-colors group border border-border/50"
              >
                <Zap className="h-3.5 w-3.5 text-primary" />
                <span>{metric.name}</span>
                <button
                  onClick={() => onRemoveMetric(metric.id)}
                  className="min-w-[44px] min-h-[44px] p-2.5 -m-2 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity ml-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md"
                  aria-label={`Remover metrica ${metric.name}`}
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
})

SettingsPanel.displayName = 'SettingsPanel'

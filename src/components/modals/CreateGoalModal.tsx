'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Goal, Funnel, CustomMetric, METRICS_DICTIONARY } from '@/types/metrics'
import { Target, TrendingUp, TrendingDown, Filter } from 'lucide-react'

// Derive default metrics from centralized dictionary
const DEFAULT_METRICS = Object.values(METRICS_DICTIONARY).map(metric => ({
  key: metric.key,
  name: metric.label,
  type: metric.higherIsBetter ? ('max' as const) : ('min' as const),
}))

interface CreateGoalModalProps {
  open: boolean
  onClose: () => void
  onSave: (goal: Omit<Goal, 'id'>) => void
  funnels: Funnel[]
  customMetrics: CustomMetric[]
}

export function CreateGoalModal({
  open,
  onClose,
  onSave,
  funnels,
  customMetrics,
}: CreateGoalModalProps) {
  const [metricKey, setMetricKey] = useState('')
  const [targetValue, setTargetValue] = useState('')
  const [targetType, setTargetType] = useState<'min' | 'max'>('max')
  const [funnelId, setFunnelId] = useState<string>('')

  const allMetrics = [
    ...DEFAULT_METRICS,
    ...customMetrics.map(m => ({
      key: m.id,
      name: m.name,
      type: 'max' as const, // Usuário define
    })),
  ]

  const selectedMetric = allMetrics.find(m => m.key === metricKey)

  const handleMetricChange = (key: string) => {
    setMetricKey(key)
    const metric = allMetrics.find(m => m.key === key)
    if (metric) {
      setTargetType(metric.type)
    }
  }

  const handleSave = () => {
    if (!metricKey || !targetValue) return

    const metric = allMetrics.find(m => m.key === metricKey)

    onSave({
      metricKey,
      metricName: metric?.name || metricKey,
      targetValue: parseFloat(targetValue),
      targetType,
      funnelId: funnelId || undefined,
    })

    // Reset form
    setMetricKey('')
    setTargetValue('')
    setTargetType('max')
    setFunnelId('')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 bg-gradient-to-r from-amber-500 to-orange-500">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white/20">
              <Target className="h-5 w-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-white text-lg">Criar Nova Meta</DialogTitle>
              <p className="text-white/70 text-sm mt-0.5">Defina objetivos para suas metricas</p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5 p-6">
          <div className="space-y-2">
            <Label htmlFor="metric" className="text-sm font-medium">Metrica</Label>
            <select
              id="metric"
              value={metricKey}
              onChange={(e) => handleMetricChange(e.target.value)}
              className="w-full h-11 min-h-[44px] bg-background border border-border/50 rounded-lg px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors"
            >
              <option value="">Selecione uma metrica</option>
              <optgroup label="Metricas Padrao">
                {DEFAULT_METRICS.map(m => (
                  <option key={m.key} value={m.key}>{m.name}</option>
                ))}
              </optgroup>
              {customMetrics.length > 0 && (
                <optgroup label="Metricas Customizadas">
                  {customMetrics.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="target" className="text-sm font-medium">Valor da Meta</Label>
            <Input
              id="target"
              type="number"
              step="0.01"
              placeholder="Ex: 50"
              value={targetValue}
              onChange={(e) => setTargetValue(e.target.value)}
              className="h-11"
            />
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium" id="target-type-label">Tipo de Meta</Label>
            <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-labelledby="target-type-label">
              <button
                type="button"
                role="radio"
                aria-checked={targetType === 'max'}
                onClick={() => setTargetType('max')}
                className={`flex items-center gap-3 p-4 min-h-[44px] rounded-xl border-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                  targetType === 'max'
                    ? 'border-emerald-500 bg-emerald-500/10'
                    : 'border-border/50 hover:border-border'
                }`}
              >
                <div className={`p-2 rounded-lg ${targetType === 'max' ? 'bg-emerald-500/20' : 'bg-muted'}`}>
                  <TrendingUp className={`h-4 w-4 ${targetType === 'max' ? 'text-emerald-500' : 'text-muted-foreground'}`} aria-hidden="true" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-sm">Maior melhor</p>
                  <p className="text-xs text-muted-foreground">Vendas, CTR, etc</p>
                </div>
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={targetType === 'min'}
                onClick={() => setTargetType('min')}
                className={`flex items-center gap-3 p-4 min-h-[44px] rounded-xl border-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                  targetType === 'min'
                    ? 'border-rose-500 bg-rose-500/10'
                    : 'border-border/50 hover:border-border'
                }`}
              >
                <div className={`p-2 rounded-lg ${targetType === 'min' ? 'bg-rose-500/20' : 'bg-muted'}`}>
                  <TrendingDown className={`h-4 w-4 ${targetType === 'min' ? 'text-rose-500' : 'text-muted-foreground'}`} aria-hidden="true" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-sm">Menor melhor</p>
                  <p className="text-xs text-muted-foreground">CPA, CPC, etc</p>
                </div>
              </button>
            </div>
            {selectedMetric && (
              <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-2">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary" />
                Sugestao automatica baseada na metrica selecionada
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="funnel" className="text-sm font-medium flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              Funil (opcional)
            </Label>
            <select
              id="funnel"
              value={funnelId}
              onChange={(e) => setFunnelId(e.target.value)}
              className="w-full h-11 min-h-[44px] bg-background border border-border/50 rounded-lg px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors"
            >
              <option value="">Todos os Funis</option>
              {funnels.map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>
        </div>

        <DialogFooter className="px-6 py-4 bg-muted/30 border-t border-border/50">
          <Button variant="outline" onClick={onClose} className="px-6">
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={!metricKey || !targetValue}
            className="px-6"
          >
            Criar Meta
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

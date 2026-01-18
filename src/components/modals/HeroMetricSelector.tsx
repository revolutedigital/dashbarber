'use client'

import { memo, useState } from 'react'
import { X, Check, Sparkles, DollarSign, Target, Users, ShoppingCart, MousePointer, Zap, Percent } from 'lucide-react'
import { HeroMetricType, HERO_METRICS } from '@/components/cards/DynamicHeroCard'

interface HeroMetricSelectorProps {
  isOpen: boolean
  onClose: () => void
  currentMetric: HeroMetricType
  onSelect: (metric: HeroMetricType) => void
}

const METRIC_ICONS: Record<HeroMetricType, React.ReactNode> = {
  roas: <Sparkles className="w-5 h-5" />,
  roi: <Percent className="w-5 h-5" />,
  cpa: <Target className="w-5 h-5" />,
  cpl: <Users className="w-5 h-5" />,
  purchases: <ShoppingCart className="w-5 h-5" />,
  revenue: <DollarSign className="w-5 h-5" />,
  ctr: <MousePointer className="w-5 h-5" />,
  txConv: <Zap className="w-5 h-5" />,
}

const METRIC_DESCRIPTIONS: Record<HeroMetricType, string> = {
  roas: 'Retorno sobre investimento em ads - ideal para e-commerce',
  roi: 'Retorno percentual sobre o investimento total',
  cpa: 'Custo médio para adquirir cada cliente',
  cpl: 'Custo médio para gerar cada lead',
  purchases: 'Número total de conversões/vendas',
  revenue: 'Receita total gerada no período',
  ctr: 'Taxa de cliques nos anúncios',
  txConv: 'Percentual de cliques que convertem',
}

const METRIC_CATEGORIES = [
  {
    title: 'Financeiro',
    metrics: ['roas', 'roi', 'revenue'] as HeroMetricType[],
  },
  {
    title: 'Custo',
    metrics: ['cpa', 'cpl'] as HeroMetricType[],
  },
  {
    title: 'Performance',
    metrics: ['purchases', 'ctr', 'txConv'] as HeroMetricType[],
  },
]

export const HeroMetricSelector = memo(function HeroMetricSelector({
  isOpen,
  onClose,
  currentMetric,
  onSelect,
}: HeroMetricSelectorProps) {
  const [hoveredMetric, setHoveredMetric] = useState<HeroMetricType | null>(null)

  if (!isOpen) return null

  const handleSelect = (metric: HeroMetricType) => {
    onSelect(metric)
    onClose()
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="
            w-full max-w-lg
            bg-card border border-border
            rounded-2xl shadow-2xl
            animate-in fade-in-0 zoom-in-95
            duration-200
          "
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div>
              <h2 className="text-xl font-bold text-foreground">Escolher Métrica Principal</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Selecione qual métrica será exibida em destaque
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
            {METRIC_CATEGORIES.map((category) => (
              <div key={category.title}>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  {category.title}
                </h3>
                <div className="grid gap-2">
                  {category.metrics.map((metricType) => {
                    const config = HERO_METRICS[metricType]
                    const isSelected = currentMetric === metricType
                    const isHovered = hoveredMetric === metricType

                    return (
                      <button
                        key={metricType}
                        onClick={() => handleSelect(metricType)}
                        onMouseEnter={() => setHoveredMetric(metricType)}
                        onMouseLeave={() => setHoveredMetric(null)}
                        className={`
                          flex items-center gap-4 p-4 rounded-xl
                          border transition-all duration-200
                          ${isSelected
                            ? 'border-primary bg-primary/10 shadow-md shadow-primary/10'
                            : 'border-border hover:border-primary/50 hover:bg-muted/50'
                          }
                        `}
                      >
                        {/* Icon */}
                        <div className={`
                          p-3 rounded-xl
                          ${isSelected
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                          }
                          transition-colors
                        `}>
                          {METRIC_ICONS[metricType]}
                        </div>

                        {/* Info */}
                        <div className="flex-1 text-left">
                          <div className="flex items-center gap-2">
                            <span className={`font-semibold ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                              {config.shortLabel}
                            </span>
                            {config.higherIsBetter ? (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-medium">
                                Maior = Melhor
                              </span>
                            ) : (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 font-medium">
                                Menor = Melhor
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {METRIC_DESCRIPTIONS[metricType]}
                          </p>
                        </div>

                        {/* Check */}
                        {isSelected && (
                          <div className="p-1.5 rounded-full bg-primary text-primary-foreground">
                            <Check className="w-4 h-4" />
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-border bg-muted/30 rounded-b-2xl">
            <p className="text-xs text-muted-foreground text-center">
              A métrica selecionada será salva e usada como padrão
            </p>
          </div>
        </div>
      </div>
    </>
  )
})

HeroMetricSelector.displayName = 'HeroMetricSelector'

'use client'

import { useMemo } from 'react'
import { TrendingUp, TrendingDown, AlertTriangle, Sparkles, Target, Zap } from 'lucide-react'
import type { FunnelTotals } from '@/types/metrics'

interface Insight {
  type: 'positive' | 'negative' | 'warning' | 'neutral'
  icon: React.ReactNode
  title: string
  description: string
  metric?: string
  change?: number
}

interface InsightsNarrativeProps {
  totals: FunnelTotals
  previousTotals: FunnelTotals | null
  className?: string
}

/**
 * Data Storytelling Component
 * Transforms raw metrics into human-readable insights and narratives
 */
export function InsightsNarrative({ totals, previousTotals, className = '' }: InsightsNarrativeProps) {
  const insights = useMemo((): Insight[] => {
    const result: Insight[] = []

    // Calculate changes if we have previous data
    const hasComparison = previousTotals !== null

    // ROAS Analysis
    if (totals.roas >= 3) {
      result.push({
        type: 'positive',
        icon: <Sparkles className="w-4 h-4" />,
        title: 'ROAS Excelente',
        description: `Seu retorno de ${totals.roas.toFixed(2)}x está acima da média do mercado. Cada R$1 investido retorna R$${totals.roas.toFixed(2)}.`,
        metric: `${totals.roas.toFixed(2)}x`,
        change: hasComparison && previousTotals.roas > 0
          ? ((totals.roas - previousTotals.roas) / previousTotals.roas) * 100
          : undefined,
      })
    } else if (totals.roas >= 2) {
      result.push({
        type: 'neutral',
        icon: <Target className="w-4 h-4" />,
        title: 'ROAS Saudável',
        description: `Retorno de ${totals.roas.toFixed(2)}x está dentro da média esperada para o setor.`,
        metric: `${totals.roas.toFixed(2)}x`,
      })
    } else if (totals.roas > 0 && totals.roas < 1.5) {
      result.push({
        type: 'warning',
        icon: <AlertTriangle className="w-4 h-4" />,
        title: 'ROAS Baixo',
        description: `Com ${totals.roas.toFixed(2)}x de retorno, considere revisar segmentação ou criativos.`,
        metric: `${totals.roas.toFixed(2)}x`,
      })
    }

    // CPA Analysis
    if (hasComparison && previousTotals.cpa > 0) {
      const cpaChange = ((totals.cpa - previousTotals.cpa) / previousTotals.cpa) * 100
      if (cpaChange < -10) {
        result.push({
          type: 'positive',
          icon: <TrendingDown className="w-4 h-4" />,
          title: 'CPA em Queda',
          description: `Custo por aquisição reduziu ${Math.abs(cpaChange).toFixed(1)}%, agora em R$${totals.cpa.toFixed(2)}.`,
          metric: `R$${totals.cpa.toFixed(2)}`,
          change: cpaChange,
        })
      } else if (cpaChange > 20) {
        result.push({
          type: 'negative',
          icon: <TrendingUp className="w-4 h-4" />,
          title: 'CPA Aumentando',
          description: `Custo por aquisição subiu ${cpaChange.toFixed(1)}% para R$${totals.cpa.toFixed(2)}. Analise a performance dos anúncios.`,
          metric: `R$${totals.cpa.toFixed(2)}`,
          change: cpaChange,
        })
      }
    }

    // Investment Efficiency
    if (totals.amountSpent > 0 && totals.purchases > 0) {
      const efficiency = (totals.revenue / totals.amountSpent) * 100
      if (efficiency > 300) {
        result.push({
          type: 'positive',
          icon: <Zap className="w-4 h-4" />,
          title: 'Alta Eficiência',
          description: `Investimento de R$${totals.amountSpent.toLocaleString('pt-BR')} gerou R$${totals.revenue.toLocaleString('pt-BR')} em receita.`,
          metric: `${efficiency.toFixed(0)}%`,
        })
      }
    }

    // CTR Analysis
    if (totals.ctrLink > 0.02) {
      result.push({
        type: 'positive',
        icon: <Target className="w-4 h-4" />,
        title: 'CTR Acima da Média',
        description: `Taxa de cliques de ${(totals.ctrLink * 100).toFixed(2)}% indica criativos atraentes.`,
        metric: `${(totals.ctrLink * 100).toFixed(2)}%`,
      })
    } else if (totals.ctrLink > 0 && totals.ctrLink < 0.008) {
      result.push({
        type: 'warning',
        icon: <AlertTriangle className="w-4 h-4" />,
        title: 'CTR Baixo',
        description: `Taxa de cliques de ${(totals.ctrLink * 100).toFixed(2)}% está abaixo do esperado. Teste novos criativos.`,
        metric: `${(totals.ctrLink * 100).toFixed(2)}%`,
      })
    }

    // Conversion Rate
    if (totals.txConv > 0.05) {
      result.push({
        type: 'positive',
        icon: <Sparkles className="w-4 h-4" />,
        title: 'Conversão Alta',
        description: `Taxa de conversão de ${(totals.txConv * 100).toFixed(2)}% está excelente.`,
        metric: `${(totals.txConv * 100).toFixed(2)}%`,
      })
    }

    return result.slice(0, 4) // Limit to 4 insights
  }, [totals, previousTotals])

  if (insights.length === 0) {
    return null
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
        <Sparkles className="w-4 h-4" />
        Insights Automáticos
      </h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {insights.map((insight, index) => (
          <div
            key={index}
            className={`insight-card insight-card--${insight.type}`}
            role="article"
            aria-label={insight.title}
          >
            <div className="flex items-start gap-3">
              <div className={`
                flex-shrink-0 p-2 rounded-lg
                ${insight.type === 'positive' ? 'bg-emerald-500/20 text-emerald-500' : ''}
                ${insight.type === 'negative' ? 'bg-red-500/20 text-red-500' : ''}
                ${insight.type === 'warning' ? 'bg-amber-500/20 text-amber-500' : ''}
                ${insight.type === 'neutral' ? 'bg-blue-500/20 text-blue-500' : ''}
              `}>
                {insight.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-medium text-sm text-foreground">
                    {insight.title}
                  </h4>
                  {insight.metric && (
                    <span className="text-sm font-semibold tabular-nums">
                      {insight.metric}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  {insight.description}
                </p>
                {insight.change !== undefined && (
                  <div className={`
                    inline-flex items-center gap-1 mt-2 text-xs font-medium
                    ${insight.change > 0 ? 'text-red-500' : 'text-emerald-500'}
                  `}>
                    {insight.change > 0 ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {Math.abs(insight.change).toFixed(1)}% vs período anterior
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

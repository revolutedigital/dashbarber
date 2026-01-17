'use client'

import { memo } from 'react'
import { Goal } from '@/types/metrics'
import { formatCurrency, formatPercentage, formatNumber } from '@/lib/calculations'
import { Target, Trash2, TrendingUp, TrendingDown, CheckCircle2 } from 'lucide-react'

interface GoalCardProps {
  goal: Goal
  currentValue: number
  progress: number
  onRemove: () => void
}

export const GoalCard = memo(function GoalCard({ goal, currentValue, progress, onRemove }: GoalCardProps) {
  const isAchieved = progress >= 100
  const isGoodProgress = progress >= 70
  const isWarning = progress >= 40 && progress < 70

  const formatValue = (value: number) => {
    if (goal.metricKey.includes('Cpa') || goal.metricKey.includes('Cpc') || goal.metricKey.includes('Cpm') || goal.metricKey.includes('Spent')) {
      return formatCurrency(value)
    }
    if (goal.metricKey.includes('Ctr') || goal.metricKey.includes('Conv')) {
      return formatPercentage(value * 100)
    }
    return formatNumber(value)
  }

  const getProgressColor = () => {
    if (isAchieved) return 'from-emerald-500 to-teal-400'
    if (isGoodProgress) return 'from-emerald-500 to-teal-400'
    if (isWarning) return 'from-amber-500 to-orange-400'
    return 'from-rose-500 to-pink-400'
  }

  const getStatusColor = () => {
    if (isAchieved) return 'text-emerald-500'
    if (isGoodProgress) return 'text-emerald-500'
    if (isWarning) return 'text-amber-500'
    return 'text-rose-500'
  }

  return (
    <div
      className={`
        relative rounded-xl p-5 overflow-hidden
        bg-card border shadow-sm
        card-hover group
        ${isAchieved ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-border/50'}
      `}
    >
      {/* Remove button - Touch target and a11y compliant */}
      <button
        onClick={onRemove}
        className="absolute top-2 right-2 min-w-[44px] min-h-[44px] p-2.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        aria-label={`Remover meta ${goal.metricName}`}
      >
        <Trash2 className="w-4 h-4" aria-hidden="true" />
      </button>

      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className={`p-2 rounded-lg ${isAchieved ? 'bg-emerald-500/10' : 'bg-muted/50'}`}>
          {isAchieved ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          ) : (
            <Target className="w-5 h-5 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-foreground truncate">
            {goal.metricName}
          </h3>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            {goal.targetType === 'max' ? (
              <>
                <TrendingUp className="w-3 h-3" />
                <span>Maior melhor</span>
              </>
            ) : (
              <>
                <TrendingDown className="w-3 h-3" />
                <span>Menor melhor</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Values */}
      <div className="flex items-end justify-between mb-4">
        <div>
          <p className="text-2xl font-bold text-foreground tracking-tight">
            {formatValue(currentValue)}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Meta: {formatValue(goal.targetValue)}
          </p>
        </div>
        <div className="text-right">
          <p className={`text-xl font-bold ${getStatusColor()}`}>
            {progress.toFixed(0)}%
          </p>
          <p className="text-xs text-muted-foreground">
            {isAchieved ? 'Atingida!' : 'progresso'}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${getProgressColor()} animate-progress`}
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>

      {/* Funnel badge */}
      {goal.funnelId && (
        <div className="mt-3 inline-flex items-center px-2 py-1 rounded-md bg-muted/50 text-xs text-muted-foreground">
          Funil especifico
        </div>
      )}

      {/* Achievement glow */}
      {isAchieved && (
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/5 to-emerald-500/0 pointer-events-none" />
      )}
    </div>
  )
})

GoalCard.displayName = 'GoalCard'

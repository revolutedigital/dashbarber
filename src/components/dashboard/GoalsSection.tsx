'use client'

import { memo } from 'react'
import { Target } from 'lucide-react'
import { GoalCard } from '@/components/cards/GoalCard'
import { Goal } from '@/types/metrics'

interface GoalsSectionProps {
  goals: Goal[]
  selectedFunnel: string
  getMetricValue: (metricKey: string) => number
  calculateGoalProgress: (goal: Goal, currentValue: number) => number
  onRemoveGoal: (id: string) => void
}

export const GoalsSection = memo(function GoalsSection({
  goals,
  selectedFunnel,
  getMetricValue,
  calculateGoalProgress,
  onRemoveGoal,
}: GoalsSectionProps) {
  const filteredGoals = goals.filter(
    g => !g.funnelId || g.funnelId === selectedFunnel || selectedFunnel === 'all'
  )

  if (filteredGoals.length === 0) return null

  return (
    <section>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-amber-500/10">
          <Target className="h-5 w-5 text-amber-500" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Metas</h2>
          <p className="text-sm text-muted-foreground">Acompanhe o progresso das suas metas</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredGoals.map(goal => {
          const currentValue = getMetricValue(goal.metricKey)
          const progress = calculateGoalProgress(goal, currentValue)
          return (
            <GoalCard
              key={goal.id}
              goal={goal}
              currentValue={currentValue}
              progress={progress}
              onRemove={() => onRemoveGoal(goal.id)}
            />
          )
        })}
      </div>
    </section>
  )
})

GoalsSection.displayName = 'GoalsSection'

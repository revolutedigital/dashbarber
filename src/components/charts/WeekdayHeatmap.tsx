'use client'

import { memo, useMemo } from 'react'
import { Calendar } from 'lucide-react'

interface HeatmapData {
  day: string // DD/MM format
  [key: string]: string | number
}

interface WeekdayHeatmapProps {
  data: HeatmapData[]
  metricKey: string
  title?: string
  formatValue?: (value: number) => string
  colorScheme?: 'green' | 'blue' | 'purple' | 'orange'
  higherIsBetter?: boolean
}

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab']
const WEEKDAYS_FULL = ['Domingo', 'Segunda', 'Terca', 'Quarta', 'Quinta', 'Sexta', 'Sabado']

const COLOR_SCHEMES = {
  green: {
    low: 'bg-emerald-500/10',
    medium: 'bg-emerald-500/40',
    high: 'bg-emerald-500/70',
    max: 'bg-emerald-500',
    text: 'text-emerald-500',
  },
  blue: {
    low: 'bg-blue-500/10',
    medium: 'bg-blue-500/40',
    high: 'bg-blue-500/70',
    max: 'bg-blue-500',
    text: 'text-blue-500',
  },
  purple: {
    low: 'bg-purple-500/10',
    medium: 'bg-purple-500/40',
    high: 'bg-purple-500/70',
    max: 'bg-purple-500',
    text: 'text-purple-500',
  },
  orange: {
    low: 'bg-orange-500/10',
    medium: 'bg-orange-500/40',
    high: 'bg-orange-500/70',
    max: 'bg-orange-500',
    text: 'text-orange-500',
  },
}

// Parse DD/MM date string and get day of week
function getDayOfWeek(dateStr: string): number {
  const [day, month] = dateStr.split('/').map(Number)
  const year = new Date().getFullYear()
  const date = new Date(year, month - 1, day)
  return date.getDay()
}

export const WeekdayHeatmap = memo(function WeekdayHeatmap({
  data,
  metricKey,
  title = 'Performance por Dia da Semana',
  formatValue = (v) => v.toLocaleString('pt-BR'),
  colorScheme = 'green',
  higherIsBetter = true,
}: WeekdayHeatmapProps) {
  const colors = COLOR_SCHEMES[colorScheme]

  // Aggregate data by weekday
  const weekdayData = useMemo(() => {
    const aggregated: { [key: number]: { sum: number; count: number; values: number[] } } = {}

    // Initialize all weekdays
    for (let i = 0; i < 7; i++) {
      aggregated[i] = { sum: 0, count: 0, values: [] }
    }

    // Aggregate values by weekday
    data.forEach((item) => {
      try {
        const dayOfWeek = getDayOfWeek(item.day)
        const value = Number(item[metricKey]) || 0
        aggregated[dayOfWeek].sum += value
        aggregated[dayOfWeek].count += 1
        aggregated[dayOfWeek].values.push(value)
      } catch {
        // Skip invalid dates
      }
    })

    // Calculate averages
    const result = Object.entries(aggregated).map(([day, data]) => ({
      dayIndex: Number(day),
      dayName: WEEKDAYS[Number(day)],
      dayNameFull: WEEKDAYS_FULL[Number(day)],
      average: data.count > 0 ? data.sum / data.count : 0,
      total: data.sum,
      count: data.count,
    }))

    return result
  }, [data, metricKey])

  // Calculate min/max for color scaling
  const { min, max, best, worst } = useMemo(() => {
    const averages = weekdayData.map((d) => d.average).filter((a) => a > 0)
    if (averages.length === 0) return { min: 0, max: 0, best: null, worst: null }

    const minVal = Math.min(...averages)
    const maxVal = Math.max(...averages)

    const bestDay = higherIsBetter
      ? weekdayData.find((d) => d.average === maxVal)
      : weekdayData.find((d) => d.average === minVal)
    const worstDay = higherIsBetter
      ? weekdayData.find((d) => d.average === minVal && d.count > 0)
      : weekdayData.find((d) => d.average === maxVal && d.count > 0)

    return { min: minVal, max: maxVal, best: bestDay, worst: worstDay }
  }, [weekdayData, higherIsBetter])

  // Get color class based on value
  const getColorClass = (value: number): string => {
    if (value === 0) return 'bg-muted/30'
    if (max === min) return colors.medium

    const normalized = (value - min) / (max - min)
    const adjusted = higherIsBetter ? normalized : 1 - normalized

    if (adjusted < 0.25) return colors.low
    if (adjusted < 0.5) return colors.medium
    if (adjusted < 0.75) return colors.high
    return colors.max
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
        </div>
        {best && (
          <div className={`text-xs px-2 py-1 rounded-full ${colors.text} bg-current/10`}>
            Melhor: {best.dayNameFull}
          </div>
        )}
      </div>

      {/* Heatmap Grid */}
      <div className="grid grid-cols-7 gap-2">
        {weekdayData.map((day) => (
          <div
            key={day.dayIndex}
            className={`
              relative group cursor-default
              aspect-square rounded-xl
              ${getColorClass(day.average)}
              transition-all duration-200
              hover:scale-105 hover:shadow-lg
              flex flex-col items-center justify-center
            `}
          >
            <span className="text-xs font-semibold text-foreground/80">{day.dayName}</span>
            {day.count > 0 && (
              <span className="text-[10px] text-foreground/60 mt-0.5">
                {formatValue(day.average)}
              </span>
            )}

            {/* Tooltip on hover */}
            <div className="
              absolute bottom-full left-1/2 -translate-x-1/2 mb-2
              opacity-0 group-hover:opacity-100
              pointer-events-none
              bg-popover border border-border rounded-lg shadow-xl
              p-3 min-w-[140px]
              transition-opacity duration-200
              z-10
            ">
              <div className="text-sm font-semibold text-foreground mb-2">{day.dayNameFull}</div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Media:</span>
                  <span className="font-medium text-foreground">{formatValue(day.average)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total:</span>
                  <span className="font-medium text-foreground">{formatValue(day.total)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Dias:</span>
                  <span className="font-medium text-foreground">{day.count}</span>
                </div>
              </div>
              {/* Arrow */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
                <div className="border-8 border-transparent border-t-popover" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded ${colors.low}`} />
          <span>{higherIsBetter ? 'Baixo' : 'Alto'}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className={`w-3 h-3 rounded ${colors.low}`} />
          <div className={`w-3 h-3 rounded ${colors.medium}`} />
          <div className={`w-3 h-3 rounded ${colors.high}`} />
          <div className={`w-3 h-3 rounded ${colors.max}`} />
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded ${colors.max}`} />
          <span>{higherIsBetter ? 'Alto' : 'Baixo'}</span>
        </div>
      </div>

      {/* Insights */}
      {best && worst && best.dayIndex !== worst.dayIndex && (
        <div className="bg-muted/30 rounded-xl p-3 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Insight:</span>{' '}
          {higherIsBetter ? (
            <>
              <span className={colors.text}>{best.dayNameFull}</span> tem a melhor performance
              ({formatValue(best.average)}), enquanto{' '}
              <span className="text-red-400">{worst.dayNameFull}</span> tem a menor
              ({formatValue(worst.average)}).
            </>
          ) : (
            <>
              <span className={colors.text}>{best.dayNameFull}</span> tem o menor custo
              ({formatValue(best.average)}), enquanto{' '}
              <span className="text-red-400">{worst.dayNameFull}</span> tem o maior
              ({formatValue(worst.average)}).
            </>
          )}
        </div>
      )}
    </div>
  )
})

WeekdayHeatmap.displayName = 'WeekdayHeatmap'

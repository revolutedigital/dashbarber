'use client'

import { memo } from 'react'
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import { PieTooltip } from './CustomTooltip'

interface PieChartData {
  name: string
  value: number
  color: string
  [key: string]: string | number
}

interface PieChartProps {
  title: string
  data: PieChartData[]
  height?: number
  formatValue?: (value: number) => string
}

export const PieChart = memo(function PieChart({
  title,
  data,
  height = 220,
  formatValue = (v) => v.toLocaleString('pt-BR'),
}: PieChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0)

  // Sort by value for better visual hierarchy
  const sortedData = [...data].sort((a, b) => b.value - a.value)

  return (
    <div className="space-y-3">
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <div className="flex items-center gap-6">
        <div className="w-[140px] h-[140px] flex-shrink-0 relative">
          {/* Center total */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <div className="text-center">
              <p className="text-lg font-bold text-foreground tabular-nums">{formatValue(total)}</p>
              <p className="text-[10px] text-muted-foreground">Total</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height="100%">
            <RechartsPieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={42}
                outerRadius={65}
                paddingAngle={3}
                dataKey="value"
                strokeWidth={0}
                animationBegin={0}
                animationDuration={800}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    className="transition-all duration-200 hover:opacity-80"
                    style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
                  />
                ))}
              </Pie>
              <Tooltip content={<PieTooltip formatValue={formatValue} />} />
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex-1 space-y-2">
          {sortedData.map((item, index) => {
            const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0'
            const isTop = index === 0

            return (
              <div
                key={item.name}
                className={`
                  flex items-center justify-between py-1.5 px-2 rounded-lg
                  ${isTop ? 'bg-muted/50' : ''}
                  transition-colors hover:bg-muted/30
                `}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0 ring-2 ring-white/10"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-muted-foreground text-xs truncate">{item.name}</span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-foreground font-semibold text-xs tabular-nums">
                    {percentage}%
                  </span>
                  {isTop && (
                    <span className="text-[9px] text-primary bg-primary/10 px-1.5 py-0.5 rounded font-medium">
                      TOP
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
})

PieChart.displayName = 'PieChart'

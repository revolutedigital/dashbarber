'use client'

import { memo } from 'react'
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'

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

  return (
    <div className="space-y-3">
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <div className="flex items-center gap-4">
        <div className="w-[140px] h-[140px] flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsPieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={65}
                paddingAngle={2}
                dataKey="value"
                strokeWidth={0}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => [formatValue(Number(value))]}
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                  padding: '8px 12px',
                  fontSize: '12px',
                }}
                labelStyle={{ color: '#f3f4f6' }}
                itemStyle={{ color: '#d1d5db' }}
              />
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex-1 space-y-1.5">
          {data.map((item) => {
            const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0'
            return (
              <div key={item.name} className="flex items-center justify-between text-sm py-1">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-muted-foreground text-xs">{item.name}</span>
                </div>
                <span className="text-foreground font-medium text-xs tabular-nums">
                  {percentage}%
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
})

PieChart.displayName = 'PieChart'

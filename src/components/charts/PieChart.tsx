'use client'

import { memo } from 'react'
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
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
  height = 280,
  formatValue = (v) => v.toString(),
}: PieChartProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsPieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={4}
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
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '12px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
              padding: '12px 16px',
            }}
            labelStyle={{
              color: 'hsl(var(--foreground))',
              fontWeight: 600,
            }}
            itemStyle={{
              color: 'hsl(var(--foreground))',
              fontSize: '13px',
            }}
          />
          <Legend
            layout="vertical"
            verticalAlign="middle"
            align="right"
            iconType="circle"
            iconSize={10}
            wrapperStyle={{
              paddingLeft: '20px',
            }}
            formatter={(value) => (
              <span style={{ color: 'hsl(var(--foreground))', fontSize: '13px' }}>
                {value}
              </span>
            )}
          />
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  )
})

PieChart.displayName = 'PieChart'

'use client'

import { memo } from 'react'
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface BarChartData {
  day: string
  [key: string]: string | number
}

interface BarChartProps {
  title: string
  data: BarChartData[]
  bars: {
    key: string
    label: string
    color: string
  }[]
  height?: number
  formatValue?: (value: number) => string
}

export const BarChart = memo(function BarChart({
  title,
  data,
  bars,
  height = 220,
  formatValue = (v) => v.toLocaleString('pt-BR'),
}: BarChartProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsBarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="hsl(var(--border))"
            strokeOpacity={0.4}
            vertical={false}
          />
          <XAxis
            dataKey="day"
            tick={{ fontSize: 10, fill: '#9ca3af' }}
            tickLine={false}
            axisLine={false}
            dy={8}
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#9ca3af' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => v.toString()}
            width={35}
          />
          <Tooltip
            formatter={(value, name) => [formatValue(Number(value)), name]}
            contentStyle={{
              backgroundColor: '#1f2937',
              border: '1px solid #374151',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              padding: '8px 12px',
              fontSize: '12px',
            }}
            labelStyle={{
              color: '#f3f4f6',
              fontWeight: 600,
              marginBottom: '4px',
              fontSize: '11px',
            }}
            itemStyle={{ color: '#d1d5db' }}
            cursor={{ fill: '#374151', opacity: 0.3 }}
          />
          {bars.map((bar) => (
            <Bar
              key={bar.key}
              dataKey={bar.key}
              name={bar.label}
              fill={bar.color}
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            />
          ))}
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  )
})

BarChart.displayName = 'BarChart'

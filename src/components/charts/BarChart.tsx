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
  Cell,
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
  height = 280,
  formatValue = (v) => v.toString(),
}: BarChartProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsBarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <defs>
            {bars.map((bar) => (
              <linearGradient key={`gradient-${bar.key}`} id={`bar-gradient-${bar.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={bar.color} stopOpacity={1} />
                <stop offset="100%" stopColor={bar.color} stopOpacity={0.6} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} vertical={false} />
          <XAxis
            dataKey="day"
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            tickLine={false}
            axisLine={false}
            dy={10}
          />
          <YAxis
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={formatValue}
            width={40}
          />
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
              marginBottom: '8px',
            }}
            itemStyle={{
              color: 'hsl(var(--foreground))',
              fontSize: '13px',
            }}
            cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }}
          />
          {bars.map((bar) => (
            <Bar
              key={bar.key}
              dataKey={bar.key}
              name={bar.label}
              fill={`url(#bar-gradient-${bar.key})`}
              radius={[6, 6, 0, 0]}
              maxBarSize={50}
            >
              {data.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={`url(#bar-gradient-${bar.key})`}
                />
              ))}
            </Bar>
          ))}
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  )
})

BarChart.displayName = 'BarChart'

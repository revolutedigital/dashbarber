'use client'

import { memo } from 'react'
import {
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

interface AreaChartData {
  day: string
  [key: string]: string | number
}

interface AreaChartProps {
  title: string
  data: AreaChartData[]
  areas: {
    key: string
    label: string
    color: string
  }[]
  height?: number
  formatValue?: (value: number) => string
  stacked?: boolean
}

export const AreaChart = memo(function AreaChart({
  title,
  data,
  areas,
  height = 220,
  formatValue = (v) => v.toLocaleString('pt-BR'),
  stacked = false,
}: AreaChartProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsAreaChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <defs>
            {areas.map((area) => (
              <linearGradient key={`gradient-${area.key}`} id={`areaGradient-${area.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={area.color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={area.color} stopOpacity={0.02} />
              </linearGradient>
            ))}
          </defs>
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
            tickFormatter={(v) => {
              if (v >= 1000000) return `${(v / 1000000).toFixed(0)}M`
              if (v >= 1000) return `${(v / 1000).toFixed(0)}k`
              return v.toString()
            }}
            width={45}
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
          />
          <Legend
            wrapperStyle={{ paddingTop: '12px', fontSize: '11px', color: '#9ca3af' }}
            iconType="circle"
            iconSize={8}
            formatter={(value) => <span style={{ color: '#9ca3af' }}>{value}</span>}
          />
          {areas.map((area) => (
            <Area
              key={area.key}
              type="monotone"
              dataKey={area.key}
              name={area.label}
              stroke={area.color}
              strokeWidth={2}
              fill={`url(#areaGradient-${area.key})`}
              stackId={stacked ? 'stack' : undefined}
            />
          ))}
        </RechartsAreaChart>
      </ResponsiveContainer>
    </div>
  )
})

AreaChart.displayName = 'AreaChart'

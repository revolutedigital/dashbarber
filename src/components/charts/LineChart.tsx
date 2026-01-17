'use client'

import { memo } from 'react'
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
} from 'recharts'

interface LineChartData {
  day: string
  [key: string]: string | number
}

interface LineChartProps {
  title: string
  data: LineChartData[]
  lines: {
    key: string
    label: string
    color: string
  }[]
  height?: number
  formatValue?: (value: number) => string
}

export const LineChart = memo(function LineChart({
  title,
  data,
  lines,
  height = 280,
  formatValue = (v) => v.toString(),
}: LineChartProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsLineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <defs>
            {lines.map((line) => (
              <linearGradient key={`gradient-${line.key}`} id={`gradient-${line.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={line.color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={line.color} stopOpacity={0} />
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
            width={60}
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
          />
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="circle"
            iconSize={8}
          />
          {lines.map((line) => (
            <Area
              key={`area-${line.key}`}
              type="monotone"
              dataKey={line.key}
              stroke="transparent"
              fill={`url(#gradient-${line.key})`}
            />
          ))}
          {lines.map((line) => (
            <Line
              key={line.key}
              type="monotone"
              dataKey={line.key}
              name={line.label}
              stroke={line.color}
              strokeWidth={2.5}
              dot={false}
              activeDot={{
                r: 6,
                strokeWidth: 2,
                stroke: 'hsl(var(--background))',
                fill: line.color,
              }}
            />
          ))}
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  )
})

LineChart.displayName = 'LineChart'

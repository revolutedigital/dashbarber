'use client'

import { memo, useMemo } from 'react'
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
  ReferenceDot,
} from 'recharts'
import { CustomTooltip } from './CustomTooltip'
import { TrendingUp, TrendingDown } from 'lucide-react'

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
  showAverage?: boolean
  previousData?: LineChartData[]
  showAnnotations?: boolean
}

// Find peaks and valleys in data
function findAnnotations(data: LineChartData[], key: string): { peaks: number[]; valleys: number[] } {
  const values = data.map(d => Number(d[key]) || 0)
  const peaks: number[] = []
  const valleys: number[] = []

  if (values.length < 3) return { peaks, valleys }

  for (let i = 1; i < values.length - 1; i++) {
    const prev = values[i - 1]
    const curr = values[i]
    const next = values[i + 1]

    // Peak: current value is higher than both neighbors by significant margin
    if (curr > prev * 1.15 && curr > next * 1.15) {
      peaks.push(i)
    }
    // Valley: current value is lower than both neighbors by significant margin
    if (curr < prev * 0.85 && curr < next * 0.85) {
      valleys.push(i)
    }
  }

  // Only return top 2 peaks and valleys to avoid clutter
  return {
    peaks: peaks.slice(0, 2),
    valleys: valleys.slice(0, 2),
  }
}

export const LineChart = memo(function LineChart({
  title,
  data,
  lines,
  height = 220,
  formatValue = (v) => v.toLocaleString('pt-BR'),
  showAverage = false,
  previousData,
  showAnnotations = true,
}: LineChartProps) {
  // Calculate average for reference line
  const averages = lines.map(line => {
    const values = data.map(d => Number(d[line.key]) || 0)
    const sum = values.reduce((a, b) => a + b, 0)
    return {
      key: line.key,
      avg: values.length > 0 ? sum / values.length : 0,
      color: line.color,
    }
  })

  // Merge current and previous data for comparison
  const mergedData = useMemo(() => {
    if (!previousData || previousData.length === 0) return data

    return data.map((current, index) => {
      const prev = previousData[index] || {}
      const merged: Record<string, string | number> = { ...current }

      lines.forEach(line => {
        merged[`prev_${line.key}`] = prev[line.key] || 0
      })

      return merged
    })
  }, [data, previousData, lines])

  // Find annotations for the first line
  const annotations = useMemo(() => {
    if (!showAnnotations || lines.length === 0) return { peaks: [], valleys: [] }
    return findAnnotations(data, lines[0].key)
  }, [data, lines, showAnnotations])

  // Calculate trend
  const trend = useMemo(() => {
    if (data.length < 2 || lines.length === 0) return null
    const firstHalf = data.slice(0, Math.floor(data.length / 2))
    const secondHalf = data.slice(Math.floor(data.length / 2))

    const firstAvg = firstHalf.reduce((sum, d) => sum + (Number(d[lines[0].key]) || 0), 0) / firstHalf.length
    const secondAvg = secondHalf.reduce((sum, d) => sum + (Number(d[lines[0].key]) || 0), 0) / secondHalf.length

    if (firstAvg === 0) return null
    const change = ((secondAvg - firstAvg) / firstAvg) * 100
    return { change, isPositive: change > 0 }
  }, [data, lines])

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
          {trend && Math.abs(trend.change) > 5 && (
            <div className={`
              flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold
              ${trend.isPositive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}
            `}>
              {trend.isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              <span>{trend.isPositive ? '+' : ''}{trend.change.toFixed(1)}%</span>
            </div>
          )}
        </div>
        {showAverage && averages.length === 1 && (
          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
            Media: {formatValue(averages[0].avg)}
          </span>
        )}
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsLineChart data={mergedData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
          <defs>
            {lines.map((line) => (
              <linearGradient key={`gradient-${line.key}`} id={`lineGradient-${line.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={line.color} stopOpacity={0.2} />
                <stop offset="95%" stopColor={line.color} stopOpacity={0} />
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
              if (v >= 1000) return `${(v / 1000).toFixed(0)}k`
              return formatValue(v)
            }}
            width={50}
          />
          <Tooltip
            content={<CustomTooltip formatValue={formatValue} showTotal={previousData ? true : false} />}
            cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1, strokeDasharray: '4 4' }}
          />
          {lines.length > 1 && (
            <Legend
              wrapperStyle={{ paddingTop: '12px', fontSize: '11px' }}
              iconType="circle"
              iconSize={8}
              formatter={(value) => <span style={{ color: '#9ca3af' }}>{value}</span>}
            />
          )}

          {/* Average reference lines */}
          {showAverage && averages.map((avg) => (
            <ReferenceLine
              key={`avg-${avg.key}`}
              y={avg.avg}
              stroke={avg.color}
              strokeDasharray="5 5"
              strokeOpacity={0.5}
            />
          ))}

          {/* Previous period lines (dashed) */}
          {previousData && lines.map((line) => (
            <Line
              key={`prev-${line.key}`}
              type="monotone"
              dataKey={`prev_${line.key}`}
              name={`${line.label} (anterior)`}
              stroke={line.color}
              strokeWidth={1.5}
              strokeDasharray="5 5"
              strokeOpacity={0.4}
              dot={false}
              activeDot={false}
            />
          ))}

          {/* Current period lines */}
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
                strokeWidth: 3,
                stroke: 'hsl(var(--background))',
                fill: line.color,
                className: 'drop-shadow-lg',
              }}
            />
          ))}

          {/* Peak annotations */}
          {showAnnotations && annotations.peaks.map((idx) => {
            const value = Number(data[idx]?.[lines[0]?.key]) || 0
            return (
              <ReferenceDot
                key={`peak-${idx}`}
                x={data[idx]?.day}
                y={value}
                r={4}
                fill="#22c55e"
                stroke="#fff"
                strokeWidth={2}
              />
            )
          })}

          {/* Valley annotations */}
          {showAnnotations && annotations.valleys.map((idx) => {
            const value = Number(data[idx]?.[lines[0]?.key]) || 0
            return (
              <ReferenceDot
                key={`valley-${idx}`}
                x={data[idx]?.day}
                y={value}
                r={4}
                fill="#ef4444"
                stroke="#fff"
                strokeWidth={2}
              />
            )
          })}
        </RechartsLineChart>
      </ResponsiveContainer>

      {/* Annotations legend */}
      {showAnnotations && (annotations.peaks.length > 0 || annotations.valleys.length > 0) && (
        <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
          {annotations.peaks.length > 0 && (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Pico</span>
            </div>
          )}
          {annotations.valleys.length > 0 && (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span>Baixa</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
})

LineChart.displayName = 'LineChart'

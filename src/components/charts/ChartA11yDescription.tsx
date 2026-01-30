'use client'

import { useMemo } from 'react'
import { VisuallyHidden } from '@/components/a11y/VisuallyHidden'

interface DataPoint {
  label: string
  value: number
  formattedValue?: string
}

interface ChartA11yDescriptionProps {
  chartType: 'line' | 'bar' | 'pie' | 'area'
  title: string
  data: DataPoint[]
  valueUnit?: string
  className?: string
}

/**
 * Generates accessible text description of chart data
 * WCAG 2.2 - 1.1.1 Non-text Content (Level A)
 */
export function ChartA11yDescription({
  chartType,
  title,
  data,
  valueUnit = '',
  className,
}: ChartA11yDescriptionProps) {
  const description = useMemo(() => {
    if (!data.length) {
      return `${getChartTypeLabel(chartType)} "${title}" sem dados disponíveis.`
    }

    const values = data.map(d => d.value)
    const minValue = Math.min(...values)
    const maxValue = Math.max(...values)
    const avgValue = values.reduce((a, b) => a + b, 0) / values.length

    const minPoint = data.find(d => d.value === minValue)
    const maxPoint = data.find(d => d.value === maxValue)

    // Calculate trend
    const firstValue = values[0]
    const lastValue = values[values.length - 1]
    const trend = lastValue > firstValue ? 'crescente' : lastValue < firstValue ? 'decrescente' : 'estável'

    const parts: string[] = [
      `${getChartTypeLabel(chartType)} "${title}" com ${data.length} pontos de dados.`,
    ]

    // Statistics
    parts.push(
      `Valor mínimo: ${formatValue(minValue, valueUnit)} em ${minPoint?.label}.`
    )
    parts.push(
      `Valor máximo: ${formatValue(maxValue, valueUnit)} em ${maxPoint?.label}.`
    )
    parts.push(
      `Média: ${formatValue(avgValue, valueUnit)}.`
    )

    // Trend (for time series)
    if (chartType === 'line' || chartType === 'area') {
      parts.push(`Tendência geral: ${trend}.`)
    }

    // Data points summary
    if (data.length <= 10) {
      parts.push('Dados detalhados:')
      data.forEach(point => {
        parts.push(`${point.label}: ${point.formattedValue || formatValue(point.value, valueUnit)}.`)
      })
    }

    return parts.join(' ')
  }, [chartType, title, data, valueUnit])

  return (
    <VisuallyHidden>
      <div role="img" aria-label={description} className={className}>
        {description}
      </div>
    </VisuallyHidden>
  )
}

function getChartTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    line: 'Gráfico de linha',
    bar: 'Gráfico de barras',
    pie: 'Gráfico de pizza',
    area: 'Gráfico de área',
  }
  return labels[type] || 'Gráfico'
}

function formatValue(value: number, unit: string): string {
  const formatted = value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  if (unit === 'currency' || unit === 'R$') {
    return `R$ ${formatted}`
  }
  if (unit === 'percentage' || unit === '%') {
    return `${formatted}%`
  }
  if (unit) {
    return `${formatted} ${unit}`
  }
  return formatted
}

/**
 * Generates a summary table for screen readers
 */
export function ChartDataTable({
  data,
  columns,
  caption,
}: {
  data: Record<string, unknown>[]
  columns: { key: string; label: string }[]
  caption: string
}) {
  if (!data.length) return null

  return (
    <VisuallyHidden>
      <table>
        <caption>{caption}</caption>
        <thead>
          <tr>
            {columns.map(col => (
              <th key={col.key} scope="col">{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i}>
              {columns.map(col => (
                <td key={col.key}>{String(row[col.key] ?? '-')}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </VisuallyHidden>
  )
}

export default ChartA11yDescription

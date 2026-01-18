'use client'

import { memo, useState, useMemo } from 'react'
import { ChevronUp, ChevronDown, ArrowUpDown } from 'lucide-react'
import { MetaAdsData } from '@/types/metrics'
import { formatCurrency, formatPercentage, formatNumber } from '@/lib/calculations'

interface DataTableProps {
  data: MetaAdsData[]
}

type SortField = keyof MetaAdsData
type SortDirection = 'asc' | 'desc'

const columns: { key: SortField; label: string; format: (v: number) => string }[] = [
  { key: 'day', label: 'Dia', format: (v) => String(v) },
  { key: 'amountSpent', label: 'Investimento', format: formatCurrency },
  { key: 'reach', label: 'Alcance', format: formatNumber },
  { key: 'impressions', label: 'Impressoes', format: formatNumber },
  { key: 'clicksAll', label: 'Cliques', format: formatNumber },
  { key: 'purchases', label: 'Compras', format: formatNumber },
  { key: 'cpm', label: 'CPM', format: formatCurrency },
  { key: 'cpc', label: 'CPC', format: formatCurrency },
  { key: 'cpa', label: 'CPA', format: formatCurrency },
  { key: 'ctrLink', label: 'CTR', format: (v) => formatPercentage(v) },
  { key: 'txConv', label: 'TX Conv', format: (v) => formatPercentage(v) },
]

export const DataTable = memo(function DataTable({ data }: DataTableProps) {
  const [sortField, setSortField] = useState<SortField>('day')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => {
      const aVal = a[sortField]
      const bVal = b[sortField]

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        // Para datas no formato DD/MM, ordenar corretamente
        if (sortField === 'day') {
          const [aDay, aMonth] = aVal.split('/').map(Number)
          const [bDay, bMonth] = bVal.split('/').map(Number)
          const aDate = aMonth * 100 + aDay
          const bDate = bMonth * 100 + bDay
          return sortDirection === 'asc' ? aDate - bDate : bDate - aDate
        }
        return sortDirection === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal)
      }

      const aNum = Number(aVal) || 0
      const bNum = Number(bVal) || 0
      return sortDirection === 'asc' ? aNum - bNum : bNum - aNum
    })
  }, [data, sortField, sortDirection])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  if (data.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-8 text-center">
        <p className="text-muted-foreground">Nenhum dado para exibir</p>
      </div>
    )
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              {columns.map(col => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className="px-4 py-3 text-left font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors whitespace-nowrap"
                >
                  <div className="flex items-center gap-1">
                    <span>{col.label}</span>
                    {sortField === col.key ? (
                      sortDirection === 'asc' ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3 h-3 opacity-40" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sortedData.map((row, idx) => (
              <tr
                key={idx}
                className="hover:bg-muted/30 transition-colors"
              >
                {columns.map(col => (
                  <td
                    key={col.key}
                    className="px-4 py-3 text-foreground whitespace-nowrap"
                  >
                    {col.key === 'day' ? row.day : col.format(row[col.key] as number)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
})

DataTable.displayName = 'DataTable'

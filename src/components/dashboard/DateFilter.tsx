'use client'

import { memo, useState } from 'react'
import { Calendar, ChevronDown } from 'lucide-react'

export type DateRange = 'today' | '7d' | '14d' | '30d' | 'all'

interface DateFilterProps {
  value: DateRange
  onChange: (value: DateRange) => void
}

const options: { value: DateRange; label: string }[] = [
  { value: 'today', label: 'Hoje' },
  { value: '7d', label: '7 dias' },
  { value: '14d', label: '14 dias' },
  { value: '30d', label: '30 dias' },
  { value: 'all', label: 'Todo periodo' },
]

export const DateFilter = memo(function DateFilter({ value, onChange }: DateFilterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const selectedOption = options.find(o => o.value === value)

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2.5 bg-secondary text-foreground text-sm font-medium rounded-lg border border-border hover:bg-muted transition-colors"
      >
        <Calendar className="w-4 h-4 text-muted-foreground" />
        <span>{selectedOption?.label}</span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 z-50 bg-card border border-border rounded-lg shadow-lg py-1 min-w-[140px]">
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value)
                  setIsOpen(false)
                }}
                className={`w-full px-4 py-2 text-left text-sm hover:bg-muted transition-colors ${
                  value === option.value ? 'text-primary font-medium bg-primary/5' : 'text-foreground'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
})

DateFilter.displayName = 'DateFilter'

// Helper para parsear data no formato DD/MM ou DD/MM/YYYY
function parseDate(day: string, referenceYear: number): Date | null {
  const parts = day.split('/')
  if (parts.length === 3) {
    const [d, m, y] = parts.map(Number)
    return new Date(y, m - 1, d)
  } else if (parts.length === 2) {
    const [d, m] = parts.map(Number)
    return new Date(referenceYear, m - 1, d)
  }
  return null
}

// Helper para obter o numero de dias do filtro
export function getDateRangeDays(range: DateRange): number {
  switch (range) {
    case 'today': return 1
    case '7d': return 7
    case '14d': return 14
    case '30d': return 30
    case 'all': return 0
  }
}

// Helper para filtrar dados por periodo
export function filterDataByDateRange<T extends { day: string }>(
  data: T[],
  range: DateRange
): T[] {
  if (range === 'all') return data

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const daysBack = getDateRangeDays(range)

  const startDate = new Date(today)
  startDate.setDate(startDate.getDate() - daysBack)

  return data.filter(item => {
    const itemDate = parseDate(item.day, now.getFullYear())
    if (!itemDate) return true

    if (range === 'today') {
      return itemDate.getTime() === today.getTime()
    }

    return itemDate >= startDate && itemDate <= today
  })
}

// Helper para obter dados do periodo anterior (para comparacao)
export function filterDataByPreviousPeriod<T extends { day: string }>(
  data: T[],
  range: DateRange
): T[] {
  if (range === 'all') return []

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const daysBack = getDateRangeDays(range)

  // Periodo anterior: do mesmo tamanho, terminando onde o periodo atual comeca
  const endDate = new Date(today)
  endDate.setDate(endDate.getDate() - daysBack - 1)

  const startDate = new Date(endDate)
  startDate.setDate(startDate.getDate() - daysBack + 1)

  return data.filter(item => {
    const itemDate = parseDate(item.day, now.getFullYear())
    if (!itemDate) return false

    return itemDate >= startDate && itemDate <= endDate
  })
}

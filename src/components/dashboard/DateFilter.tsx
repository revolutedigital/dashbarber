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

// Helper para filtrar dados por periodo
export function filterDataByDateRange<T extends { day: string }>(
  data: T[],
  range: DateRange
): T[] {
  if (range === 'all') return data

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  let daysBack = 0
  switch (range) {
    case 'today':
      daysBack = 0
      break
    case '7d':
      daysBack = 7
      break
    case '14d':
      daysBack = 14
      break
    case '30d':
      daysBack = 30
      break
  }

  const startDate = new Date(today)
  startDate.setDate(startDate.getDate() - daysBack)

  return data.filter(item => {
    // Parse DD/MM/YYYY ou DD/MM format
    const parts = item.day.split('/')
    let itemDate: Date

    if (parts.length === 3) {
      // DD/MM/YYYY
      const [day, month, year] = parts.map(Number)
      itemDate = new Date(year, month - 1, day)
    } else if (parts.length === 2) {
      // DD/MM - assume ano atual
      const [day, month] = parts.map(Number)
      itemDate = new Date(now.getFullYear(), month - 1, day)
    } else {
      return true // Se nao conseguir parsear, inclui
    }

    if (range === 'today') {
      return itemDate.getTime() === today.getTime()
    }

    return itemDate >= startDate && itemDate <= today
  })
}

'use client'

import { memo, useState, useRef, useEffect } from 'react'
import { Calendar, Check } from 'lucide-react'

export type DateRange = 'yesterday' | 'today' | 'last2days' | 'last3days' | '7d' | '14d' | '30d' | 'all'

interface DateFilterProps {
  value: DateRange
  onChange: (value: DateRange) => void
}

const options: { value: DateRange; label: string; shortLabel: string }[] = [
  { value: 'yesterday', label: 'Ontem', shortLabel: 'Ontem' },
  { value: 'today', label: 'Hoje', shortLabel: 'Hoje' },
  { value: 'last2days', label: 'Ultimos 2 dias', shortLabel: '2d' },
  { value: 'last3days', label: 'Ultimos 3 dias', shortLabel: '3d' },
  { value: '7d', label: '7 dias', shortLabel: '7d' },
  { value: '14d', label: '14 dias', shortLabel: '14d' },
  { value: '30d', label: '30 dias', shortLabel: '30d' },
  { value: 'all', label: 'Todo periodo', shortLabel: 'Tudo' },
]

// Quick chips para acesso rápido
const quickOptions: DateRange[] = ['today', '7d', '30d']

export const DateFilter = memo(function DateFilter({ value, onChange }: DateFilterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const selectedOption = options.find(o => o.value === value)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  return (
    <div className="flex items-center gap-2" ref={dropdownRef} onKeyDown={handleKeyDown}>
      {/* Quick access chips */}
      <div className="hidden sm:flex items-center gap-1">
        {quickOptions.map((option) => {
          const opt = options.find(o => o.value === option)!
          const isSelected = value === option

          return (
            <button
              key={option}
              onClick={() => onChange(option)}
              className={`
                px-3 py-1.5 text-xs font-medium rounded-full
                transition-all duration-200 ease-out
                ${isSelected
                  ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25 scale-105'
                  : 'bg-secondary/80 text-muted-foreground hover:bg-secondary hover:text-foreground'
                }
              `}
            >
              {opt.shortLabel}
            </button>
          )
        })}
      </div>

      {/* Full dropdown */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          className={`
            flex items-center gap-2 px-3 py-2
            bg-secondary/80 backdrop-blur-sm text-foreground text-sm font-medium
            rounded-xl border border-border/50
            hover:bg-secondary hover:border-border
            focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary
            transition-all duration-200
            ${isOpen ? 'ring-2 ring-primary/50 border-primary' : ''}
          `}
        >
          <Calendar className="w-4 h-4 text-primary" />
          <span className="hidden xs:inline">{selectedOption?.label}</span>
          <span className="xs:hidden">{selectedOption?.shortLabel}</span>
          <div className={`
            w-4 h-4 flex items-center justify-center
            transition-transform duration-200
            ${isOpen ? 'rotate-180' : ''}
          `}>
            <svg className="w-3 h-3 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>

        {/* Dropdown menu */}
        {isOpen && (
          <div
            role="listbox"
            className={`
              absolute right-0 top-full mt-2 z-50
              bg-popover/95 backdrop-blur-xl
              border border-border/50 rounded-xl
              shadow-2xl shadow-black/20
              py-2 min-w-[180px]
              animate-in fade-in-0 zoom-in-95 slide-in-from-top-2
              duration-200
            `}
          >
            {/* Header */}
            <div className="px-3 py-2 border-b border-border/50 mb-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Selecionar periodo
              </p>
            </div>

            {options.map((option) => {
              const isSelected = value === option.value

              return (
                <button
                  key={option.value}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(option.value)
                    setIsOpen(false)
                  }}
                  className={`
                    w-full px-3 py-2.5 text-left text-sm
                    flex items-center justify-between gap-3
                    transition-colors duration-150
                    ${isSelected
                      ? 'bg-primary/10 text-primary'
                      : 'text-foreground hover:bg-muted/50'
                    }
                  `}
                >
                  <span className={isSelected ? 'font-medium' : ''}>{option.label}</span>
                  {isSelected && (
                    <Check className="w-4 h-4 text-primary" />
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>
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
    case 'yesterday': return 1
    case 'today': return 1
    case 'last2days': return 2
    case 'last3days': return 3
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
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  return data.filter(item => {
    const itemDate = parseDate(item.day, now.getFullYear())
    if (!itemDate) return true

    // Filtros especificos
    if (range === 'today') {
      return itemDate.getTime() === today.getTime()
    }

    if (range === 'yesterday') {
      return itemDate.getTime() === yesterday.getTime()
    }

    if (range === 'last2days') {
      return itemDate.getTime() === today.getTime() || itemDate.getTime() === yesterday.getTime()
    }

    if (range === 'last3days') {
      const twoDaysAgo = new Date(today)
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)
      return itemDate >= twoDaysAgo && itemDate <= today
    }

    // Filtros de X dias (7d, 14d, 30d)
    const daysBack = getDateRangeDays(range)
    const startDate = new Date(today)
    startDate.setDate(startDate.getDate() - daysBack + 1)

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

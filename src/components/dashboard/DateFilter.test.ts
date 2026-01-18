import { describe, it, expect } from 'vitest'
import { filterDataByDateRange, filterDataByPreviousPeriod, getDateRangeDays } from './DateFilter'

describe('getDateRangeDays', () => {
  it('should return 1 for yesterday', () => {
    expect(getDateRangeDays('yesterday')).toBe(1)
  })

  it('should return 1 for today', () => {
    expect(getDateRangeDays('today')).toBe(1)
  })

  it('should return 2 for last2days', () => {
    expect(getDateRangeDays('last2days')).toBe(2)
  })

  it('should return 3 for last3days', () => {
    expect(getDateRangeDays('last3days')).toBe(3)
  })

  it('should return 7 for 7d', () => {
    expect(getDateRangeDays('7d')).toBe(7)
  })

  it('should return 14 for 14d', () => {
    expect(getDateRangeDays('14d')).toBe(14)
  })

  it('should return 30 for 30d', () => {
    expect(getDateRangeDays('30d')).toBe(30)
  })

  it('should return 0 for all', () => {
    expect(getDateRangeDays('all')).toBe(0)
  })
})

describe('filterDataByDateRange', () => {
  const mockData = [
    { day: '01/01' },
    { day: '15/01' },
    { day: '20/01' },
  ]

  it('should return all data when range is all', () => {
    const result = filterDataByDateRange(mockData, 'all')
    expect(result).toHaveLength(3)
  })

  it('should handle empty data', () => {
    const result = filterDataByDateRange([], '7d')
    expect(result).toHaveLength(0)
  })
})

describe('filterDataByPreviousPeriod', () => {
  it('should return empty array when range is all', () => {
    const mockData = [{ day: '01/01' }]
    const result = filterDataByPreviousPeriod(mockData, 'all')
    expect(result).toHaveLength(0)
  })

  it('should handle empty data', () => {
    const result = filterDataByPreviousPeriod([], '7d')
    expect(result).toHaveLength(0)
  })
})

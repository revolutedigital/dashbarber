'use client'

import { useState, useEffect, useCallback } from 'react'
import type { DateRange } from '@/components/dashboard'

/**
 * Manages core dashboard state: funnel selection, date range, theme, and modals
 */
export function useDashboardState() {
  // Core selections
  const [selectedFunnel, setSelectedFunnel] = useState<string>('all')
  const [dateRange, setDateRange] = useState<DateRange>('all')
  const [isDark, setIsDark] = useState(true)

  // Modal visibility states
  const [showMetricModal, setShowMetricModal] = useState(false)
  const [showGoalModal, setShowGoalModal] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  // Sync dark mode with document
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDark])

  // Handlers
  const handleFunnelChange = useCallback((value: string) => {
    setSelectedFunnel(value)
  }, [])

  const handleDateRangeChange = useCallback((value: DateRange) => {
    setDateRange(value)
  }, [])

  const handleToggleTheme = useCallback(() => {
    setIsDark(prev => !prev)
  }, [])

  const handleToggleSettings = useCallback(() => {
    setShowSettings(prev => !prev)
  }, [])

  const handleOpenMetricModal = useCallback(() => {
    setShowMetricModal(true)
  }, [])

  const handleCloseMetricModal = useCallback(() => {
    setShowMetricModal(false)
  }, [])

  const handleOpenGoalModal = useCallback(() => {
    setShowGoalModal(true)
  }, [])

  const handleCloseGoalModal = useCallback(() => {
    setShowGoalModal(false)
  }, [])

  return {
    // State
    selectedFunnel,
    dateRange,
    isDark,
    showMetricModal,
    showGoalModal,
    showSettings,

    // Handlers
    handleFunnelChange,
    handleDateRangeChange,
    handleToggleTheme,
    handleToggleSettings,
    handleOpenMetricModal,
    handleCloseMetricModal,
    handleOpenGoalModal,
    handleCloseGoalModal,
  }
}

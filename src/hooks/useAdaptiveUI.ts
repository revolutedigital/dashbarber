'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'

type DeviceType = 'mobile' | 'tablet' | 'desktop' | 'large-desktop'
type ColorScheme = 'light' | 'dark'
type ContrastPreference = 'normal' | 'more' | 'less'

interface AdaptiveUIState {
  // Device info
  deviceType: DeviceType
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean

  // Screen dimensions
  screenWidth: number
  screenHeight: number
  isPortrait: boolean

  // User preferences
  colorScheme: ColorScheme
  prefersReducedMotion: boolean
  prefersReducedData: boolean
  contrastPreference: ContrastPreference

  // Touch support
  isTouchDevice: boolean

  // Connection info
  isOnline: boolean
  connectionType: string | null
  saveData: boolean

  // Visibility
  isPageVisible: boolean
}

interface AdaptiveUIOptions {
  /**
   * Breakpoint for mobile devices (default: 640px)
   */
  mobileBreakpoint?: number
  /**
   * Breakpoint for tablet devices (default: 1024px)
   */
  tabletBreakpoint?: number
  /**
   * Breakpoint for large desktop (default: 1536px)
   */
  largeDesktopBreakpoint?: number
}

const defaultOptions: Required<AdaptiveUIOptions> = {
  mobileBreakpoint: 640,
  tabletBreakpoint: 1024,
  largeDesktopBreakpoint: 1536,
}

/**
 * Hook for adaptive UI based on device, preferences, and capabilities
 * Detects device type, user preferences, and adapts UI accordingly
 */
export function useAdaptiveUI(options: AdaptiveUIOptions = {}): AdaptiveUIState {
  const config = { ...defaultOptions, ...options }

  const [state, setState] = useState<AdaptiveUIState>(() => ({
    deviceType: 'desktop',
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    screenWidth: typeof window !== 'undefined' ? window.innerWidth : 1200,
    screenHeight: typeof window !== 'undefined' ? window.innerHeight : 800,
    isPortrait: false,
    colorScheme: 'dark',
    prefersReducedMotion: false,
    prefersReducedData: false,
    contrastPreference: 'normal',
    isTouchDevice: false,
    isOnline: true,
    connectionType: null,
    saveData: false,
    isPageVisible: true,
  }))

  const getDeviceType = useCallback((width: number): DeviceType => {
    if (width < config.mobileBreakpoint) return 'mobile'
    if (width < config.tabletBreakpoint) return 'tablet'
    if (width >= config.largeDesktopBreakpoint) return 'large-desktop'
    return 'desktop'
  }, [config.mobileBreakpoint, config.tabletBreakpoint, config.largeDesktopBreakpoint])

  const getContrastPreference = useCallback((): ContrastPreference => {
    if (typeof window === 'undefined') return 'normal'
    if (window.matchMedia('(prefers-contrast: more)').matches) return 'more'
    if (window.matchMedia('(prefers-contrast: less)').matches) return 'less'
    return 'normal'
  }, [])

  const getConnectionInfo = useCallback(() => {
    if (typeof navigator === 'undefined') {
      return { connectionType: null, saveData: false }
    }

    const connection = (navigator as Navigator & {
      connection?: { effectiveType?: string; saveData?: boolean }
    }).connection

    return {
      connectionType: connection?.effectiveType || null,
      saveData: connection?.saveData || false,
    }
  }, [])

  // Update state based on current conditions
  const updateState = useCallback(() => {
    if (typeof window === 'undefined') return

    const width = window.innerWidth
    const height = window.innerHeight
    const deviceType = getDeviceType(width)
    const { connectionType, saveData } = getConnectionInfo()

    setState({
      deviceType,
      isMobile: deviceType === 'mobile',
      isTablet: deviceType === 'tablet',
      isDesktop: deviceType === 'desktop' || deviceType === 'large-desktop',
      screenWidth: width,
      screenHeight: height,
      isPortrait: height > width,
      colorScheme: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
      prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      prefersReducedData: window.matchMedia('(prefers-reduced-data: reduce)').matches,
      contrastPreference: getContrastPreference(),
      isTouchDevice: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      isOnline: navigator.onLine,
      connectionType,
      saveData,
      isPageVisible: document.visibilityState === 'visible',
    })
  }, [getDeviceType, getConnectionInfo, getContrastPreference])

  useEffect(() => {
    // Initial update
    updateState()

    // Resize listener with debounce
    let resizeTimeout: NodeJS.Timeout
    const handleResize = () => {
      clearTimeout(resizeTimeout)
      resizeTimeout = setTimeout(updateState, 100)
    }

    // Media query listeners
    const colorSchemeQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const contrastQuery = window.matchMedia('(prefers-contrast: more)')

    const handleMediaChange = () => updateState()

    // Event listeners
    window.addEventListener('resize', handleResize)
    window.addEventListener('online', updateState)
    window.addEventListener('offline', updateState)
    document.addEventListener('visibilitychange', updateState)

    colorSchemeQuery.addEventListener('change', handleMediaChange)
    motionQuery.addEventListener('change', handleMediaChange)
    contrastQuery.addEventListener('change', handleMediaChange)

    return () => {
      clearTimeout(resizeTimeout)
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('online', updateState)
      window.removeEventListener('offline', updateState)
      document.removeEventListener('visibilitychange', updateState)
      colorSchemeQuery.removeEventListener('change', handleMediaChange)
      motionQuery.removeEventListener('change', handleMediaChange)
      contrastQuery.removeEventListener('change', handleMediaChange)
    }
  }, [updateState])

  return state
}

/**
 * Hook for responsive values based on device type
 */
export function useResponsiveValue<T>(values: {
  mobile?: T
  tablet?: T
  desktop?: T
  'large-desktop'?: T
}, defaultValue: T): T {
  const { deviceType } = useAdaptiveUI()

  return useMemo(() => {
    // Try exact match first
    if (values[deviceType] !== undefined) {
      return values[deviceType] as T
    }

    // Fallback chain
    if (deviceType === 'large-desktop' && values.desktop !== undefined) {
      return values.desktop
    }
    if (deviceType === 'tablet' && values.mobile !== undefined) {
      return values.mobile
    }
    if (deviceType === 'mobile' && values.tablet !== undefined) {
      return values.tablet
    }

    return defaultValue
  }, [deviceType, values, defaultValue])
}

/**
 * Hook for simplified animation based on user preferences
 */
export function useAnimationConfig() {
  const { prefersReducedMotion, saveData, connectionType } = useAdaptiveUI()

  return useMemo(() => {
    // Disable animations if user prefers reduced motion
    if (prefersReducedMotion) {
      return {
        duration: 0,
        enabled: false,
        transition: 'none',
      }
    }

    // Reduce animations on slow connections or save data mode
    if (saveData || connectionType === 'slow-2g' || connectionType === '2g') {
      return {
        duration: 150,
        enabled: true,
        transition: 'fast',
      }
    }

    // Full animations
    return {
      duration: 300,
      enabled: true,
      transition: 'normal',
    }
  }, [prefersReducedMotion, saveData, connectionType])
}

export default useAdaptiveUI

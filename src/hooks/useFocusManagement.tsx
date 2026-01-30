'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Hook for managing focus after user actions
 * WCAG 2.2 - 2.4.3 Focus Order (Level A)
 */
export function useFocusManagement() {
  const previousFocusRef = useRef<HTMLElement | null>(null)

  /**
   * Saves current focus to restore later
   */
  const saveFocus = useCallback(() => {
    previousFocusRef.current = document.activeElement as HTMLElement
  }, [])

  /**
   * Restores focus to previously saved element
   */
  const restoreFocus = useCallback(() => {
    if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
      previousFocusRef.current.focus()
    }
  }, [])

  /**
   * Focuses first focusable element in container
   */
  const focusFirst = useCallback((container: HTMLElement | null) => {
    if (!container) return

    const focusable = container.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    focusable?.focus()
  }, [])

  /**
   * Moves focus to specific element by ID
   */
  const focusById = useCallback((id: string) => {
    const element = document.getElementById(id)
    if (element) {
      // Make element focusable if not already
      if (!element.hasAttribute('tabindex')) {
        element.setAttribute('tabindex', '-1')
      }
      element.focus()
    }
  }, [])

  return {
    saveFocus,
    restoreFocus,
    focusFirst,
    focusById,
  }
}

/**
 * Hook for modal focus trap
 * WCAG 2.2 - 2.1.2 No Keyboard Trap (Level A)
 */
export function useFocusTrap(isActive: boolean) {
  const containerRef = useRef<HTMLElement | null>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!isActive) return

    // Save current focus
    previousFocusRef.current = document.activeElement as HTMLElement

    // Focus first element in trap
    const container = containerRef.current
    if (container) {
      const firstFocusable = container.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      firstFocusable?.focus()
    }

    // Cleanup: restore focus
    return () => {
      previousFocusRef.current?.focus()
    }
  }, [isActive])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key !== 'Tab' || !containerRef.current) return

    const focusableElements = containerRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )

    if (focusableElements.length === 0) return

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    if (e.shiftKey && document.activeElement === firstElement) {
      e.preventDefault()
      lastElement.focus()
    } else if (!e.shiftKey && document.activeElement === lastElement) {
      e.preventDefault()
      firstElement.focus()
    }
  }, [])

  useEffect(() => {
    if (!isActive) return

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isActive, handleKeyDown])

  return containerRef
}

/**
 * Hook for roving tabindex pattern
 * Useful for navigation menus, tab lists, etc.
 */
export function useRovingTabIndex<T extends HTMLElement>(
  items: Array<{ id: string; disabled?: boolean }>,
  options: {
    orientation?: 'horizontal' | 'vertical' | 'both'
    wrap?: boolean
  } = {}
) {
  const { orientation = 'horizontal', wrap = true } = options
  const [activeIndex, setActiveIndex] = useState(0)
  const itemRefs = useRef<Map<string, T>>(new Map())

  const registerItem = useCallback((id: string, ref: T | null) => {
    if (ref) {
      itemRefs.current.set(id, ref)
    } else {
      itemRefs.current.delete(id)
    }
  }, [])

  const focusItem = useCallback((index: number) => {
    const enabledItems = items.filter(item => !item.disabled)
    if (enabledItems.length === 0) return

    let targetIndex = index
    if (wrap) {
      targetIndex = ((index % enabledItems.length) + enabledItems.length) % enabledItems.length
    } else {
      targetIndex = Math.max(0, Math.min(index, enabledItems.length - 1))
    }

    const targetItem = enabledItems[targetIndex]
    const element = itemRefs.current.get(targetItem.id)
    if (element) {
      element.focus()
      setActiveIndex(targetIndex)
    }
  }, [items, wrap])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const enabledItems = items.filter(item => !item.disabled)
    const currentIndex = activeIndex

    let nextIndex: number | null = null

    switch (e.key) {
      case 'ArrowRight':
        if (orientation === 'horizontal' || orientation === 'both') {
          nextIndex = currentIndex + 1
        }
        break
      case 'ArrowLeft':
        if (orientation === 'horizontal' || orientation === 'both') {
          nextIndex = currentIndex - 1
        }
        break
      case 'ArrowDown':
        if (orientation === 'vertical' || orientation === 'both') {
          nextIndex = currentIndex + 1
        }
        break
      case 'ArrowUp':
        if (orientation === 'vertical' || orientation === 'both') {
          nextIndex = currentIndex - 1
        }
        break
      case 'Home':
        nextIndex = 0
        break
      case 'End':
        nextIndex = enabledItems.length - 1
        break
    }

    if (nextIndex !== null) {
      e.preventDefault()
      focusItem(nextIndex)
    }
  }, [activeIndex, items, orientation, focusItem])

  const getItemProps = useCallback((index: number) => ({
    tabIndex: index === activeIndex ? 0 : -1,
    onKeyDown: handleKeyDown,
    ref: (ref: T | null) => registerItem(items[index].id, ref),
  }), [activeIndex, handleKeyDown, registerItem, items])

  return {
    activeIndex,
    setActiveIndex,
    getItemProps,
    focusItem,
  }
}

/**
 * Hook for announcing content changes to screen readers
 */
export function useAnnounce() {
  const [announcement, setAnnouncement] = useState('')
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const announce = useCallback((message: string, delay = 100) => {
    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Clear then set to trigger announcement
    setAnnouncement('')
    timeoutRef.current = setTimeout(() => {
      setAnnouncement(message)
    }, delay)
  }, [])

  const AnnouncerComponent = useCallback(() => (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    >
      {announcement}
    </div>
  ), [announcement])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return { announce, AnnouncerComponent }
}

export default useFocusManagement

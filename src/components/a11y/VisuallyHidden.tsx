'use client'

import { type ElementType, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface VisuallyHiddenProps {
  children: ReactNode
  className?: string
  as?: ElementType
}

/**
 * Visually hides content while keeping it accessible to screen readers
 * WCAG 2.2 compliant
 */
export function VisuallyHidden({
  children,
  className,
  as: Component = 'span',
}: VisuallyHiddenProps) {
  return (
    <Component
      className={cn(
        // Visually hidden but accessible to screen readers
        'absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0',
        // Using clip instead of clip-path for better browser support
        '[clip:rect(0,0,0,0)]',
        className
      )}
    >
      {children}
    </Component>
  )
}

/**
 * Live region for announcing dynamic content changes
 * WCAG 2.2 - 4.1.3 Status Messages (Level AA)
 */
export function LiveRegion({
  children,
  politeness = 'polite',
  atomic = true,
  className,
}: {
  children: React.ReactNode
  politeness?: 'polite' | 'assertive' | 'off'
  atomic?: boolean
  className?: string
}) {
  return (
    <div
      role="status"
      aria-live={politeness}
      aria-atomic={atomic}
      className={cn('sr-only', className)}
    >
      {children}
    </div>
  )
}

/**
 * Focus trap for modal dialogs
 */
export function FocusTrap({
  children,
  active = true,
}: {
  children: React.ReactNode
  active?: boolean
}) {
  if (!active) return <>{children}</>

  return (
    <div
      role="presentation"
      tabIndex={-1}
      onKeyDown={(e) => {
        if (e.key === 'Tab') {
          const focusableElements = e.currentTarget.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          )
          const firstElement = focusableElements[0] as HTMLElement
          const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

          if (e.shiftKey && document.activeElement === firstElement) {
            e.preventDefault()
            lastElement?.focus()
          } else if (!e.shiftKey && document.activeElement === lastElement) {
            e.preventDefault()
            firstElement?.focus()
          }
        }
      }}
    >
      {children}
    </div>
  )
}

export default VisuallyHidden

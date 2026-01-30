'use client'

import { useCallback, useState } from 'react'

interface SkipLink {
  id: string
  label: string
}

const defaultSkipLinks: SkipLink[] = [
  { id: 'main-content', label: 'Pular para conteúdo principal' },
  { id: 'kpi-section', label: 'Pular para métricas' },
  { id: 'charts-section', label: 'Pular para gráficos' },
]

interface SkipLinksProps {
  /**
   * Custom skip links (overrides defaults)
   */
  links?: SkipLink[]
}

/**
 * Skip Links Component for keyboard navigation
 * Allows users to skip directly to main content sections
 *
 * WCAG 2.2 - Success Criterion 2.4.1 Bypass Blocks (Level A)
 */
export function SkipLinks({ links = defaultSkipLinks }: SkipLinksProps) {
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null)

  const handleFocus = useCallback((index: number) => {
    setFocusedIndex(index)
  }, [])

  const handleBlur = useCallback(() => {
    setFocusedIndex(null)
  }, [])

  const handleClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault()
    const element = document.getElementById(id)
    if (element) {
      // Set tabindex temporarily if not focusable
      const tabindex = element.getAttribute('tabindex')
      if (tabindex === null) {
        element.setAttribute('tabindex', '-1')
      }

      element.focus()
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })

      // Remove tabindex after focus if it wasn't there before
      if (tabindex === null) {
        // Use setTimeout to ensure focus happens first
        setTimeout(() => {
          element.removeAttribute('tabindex')
        }, 100)
      }
    }
  }, [])

  return (
    <nav
      aria-label="Links de navegação rápida"
      className="skip-links-container"
    >
      {links.map((link, index) => (
        <a
          key={link.id}
          href={`#${link.id}`}
          className="skip-link"
          onClick={(e) => handleClick(e, link.id)}
          onFocus={() => handleFocus(index)}
          onBlur={handleBlur}
          aria-current={focusedIndex === index ? 'true' : undefined}
        >
          {link.label}
        </a>
      ))}
    </nav>
  )
}

/**
 * Target anchor for skip links
 * Place this at the beginning of each major section
 */
export function SkipLinkTarget({
  id,
  label,
  children,
  className = '',
}: {
  id: string
  label: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <section
      id={id}
      aria-label={label}
      className={className}
      tabIndex={-1}
    >
      {children}
    </section>
  )
}

export default SkipLinks

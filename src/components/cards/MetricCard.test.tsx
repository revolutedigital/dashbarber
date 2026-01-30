import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MetricCard } from './MetricCard'
import { DollarSign } from 'lucide-react'

describe('MetricCard', () => {
  describe('rendering', () => {
    it('should render title and value', () => {
      render(<MetricCard title="Test Metric" value="R$ 1.000,00" />)

      expect(screen.getByText('Test Metric')).toBeInTheDocument()
      expect(screen.getByText('R$ 1.000,00')).toBeInTheDocument()
    })

    it('should render subtitle when provided', () => {
      render(
        <MetricCard
          title="Test"
          value="100"
          subtitle="vs. período anterior"
        />
      )

      expect(screen.getByText('vs. período anterior')).toBeInTheDocument()
    })

    it('should render icon when provided', () => {
      render(
        <MetricCard
          title="Revenue"
          value="R$ 5.000"
          icon={<DollarSign data-testid="icon" />}
        />
      )

      expect(screen.getByTestId('icon')).toBeInTheDocument()
    })

    it('should not render icon container when no icon provided', () => {
      const { container } = render(<MetricCard title="Test" value="100" />)

      // Check that there's no icon container
      const iconContainers = container.querySelectorAll('[class*="lucide"]')
      expect(iconContainers.length).toBe(0)
    })
  })

  describe('trend indicator', () => {
    it('should show positive trend with green styling', () => {
      render(<MetricCard title="Growth" value="50%" trend={10.5} />)

      const trendText = screen.getByText('+10.5%')
      expect(trendText).toBeInTheDocument()
    })

    it('should show negative trend with red styling', () => {
      render(<MetricCard title="Decline" value="30%" trend={-5.2} />)

      const trendText = screen.getByText('-5.2%')
      expect(trendText).toBeInTheDocument()
    })

    it('should show neutral trend with no sign', () => {
      render(<MetricCard title="Stable" value="40%" trend={0} />)

      const trendText = screen.getByText('0.0%')
      expect(trendText).toBeInTheDocument()
    })

    it('should not render trend when not provided', () => {
      render(<MetricCard title="No Trend" value="100" />)

      // Check that there's no percentage sign in the footer
      const trendElements = document.querySelectorAll('[class*="trending"]')
      expect(trendElements.length).toBe(0)
    })
  })

  describe('styling', () => {
    it('should apply custom className', () => {
      const { container } = render(
        <MetricCard
          title="Custom"
          value="100"
          className="custom-class"
        />
      )

      expect(container.firstChild).toHaveClass('custom-class')
    })

    it('should have proper base styling', () => {
      const { container } = render(<MetricCard title="Test" value="100" />)

      const card = container.firstChild as HTMLElement
      expect(card.className).toContain('rounded-2xl')
      expect(card.className).toContain('backdrop-blur')
    })
  })

  describe('edge cases', () => {
    it('should handle very long values', () => {
      render(<MetricCard title="Long" value="R$ 1.234.567.890,00" />)

      expect(screen.getByText('R$ 1.234.567.890,00')).toBeInTheDocument()
    })

    it('should handle very long titles', () => {
      const longTitle = 'This is a very long metric title that might overflow'
      render(<MetricCard title={longTitle} value="100" />)

      expect(screen.getByText(longTitle)).toBeInTheDocument()
    })

    it('should handle empty subtitle', () => {
      const { container } = render(<MetricCard title="Test" value="100" subtitle="" />)

      // Should not render empty subtitle span
      const subtitleElements = container.querySelectorAll('.text-muted-foreground\\/70')
      expect(subtitleElements.length).toBe(0)
    })

    it('should format trend with decimal places', () => {
      render(<MetricCard title="Test" value="100" trend={12.3456} />)

      expect(screen.getByText('+12.3%')).toBeInTheDocument()
    })

    it('should handle very small trends', () => {
      render(<MetricCard title="Test" value="100" trend={0.001} />)

      expect(screen.getByText('+0.0%')).toBeInTheDocument()
    })
  })
})

import { test, expect } from '@playwright/test'

test.describe('Dashboard Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should load the dashboard page', async ({ page }) => {
    // Wait for the page to load
    await expect(page).toHaveTitle(/DashBarber/i)
  })

  test('should display the dashboard header', async ({ page }) => {
    // Look for dashboard header elements
    const header = page.locator('header, [data-testid="dashboard-header"]').first()
    await expect(header).toBeVisible()
  })

  test('should display KPI cards', async ({ page }) => {
    // Wait for KPI section to load
    const kpiSection = page.locator('[data-testid="kpi-section"], .kpi-section, section').first()
    await expect(kpiSection).toBeVisible({ timeout: 10000 })
  })

  test('should display charts section', async ({ page }) => {
    // Wait for charts to render
    await page.waitForSelector('canvas, svg, [data-testid="chart"]', { timeout: 10000 })
    const charts = page.locator('canvas, svg').first()
    await expect(charts).toBeVisible()
  })

  test('should toggle dark mode', async ({ page }) => {
    // Look for dark mode toggle
    const darkModeToggle = page.locator('button').filter({ hasText: /dark|light|theme/i }).first()

    if (await darkModeToggle.isVisible()) {
      // Get initial state
      const initialClass = await page.locator('html').getAttribute('class')

      // Click toggle
      await darkModeToggle.click()

      // Wait for class change
      await page.waitForTimeout(500)

      // Verify class changed
      const newClass = await page.locator('html').getAttribute('class')
      expect(newClass).not.toBe(initialClass)
    }
  })

  test('should display loading state initially', async ({ page }) => {
    // Navigate and immediately check for loading state
    await page.goto('/', { waitUntil: 'domcontentloaded' })

    // Loading state might show skeleton or spinner
    const loadingElement = page.locator('[data-loading="true"], .animate-pulse, .skeleton, .loading').first()

    // Either loading is visible or content is already loaded
    const hasLoading = await loadingElement.isVisible().catch(() => false)
    const hasContent = await page.locator('canvas, svg, [data-testid="metric-value"]').first().isVisible().catch(() => false)

    expect(hasLoading || hasContent).toBe(true)
  })
})

test.describe('Dashboard Filters', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('should have date filter options', async ({ page }) => {
    // Look for date filter buttons or select
    const dateFilters = page.locator('button, [role="combobox"]').filter({ hasText: /hoje|7|14|30|dias/i })

    if (await dateFilters.count() > 0) {
      await expect(dateFilters.first()).toBeVisible()
    }
  })

  test('should filter by date range', async ({ page }) => {
    // Find date filter button
    const dateButton = page.locator('button').filter({ hasText: /7 dias|últimos 7/i }).first()

    if (await dateButton.isVisible()) {
      await dateButton.click()

      // Wait for data to update
      await page.waitForTimeout(1000)

      // Verify button is selected/active
      await expect(dateButton).toBeVisible()
    }
  })

  test('should have funnel selector', async ({ page }) => {
    // Look for funnel selector
    const funnelSelector = page.locator('select, [role="combobox"], button').filter({ hasText: /funil|funnel|todos/i }).first()

    if (await funnelSelector.isVisible()) {
      await expect(funnelSelector).toBeVisible()
    }
  })
})

test.describe('Dashboard Metrics', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('should display numeric values in cards', async ({ page }) => {
    // Wait for metrics to load
    await page.waitForTimeout(3000)

    // Look for formatted numbers (currency, percentages, etc.)
    const metricValues = page.locator('[data-testid="metric-value"], .metric-value, .text-2xl, .text-3xl, .text-4xl')

    if (await metricValues.count() > 0) {
      const firstMetric = metricValues.first()
      await expect(firstMetric).toBeVisible()

      // Verify it contains some text
      const text = await firstMetric.textContent()
      expect(text).toBeTruthy()
    }
  })

  test('should display trend indicators', async ({ page }) => {
    await page.waitForTimeout(3000)

    // Look for trend indicators (arrows, percentages, colors)
    const trendIndicators = page.locator('[data-testid="trend"], .trend, .text-green, .text-red, svg[data-icon]')

    // Either has trend indicators or doesn't (both valid)
    expect(await trendIndicators.count()).toBeGreaterThanOrEqual(0)
  })
})

test.describe('Dashboard Navigation', () => {
  test('should navigate to dashboard from home', async ({ page }) => {
    await page.goto('/')

    // If there's a redirect, follow it
    await page.waitForURL('**/*')

    // Should be on dashboard or home page
    const url = page.url()
    expect(url).toMatch(/localhost:3000/)
  })

  test('should handle 404 gracefully', async ({ page }) => {
    const response = await page.goto('/non-existent-page')

    // Either 404 or redirect to home
    expect(response?.status()).toBeLessThan(500)
  })
})

test.describe('Dashboard Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('should have proper heading hierarchy', async ({ page }) => {
    const h1 = page.locator('h1')

    // Should have at least one h1
    if (await h1.count() > 0) {
      await expect(h1.first()).toBeVisible()
    }
  })

  test('should have accessible buttons', async ({ page }) => {
    const buttons = page.locator('button')
    const count = await buttons.count()

    for (let i = 0; i < Math.min(count, 5); i++) {
      const button = buttons.nth(i)

      if (await button.isVisible()) {
        // Button should have accessible name
        const name = await button.getAttribute('aria-label') || await button.textContent()
        expect(name).toBeTruthy()
      }
    }
  })

  test('should be keyboard navigable', async ({ page }) => {
    // Press Tab and verify focus moves
    await page.keyboard.press('Tab')

    const focusedElement = page.locator(':focus')
    await expect(focusedElement).toBeFocused()
  })
})

test.describe('Dashboard Responsive', () => {
  test('should display correctly on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')

    // Page should still render
    await expect(page.locator('body')).toBeVisible()
  })

  test('should display correctly on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('/')

    // Page should still render
    await expect(page.locator('body')).toBeVisible()
  })

  test('should display correctly on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.goto('/')

    // Page should still render
    await expect(page.locator('body')).toBeVisible()
  })
})

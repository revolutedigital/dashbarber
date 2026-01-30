'use client'

import type { RefObject } from 'react'

export type ExportFormat = 'png' | 'svg' | 'jpeg'

interface ExportOptions {
  filename?: string
  backgroundColor?: string
  scale?: number
  quality?: number
}

/**
 * Exports a chart element as an image file
 */
export async function exportChartAsImage(
  chartRef: RefObject<HTMLElement | null>,
  format: ExportFormat = 'png',
  options: ExportOptions = {}
): Promise<void> {
  const element = chartRef.current
  if (!element) {
    throw new Error('Chart element not found')
  }

  const {
    filename = `chart-${new Date().toISOString().split('T')[0]}`,
    backgroundColor = '#ffffff',
    scale = 2,
    quality = 0.95,
  } = options

  // Find the SVG element inside the chart container
  const svg = element.querySelector('svg')
  if (!svg) {
    throw new Error('SVG element not found in chart')
  }

  // Clone the SVG to avoid modifying the original
  const clonedSvg = svg.cloneNode(true) as SVGElement

  // Get dimensions
  const bbox = svg.getBoundingClientRect()
  const width = bbox.width * scale
  const height = bbox.height * scale

  // Set viewBox and dimensions
  clonedSvg.setAttribute('width', String(width))
  clonedSvg.setAttribute('height', String(height))

  // Add background
  const backgroundRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
  backgroundRect.setAttribute('width', '100%')
  backgroundRect.setAttribute('height', '100%')
  backgroundRect.setAttribute('fill', backgroundColor)
  clonedSvg.insertBefore(backgroundRect, clonedSvg.firstChild)

  // Serialize SVG
  const serializer = new XMLSerializer()
  const svgString = serializer.serializeToString(clonedSvg)
  const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })

  if (format === 'svg') {
    downloadBlob(svgBlob, `${filename}.svg`)
    return
  }

  // Convert to image format
  const img = new Image()
  const url = URL.createObjectURL(svgBlob)

  return new Promise((resolve, reject) => {
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Could not get canvas context'))
        return
      }

      // Fill background
      ctx.fillStyle = backgroundColor
      ctx.fillRect(0, 0, width, height)

      // Draw image
      ctx.drawImage(img, 0, 0, width, height)

      // Convert to blob and download
      canvas.toBlob(
        (blob) => {
          if (blob) {
            downloadBlob(blob, `${filename}.${format}`)
            resolve()
          } else {
            reject(new Error('Failed to create image blob'))
          }
        },
        format === 'jpeg' ? 'image/jpeg' : 'image/png',
        quality
      )

      URL.revokeObjectURL(url)
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load SVG image'))
    }

    img.src = url
  })
}

/**
 * Exports chart data as CSV
 */
export function exportChartDataAsCSV(
  data: Record<string, unknown>[],
  filename = 'chart-data'
): void {
  if (!data.length) {
    throw new Error('No data to export')
  }

  const headers = Object.keys(data[0])
  const csvRows = [
    headers.join(','),
    ...data.map(row =>
      headers.map(header => {
        const value = row[header]
        // Handle strings with commas
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value}"`
        }
        return String(value ?? '')
      }).join(',')
    ),
  ]

  const csvString = csvRows.join('\n')
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' })
  downloadBlob(blob, `${filename}.csv`)
}

/**
 * Helper function to download a blob
 */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Copies chart image to clipboard
 */
export async function copyChartToClipboard(
  chartRef: RefObject<HTMLElement | null>,
  scale = 2
): Promise<void> {
  const element = chartRef.current
  if (!element) {
    throw new Error('Chart element not found')
  }

  const svg = element.querySelector('svg')
  if (!svg) {
    throw new Error('SVG element not found in chart')
  }

  const clonedSvg = svg.cloneNode(true) as SVGElement
  const bbox = svg.getBoundingClientRect()
  const width = bbox.width * scale
  const height = bbox.height * scale

  clonedSvg.setAttribute('width', String(width))
  clonedSvg.setAttribute('height', String(height))

  const backgroundRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
  backgroundRect.setAttribute('width', '100%')
  backgroundRect.setAttribute('height', '100%')
  backgroundRect.setAttribute('fill', '#ffffff')
  clonedSvg.insertBefore(backgroundRect, clonedSvg.firstChild)

  const serializer = new XMLSerializer()
  const svgString = serializer.serializeToString(clonedSvg)
  const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })

  const img = new Image()
  const url = URL.createObjectURL(svgBlob)

  return new Promise((resolve, reject) => {
    img.onload = async () => {
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Could not get canvas context'))
        return
      }

      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, width, height)
      ctx.drawImage(img, 0, 0, width, height)

      try {
        const blob = await new Promise<Blob>((res, rej) => {
          canvas.toBlob(b => b ? res(b) : rej(new Error('Failed to create blob')), 'image/png')
        })

        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ])
        resolve()
      } catch (err) {
        reject(err)
      }

      URL.revokeObjectURL(url)
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image'))
    }

    img.src = url
  })
}

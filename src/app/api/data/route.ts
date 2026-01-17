import { NextRequest, NextResponse } from 'next/server'

/**
 * Unified Data API
 *
 * This endpoint proxies to the appropriate data source based on DATA_SOURCE env var:
 * - "sheets" -> /api/sheets (Google Sheets via Apps Script)
 * - "postgres" -> /api/metrics (PostgreSQL via Pabbly webhook)
 *
 * This allows the dashboard to work with either data source without code changes.
 */

export async function GET(request: NextRequest) {
  const dataSource = process.env.DATA_SOURCE || 'sheets'

  // Get the base URL for internal API calls
  const baseUrl = request.nextUrl.origin

  try {
    if (dataSource === 'postgres') {
      // Forward to PostgreSQL metrics endpoint
      const response = await fetch(`${baseUrl}/api/metrics`, {
        headers: request.headers,
      })

      if (!response.ok) {
        throw new Error(`Metrics API returned ${response.status}`)
      }

      const data = await response.json()

      // Transform to match the expected format if needed
      return NextResponse.json({
        funnels: data.funnels,
        lastUpdated: data.lastUpdated,
        source: 'postgres',
      })
    } else {
      // Forward to Google Sheets endpoint (default)
      const response = await fetch(`${baseUrl}/api/sheets`, {
        headers: request.headers,
      })

      if (!response.ok) {
        throw new Error(`Sheets API returned ${response.status}`)
      }

      const data = await response.json()

      return NextResponse.json({
        ...data,
        source: 'sheets',
      })
    }
  } catch (error) {
    console.error('Data API Error:', error)

    return NextResponse.json(
      {
        error: 'Failed to fetch data',
        details: error instanceof Error ? error.message : 'Unknown error',
        source: dataSource,
      },
      { status: 500 }
    )
  }
}

// Health check
export async function HEAD() {
  const dataSource = process.env.DATA_SOURCE || 'sheets'

  return new NextResponse(null, {
    status: 200,
    headers: {
      'X-Data-Source': dataSource,
    },
  })
}

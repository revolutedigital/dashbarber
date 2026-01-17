import { NextRequest, NextResponse } from 'next/server'

/**
 * Unified Data API - Google Sheets Only
 *
 * Busca dados diretamente da planilha via Google Apps Script
 */

export async function GET(request: NextRequest) {
  const baseUrl = request.nextUrl.origin

  try {
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
  } catch (error) {
    console.error('Data API Error:', error)

    return NextResponse.json(
      {
        error: 'Falha ao buscar dados',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    )
  }
}

export async function HEAD() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'X-Data-Source': 'sheets',
    },
  })
}

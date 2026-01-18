import { NextRequest, NextResponse } from 'next/server'
import { ApiResponseSchema } from '@/lib/schemas'

/**
 * Unified Data API - Google Sheets Only
 * Busca dados diretamente da planilha via Google Apps Script
 */

function checkAuth(request: NextRequest): boolean {
  const apiKey = request.headers.get('x-api-key')
  const expectedKey = process.env.API_SECRET_KEY

  if (!expectedKey) return true
  if (!apiKey) return false
  if (apiKey.length !== expectedKey.length) return false

  let result = 0
  for (let i = 0; i < apiKey.length; i++) {
    result |= apiKey.charCodeAt(i) ^ expectedKey.charCodeAt(i)
  }
  return result === 0
}

export async function GET(request: NextRequest) {
  // Auth check
  if (!checkAuth(request)) {
    return NextResponse.json(
      { error: 'Nao autorizado' },
      { status: 401 }
    )
  }

  const sheetUrl = process.env.GOOGLE_SCRIPT_URL

  if (!sheetUrl) {
    return NextResponse.json(
      { error: 'GOOGLE_SCRIPT_URL nao configurada' },
      { status: 400 }
    )
  }

  try {
    // Fetch direto ao Google Apps Script
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000)

    const response = await fetch(sheetUrl, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'DashBarber/1.0',
      },
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`Google API returned ${response.status}`)
    }

    const rawData = await response.json()

    // Validacao com Zod
    const validationResult = ApiResponseSchema.safeParse(rawData)

    if (!validationResult.success) {
      console.error('Validation failed:', validationResult.error.issues)
      return NextResponse.json(
        { error: 'Dados invalidos', details: validationResult.error.issues },
        { status: 422 }
      )
    }

    return NextResponse.json({
      ...validationResult.data,
      source: 'sheets',
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    console.error('Data API Error:', message)

    return NextResponse.json(
      { error: 'Falha ao buscar dados', details: message },
      { status: 500 }
    )
  }
}

export async function HEAD() {
  return new NextResponse(null, {
    status: 200,
    headers: { 'X-Data-Source': 'sheets' },
  })
}

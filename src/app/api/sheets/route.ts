import { NextRequest, NextResponse } from 'next/server'
import { ApiResponseSchema } from '@/lib/schemas'
import {
  checkRateLimit,
  resilientFetch,
  getCircuitStatus,
} from '@/lib/data-utils'

// ============================================
// AUTHENTICATION
// ============================================

/**
 * Verifica autenticacao via API Key com timing-safe comparison
 */
function checkAuth(request: NextRequest): boolean {
  const apiKey = request.headers.get('x-api-key')
  const expectedKey = process.env.API_SECRET_KEY

  // Se nao ha chave configurada, permite (desenvolvimento local)
  if (!expectedKey) {
    return true
  }

  if (!apiKey) {
    return false
  }

  // Timing-safe comparison to prevent timing attacks
  if (apiKey.length !== expectedKey.length) {
    return false
  }

  let result = 0
  for (let i = 0; i < apiKey.length; i++) {
    result |= apiKey.charCodeAt(i) ^ expectedKey.charCodeAt(i)
  }
  return result === 0
}

// ============================================
// API ROUTE HANDLER
// ============================================

export async function GET(request: NextRequest) {
  // Obtem IP para rate limiting
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
             request.headers.get('x-real-ip') ||
             'unknown'

  // Verifica rate limit com cleanup automatico
  const rateLimit = checkRateLimit(ip, 60000, 30)
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: 'Rate limit excedido. Tente novamente em 1 minuto.',
        retryAfter: Math.ceil(rateLimit.resetIn / 1000),
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil(rateLimit.resetIn / 1000)),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Date.now() + rateLimit.resetIn),
        },
      }
    )
  }

  // Verifica autenticacao
  if (!checkAuth(request)) {
    return NextResponse.json(
      { error: 'Nao autorizado. API Key invalida ou ausente.' },
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

  // Check circuit breaker status before attempting
  const circuitStatus = getCircuitStatus('google-sheets')
  if (circuitStatus?.state === 'OPEN') {
    return NextResponse.json(
      {
        error: 'Servico temporariamente indisponivel. Circuit breaker ativo.',
        circuitState: 'OPEN',
        retryAfter: 30,
      },
      {
        status: 503,
        headers: {
          'Retry-After': '30',
        },
      }
    )
  }

  try {
    // Resilient fetch com retry, circuit breaker, e timeout
    const response = await resilientFetch(sheetUrl, {
      timeoutMs: 30000, // 30 second timeout
      retryOptions: {
        maxRetries: 3,
        baseDelayMs: 500,
        maxDelayMs: 5000,
      },
      circuitBreakerKey: 'google-sheets',
      circuitBreakerOptions: {
        failureThreshold: 5,
        resetTimeoutMs: 30000,
        halfOpenRequests: 3,
      },
      next: { revalidate: 300 }, // Cache de 5 minutos
    })

    if (!response.ok) {
      const errorMessage = `Google Sheets API returned ${response.status}`
      console.error(errorMessage)
      throw new Error(errorMessage)
    }

    const rawData = await response.json()

    // Valida dados com Zod (schema com validacoes logicas)
    const validationResult = ApiResponseSchema.safeParse(rawData)

    if (!validationResult.success) {
      // Log estruturado sem expor dados sensiveis
      console.error('Data validation failed:', {
        issueCount: validationResult.error.issues.length,
        paths: validationResult.error.issues.map(i => i.path.join('.')),
      })

      return NextResponse.json(
        {
          error: 'Dados da planilha em formato invalido',
          validationErrors: validationResult.error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        },
        { status: 422 }
      )
    }

    // Retorna dados validados com headers de cache e rate limit
    return NextResponse.json(validationResult.data, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
        'X-RateLimit-Remaining': String(rateLimit.remaining),
        'X-Data-Source': 'google-sheets',
        'X-Validation': 'passed',
      },
    })
  } catch (error) {
    // Log estruturado
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('API Error:', {
      type: error instanceof Error ? error.constructor.name : 'Unknown',
      message: errorMessage,
      timestamp: new Date().toISOString(),
    })

    // Check if circuit breaker opened
    const currentCircuit = getCircuitStatus('google-sheets')
    const isCircuitOpen = currentCircuit?.state === 'OPEN'

    return NextResponse.json(
      {
        error: 'Erro ao buscar dados da planilha',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
        circuitState: currentCircuit?.state,
      },
      {
        status: isCircuitOpen ? 503 : 500,
        headers: isCircuitOpen ? { 'Retry-After': '30' } : {},
      }
    )
  }
}

// ============================================
// HEALTH CHECK ENDPOINT
// ============================================

export async function HEAD() {
  const circuitStatus = getCircuitStatus('google-sheets')

  return new NextResponse(null, {
    status: circuitStatus?.state === 'OPEN' ? 503 : 200,
    headers: {
      'X-Circuit-State': circuitStatus?.state || 'CLOSED',
      'X-Circuit-Failures': String(circuitStatus?.failures || 0),
    },
  })
}

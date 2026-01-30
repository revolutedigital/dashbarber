import { NextResponse } from 'next/server'

export interface ApiSuccessResponse<T> {
  success: true
  data: T
  meta?: {
    pagination?: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
  }
}

export interface ApiErrorResponse {
  success: false
  error: {
    code: string
    message: string
    details?: unknown
  }
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse

export function successResponse<T>(
  data: T,
  meta?: ApiSuccessResponse<T>['meta'],
  status = 200
): NextResponse {
  return NextResponse.json({ success: true, data, meta }, { status })
}

export function errorResponse(
  code: string,
  message: string,
  status = 400
): NextResponse {
  return NextResponse.json(
    { success: false, error: { code, message } },
    { status }
  )
}

export function unauthorizedResponse(message = 'Não autorizado'): NextResponse {
  return errorResponse('UNAUTHORIZED', message, 401)
}

export function forbiddenResponse(message = 'Acesso negado'): NextResponse {
  return errorResponse('FORBIDDEN', message, 403)
}

export function notFoundResponse(resource = 'Recurso'): NextResponse {
  return errorResponse('NOT_FOUND', `${resource} não encontrado`, 404)
}

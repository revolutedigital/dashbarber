import { http, HttpResponse } from 'msw'
import { mockFunnelsData, mockEmptyData } from './fixtures/funnels'

const API_KEY = '1054286cb50d7d357af26f663ec32b98fb98b34c2ea4976049b87d04dd7cc990'

export const handlers = [
  // Mock /api/sheets endpoint
  http.get('/api/sheets', ({ request }) => {
    const apiKey = request.headers.get('x-api-key')

    if (apiKey !== API_KEY) {
      return HttpResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    return HttpResponse.json(mockFunnelsData)
  }),

  // Mock /api/data endpoint
  http.get('/api/data', ({ request }) => {
    const apiKey = request.headers.get('x-api-key')

    if (apiKey !== API_KEY) {
      return HttpResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    return HttpResponse.json(mockFunnelsData)
  }),

  // Mock /api/health endpoint
  http.get('/api/health', () => {
    return HttpResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '0.1.0',
    })
  }),

  // Mock Google Apps Script (external)
  http.get('https://script.google.com/macros/*', () => {
    return HttpResponse.json(mockFunnelsData)
  }),
]

// Handler for testing error scenarios
export const errorHandlers = {
  networkError: http.get('/api/sheets', () => {
    return HttpResponse.error()
  }),

  serverError: http.get('/api/sheets', () => {
    return HttpResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }),

  emptyData: http.get('/api/sheets', () => {
    return HttpResponse.json(mockEmptyData)
  }),

  rateLimited: http.get('/api/sheets', () => {
    return HttpResponse.json(
      { error: 'Too Many Requests' },
      { status: 429, headers: { 'Retry-After': '60' } }
    )
  }),
}

'use client'

import useSWR from 'swr'
import { ApiResponse } from '@/types/metrics'

const fetcher = async (url: string): Promise<ApiResponse> => {
  const response = await fetch(url, {
    headers: {
      'x-api-key': process.env.NEXT_PUBLIC_API_KEY || '',
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Erro desconhecido' }))
    throw new Error(error.error || `HTTP ${response.status}`)
  }

  return response.json()
}

/**
 * Fetch dashboard data.
 * When workspaceId is provided, fetches from workspace-scoped API.
 * Otherwise falls back to legacy /api/data endpoint.
 */
export function useDashboardData(workspaceId?: string | null) {
  const url = workspaceId
    ? `/api/v1/workspaces/${workspaceId}/metrics`
    : '/api/data'

  const { data, error, isLoading, isValidating, mutate } = useSWR<ApiResponse>(
    url,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      refreshInterval: 5 * 60 * 1000, // 5 minutos
      dedupingInterval: 30 * 1000, // 30 segundos
      errorRetryCount: 3,
      errorRetryInterval: 5000,
    }
  )

  return {
    data,
    error,
    isLoading,
    isValidating,
    refresh: mutate,
  }
}

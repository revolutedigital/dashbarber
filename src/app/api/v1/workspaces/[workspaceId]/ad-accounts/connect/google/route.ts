import { NextRequest } from 'next/server'
import { successResponse, errorResponse } from '@/lib/api/response'
import { requireWorkspaceAuth, isAuthError } from '@/lib/api/auth-guard'

type Params = { params: Promise<{ workspaceId: string }> }

/**
 * GET /api/v1/workspaces/:id/ad-accounts/connect/google
 * Initiates Google Ads OAuth flow
 */
export async function GET(request: NextRequest, { params }: Params) {
  const { workspaceId } = await params
  const authResult = await requireWorkspaceAuth(request, workspaceId, 'ad_account.connect')
  if (isAuthError(authResult)) return authResult

  const clientId = process.env.GOOGLE_ADS_CLIENT_ID
  const redirectUri = `${process.env.NEXTAUTH_URL}/api/oauth/google-ads/callback`

  if (!clientId) {
    return errorResponse('CONFIG', 'Google Ads Client ID não configurado', 500)
  }

  // Build OAuth URL
  const state = Buffer.from(
    JSON.stringify({ workspaceId, userId: authResult.userId })
  ).toString('base64')

  const scopes = [
    'https://www.googleapis.com/auth/adwords',
  ].join(' ')

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  authUrl.searchParams.set('client_id', clientId)
  authUrl.searchParams.set('redirect_uri', redirectUri)
  authUrl.searchParams.set('scope', scopes)
  authUrl.searchParams.set('state', state)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('access_type', 'offline')
  authUrl.searchParams.set('prompt', 'consent')

  return successResponse({ authUrl: authUrl.toString() })
}

import { NextRequest } from 'next/server'
import { successResponse, errorResponse } from '@/lib/api/response'
import { requireWorkspaceAuth, isAuthError } from '@/lib/api/auth-guard'

type Params = { params: Promise<{ workspaceId: string }> }

/**
 * GET /api/v1/workspaces/:id/ad-accounts/connect/meta
 * Initiates Meta Ads OAuth flow
 */
export async function GET(request: NextRequest, { params }: Params) {
  const { workspaceId } = await params
  const authResult = await requireWorkspaceAuth(request, workspaceId, 'ad_account.connect')
  if (isAuthError(authResult)) return authResult

  const appId = process.env.META_APP_ID
  const redirectUri = `${process.env.NEXTAUTH_URL}/api/oauth/meta-ads/callback`

  if (!appId) {
    return errorResponse('CONFIG', 'Meta App ID não configurado', 500)
  }

  // Build OAuth URL
  const state = Buffer.from(
    JSON.stringify({ workspaceId, userId: authResult.userId })
  ).toString('base64')

  const scopes = [
    'ads_read',
    'ads_management',
    'business_management',
    'read_insights',
  ].join(',')

  const authUrl = new URL('https://www.facebook.com/v18.0/dialog/oauth')
  authUrl.searchParams.set('client_id', appId)
  authUrl.searchParams.set('redirect_uri', redirectUri)
  authUrl.searchParams.set('scope', scopes)
  authUrl.searchParams.set('state', state)
  authUrl.searchParams.set('response_type', 'code')

  return successResponse({ authUrl: authUrl.toString() })
}

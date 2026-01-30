import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { encrypt } from '@/lib/crypto'

/**
 * GET /api/oauth/google-ads/callback
 * Handles Google Ads OAuth callback
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  // Handle error from Google
  if (error) {
    return NextResponse.redirect(
      new URL(`/settings/connections?error=${error}`, request.url)
    )
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL('/settings/connections?error=missing_params', request.url)
    )
  }

  // Decode state
  let stateData: { workspaceId: string; userId: string }
  try {
    stateData = JSON.parse(Buffer.from(state, 'base64').toString())
  } catch {
    return NextResponse.redirect(
      new URL('/settings/connections?error=invalid_state', request.url)
    )
  }

  const { workspaceId, userId } = stateData

  // Verify user has access to workspace
  const member = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
  })

  if (!member) {
    return NextResponse.redirect(
      new URL('/settings/connections?error=unauthorized', request.url)
    )
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_ADS_CLIENT_ID!,
        client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET!,
        redirect_uri: `${process.env.NEXTAUTH_URL}/api/oauth/google-ads/callback`,
        grant_type: 'authorization_code',
        code,
      }),
    })

    const tokenData = await tokenResponse.json()

    if (tokenData.error) {
      console.error('Google token exchange error:', tokenData.error)
      return NextResponse.redirect(
        new URL('/settings/connections?error=token_exchange', request.url)
      )
    }

    const { access_token, refresh_token, expires_in } = tokenData

    // Get accessible customer IDs using Google Ads API
    // Note: This requires the google-ads-api package to properly query customers
    // For now, we'll save with a placeholder and let the sync job fetch real data

    const encryptedAccessToken = await encrypt(access_token)
    const encryptedRefreshToken = refresh_token ? await encrypt(refresh_token) : null
    const tokenExpiresAt = new Date(Date.now() + expires_in * 1000)

    // Get customer accounts (simplified - real implementation needs Google Ads API)
    // The user will need to manually enter their customer ID or we fetch via API
    const customerId = 'pending_setup' // Placeholder - UI will prompt for customer ID

    await prisma.adAccountConnection.upsert({
      where: {
        workspaceId_platform_accountId: {
          workspaceId,
          platform: 'GOOGLE_ADS',
          accountId: customerId,
        },
      },
      create: {
        workspaceId,
        platform: 'GOOGLE_ADS',
        accountId: customerId,
        accountName: 'Google Ads (configurar)',
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        tokenExpiresAt,
        syncStatus: 'PENDING',
      },
      update: {
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        tokenExpiresAt,
        syncStatus: 'PENDING',
        syncError: null,
        isActive: true,
      },
    })

    // Redirect to success page
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { slug: true },
    })

    return NextResponse.redirect(
      new URL(`/${workspace?.slug}/settings/connections?success=google`, request.url)
    )
  } catch (error) {
    console.error('Google OAuth error:', error)
    return NextResponse.redirect(
      new URL('/settings/connections?error=unknown', request.url)
    )
  }
}

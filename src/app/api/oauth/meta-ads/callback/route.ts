import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { encrypt } from '@/lib/crypto'

/**
 * GET /api/oauth/meta-ads/callback
 * Handles Meta Ads OAuth callback
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  // Handle error from Meta
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
    const tokenResponse = await fetch(
      'https://graph.facebook.com/v18.0/oauth/access_token',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: process.env.META_APP_ID!,
          client_secret: process.env.META_APP_SECRET!,
          redirect_uri: `${process.env.NEXTAUTH_URL}/api/oauth/meta-ads/callback`,
          code,
        }),
      }
    )

    const tokenData = await tokenResponse.json()

    if (tokenData.error) {
      console.error('Meta token exchange error:', tokenData.error)
      return NextResponse.redirect(
        new URL('/settings/connections?error=token_exchange', request.url)
      )
    }

    // Exchange for long-lived token (60 days)
    const longLivedResponse = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?` +
        `grant_type=fb_exchange_token&` +
        `client_id=${process.env.META_APP_ID}&` +
        `client_secret=${process.env.META_APP_SECRET}&` +
        `fb_exchange_token=${tokenData.access_token}`
    )

    const longLivedData = await longLivedResponse.json()
    const accessToken = longLivedData.access_token || tokenData.access_token
    const expiresIn = longLivedData.expires_in || 3600

    // Get ad accounts
    const accountsResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/adaccounts?` +
        `fields=account_id,name,account_status&` +
        `access_token=${accessToken}`
    )

    const accountsData = await accountsResponse.json()

    if (!accountsData.data || accountsData.data.length === 0) {
      return NextResponse.redirect(
        new URL('/settings/connections?error=no_ad_accounts', request.url)
      )
    }

    // Save all ad accounts
    const encryptedToken = await encrypt(accessToken)
    const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000)

    for (const account of accountsData.data) {
      // Skip inactive accounts
      if (account.account_status !== 1) continue

      const accountId = account.account_id.replace('act_', '')

      await prisma.adAccountConnection.upsert({
        where: {
          workspaceId_platform_accountId: {
            workspaceId,
            platform: 'META_ADS',
            accountId,
          },
        },
        create: {
          workspaceId,
          platform: 'META_ADS',
          accountId,
          accountName: account.name,
          accessToken: encryptedToken,
          tokenExpiresAt,
          syncStatus: 'PENDING',
        },
        update: {
          accountName: account.name,
          accessToken: encryptedToken,
          tokenExpiresAt,
          syncStatus: 'PENDING',
          syncError: null,
          isActive: true,
        },
      })
    }

    // Redirect to success page
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { slug: true },
    })

    return NextResponse.redirect(
      new URL(`/${workspace?.slug}/settings/connections?success=meta`, request.url)
    )
  } catch (error) {
    console.error('Meta OAuth error:', error)
    return NextResponse.redirect(
      new URL('/settings/connections?error=unknown', request.url)
    )
  }
}

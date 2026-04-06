import type { MedusaRequest, MedusaResponse } from '@medusajs/framework/http'
import marketplaceService from '../../../../../modules/marketplace/service'
import type { MarketplacePlatform } from '../../../../../modules/marketplace/types'

/**
 * GET /store/marketplace/oauth/callback/:platform?code=X&state=Y
 *
 * Receives the OAuth callback from the marketplace platform, exchanges the
 * authorization code for tokens, persists the connection and redirects the
 * browser back to the admin marketplace page.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  // Medusa v2 injects path params into req.params
  const params = (req as any).params as Record<string, string>
  const platform = (params?.platform ?? '') as MarketplacePlatform

  const url = new URL(req.url ?? '', `http://${req.headers.host}`)
  const code = url.searchParams.get('code') ?? ''
  const state = url.searchParams.get('state') ?? ''

  if (!platform) {
    return res.status(400).json({ error: 'platform is required in path' })
  }

  if (!code || !state) {
    return res.redirect(`/app/marketplace?status=error&reason=missing_code_or_state&platform=${platform}`)
  }

  try {
    const connection = await marketplaceService.handleOAuthCallback(platform, code, state)

    return res.redirect(
      `/app/marketplace?connected=${encodeURIComponent(platform)}&status=success&connection_id=${encodeURIComponent(connection.id)}`,
    )
  } catch (err: any) {
    console.error(`[Marketplace OAuth] callback error for ${platform}: ${err?.message}`)
    return res.redirect(
      `/app/marketplace?status=error&platform=${encodeURIComponent(platform)}&reason=${encodeURIComponent(err?.message ?? 'unknown')}`,
    )
  }
}

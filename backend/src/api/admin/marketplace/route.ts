import type { MedusaRequest, MedusaResponse } from '@medusajs/framework/http'
import marketplaceService from '../../../modules/marketplace/service'
import type { MarketplacePlatform } from '../../../modules/marketplace/types'

/**
 * GET /admin/marketplace/connections
 * Returns all marketplace connections (tokens redacted).
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const connections = marketplaceService.listConnections()
    // Redact encrypted tokens before sending to client
    const safe = connections.map(({ access_token, refresh_token, ...rest }) => rest)
    return res.status(200).json({ connections: safe })
  } catch (err: any) {
    return res.status(500).json({ error: err.message })
  }
}

/**
 * POST /admin/marketplace/connections
 * Creates a connection using explicit credentials (non-OAuth).
 * Body: { platform: MarketplacePlatform, config: Record<string, unknown> }
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const body = req.body as {
    platform?: MarketplacePlatform
    config?: Record<string, unknown>
  }

  if (!body?.platform) {
    return res.status(400).json({ error: 'platform is required' })
  }

  try {
    const connection = await marketplaceService.createCredentialConnection(
      body.platform,
      body.config ?? {},
    )
    const { access_token, refresh_token, ...safe } = connection
    return res.status(201).json({ connection: safe })
  } catch (err: any) {
    return res.status(500).json({ error: err.message })
  }
}

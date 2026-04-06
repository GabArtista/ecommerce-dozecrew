import type { MedusaRequest, MedusaResponse } from '@medusajs/framework/http'
import marketplaceService from '../../../../../modules/marketplace/service'
import type { MarketplacePlatform } from '../../../../../modules/marketplace/types'

/**
 * GET /admin/marketplace/oauth/:platform/url?store_id=x
 * Returns the OAuth authorization URL for the given platform.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { platform } = req.params as { platform: MarketplacePlatform }
  const storeId = (req.query?.store_id as string) ?? ''

  if (!platform) {
    return res.status(400).json({ error: 'platform is required in path' })
  }

  try {
    const url = await marketplaceService.generateOAuthUrl(platform, storeId)
    return res.status(200).json({ url, platform })
  } catch (err: any) {
    return res.status(500).json({ error: err.message })
  }
}

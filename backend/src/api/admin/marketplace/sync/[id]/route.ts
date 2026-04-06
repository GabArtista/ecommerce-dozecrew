import type { MedusaRequest, MedusaResponse } from '@medusajs/framework/http'
import marketplaceService from '../../../../../modules/marketplace/service'

/**
 * POST /admin/marketplace/sync/:id
 * Manually triggers an order sync for the given connection.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params as { id: string }

  if (!id) {
    return res.status(400).json({ error: 'Connection id is required' })
  }

  try {
    await marketplaceService.syncOrders(id)
    return res.status(200).json({ success: true, connection_id: id })
  } catch (err: any) {
    return res.status(500).json({ error: err.message })
  }
}

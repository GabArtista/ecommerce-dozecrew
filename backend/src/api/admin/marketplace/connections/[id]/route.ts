import type { MedusaRequest, MedusaResponse } from '@medusajs/framework/http'
import marketplaceService from '../../../../../modules/marketplace/service'

/**
 * DELETE /admin/marketplace/connections/:id
 * Removes a marketplace connection by ID.
 */
export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params as { id: string }

  if (!id) {
    return res.status(400).json({ error: 'Connection id is required' })
  }

  const existing = marketplaceService.getConnection(id)
  if (!existing) {
    return res.status(404).json({ error: `Connection not found: ${id}` })
  }

  marketplaceService.deleteConnection(id)
  return res.status(200).json({ success: true, deleted_id: id })
}

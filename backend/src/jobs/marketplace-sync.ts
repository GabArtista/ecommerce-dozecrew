import marketplaceService from '../modules/marketplace/service'

/**
 * Scheduled job: sync orders for all active marketplace connections.
 * Runs every 15 minutes.
 */
export default async function syncMarketplaceOrders() {
  const connections = marketplaceService.listConnections()

  const eligible = connections.filter(
    (c) => c.status === 'active' && c.sync_orders,
  )

  if (eligible.length === 0) {
    console.info('[marketplace-sync] No active connections to sync')
    return
  }

  console.info(`[marketplace-sync] Syncing orders for ${eligible.length} connection(s)`)

  const results = await Promise.allSettled(
    eligible.map((c) => marketplaceService.syncOrders(c.id)),
  )

  let success = 0
  let failed = 0

  results.forEach((result, idx) => {
    if (result.status === 'fulfilled') {
      success++
    } else {
      failed++
      console.error(
        `[marketplace-sync] Failed for connection=${eligible[idx].id} (${eligible[idx].platform}): ${result.reason?.message ?? result.reason}`,
      )
    }
  })

  console.info(`[marketplace-sync] Done — success=${success} failed=${failed}`)
}

export const config = {
  name: 'sync-marketplace-orders',
  schedule: '*/15 * * * *',
}

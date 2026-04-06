import { decrypt } from '../utils/encryption'
import type { IMarketplaceProvider, MarketplaceConnection, TokenData } from '../types'

const TIKTOK_AUTH_BASE = 'https://auth.tiktok-shops.com'

export class TikTokProvider implements IMarketplaceProvider {
  readonly platform = 'tiktok' as const

  getAuthorizationUrl(storeId: string, state: string): string {
    const appKey = process.env.TIKTOK_APP_KEY ?? ''
    const params = new URLSearchParams({
      app_key: appKey,
      state,
    })
    return `${TIKTOK_AUTH_BASE}/oauth/authorize?${params.toString()}`
  }

  async exchangeCodeForToken(code: string, state: string, _extra?: Record<string, string>): Promise<TokenData> {
    const appKey = process.env.TIKTOK_APP_KEY ?? ''
    const appSecret = process.env.TIKTOK_APP_SECRET ?? ''

    const res = await fetch(`${TIKTOK_AUTH_BASE}/api/v2/token/get`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        app_key: appKey,
        app_secret: appSecret,
        auth_code: code,
        grant_type: 'authorized_code',
      }),
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`[TikTok] exchangeCodeForToken failed (${res.status}): ${text}`)
    }

    const json = (await res.json()) as Record<string, unknown>
    const data = (json.data ?? json) as Record<string, unknown>

    return {
      access_token: data.access_token as string,
      refresh_token: data.refresh_token as string | undefined,
      expires_in: data.access_token_expire_in as number | undefined,
      platform_seller_id: data.seller_id as string | undefined,
      store_name: data.seller_name as string | undefined,
    }
  }

  async refreshAccessToken(connection: MarketplaceConnection): Promise<TokenData> {
    const appKey = process.env.TIKTOK_APP_KEY ?? ''
    const appSecret = process.env.TIKTOK_APP_SECRET ?? ''

    if (!connection.refresh_token) {
      throw new Error('[TikTok] No refresh_token available for this connection')
    }

    const plainRefreshToken = decrypt(connection.refresh_token)

    const res = await fetch(`${TIKTOK_AUTH_BASE}/api/v2/token/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        app_key: appKey,
        app_secret: appSecret,
        refresh_token: plainRefreshToken,
        grant_type: 'refresh_token',
      }),
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`[TikTok] refreshAccessToken failed (${res.status}): ${text}`)
    }

    const json = (await res.json()) as Record<string, unknown>
    const data = (json.data ?? json) as Record<string, unknown>

    return {
      access_token: data.access_token as string,
      refresh_token: data.refresh_token as string | undefined,
      expires_in: data.access_token_expire_in as number | undefined,
      platform_seller_id: data.seller_id as string | undefined,
    }
  }

  async validateCredentials(_config: Record<string, unknown>): Promise<boolean> {
    // OAuth flow — credentials validated during token exchange
    return true
  }

  async syncProduct(connection: MarketplaceConnection, product: Record<string, unknown>): Promise<void> {
    // TODO: TikTok Shop product API is under active development.
    // Reference: https://partner.tiktokshop.com/docv2/page/650aa4c12b79a702fc8e76d9
    // Endpoint: POST https://open-api.tiktokglobalshop.com/product/202309/products
    // Requires: access_token, app_key, sign (HMAC-SHA256), timestamp
    console.warn('[TikTok] syncProduct: not yet implemented — API in evolution')
  }

  async updateInventory(connection: MarketplaceConnection, variantId: string, qty: number): Promise<void> {
    // TODO: TikTok Shop inventory update
    // Reference: https://partner.tiktokshop.com/docv2/page/inventory
    // Endpoint: POST https://open-api.tiktokglobalshop.com/product/202309/products/{product_id}/skus/inventory/update
    console.warn('[TikTok] updateInventory: not yet implemented — API in evolution')
  }

  async fetchOrders(connection: MarketplaceConnection, since: Date): Promise<Record<string, unknown>[]> {
    // TODO: TikTok Shop orders
    // Reference: https://partner.tiktokshop.com/docv2/page/order_search
    // Endpoint: GET https://open-api.tiktokglobalshop.com/order/202309/orders/search
    console.warn('[TikTok] fetchOrders: not yet implemented — API in evolution')
    return []
  }
}

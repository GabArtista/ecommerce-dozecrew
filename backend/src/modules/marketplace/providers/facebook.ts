import { decrypt } from '../utils/encryption'
import type { IMarketplaceProvider, MarketplaceConnection, TokenData } from '../types'

const FB_GRAPH_BASE = 'https://graph.facebook.com/v19.0'
const FB_DIALOG_BASE = 'https://www.facebook.com/v19.0/dialog/oauth'

export class FacebookProvider implements IMarketplaceProvider {
  readonly platform = 'facebook' as const

  getAuthorizationUrl(storeId: string, state: string): string {
    const appId = process.env.FACEBOOK_APP_ID ?? ''
    const redirectUri = process.env.FACEBOOK_REDIRECT_URI ?? `https://shop-back.dozecrew.com/store/marketplace/oauth/callback/facebook`

    const params = new URLSearchParams({
      client_id: appId,
      redirect_uri: redirectUri,
      scope: 'catalog_management',
      state,
      response_type: 'code',
    })

    return `${FB_DIALOG_BASE}?${params.toString()}`
  }

  async exchangeCodeForToken(code: string, state: string, extra?: Record<string, string>): Promise<TokenData> {
    const appId = process.env.FACEBOOK_APP_ID ?? ''
    const appSecret = process.env.FACEBOOK_APP_SECRET ?? ''
    const redirectUri = process.env.FACEBOOK_REDIRECT_URI ?? `https://shop-back.dozecrew.com/store/marketplace/oauth/callback/facebook`

    // Exchange short-lived code for short-lived token
    const shortParams = new URLSearchParams({
      client_id: appId,
      redirect_uri: redirectUri,
      client_secret: appSecret,
      code,
    })

    const shortRes = await fetch(`${FB_GRAPH_BASE}/oauth/access_token?${shortParams.toString()}`)

    if (!shortRes.ok) {
      const text = await shortRes.text()
      throw new Error(`[Facebook] exchangeCodeForToken (short) failed (${shortRes.status}): ${text}`)
    }

    const shortData = (await shortRes.json()) as Record<string, unknown>
    const shortToken = shortData.access_token as string

    // Immediately exchange for long-lived token (~60 days)
    const longParams = new URLSearchParams({
      grant_type: 'fb_exchange_token',
      client_id: appId,
      client_secret: appSecret,
      fb_exchange_token: shortToken,
    })

    const longRes = await fetch(`${FB_GRAPH_BASE}/oauth/access_token?${longParams.toString()}`)

    if (!longRes.ok) {
      const text = await longRes.text()
      throw new Error(`[Facebook] exchangeCodeForToken (long-lived) failed (${longRes.status}): ${text}`)
    }

    const longData = (await longRes.json()) as Record<string, unknown>

    // Fetch user/page id
    let sellerId = ''
    try {
      const meRes = await fetch(`${FB_GRAPH_BASE}/me?access_token=${longData.access_token}`)
      if (meRes.ok) {
        const me = (await meRes.json()) as Record<string, unknown>
        sellerId = String(me.id ?? '')
      }
    } catch {
      // Non-fatal
    }

    return {
      access_token: longData.access_token as string,
      expires_in: longData.expires_in as number | undefined,
      platform_seller_id: sellerId,
    }
  }

  async refreshAccessToken(connection: MarketplaceConnection): Promise<TokenData> {
    // Facebook long-lived tokens are renewed by exchanging the current token
    const appId = process.env.FACEBOOK_APP_ID ?? ''
    const appSecret = process.env.FACEBOOK_APP_SECRET ?? ''
    const plainToken = decrypt(connection.access_token)

    const params = new URLSearchParams({
      grant_type: 'fb_exchange_token',
      client_id: appId,
      client_secret: appSecret,
      fb_exchange_token: plainToken,
    })

    const res = await fetch(`${FB_GRAPH_BASE}/oauth/access_token?${params.toString()}`)

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`[Facebook] refreshAccessToken failed (${res.status}): ${text}`)
    }

    const data = (await res.json()) as Record<string, unknown>

    return {
      access_token: data.access_token as string,
      expires_in: data.expires_in as number | undefined,
      platform_seller_id: connection.platform_seller_id,
    }
  }

  async validateCredentials(config: Record<string, unknown>): Promise<boolean> {
    const appId = process.env.FACEBOOK_APP_ID ?? ''
    const appSecret = process.env.FACEBOOK_APP_SECRET ?? ''

    if (!appId || !appSecret) {
      return false
    }

    try {
      // Verify app token
      const res = await fetch(`${FB_GRAPH_BASE}/oauth/access_token?client_id=${appId}&client_secret=${appSecret}&grant_type=client_credentials`)
      return res.ok
    } catch {
      return false
    }
  }

  async syncProduct(connection: MarketplaceConnection, product: Record<string, unknown>): Promise<void> {
    const accessToken = decrypt(connection.access_token)
    const catalogId = (connection.config as Record<string, unknown>).catalog_id as string

    if (!catalogId) {
      throw new Error('[Facebook] catalog_id is required in connection.config')
    }

    const payload = {
      name: product.title as string,
      description: (product.description as string) ?? '',
      price: `${(product.price as number) * 100} BRL`,
      currency: 'BRL',
      availability: (product.quantity as number) > 0 ? 'in stock' : 'out of stock',
      condition: 'new',
      retailer_id: String(product.id ?? product.variant_id ?? ''),
      url: (product.url as string) ?? '',
      image_url: (product.image_url as string) ?? '',
    }

    const res = await fetch(`${FB_GRAPH_BASE}/${catalogId}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`[Facebook] syncProduct failed (${res.status}): ${text}`)
    }
  }

  async updateInventory(connection: MarketplaceConnection, variantId: string, qty: number): Promise<void> {
    const accessToken = decrypt(connection.access_token)
    const catalogId = (connection.config as Record<string, unknown>).catalog_id as string
    const retailerId = variantId

    if (!catalogId) {
      throw new Error('[Facebook] catalog_id is required in connection.config')
    }

    // Update via catalog batch API
    const res = await fetch(`${FB_GRAPH_BASE}/${catalogId}/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        requests: [
          {
            method: 'UPDATE',
            retailer_id: retailerId,
            data: { availability: qty > 0 ? 'in stock' : 'out of stock' },
          },
        ],
      }),
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`[Facebook] updateInventory failed (${res.status}): ${text}`)
    }
  }

  async fetchOrders(_connection: MarketplaceConnection, _since: Date): Promise<Record<string, unknown>[]> {
    // Facebook removed checkout / native shop orders from the API in 2025.
    // Orders are now managed through Meta Business Suite UI only.
    return []
  }
}

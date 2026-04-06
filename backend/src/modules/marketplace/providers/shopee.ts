import { createHmac } from 'crypto'
import { decrypt } from '../utils/encryption'
import type { IMarketplaceProvider, MarketplaceConnection, TokenData } from '../types'

const SHOPEE_BASE = 'https://partner.shopeemobile.com'

function sign(
  partnerId: string,
  path: string,
  timestamp: number,
  accessToken: string,
  shopId: string,
): string {
  const key = process.env.SHOPEE_PARTNER_KEY ?? ''
  const baseString = `${partnerId}${path}${timestamp}${accessToken}${shopId}`
  return createHmac('sha256', key).update(baseString).digest('hex')
}

export class ShopeeProvider implements IMarketplaceProvider {
  readonly platform = 'shopee' as const

  getAuthorizationUrl(storeId: string, state: string): string {
    const partnerId = process.env.SHOPEE_PARTNER_ID ?? ''
    const timestamp = Math.floor(Date.now() / 1000)
    const path = '/api/v2/shop/auth_partner'
    const signature = sign(partnerId, path, timestamp, '', '')

    const redirectUri = process.env.SHOPEE_REDIRECT_URI ?? `https://shop-back.dozecrew.com/store/marketplace/oauth/callback/shopee`

    const params = new URLSearchParams({
      partner_id: partnerId,
      timestamp: String(timestamp),
      sign: signature,
      redirect: redirectUri,
      state,
    })

    return `${SHOPEE_BASE}${path}?${params.toString()}`
  }

  async exchangeCodeForToken(code: string, state: string, extra?: Record<string, string>): Promise<TokenData> {
    const partnerId = process.env.SHOPEE_PARTNER_ID ?? ''
    const timestamp = Math.floor(Date.now() / 1000)
    const path = '/api/v2/auth/token/get'
    const shopId = extra?.shop_id ?? ''
    const signature = sign(partnerId, path, timestamp, '', shopId)

    const params = new URLSearchParams({
      partner_id: partnerId,
      timestamp: String(timestamp),
      sign: signature,
    })

    const res = await fetch(`${SHOPEE_BASE}${path}?${params.toString()}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, shop_id: Number(shopId), partner_id: Number(partnerId) }),
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`[Shopee] exchangeCodeForToken failed (${res.status}): ${text}`)
    }

    const data = (await res.json()) as Record<string, unknown>

    return {
      access_token: data.access_token as string,
      refresh_token: data.refresh_token as string | undefined,
      expires_in: data.expire_in as number | undefined,
      platform_seller_id: String(shopId),
    }
  }

  async refreshAccessToken(connection: MarketplaceConnection): Promise<TokenData> {
    const partnerId = process.env.SHOPEE_PARTNER_ID ?? ''
    const timestamp = Math.floor(Date.now() / 1000)
    const path = '/api/v2/auth/access_token/get'
    const shopId = connection.platform_seller_id ?? ''

    if (!connection.refresh_token) {
      throw new Error('[Shopee] No refresh_token available for this connection')
    }

    const plainRefreshToken = decrypt(connection.refresh_token)
    const signature = sign(partnerId, path, timestamp, '', shopId)

    const params = new URLSearchParams({
      partner_id: partnerId,
      timestamp: String(timestamp),
      sign: signature,
    })

    const res = await fetch(`${SHOPEE_BASE}${path}?${params.toString()}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        refresh_token: plainRefreshToken,
        shop_id: Number(shopId),
        partner_id: Number(partnerId),
      }),
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`[Shopee] refreshAccessToken failed (${res.status}): ${text}`)
    }

    const data = (await res.json()) as Record<string, unknown>

    return {
      access_token: data.access_token as string,
      refresh_token: data.refresh_token as string | undefined,
      expires_in: data.expire_in as number | undefined,
      platform_seller_id: shopId,
    }
  }

  async validateCredentials(config: Record<string, unknown>): Promise<boolean> {
    const partnerId = process.env.SHOPEE_PARTNER_ID ?? ''
    const partnerKey = process.env.SHOPEE_PARTNER_KEY ?? ''

    if (!partnerId || !partnerKey) {
      return false
    }

    try {
      const timestamp = Math.floor(Date.now() / 1000)
      const path = '/api/v2/public/get_shops_by_partner'
      const signature = sign(partnerId, path, timestamp, '', '')

      const params = new URLSearchParams({
        partner_id: partnerId,
        timestamp: String(timestamp),
        sign: signature,
        page_size: '1',
      })

      const res = await fetch(`${SHOPEE_BASE}${path}?${params.toString()}`)
      return res.ok
    } catch {
      return false
    }
  }

  async syncProduct(connection: MarketplaceConnection, product: Record<string, unknown>): Promise<void> {
    const partnerId = process.env.SHOPEE_PARTNER_ID ?? ''
    const shopId = connection.platform_seller_id ?? ''
    const accessToken = decrypt(connection.access_token)
    const timestamp = Math.floor(Date.now() / 1000)
    const path = '/api/v2/product/add_item'
    const signature = sign(partnerId, path, timestamp, accessToken, shopId)

    const params = new URLSearchParams({
      partner_id: partnerId,
      timestamp: String(timestamp),
      access_token: accessToken,
      shop_id: shopId,
      sign: signature,
    })

    const payload = {
      original_price: product.price as number,
      normal_stock: product.quantity as number,
      item_name: product.title as string,
      description: (product.description as string) ?? '',
      weight: 0.5,
      item_status: 'NORMAL',
      dimension: { package_length: 10, package_width: 10, package_height: 10 },
      logistics_info: [{ logistic_id: 1, enabled: true }],
    }

    const res = await fetch(`${SHOPEE_BASE}${path}?${params.toString()}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`[Shopee] syncProduct failed (${res.status}): ${text}`)
    }
  }

  async updateInventory(connection: MarketplaceConnection, variantId: string, qty: number): Promise<void> {
    const partnerId = process.env.SHOPEE_PARTNER_ID ?? ''
    const shopId = connection.platform_seller_id ?? ''
    const accessToken = decrypt(connection.access_token)
    const timestamp = Math.floor(Date.now() / 1000)
    const path = '/api/v2/product/update_stock'
    const signature = sign(partnerId, path, timestamp, accessToken, shopId)

    const itemId = (connection.config as Record<string, unknown>)[`item_id_${variantId}`]

    if (!itemId) {
      throw new Error(`[Shopee] No item_id mapped for variantId=${variantId}`)
    }

    const params = new URLSearchParams({
      partner_id: partnerId,
      timestamp: String(timestamp),
      access_token: accessToken,
      shop_id: shopId,
      sign: signature,
    })

    const res = await fetch(`${SHOPEE_BASE}${path}?${params.toString()}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item_id: Number(itemId), stock_list: [{ model_id: 0, normal_stock: qty }] }),
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`[Shopee] updateInventory failed (${res.status}): ${text}`)
    }
  }

  async fetchOrders(connection: MarketplaceConnection, since: Date): Promise<Record<string, unknown>[]> {
    const partnerId = process.env.SHOPEE_PARTNER_ID ?? ''
    const shopId = connection.platform_seller_id ?? ''
    const accessToken = decrypt(connection.access_token)
    const timestamp = Math.floor(Date.now() / 1000)
    const path = '/api/v2/order/get_order_list'
    const signature = sign(partnerId, path, timestamp, accessToken, shopId)

    const params = new URLSearchParams({
      partner_id: partnerId,
      timestamp: String(timestamp),
      access_token: accessToken,
      shop_id: shopId,
      sign: signature,
      time_range_field: 'create_time',
      time_from: String(Math.floor(since.getTime() / 1000)),
      time_to: String(Math.floor(Date.now() / 1000)),
      page_size: '50',
      order_status: 'ALL',
    })

    const res = await fetch(`${SHOPEE_BASE}${path}?${params.toString()}`)

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`[Shopee] fetchOrders failed (${res.status}): ${text}`)
    }

    const data = (await res.json()) as { response?: { order_list?: Record<string, unknown>[] } }
    return data.response?.order_list ?? []
  }
}

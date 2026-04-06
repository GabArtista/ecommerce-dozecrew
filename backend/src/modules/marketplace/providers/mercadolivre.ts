import { decrypt } from '../utils/encryption'
import type { IMarketplaceProvider, MarketplaceConnection, TokenData } from '../types'

const ML_BASE_AUTH = 'https://auth.mercadolibre.com.ar'
const ML_BASE_API = 'https://api.mercadolibre.com'

export class MercadoLivreProvider implements IMarketplaceProvider {
  readonly platform = 'mercadolivre' as const

  getAuthorizationUrl(storeId: string, state: string): string {
    const clientId = process.env.ML_CLIENT_ID ?? ''
    const redirectUri = process.env.ML_REDIRECT_URI ?? ''
    return (
      `${ML_BASE_AUTH}/authorization` +
      `?response_type=code` +
      `&client_id=${encodeURIComponent(clientId)}` +
      `&state=${encodeURIComponent(state)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}`
    )
  }

  async exchangeCodeForToken(code: string, _state: string, _extra?: Record<string, string>): Promise<TokenData> {
    const clientId = process.env.ML_CLIENT_ID ?? ''
    const clientSecret = process.env.ML_CLIENT_SECRET ?? ''
    const redirectUri = process.env.ML_REDIRECT_URI ?? ''

    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
    })

    const res = await fetch(`${ML_BASE_API}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
      body: body.toString(),
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`[MercadoLivre] exchangeCodeForToken failed (${res.status}): ${text}`)
    }

    const data = (await res.json()) as Record<string, unknown>

    return {
      access_token: data.access_token as string,
      refresh_token: data.refresh_token as string | undefined,
      expires_in: data.expires_in as number | undefined,
      platform_seller_id: String(data.user_id ?? ''),
    }
  }

  async refreshAccessToken(connection: MarketplaceConnection): Promise<TokenData> {
    const clientId = process.env.ML_CLIENT_ID ?? ''
    const clientSecret = process.env.ML_CLIENT_SECRET ?? ''

    if (!connection.refresh_token) {
      throw new Error('[MercadoLivre] No refresh_token available for this connection')
    }

    const plainRefreshToken = decrypt(connection.refresh_token)

    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: plainRefreshToken,
    })

    const res = await fetch(`${ML_BASE_API}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
      body: body.toString(),
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`[MercadoLivre] refreshAccessToken failed (${res.status}): ${text}`)
    }

    const data = (await res.json()) as Record<string, unknown>

    return {
      access_token: data.access_token as string,
      refresh_token: data.refresh_token as string | undefined,
      expires_in: data.expires_in as number | undefined,
      platform_seller_id: String(data.user_id ?? connection.platform_seller_id ?? ''),
    }
  }

  async validateCredentials(_config: Record<string, unknown>): Promise<boolean> {
    // OAuth flow — credentials are validated during the token exchange
    return true
  }

  async syncProduct(connection: MarketplaceConnection, product: Record<string, unknown>): Promise<void> {
    const accessToken = decrypt(connection.access_token)

    const payload = {
      title: product.title as string,
      price: product.price as number,
      available_quantity: product.quantity as number,
      currency_id: 'BRL',
      buying_mode: 'buy_it_now',
      listing_type_id: 'gold_special',
      condition: 'new',
      category_id: (product.category_id as string) ?? 'MLB3530',
    }

    const res = await fetch(`${ML_BASE_API}/items`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`[MercadoLivre] syncProduct failed (${res.status}): ${text}`)
    }
  }

  async updateInventory(connection: MarketplaceConnection, variantId: string, qty: number): Promise<void> {
    const accessToken = decrypt(connection.access_token)
    const itemId = (connection.config as Record<string, unknown>)[`item_id_${variantId}`] as string

    if (!itemId) {
      throw new Error(`[MercadoLivre] No item_id mapped for variantId=${variantId}`)
    }

    const res = await fetch(`${ML_BASE_API}/items/${itemId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ available_quantity: qty }),
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`[MercadoLivre] updateInventory failed (${res.status}): ${text}`)
    }
  }

  async fetchOrders(connection: MarketplaceConnection, since: Date): Promise<Record<string, unknown>[]> {
    const accessToken = decrypt(connection.access_token)
    const sellerId = connection.platform_seller_id ?? ''

    const url =
      `${ML_BASE_API}/orders/search` +
      `?seller=${encodeURIComponent(sellerId)}` +
      `&sort=date_desc` +
      `&order.date_created.from=${since.toISOString()}`

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`[MercadoLivre] fetchOrders failed (${res.status}): ${text}`)
    }

    const data = (await res.json()) as { results?: Record<string, unknown>[] }
    return data.results ?? []
  }
}

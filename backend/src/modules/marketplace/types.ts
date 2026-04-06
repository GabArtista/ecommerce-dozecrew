export type MarketplacePlatform =
  | 'mercadolivre'
  | 'shopee'
  | 'amazon'
  | 'tiktok'
  | 'facebook'
  | 'magalu'
  | 'americanas'
  | 'shein'

export type ConnectionStatus = 'active' | 'error' | 'expired' | 'disconnected'

export interface MarketplaceConnection {
  id: string
  platform: MarketplacePlatform
  store_name?: string
  platform_seller_id?: string
  access_token: string          // criptografado AES-256-GCM
  refresh_token?: string        // criptografado
  token_expires_at?: Date
  config: Record<string, unknown>
  status: ConnectionStatus
  last_sync_at?: Date
  last_error?: string
  sync_products: boolean
  sync_orders: boolean
  created_at: Date
  updated_at: Date
}

export interface TokenData {
  access_token: string
  refresh_token?: string
  expires_in?: number           // segundos
  platform_seller_id?: string
  store_name?: string
}

export interface SyncResult {
  platform: MarketplacePlatform
  type: 'products' | 'orders' | 'inventory'
  success: number
  failed: number
  errors: string[]
  duration_ms: number
}

export interface IMarketplaceProvider {
  platform: MarketplacePlatform
  getAuthorizationUrl(storeId: string, state: string): string
  exchangeCodeForToken(code: string, state: string, extra?: Record<string, string>): Promise<TokenData>
  refreshAccessToken(connection: MarketplaceConnection): Promise<TokenData>
  validateCredentials(config: Record<string, unknown>): Promise<boolean>
  syncProduct(connection: MarketplaceConnection, product: Record<string, unknown>): Promise<void>
  updateInventory(connection: MarketplaceConnection, variantId: string, qty: number): Promise<void>
  fetchOrders(connection: MarketplaceConnection, since: Date): Promise<Record<string, unknown>[]>
}

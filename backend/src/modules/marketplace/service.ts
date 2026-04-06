import { encrypt } from './utils/encryption'
import { MercadoLivreProvider } from './providers/mercadolivre'
import { ShopeeProvider } from './providers/shopee'
import { TikTokProvider } from './providers/tiktok'
import { FacebookProvider } from './providers/facebook'
import type { MarketplaceConnection, MarketplacePlatform } from './types'
import { randomUUID } from 'crypto'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'

const DATA_DIR = process.env.MARKETPLACE_DATA_DIR || join(process.cwd(), '.medusa', 'data')
const DB_FILE = join(DATA_DIR, 'marketplace-connections.json')

// Ensure the data directory exists on startup
try {
  mkdirSync(DATA_DIR, { recursive: true })
} catch {
  // ignore if already exists
}

// ---------------------------------------------------------------------------
// CSRF state store — Redis-backed when REDIS_URL is set, otherwise in-memory.
//
// AVISO P1: CSRF_STORE em memória não funciona com múltiplos workers.
// Migrar para Redis antes de produção (configure REDIS_URL).
// ---------------------------------------------------------------------------

type CsrfEntry = { platform: MarketplacePlatform; storeId: string; expiresAt: number }

// In-memory fallback (single-process only)
const _memStore = new Map<string, CsrfEntry>()

/** Purge expired entries from the in-memory fallback store on every read. */
function _memPurge() {
  const now = Date.now()
  for (const [key, entry] of _memStore) {
    if (now > entry.expiresAt) _memStore.delete(key)
  }
}

// ioredis is a transitive dependency already present in node_modules
// eslint-disable-next-line @typescript-eslint/no-var-requires
const IORedis: typeof import('ioredis').default = require('ioredis')

// Try to connect to Redis if REDIS_URL is available
let _redis: import('ioredis').Redis | null = null
if (process.env.REDIS_URL) {
  try {
    const client = new IORedis(process.env.REDIS_URL, { lazyConnect: true, enableReadyCheck: false })
    // Validate connectivity synchronously (best-effort: if ping fails we fall back)
    client.ping().then(() => {
      _redis = client
      console.info('[Marketplace] CSRF store backed by Redis (%s)', process.env.REDIS_URL)
    }).catch((err: unknown) => {
      console.warn('[Marketplace] Could not connect to Redis for CSRF store — falling back to in-memory Map.', err)
    })
  } catch (err) {
    console.warn('[Marketplace] Could not initialise Redis for CSRF store — falling back to in-memory Map.', err)
  }
} else {
  console.warn(
    '[Marketplace] AVISO P1: REDIS_URL não definida. CSRF_STORE em memória não funciona com ' +
    'múltiplos workers. Defina REDIS_URL antes de ir para produção.',
  )
}

const CSRF_KEY_PREFIX = 'csrf:'
const CSRF_TTL_SECONDS = 10 * 60 // 10 minutes

const CSRF_STORE = {
  async set(state: string, entry: CsrfEntry): Promise<void> {
    if (_redis) {
      await _redis.set(
        `${CSRF_KEY_PREFIX}${state}`,
        JSON.stringify(entry),
        'EX',
        CSRF_TTL_SECONDS,
      )
    } else {
      _memPurge()
      _memStore.set(state, entry)
    }
  },

  async get(state: string): Promise<CsrfEntry | undefined> {
    if (_redis) {
      const raw = await _redis.get(`${CSRF_KEY_PREFIX}${state}`)
      return raw ? (JSON.parse(raw) as CsrfEntry) : undefined
    }
    _memPurge()
    return _memStore.get(state)
  },

  async delete(state: string): Promise<void> {
    if (_redis) {
      await _redis.del(`${CSRF_KEY_PREFIX}${state}`)
    } else {
      _memStore.delete(state)
    }
  },
}

class MarketplaceService {
  private providers = {
    mercadolivre: new MercadoLivreProvider(),
    shopee: new ShopeeProvider(),
    tiktok: new TikTokProvider(),
    facebook: new FacebookProvider(),
  } as const

  // ---- Persistence (file-based, swap for DB adapter when needed) ----

  private _connectionsCache: MarketplaceConnection[] | null = null

  private load(): MarketplaceConnection[] {
    if (this._connectionsCache !== null) return this._connectionsCache
    try {
      if (!existsSync(DB_FILE)) {
        this._connectionsCache = []
        return this._connectionsCache
      }
      const raw = readFileSync(DB_FILE, 'utf-8')
      const parsed = JSON.parse(raw) as MarketplaceConnection[]
      // Rehydrate Date fields
      this._connectionsCache = parsed.map((c) => ({
        ...c,
        created_at: new Date(c.created_at),
        updated_at: new Date(c.updated_at),
        token_expires_at: c.token_expires_at ? new Date(c.token_expires_at) : undefined,
        last_sync_at: c.last_sync_at ? new Date(c.last_sync_at) : undefined,
      }))
      return this._connectionsCache
    } catch {
      this._connectionsCache = []
      return this._connectionsCache
    }
  }

  private save(connections: MarketplaceConnection[]): void {
    this._connectionsCache = connections
    writeFileSync(DB_FILE, JSON.stringify(connections, null, 2), 'utf-8')
  }

  // ---- Public API ----

  listConnections(): MarketplaceConnection[] {
    return this.load()
  }

  getConnection(id: string): MarketplaceConnection | undefined {
    return this.load().find((c) => c.id === id)
  }

  async generateOAuthUrl(platform: MarketplacePlatform, storeId: string): Promise<string> {
    const provider = this.getProvider(platform)
    const state = randomUUID()
    await CSRF_STORE.set(state, { platform, storeId, expiresAt: Date.now() + CSRF_TTL_SECONDS * 1000 })
    return provider.getAuthorizationUrl(storeId, state)
  }

  async handleOAuthCallback(
    platform: MarketplacePlatform,
    code: string,
    state: string,
  ): Promise<MarketplaceConnection> {
    // Validate CSRF state
    const csrfEntry = await CSRF_STORE.get(state)
    if (!csrfEntry) {
      throw new Error('[Marketplace] Invalid or expired OAuth state parameter')
    }
    if (Date.now() > csrfEntry.expiresAt) {
      await CSRF_STORE.delete(state)
      throw new Error('[Marketplace] OAuth state has expired — please retry authorization')
    }
    if (csrfEntry.platform !== platform) {
      throw new Error(`[Marketplace] Platform mismatch: expected ${csrfEntry.platform}, got ${platform}`)
    }
    await CSRF_STORE.delete(state)

    const provider = this.getProvider(platform)
    const tokenData = await provider.exchangeCodeForToken(code, state)

    const now = new Date()
    const connection: MarketplaceConnection = {
      id: randomUUID(),
      platform,
      store_name: tokenData.store_name,
      platform_seller_id: tokenData.platform_seller_id,
      access_token: encrypt(tokenData.access_token),
      refresh_token: tokenData.refresh_token ? encrypt(tokenData.refresh_token) : undefined,
      token_expires_at: tokenData.expires_in
        ? new Date(Date.now() + tokenData.expires_in * 1000)
        : undefined,
      config: {},
      status: 'active',
      sync_products: true,
      sync_orders: true,
      created_at: now,
      updated_at: now,
    }

    const connections = this.load()
    connections.push(connection)
    this.save(connections)

    return connection
  }

  async createCredentialConnection(
    platform: MarketplacePlatform,
    config: Record<string, unknown>,
  ): Promise<MarketplaceConnection> {
    const provider = this.getProvider(platform)
    const valid = await provider.validateCredentials(config)

    if (!valid) {
      throw new Error(`[Marketplace] Credential validation failed for platform=${platform}`)
    }

    const now = new Date()
    const accessToken = (config.access_token as string) ?? ''
    const refreshToken = (config.refresh_token as string) ?? undefined

    const connection: MarketplaceConnection = {
      id: randomUUID(),
      platform,
      store_name: config.store_name as string | undefined,
      platform_seller_id: config.platform_seller_id as string | undefined,
      access_token: accessToken ? encrypt(accessToken) : '',
      refresh_token: refreshToken ? encrypt(refreshToken as string) : undefined,
      token_expires_at: config.expires_in
        ? new Date(Date.now() + (config.expires_in as number) * 1000)
        : undefined,
      config: omit(config, ['access_token', 'refresh_token', 'expires_in']),
      status: 'active',
      sync_products: true,
      sync_orders: true,
      created_at: now,
      updated_at: now,
    }

    const connections = this.load()
    connections.push(connection)
    this.save(connections)

    return connection
  }

  deleteConnection(id: string): void {
    const connections = this.load().filter((c) => c.id !== id)
    this.save(connections)
  }

  async syncOrders(connectionId: string): Promise<void> {
    const connection = this.getConnection(connectionId)
    if (!connection) {
      throw new Error(`[Marketplace] Connection not found: ${connectionId}`)
    }

    await this.refreshTokenIfNeeded(connection)

    const provider = this.getProvider(connection.platform)
    const since = connection.last_sync_at ?? new Date(Date.now() - 24 * 60 * 60 * 1000)

    try {
      const orders = await provider.fetchOrders(connection, since)

      // Update last_sync_at on success
      const connections = this.load()
      const idx = connections.findIndex((c) => c.id === connectionId)
      if (idx !== -1) {
        connections[idx].last_sync_at = new Date()
        connections[idx].status = 'active'
        connections[idx].last_error = undefined
        connections[idx].updated_at = new Date()
        this.save(connections)
      }

      console.info(`[Marketplace] syncOrders: fetched ${orders.length} orders from ${connection.platform} (connection=${connectionId})`)
    } catch (err: any) {
      const connections = this.load()
      const idx = connections.findIndex((c) => c.id === connectionId)
      if (idx !== -1) {
        connections[idx].status = 'error'
        connections[idx].last_error = err?.message ?? String(err)
        connections[idx].updated_at = new Date()
        this.save(connections)
      }
      throw err
    }
  }

  async refreshTokenIfNeeded(connection: MarketplaceConnection): Promise<void> {
    if (!connection.token_expires_at) return

    // Refresh if token expires within 5 minutes
    const fiveMinutes = 5 * 60 * 1000
    if (connection.token_expires_at.getTime() - Date.now() > fiveMinutes) return

    const provider = this.getProvider(connection.platform)

    try {
      const tokenData = await provider.refreshAccessToken(connection)

      const connections = this.load()
      const idx = connections.findIndex((c) => c.id === connection.id)
      if (idx !== -1) {
        connections[idx].access_token = encrypt(tokenData.access_token)
        if (tokenData.refresh_token) {
          connections[idx].refresh_token = encrypt(tokenData.refresh_token)
        }
        if (tokenData.expires_in) {
          connections[idx].token_expires_at = new Date(Date.now() + tokenData.expires_in * 1000)
        }
        connections[idx].status = 'active'
        connections[idx].updated_at = new Date()
        this.save(connections)
      }
    } catch (err: any) {
      console.error(`[Marketplace] refreshTokenIfNeeded failed for ${connection.platform}: ${err?.message}`)

      const connections = this.load()
      const idx = connections.findIndex((c) => c.id === connection.id)
      if (idx !== -1) {
        connections[idx].status = 'expired'
        connections[idx].last_error = err?.message ?? String(err)
        connections[idx].updated_at = new Date()
        this.save(connections)
      }

      throw err
    }
  }

  // ---- Private helpers ----

  private getProvider(platform: MarketplacePlatform) {
    const provider = (this.providers as Record<string, (typeof this.providers)[keyof typeof this.providers]>)[platform]
    if (!provider) {
      throw new Error(`[Marketplace] No provider registered for platform=${platform}`)
    }
    return provider
  }
}

function omit<T extends Record<string, unknown>>(obj: T, keys: string[]): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const key of Object.keys(obj)) {
    if (!keys.includes(key)) {
      result[key] = obj[key]
    }
  }
  return result
}

export default new MarketplaceService()

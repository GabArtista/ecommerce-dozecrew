# Spec: Agente D — Marketplace Backend Hub

**Onda**: 2 (paralelo com E e F)
**Tipo de agente**: `general-purpose`
**Depende de**: Agente C ter entregado `docs/decisions/marketplace-research.md`

---

## Missão

Implementar o módulo de integração com marketplaces no backend Medusa, incluindo OAuth2 callbacks, sync de produtos/estoque/pedidos, e webhooks de entrada.

---

## Contexto

Ler `docs/decisions/marketplace-research.md` antes de iniciar. As decisões de arquitetura nesse doc são normativas.

---

## Estrutura a Criar

```
backend/src/modules/marketplace/
├── index.ts                    # Exportação do módulo
├── types.ts                    # Tipos TypeScript
├── service.ts                  # MarketplaceModuleService
├── models/
│   └── marketplace-connection.ts  # Entidade de conexão
├── providers/
│   ├── base.ts                 # Interface base para providers
│   ├── mercadolivre.ts         # Provider ML
│   ├── shopee.ts               # Provider Shopee
│   ├── amazon.ts               # Provider Amazon
│   ├── tiktok.ts               # Provider TikTok Shop
│   └── facebook.ts             # Provider Facebook/Meta
└── utils/
    ├── encryption.ts           # Encrypt/decrypt de tokens
    └── sync.ts                 # Utilitários de sync
```

---

## Tarefas

### 1. Modelo de Dados

Criar entidade `MarketplaceConnection`:
```typescript
{
  id: string
  platform: 'mercadolivre' | 'shopee' | 'amazon' | 'tiktok' | 'facebook'
  store_id: string              // ID do lojista no Medusa
  access_token: string          // Criptografado (AES-256)
  refresh_token?: string        // Criptografado
  token_expires_at?: Date
  platform_seller_id?: string   // ID do vendedor na plataforma
  config: Record<string, any>   // Config específica por plataforma
  status: 'active' | 'error' | 'expired' | 'disconnected'
  last_sync_at?: Date
  last_error?: string
  created_at: Date
  updated_at: Date
}
```

### 2. Interface Base de Provider

```typescript
interface MarketplaceProvider {
  platform: string

  // Auth
  getAuthorizationUrl(storeId: string): string  // Para OAuth2
  exchangeCodeForToken(code: string, state: string): Promise<TokenData>
  refreshToken(connection: MarketplaceConnection): Promise<TokenData>

  // Produtos
  publishProduct(connection: MarketplaceConnection, product: MedusaProduct): Promise<void>
  updateProduct(connection: MarketplaceConnection, product: MedusaProduct): Promise<void>
  updateStock(connection: MarketplaceConnection, variantId: string, qty: number): Promise<void>

  // Pedidos
  fetchOrders(connection: MarketplaceConnection, since: Date): Promise<MarketplaceOrder[]>
  acknowledgeOrder(connection: MarketplaceConnection, orderId: string): Promise<void>
}
```

### 3. Rotas Admin

**Arquivo**: `backend/src/api/admin/marketplace/`

```
GET  /admin/marketplace/connections          # Listar conexões
POST /admin/marketplace/connections          # Criar conexão (credencial manual)
GET  /admin/marketplace/connections/:id      # Detalhe
DELETE /admin/marketplace/connections/:id   # Desconectar

GET  /admin/marketplace/oauth/:platform/url  # Gerar URL de autorização OAuth2
POST /admin/marketplace/sync/:id             # Forçar sync manual
GET  /admin/marketplace/sync/:id/log        # Log de sync
```

### 4. Rotas Store (OAuth2 Callback)

**Arquivo**: `backend/src/api/store/marketplace/`

```
GET /store/marketplace/oauth/callback/:platform  # Callback OAuth2
```

Esta rota recebe o `code` e `state` do OAuth2, faz o exchange, salva o token, redireciona para o admin.

### 5. Jobs Agendados

**Arquivo**: `backend/src/jobs/marketplace-sync.ts`

Jobs a criar:
- `sync-marketplace-products` — a cada 6h, publica/atualiza produtos novos
- `sync-marketplace-orders` — a cada 15min, importa pedidos dos marketplaces
- `refresh-marketplace-tokens` — a cada hora, renova tokens próximos do vencimento

### 6. Subscriber para Sync Automático

**Arquivo**: `backend/src/subscribers/marketplace-sync.ts`

Ouvir eventos:
- `product.updated` → atualizar produto em todos os marketplaces ativos
- `product-variant.updated` → atualizar estoque nos marketplaces
- `order.placed` → quando pedido veio de marketplace, dar acknowledge

### 7. Implementar Providers

Para cada plataforma definida no research do Agente C, implementar o provider. Priorizar conforme recomendação do Agente C.

**Para OAuth2 providers (ex: ML, Amazon, TikTok, Facebook):**
- `getAuthorizationUrl()` com state anti-CSRF
- `exchangeCodeForToken()` via backend (nunca expor client_secret no frontend)
- Refresh automático de token

**Para credencial manual (ex: Shopee):**
- `validateCredentials()` para testar se as credenciais estão corretas antes de salvar

---

## Variáveis de Ambiente Necessárias

Adicionar ao `backend/.env`:
```
# Marketplace credentials (cada plataforma)
ML_CLIENT_ID=
ML_CLIENT_SECRET=
ML_REDIRECT_URI=https://shop-back.dozecrew.com/store/marketplace/oauth/callback/mercadolivre

AMAZON_CLIENT_ID=
AMAZON_CLIENT_SECRET=
AMAZON_REDIRECT_URI=https://shop-back.dozecrew.com/store/marketplace/oauth/callback/amazon

TIKTOK_APP_KEY=
TIKTOK_APP_SECRET=
TIKTOK_REDIRECT_URI=...

FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=
FACEBOOK_REDIRECT_URI=...

# Encryption
MARKETPLACE_TOKEN_ENCRYPTION_KEY=  # 32 bytes hex
```

---

## Entregáveis

- [ ] `backend/src/modules/marketplace/` — módulo completo
- [ ] `backend/src/api/admin/marketplace/` — rotas admin
- [ ] `backend/src/api/store/marketplace/oauth/callback/` — OAuth callback
- [ ] `backend/src/jobs/marketplace-sync.ts` — jobs
- [ ] `backend/src/subscribers/marketplace-sync.ts` — subscriber
- [ ] Variáveis de ambiente documentadas em `backend/.env.example`

---

## Critério de Pronto

- Módulo compilando sem erros TypeScript
- Rotas admin retornando respostas corretas (pode ser com dados mockados)
- OAuth2 flow completo para pelo menos ML e Facebook
- Provider Shopee com credencial manual validada
- Jobs registrados e rodando (mesmo que sem sync real sem credenciais)
- Tokens armazenados criptografados

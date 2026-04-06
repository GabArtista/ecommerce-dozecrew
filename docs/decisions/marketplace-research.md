# Marketplace Research — Decisões Técnicas

> **Agente C — Marketplace Research**
> Data: 2026-03-30
> Status: Completo — para uso do Agente D (Marketplace Backend Hub)

---

## Sumário Executivo

| Plataforma | Tipo de Conexão | Viabilidade | SDK Node.js | Sandbox | Prioridade |
|---|---|---|---|---|---|
| Mercado Livre | OAuth2-simples | Alta | Oficial (legado) + REST direto | Sim (test users) | P1 — Imediato |
| Shopee | OAuth2-simples (c/ HMAC) | Alta | Community apenas | Sim (host separado) | P2 — Sprint 2 |
| Amazon SP-API | OAuth2-complexo (LWA + IAM) | Média | Oficial + community | Sim | P3 — Sprint 3 |
| TikTok Shop | OAuth2-simples | Alta | SDK oficial disponível | Sim (test seller) | P2 — Sprint 2 |
| Facebook/Instagram | OAuth2-simples | Média* | Oficial (Meta Business SDK) | Não (produção) | P3 — Sprint 3 |
| Shein | Credencial-wizard (API Key) | Média | Nenhum | Não documentado | P4 — Futuro |
| Magalu | OAuth2-simples | Alta | Nenhum | Não documentado | P2 — Sprint 2 |
| Americanas (SkyHub) | Credencial-wizard (API Key estático) | Média | Nenhum | Não | P3 — Sprint 3 |

> \* Meta removeu checkout nativo em Jun/2025 — integração vira vitrine/catálogo apenas, sem pedidos diretos.

---

## 1. Mercado Livre (MELI)

### Tipo de conexão
`OAuth2-simples` — fluxo padrão Authorization Code, 100% controlável pelo backend.

### Como o vendedor cria o app (passos exatos)

1. Acessa **developers.mercadolivre.com.br** com conta ML existente.
2. Clica em **"Criar aplicação"** no DevCenter.
3. Preenche:
   - Nome da aplicação (único globalmente)
   - Nome curto (gera URL pública da app)
   - Descrição (até 150 chars — visível ao vendedor na tela de autorização)
   - Logo da empresa
   - **Redirect URI(s)** — obrigatório HTTPS, domínio raiz
4. Obtém `client_id` (APP_ID) e `client_secret` — **não compartilhar o secret**.
5. Guarda credenciais (não há tela posterior para recuperar).

### Fluxo de autenticação (OAuth2 Authorization Code)

**Passo 1 — Redirecionar vendedor:**
```
GET https://auth.mercadolibre.com.ar/authorization
  ?response_type=code
  &client_id={APP_ID}
  &state={CSRF_token}
  &redirect_uri={REDIRECT_URI}
```

**Passo 2 — Receber code no callback** (redirect_uri?code=XYZ&state=ABC)

**Passo 3 — Trocar code por tokens:**
```
POST https://api.mercadolibre.com/oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&client_id={APP_ID}
&client_secret={CLIENT_SECRET}
&code={CODE}
&redirect_uri={REDIRECT_URI}
```

**Resposta:**
```json
{
  "access_token": "APP_USR-...",
  "token_type": "bearer",
  "expires_in": 21600,
  "scope": "offline_access read write",
  "user_id": 123456789,
  "refresh_token": "TG-..."
}
```

**Passo 4 — Renovar access_token (a cada 6 horas):**
```
POST https://api.mercadolibre.com/oauth/token
grant_type=refresh_token
&client_id={APP_ID}
&client_secret={CLIENT_SECRET}
&refresh_token={REFRESH_TOKEN}
```

**Validade dos tokens:**
- `access_token`: 6 horas
- `refresh_token`: 6 meses (renova a cada uso — sliding window)

### Escopos disponíveis

| Escopo | Permissão |
|---|---|
| `read` | Leitura de dados |
| `write` | Criação e edição |
| `offline_access` | Permite uso de refresh_token |

### APIs disponíveis

**Produtos (Listings):**
```
POST   /items                              — criar anúncio
PUT    /items/{item_id}                    — atualizar item (título, preço, estoque)
GET    /items/{item_id}                    — consultar item
PUT    /items/{item_id}/variations/{id}    — atualizar variação específica
```

**Preço:**
```
PUT    /items/{item_id}
       body: { "price": 99.90 }
```

**Estoque:**
```
PUT    /items/{item_id}
       body: { "available_quantity": 50 }

PUT    /user-products/{USER_PRODUCT_ID}/stock/type/seller_warehouse
       — estoque distribuído (multi-origem)
```

**Pedidos:**
```
GET    /orders/{order_id}                  — detalhes do pedido
GET    /orders/search?seller={user_id}    — listar pedidos do seller
GET    /packs/{pack_id}/orders             — pedidos em pack (carrinho)
```

**Categorias:**
```
GET    /sites/MLB/categories               — categorias do Brasil (MLB = Brasil)
GET    /categories/{category_id}
```

### Webhooks

Tópicos disponíveis para inscrição (via POST /applications/{app_id}/hooks):

| Tópico | Evento |
|---|---|
| `items` | Alterações em anúncios publicados |
| `orders_v2` | Criação e atualização de vendas confirmadas |
| `payments` | Eventos de pagamento |
| `questions` | Perguntas de compradores |
| `messages` | Mensagens pós-venda |
| `shipments` | Atualizações de envio |
| `claims` | Reclamações abertas |
| `item_competition` | Competição de catálogo |

**Formato da notificação (POST no seu endpoint):**
```json
{
  "resource": "/orders/123456789",
  "user_id": 12345,
  "topic": "orders_v2",
  "application_id": 67890,
  "sent": "2026-01-01T12:00:00.000-04:00",
  "attempts": 1
}
```
- MELI envia apenas o ID — o backend deve fazer GET no resource para obter detalhes.
- Valida autenticidade via header `x-signature` (HMAC-SHA256).

### Rate Limits

- **Padrão**: 1.500 requests/minuto por vendedor (seller)
- Exceder retorna `HTTP 429` com body vazio
- Header `X-Ratelimit-Limit` informa o limite atual

### Sandbox

Não há ambiente sandbox separado. MELI usa **test users** em produção:
- Criar até 10 test users via `POST /users/test_user` (requer access_token de conta real)
- Test users só interagem entre si (não afetam dados reais)
- Test users podem listar, comprar, vender, perguntar — sem custos reais

### SDK Node.js

- **Oficial (legado)**: `mercadolibre-nodejs-sdk` (npm) — versão 3.0.1, última publicação há 5 anos. **Não recomendado para novas integrações.**
- **Recomendação**: implementar chamadas REST diretamente via `fetch`/`axios` + gerenciamento próprio de tokens.
- GitHub oficial: `github.com/mercadolibre/nodejs-sdk`

### Complexidade de onboarding para o vendedor

**Fácil** — O vendedor apenas clica num link gerado pelo nosso sistema, faz login no ML, aprova as permissões e é redirecionado de volta. Sem configuração técnica necessária do lado do vendedor.

### Implementação recomendada para o Agente D

1. Criar rota `GET /api/store/marketplace/meli/oauth/start` — gera URL de autorização com CSRF state
2. Criar rota `GET /api/store/marketplace/meli/oauth/callback` — recebe code, troca por tokens, salva no banco
3. Job agendado para renovar `refresh_token` antes de expirar (a cada 5h30min)
4. Webhook receiver em `POST /api/store/marketplace/meli/webhook` — valida assinatura, enfileira processamento
5. Serviços: `MELIProductService`, `MELIOrderService`, `MELIInventoryService`
6. Armazenar: `access_token`, `refresh_token`, `user_id`, `expires_at` por loja conectada

---

## 2. Shopee Open Platform

### Tipo de conexão
`OAuth2-simples` com particularidade: **todas as requests exigem assinatura HMAC-SHA256** usando o `partner_key`. É OAuth2, mas cada chamada à API precisa de assinatura adicional.

### Como o vendedor cria o app (passos exatos)

1. O **integrador** (nosso sistema) registra conta em **open.shopee.com** (Open Platform).
2. Em **App Management > App List > Criar App**:
   - Tipo: ERP System
   - Nome, descrição, logo
   - **Redirect URL** para OAuth
   - Selecionar regiões alvo (incluir Brazil/BR)
3. Recebe: `Partner ID` (público) e `Partner Key` (secreto — equivale ao client_secret).
4. Há dois ambientes: **test** (sandbox) e **live** (produção) — cada um com IDs diferentes.
5. **O vendedor não cria nenhum app** — ele apenas autoriza via link gerado pelo nosso sistema.

### Credenciais do vendedor (Seller Center)

O vendedor localiza o `Partner ID` e `Partner Key` em:
- Shopee Open Platform > App Management > App List > Selecionar App > **App Key**
- Clicar no ícone de olho para revelar a chave

### Fluxo de autenticação

**Passo 1 — Gerar URL de autorização (com assinatura):**
```
GET https://partner.shopeemobile.com/api/v2/shop/auth_partner
  ?partner_id={PARTNER_ID}
  &timestamp={UNIX_TIMESTAMP}
  &sign={HMAC_SHA256_SIGNATURE}
  &redirect={REDIRECT_URL}
```

**Como calcular a assinatura (HMAC-SHA256):**
```
base_string = "{partner_id}/api/v2/shop/auth_partner{timestamp}"
sign = HMAC-SHA256(base_string, partner_key)  // hex lowercase
```

**Passo 2 — Vendedor autoriza e é redirecionado:**
```
{REDIRECT_URL}?code={AUTH_CODE}&shop_id={SHOP_ID}
```

**Passo 3 — Trocar code por tokens:**
```
POST https://partner.shopeemobile.com/api/v2/auth/token/get
Content-Type: application/json
Headers: sign calculado via HMAC

{
  "code": "{AUTH_CODE}",
  "shop_id": {SHOP_ID},
  "partner_id": {PARTNER_ID}
}
```

**Resposta:**
```json
{
  "access_token": "...",
  "refresh_token": "...",
  "expire_in": 14400,
  "request_id": "..."
}
```

**Passo 4 — Renovar tokens:**
```
POST /api/v2/auth/access_token/get
{
  "refresh_token": "...",
  "shop_id": {SHOP_ID},
  "partner_id": {PARTNER_ID}
}
```

**Validade dos tokens:**
- `access_token`: 4 horas
- `refresh_token`: 30 dias (se expirar, vendedor precisa reautorizar)

**Assinatura em cada request de API:**
```
base_string = "{partner_id}{path}{timestamp}{access_token}{shop_id}"
sign = HMAC-SHA256(base_string, partner_key)  // hex lowercase
```

### APIs disponíveis

**Endpoint base de produção (Brasil):** `https://partner.shopeemobile.com`
**Endpoint sandbox:** `https://partner.test-stable.shopeemobile.com`

**Produtos:**
```
GET    /api/v2/product/get_item_list          — listar produtos do seller
GET    /api/v2/product/get_item_base_info     — detalhes do produto
POST   /api/v2/product/add_item               — criar produto
POST   /api/v2/product/update_item            — atualizar produto
POST   /api/v2/product/update_stock           — atualizar estoque
POST   /api/v2/product/update_price           — atualizar preço
```

**Pedidos:**
```
GET    /api/v2/order/get_order_list           — listar pedidos
GET    /api/v2/order/get_order_detail         — detalhes do pedido
POST   /api/v2/order/handle_buyer_cancellation — tratar cancelamento
```

**Logística:**
```
GET    /api/v2/logistics/get_shipping_parameter
POST   /api/v2/logistics/init_shipment
POST   /api/v2/logistics/create_shipping_document
```

### Webhooks

Shopee oferece webhooks para:
- Novo pedido criado
- Status do pedido atualizado
- Cancelamento de pedido
- Produto atualizado
- Estoque baixo

Configurados no painel da Open Platform com URL de callback. Cada evento inclui `shop_id` para identificar o seller.

### Rate Limits

Shopee aplica rate limits mas não publica os valores exatos publicamente. A documentação oficial menciona throttling adaptativo:
- Recomenda-se implementar **exponential backoff** em caso de `HTTP 429`
- Rate limits variam por endpoint e por tier do partner

### Sandbox

**Disponível** — host separado: `https://partner.test-stable.shopeemobile.com`
- Test Partner ID e Test Key fornecidos separadamente após criação do app
- Loja de teste criável via painel da Open Platform
- Não afeta dados de produção

### SDK Node.js

**Sem SDK oficial**. Apenas community:
- `shopee-client` (npm) — TypeScript, documentado
- `shopee-sdk` (GitHub: congminh1254) — cobre 100% dos endpoints
- Recomendação: **implementar cliente próprio** com HMAC-SHA256 signing, dado que todos os pacotes community estão desatualizados.

### Complexidade de onboarding para o vendedor

**Médio** — O vendedor clica num link, autoriza no Shopee Seller Center e volta. O processo em si é simples (semelhante ao MELI), mas exige que o vendedor tenha conta ativa no Seller Center e a loja aprovada pela Shopee.

### Implementação recomendada para o Agente D

1. Rota `GET /api/store/marketplace/shopee/oauth/start` — gera URL assinada de autorização
2. Rota `GET /api/store/marketplace/shopee/oauth/callback` — recebe `code` + `shop_id`, troca tokens
3. **Utilitário de assinatura HMAC-SHA256** — reutilizável em todas as chamadas
4. Job de renovação de `access_token` a cada 3h30min (antes das 4h expirarem)
5. Alerta quando `refresh_token` está próximo de expirar (28 dias) — notificar vendedor para reautorizar
6. Armazenar: `access_token`, `refresh_token`, `shop_id`, `partner_id`, `expires_at`

---

## 3. Amazon Selling Partner API (SP-API)

### Tipo de conexão
`OAuth2-complexo` — Usa Login with Amazon (LWA), que é OAuth2, mas o processo de registro e aprovação é burocrático e exige configuração de IAM na AWS.

### Como o integrador registra o app (passos exatos)

1. **Criar conta AWS** (se não existir) e configurar:
   - IAM User com permissão `execute-api:Invoke`
   - IAM Policy com ações SP-API
   - IAM Role com trust relationship para a IAM Policy
   - Copiar o **Role ARN** gerado

2. **Acessar Developer Central** (dentro do Seller Central do próprio vendedor da Doze Crew):
   - Seller Central > Apps & Services > Develop Apps > Add new app client

3. **Registrar a aplicação:**
   - App name
   - API Type: SP API
   - IAM ARN: colar o Role ARN do passo 1
   - Selecionar roles necessários (ver abaixo)

4. Receber **LWA Client ID** e **LWA Client Secret**

5. **Solicitar aprovação dos roles** — Amazon avalia e aprova (pode levar dias)

### Roles necessários para o hub de marketplace

| Role | Acesso concedido |
|---|---|
| `Product Listing` | Listings Items API, Catalog Items API |
| `Inventory and Order Tracking` | Orders API, FBA Inventory API |
| `Direct to Consumer Shipping` | Shipments |
| `Finance and Accounting` | Notifications para FEE_PROMOTION |

### Fluxo de autorização do vendedor (Website Authorization Workflow)

**Passo 1 — Vendedor inicia do nosso site:**
```
GET https://sellercentral.amazon.com.br/apps/authorize/consent
  ?application_id={APP_ID}
  &state={CSRF_state}
  &redirect_uri={REDIRECT_URI}
  &version=beta
```

**Passo 2 — Amazon redireciona de volta:**
```
{REDIRECT_URI}
  ?spapi_oauth_code={CODE}   — expira em 5 MINUTOS
  &state={CSRF_state}
  &selling_partner_id={MERCHANT_TOKEN}
```

**Passo 3 — Trocar code por tokens LWA:**
```
POST https://api.amazon.com/auth/o2/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&code={spapi_oauth_code}
&client_id={LWA_CLIENT_ID}
&client_secret={LWA_CLIENT_SECRET}
```

**Resposta:**
```json
{
  "access_token": "Atza|...",
  "refresh_token": "Atzr|...",
  "token_type": "bearer",
  "expires_in": 3600
}
```

**Passo 4 — Renovar access_token (a cada hora):**
```
POST https://api.amazon.com/auth/o2/token
grant_type=refresh_token
&refresh_token={REFRESH_TOKEN}
&client_id={LWA_CLIENT_ID}
&client_secret={LWA_CLIENT_SECRET}
```

**Validade dos tokens:**
- `access_token`: 1 hora
- `refresh_token`: longa duração (não expira por inatividade)

### APIs disponíveis

**Endpoint base:** `https://sellingpartnerapi-na.amazon.com` (América do Norte / Brasil usa `sellingpartnerapi-fe.amazon.com` para FE ou a AWS region correta)

```
GET    /listings/2021-08-01/items/{sellerId}/{sku}           — buscar listing
PUT    /listings/2021-08-01/items/{sellerId}/{sku}           — criar/atualizar listing
PATCH  /listings/2021-08-01/items/{sellerId}/{sku}           — atualizar parcialmente

GET    /orders/v0/orders                                      — listar pedidos
GET    /orders/v0/orders/{orderId}                           — detalhes do pedido
GET    /orders/v0/orders/{orderId}/items                     — itens do pedido

GET    /fba/inventory/v1/summaries                           — inventário FBA

POST   /notifications/v1/subscriptions/{notificationType}   — assinar notificações (webhooks)
DELETE /notifications/v1/subscriptions/{notificationType}   — cancelar assinatura
```

### Webhooks (Notifications API)

Amazon usa SQS (Amazon Simple Queue Service) como destino para notificações — não é um webhook HTTP direto:
1. Criar fila SQS na AWS
2. Assinar notificações via Notifications API apontando para a fila SQS
3. Seu backend consome a fila SQS

Tipos de notificação relevantes:
- `ANY_OFFER_CHANGED` — mudança de preço na listagem
- `ITEM_INVENTORY_EVENT_CHANGE` — mudança de inventário
- `ORDER_STATUS_CHANGE` — status de pedido alterado
- `MFN_ORDER_STATUS_CHANGE` — pedido MFN (fulfilled pelo seller)

### Rate Limits

Variam por endpoint. Exemplos:
| Endpoint | Rate | Burst |
|---|---|---|
| `GET /orders/v0/orders` | 0.0167 req/s (1/min) | 20 |
| `GET /listings/...` | 5 req/s | 10 |
| `PUT /listings/...` | 5 req/s | 10 |

- **Sandbox**: todas as operações = 5 req/s, burst 15
- Throttling retorna `HTTP 429`; header `x-amzn-RateLimit-Limit` informa o limite atual
- Implementar **Token Bucket** com backoff exponencial

### Sandbox

**Disponível** — endpoints separados com prefixo `sandbox`:
```
https://sandbox.sellingpartnerapi-na.amazon.com
```
- Dados estáticos de teste (sem transações reais)
- Não replica rate limits de produção (sandbox tem 5 req/s em tudo)

### SDK Node.js

- **Oficial**: `@amazon-sp-api-release/amazon-sp-api-sdk-js` (npm) — suporta ESM, Node 14+, rate limiter embutido
- **Community**: `amazon-sp-api` (npm) — popular, mantido ativamente
- **Community TypeScript**: `@scaleleap/selling-partner-api-sdk` — totalmente tipado

### Complexidade de onboarding para o vendedor

**Difícil** — Requer:
1. O vendedor ter conta Seller Central ativa no Brasil
2. Entender o fluxo de autorização de "terceiro"
3. Após autorizar, funciona normalmente

A complexidade real está no **lado do desenvolvedor** (IAM, roles, aprovação da Amazon), não no vendedor final.

### Implementação recomendada para o Agente D

1. Rota `GET /api/store/marketplace/amazon/oauth/start`
2. Rota `GET /api/store/marketplace/amazon/oauth/callback` — trocar `spapi_oauth_code` em menos de 5 minutos
3. Job de renovação de `access_token` a cada 50 minutos
4. **Configurar SQS** para receber Notifications — processar assincronamente
5. Usar `@amazon-sp-api-release/amazon-sp-api-sdk-js` para chamadas
6. Implementar Token Bucket para rate limiting
7. Armazenar: `access_token`, `refresh_token`, `selling_partner_id`, `expires_at`, região marketplace

---

## 4. TikTok Shop

### Disponibilidade no Brasil

**Confirmado: SIM.** TikTok Shop lançou oficialmente no Brasil em **8 de maio de 2025**. O lançamento brasileiro foi considerado um dos melhores mundialmente pelo próprio TikTok. Projeções do Santander apontam R$ 39 bilhões em volume até 2028.

O mercado BR está documentado no TikTok Shop Partner Center: `partner.tiktokshop.com/docv2/page/67ca5b6c49162f049f2d1fa6`

### Tipo de conexão
`OAuth2-simples` — padrão Authorization Code, sem assinaturas adicionais por request.

### Como o integrador cria o app

1. Acessar **TikTok Shop Partner Center**: `partner.tiktokshop.com`
2. Criar app com:
   - Nome, categoria, logo
   - **Target Market**: selecionar Brazil (BR)
   - **Seller Types** compatíveis
   - Redirect URL
   - Webhook URL (opcional no início)
3. Selecionar região de registro do negócio
4. Receber: `App ID` (client_id) e `App Secret` (client_secret)
5. Criar **Test Seller Account** para desenvolvimento

### Fluxo de autenticação (OAuth2 Authorization Code)

**Passo 1 — Redirecionar vendedor:**
```
GET https://services.tiktokshop.com/open/authorize
  ?app_key={APP_ID}
  &state={CSRF_state}
```

**Passo 2 — Receber code no callback:**
```
{REDIRECT_URL}?code={AUTH_CODE}&state={STATE}
```

**Passo 3 — Trocar code por tokens:**
```
POST https://auth.tiktok-shops.com/api/v2/token/get
{
  "app_key": "{APP_ID}",
  "app_secret": "{APP_SECRET}",
  "auth_code": "{AUTH_CODE}",
  "grant_type": "authorized_code"
}
```

**Resposta:**
```json
{
  "code": 0,
  "data": {
    "access_token": "...",
    "refresh_token": "...",
    "access_token_expire_in": 86400,
    "refresh_token_expire_in": 2592000,
    "open_id": "...",
    "seller_name": "..."
  }
}
```

**Passo 4 — Renovar tokens:**
```
POST https://auth.tiktok-shops.com/api/v2/token/refresh
{
  "app_key": "{APP_ID}",
  "app_secret": "{APP_SECRET}",
  "refresh_token": "{REFRESH_TOKEN}",
  "grant_type": "refresh_token"
}
```

**Validade dos tokens:**
- `access_token`: 24 horas
- `refresh_token`: 30 dias

### APIs disponíveis

**Endpoint base:** `https://open-api.tiktokglobalshop.com`

```
GET    /product/202309/products                   — listar produtos
POST   /product/202309/products                   — criar produto
PUT    /product/202309/products/{product_id}      — atualizar produto
POST   /product/202309/products/{id}/inventory    — atualizar estoque

GET    /order/202309/orders                        — listar pedidos
GET    /order/202309/orders/{order_id}             — detalhes do pedido

GET    /fulfillment/202309/packages               — gerenciar embalagens
```

### Webhooks

TikTok Shop suporta webhooks para eventos em tempo real:
- Novo pedido criado
- Status do pedido alterado
- Cancelamento de pedido
- Atualização de produto
- Conexão de loja

Configurados no Partner Center. Cada evento inclui identificação do seller via `open_id`.

### Rate Limits

TikTok publica a política de rate limits no Partner Center (`partner.tiktokshop.com/docv2/page/rate-limits`). Os limites específicos variam por tier de parceiro e endpoint, mas o padrão é:
- Limites por app_key + shop combination
- Throttling via `HTTP 429`
- Recomendado: implementar filas de processamento assíncrono

### Sandbox

**Disponível** via **Test Seller Account** criada no Partner Center:
- Simula fluxo completo sem transações reais
- Requer Node.js 16+ para o SDK oficial

### SDK Node.js

- **SDK oficial**: documentado em `partner.tiktokshop.com/docv2/page/integrate-node-js-sdk`
- Instalável via download do Partner Center (não está no npm registry público como pacote oficial)
- Community: `@redonvn/skd-tiktok-shop` (npm) e `@nisyaban/tiktok-shop-client`
- Recomendação: usar o **SDK oficial baixado do Partner Center** + implementar wrapper TypeScript

### Complexidade de onboarding para o vendedor

**Fácil** — O vendedor clica no link gerado pelo nosso sistema, autoriza no TikTok Shop Seller Center e retorna. Processo idêntico ao MELI em termos de UX do vendedor. Exige que o vendedor já seja seller aprovado no TikTok Shop Brasil.

### Implementação recomendada para o Agente D

1. Rota `GET /api/store/marketplace/tiktok/oauth/start`
2. Rota `GET /api/store/marketplace/tiktok/oauth/callback`
3. Job de renovação de `access_token` a cada 20 horas
4. Alerta com 5 dias de antecedência antes do `refresh_token` expirar
5. Webhook receiver em `POST /api/store/marketplace/tiktok/webhook`
6. Armazenar: `access_token`, `refresh_token`, `open_id`, `seller_name`, `expires_at`

---

## 5. Facebook / Instagram Shop

### Tipo de conexão
`OAuth2-simples` — fluxo padrão Meta Login (Facebook OAuth2). Porém, a utilidade é **limitada a catálogo/vitrine** desde a depreciação do checkout nativo.

### Mudança crítica de 2025

Meta removeu o **checkout nativo** do Facebook e Instagram Shops em junho de 2025, com conclusão em agosto de 2025. Isso significa:
- **Não há mais pedidos gerados dentro do Meta** — o comprador é redirecionado para o site externo
- A integração via API passa a ser **vitrine/catálogo apenas** (sem gestão de pedidos via API do Meta)
- O modelo recomendado pelo próprio Meta agora é: sincronizar catálogo → comprador clica → vai para o e-commerce externo → completa compra lá

### Como o integrador cria o app

1. Acessar **Meta for Developers**: `developers.facebook.com`
2. Criar novo app > Business (Commerce)
3. Adicionar produtos: **Marketing API**, **Commerce Platform**
4. Configurar **Basic Settings**: domínio, redirect URLs, privacy policy
5. Submeter para **Meta App Review** (obrigatório para acesso avançado)
6. Receber: `App ID` e `App Secret`

### Permissões OAuth necessárias

| Permissão | Para que serve |
|---|---|
| `catalog_management` | Criar/editar catálogos e produtos |
| `business_management` | Acessar Business Manager e assets |
| `pages_manage_metadata` | Gerenciar páginas do Facebook |
| `instagram_basic` | Dados básicos da conta Instagram |

### Fluxo de autenticação (Meta Login / OAuth2)

**Passo 1 — Redirecionar vendedor:**
```
GET https://www.facebook.com/v20.0/dialog/oauth
  ?client_id={APP_ID}
  &redirect_uri={REDIRECT_URI}
  &scope=catalog_management,business_management
  &state={CSRF_state}
  &response_type=code
```

**Passo 2 — Receber code no callback e trocar por token:**
```
GET https://graph.facebook.com/v20.0/oauth/access_token
  ?client_id={APP_ID}
  &client_secret={APP_SECRET}
  &redirect_uri={REDIRECT_URI}
  &code={CODE}
```

**Passo 3 — Trocar por Long-Lived Token (60 dias):**
```
GET https://graph.facebook.com/v20.0/oauth/access_token
  ?grant_type=fb_exchange_token
  &client_id={APP_ID}
  &client_secret={APP_SECRET}
  &fb_exchange_token={SHORT_LIVED_TOKEN}
```

**Recomendação da própria Meta**: usar **System User Token** (via Business Manager) para evitar renovação manual a cada 60 dias — token de longa duração para operações servidor-a-servidor.

### APIs disponíveis (Catalog/Commerce)

```
POST   /{business_id}/owned_product_catalogs        — criar catálogo
POST   /{catalog_id}/products                        — criar produto
POST   /{catalog_id}/batch                           — criar/atualizar em lote
GET    /{catalog_id}/products                        — listar produtos
DELETE /{product_id}                                 — remover produto

POST   /{catalog_id}/product_feeds                   — criar feed de produtos (URL para batch)
GET    /{feed_id}/uploads                            — status dos uploads
```

**Graph API Version atual**: v20.0 (2025)

### Webhooks

Meta oferece webhooks via Webhooks API:
- Eventos de catálogo (produtos aprovados/rejeitados)
- Eventos de shop (instalação, desinstalação)
- **Não há mais webhooks de pedidos** (checkout foi descontinuado)

Configuração: no painel do app em Meta Developers > Webhooks > Subscribe.

**Importante 2026**: Webhooks mTLS migram para nova CA da Meta em 31/03/2026 — atualizar certificados.

### Rate Limits

Meta usa sistema de Business Use Case (BUC) tiers:
- `catalog_management`: standard tier = 200 calls/hora por usuário
- BUC tier sobe conforme uso legítimo aprovado pelo Meta
- Header `X-Business-Use-Case-Usage` retorna uso atual

### Sandbox

**Não há sandbox separado** — Meta usa modo de teste dentro do mesmo app:
- Contas de teste criáveis em App > Roles > Test Users
- Catálogos de teste não têm revisão real

### SDK Node.js

- **Oficial**: `facebook-nodejs-business-sdk` (npm) — versão 24.0.1 (2025), mantido pelo Facebook
- Instalação: `npm install facebook-nodejs-business-sdk`
- Cobre: Marketing API, Catalog API, Commerce Platform

### Complexidade de onboarding para o vendedor

**Médio** — O vendedor precisa:
1. Ter uma Página do Facebook (Business)
2. Ter Commerce Manager configurado
3. Autorizar o app via Meta Login

O processo é familiar (login social comum), mas requer configuração prévia do Commerce Manager.

### Implementação recomendada para o Agente D

1. Rota `GET /api/store/marketplace/meta/oauth/start`
2. Rota `GET /api/store/marketplace/meta/oauth/callback` — trocar code por token, em seguida trocar por Long-Lived Token
3. **Foco no Catalog Sync**: sincronizar produtos do catálogo Medusa com o Product Catalog do Meta
4. Usar **batch API** para atualizações em volume (não atualizar produto por produto)
5. Implementar **Product Feed** como alternativa ao push por API (URL de feed que o Meta consome)
6. **Não implementar gestão de pedidos** — checkout é externo (direto no nosso e-commerce)
7. Usar `facebook-nodejs-business-sdk` para chamadas

---

## 6. Shein

### Tipo de conexão
`Credencial-wizard` — A Shein possui uma plataforma de desenvolvedor oficial (`open.sheincorp.com`), mas o acesso é restrito e por aprovação. O vendedor obtém credenciais (Open Key ID + Secret Key) via SMS após aprovação no Seller Hub.

### Modelo de negócio da Shein no Brasil

A Shein opera como marketplace no Brasil exigindo:
- CNPJ (registro legal brasileiro)
- Aprovação como "vendor" pela Shein
- Modelos: venda própria via Seller Hub, ou Shein Fulfillment Service (SFS) onde a Shein armazena o inventário

**Não é consignment puro** — o vendedor define preço e gerencia estoque, mas a Shein tem controle forte sobre os produtos publicados.

### Como obter API Key

1. Vendedor acessa o **SHEIN Seller Hub**
2. Navega para: **Personal Center > Third-party Application**
3. Solicita uma API Key via plugin oficial de integração da SHEIN
4. Recebe via SMS: **Open Key ID** e **Secret Key**
5. Acessa `open.sheincorp.com` para documentação e portal: `openapi-portal.sheincorp.com`

### APIs disponíveis (open.sheincorp.com)

| Endpoint | Função |
|---|---|
| `Product Publish or Edit` | Publicar/editar produto no catálogo Shein |
| `Get Purchase Order Information` | Consultar informações de pedidos |
| Shipping label printing | Impressão de etiquetas |
| Order status update | Atualizar status de entrega |
| Inventory sync | Sincronização de estoque |

A documentação oficial está disponível em `open.sheincorp.com/documents/apidoc/` mas requer login/aprovação para acesso completo.

### Webhooks
Não documentado publicamente.

### Rate Limits
Não documentado publicamente.

### Sandbox
Não documentado publicamente.

### SDK Node.js
Nenhum oficial ou community relevante.

### Complexidade de onboarding para o vendedor

**Difícil** — O processo envolve:
1. Aprovação da Shein para ser vendor no Brasil (processo manual/avaliação)
2. Configurar conta no Seller Hub
3. Solicitar API Key (aprovação adicional)
4. Fornecer credenciais ao nosso sistema manualmente

### Viabilidade

**Média** — A API existe e funciona (ChannelEngine, Pipe17 e outros hubs já integram com Shein). Porém:
- Processo de onboarding burocrático para o vendedor
- Documentação pública limitada
- Sem sandbox documentado
- Sem SDK Node.js

Para o nosso hub, a implementação seria um **credencial-wizard**: o vendedor insere o Open Key ID e Secret Key obtidos manualmente no Seller Hub, e nosso sistema usa essas credenciais via API Key nos headers das requests.

### Implementação recomendada para o Agente D

1. Formulário de credenciais no frontend (sem OAuth flow)
2. Validar credenciais via chamada de teste à API
3. Armazenar: `open_key_id`, `secret_key` (criptografados)
4. Implementar chamadas REST diretas conforme `open.sheincorp.com/documents/apidoc/`
5. **Depende de acesso aprovado à documentação completa**

---

## 7. Plataformas Brasileiras Bônus

### 7.1 Magalu (Magazine Luiza)

**Tipo de conexão**: `OAuth2-simples`

- **Portal de dev**: `developers.magalu.com`
- **Autenticação**: OAuth2 Authorization Code (migração concluída até Nov/2025)
- **APIs disponíveis**: produtos (SKU), preço, estoque, pedidos, promoções
- **Webhooks**: Sim — eventos de SKU e pedidos em tempo real
- **Rate Limits**: não publicados (contato com Magalu Devs necessário)
- **Sandbox**: não documentado publicamente
- **SDK Node.js**: Nenhum oficial

**Fluxo resumido**: O vendedor já é parceiro Magalu Marketplace. O integrador registra no portal `developers.magalu.com`, configura OAuth2 com ID Magalu, e o vendedor autoriza via "ID Magalu" (conta unificada do Grupo Magazine Luiza).

**Complexidade de onboarding**: Fácil (para quem já é seller Magalu)

**Prioridade**: P2 — bom ROI no mercado brasileiro, OAuth2 simples, market share relevante

### 7.2 Americanas Marketplace (SkyHub / B2W)

**Tipo de conexão**: `Credencial-wizard` — usa API Key estático, não OAuth2

- **Plataforma de integração**: SkyHub (`desenvolvedores.skyhub.com.br`) — obrigatório, sem bypass
- **Autenticação**: Headers `X-User-Email` + `X-Api-Key` (obtidos no portal Americanas Partner)
- **Como obter credenciais**: Americanas Partner Portal > Configurações > Integração SkyHub > Credenciais API
- **APIs disponíveis**: produtos, estoque, preços, pedidos (via SkyHub como middleware)
- **Webhooks**: não confirmado publicamente
- **Rate Limits**: não publicados
- **Sandbox**: Não
- **SDK Node.js**: Nenhum

**Limitações importantes**:
- Cada conta SkyHub serve apenas uma plataforma de integração
- Para contato com a equipe de credenciamento: `[email protected]`
- Categorização obrigatória antes de criar produto (desde Mar/2025)

**Complexidade de onboarding**: Médio (requer aprovação como seller + ativação do SkyHub)

**Prioridade**: P3 — market share significativo, mas integração mais trabalhosa sem OAuth2

---

## Recomendação de Prioridade

### Critérios de avaliação
- ROI: volume de vendas no Brasil + facilidade de adoção pelos vendedores
- Complexidade técnica: horas de implementação estimadas
- Time to market: velocidade para entregar valor

### Matriz de priorização

| Sprint | Marketplace | Justificativa | Complexidade Técnica |
|---|---|---|---|
| Sprint 1 | Mercado Livre | Marketplace dominante no Brasil (~50% share), OAuth2 puro, excelente documentação, enorme base de sellers | 2-3 dias |
| Sprint 2 | TikTok Shop | Lançamento explosivo Brasil 2025, crescimento acelerado, OAuth2 limpo, SDK oficial | 2-3 dias |
| Sprint 2 | Magalu | Forte presença no varejo brasileiro, OAuth2 simples, boa documentação | 2-3 dias |
| Sprint 2 | Shopee | Grande base de sellers, OAuth2 com HMAC (adiciona complexidade), sandbox disponível | 3-4 dias |
| Sprint 3 | Amazon SP-API | Mercado premium, mas onboarding complexo (IAM, aprovação de roles), menor share no Brasil | 4-5 dias |
| Sprint 3 | Facebook/Instagram | Vitrine apenas (sem pedidos), útil para descoberta de produtos, impacto reduzido pós-depreciação checkout | 2-3 dias |
| Sprint 3 | Americanas (SkyHub) | Market share relevante, mas modelo API Key sem OAuth é menos elegante para o UX do hub | 3-4 dias |
| Sprint 4 | Shein | Crescimento forte no Brasil, mas onboarding burocrático e documentação restrita | 3-5 dias |

---

## Decisões de Arquitetura para o Agente D

### D1 — Estrutura de módulo Medusa

```
src/modules/marketplace/
  services/
    marketplace-connection.service.ts   — gerencia conexões OAuth
    meli.service.ts
    shopee.service.ts
    tiktok.service.ts
    magalu.service.ts
    amazon.service.ts
    meta.service.ts
    shein.service.ts
  utils/
    oauth.utils.ts                      — helpers de OAuth2 comuns
    shopee-hmac.utils.ts               — assinatura HMAC-SHA256 (Shopee)
    token-store.ts                     — abstração de armazenamento de tokens
  models/
    marketplace-connection.ts          — entidade de conexão
  jobs/
    token-refresh.job.ts               — renovação periódica de tokens
```

### D2 — Padrão de rotas OAuth

Todas as plataformas seguem o mesmo padrão de URL:
```
GET  /api/store/marketplace/{platform}/oauth/start
GET  /api/store/marketplace/{platform}/oauth/callback
POST /api/store/marketplace/{platform}/webhook
GET  /api/store/marketplace/{platform}/status
DELETE /api/store/marketplace/{platform}/disconnect
```

Onde `{platform}` = `meli` | `shopee` | `tiktok` | `amazon` | `meta` | `shein` | `magalu` | `americanas`

### D3 — Modelo de dados para conexões

```typescript
interface MarketplaceConnection {
  id: string;
  store_id: string;              // loja do nosso e-commerce
  platform: MarketplacePlatform; // enum
  status: 'active' | 'expired' | 'revoked' | 'pending';

  // Tokens OAuth
  access_token: string;          // criptografado em repouso
  refresh_token: string;         // criptografado em repouso
  token_expires_at: Date;

  // Identificadores do vendedor na plataforma
  external_seller_id: string;    // user_id (MELI), shop_id (Shopee), open_id (TikTok), selling_partner_id (Amazon)
  external_seller_name: string;

  // Metadados
  scopes: string[];
  connected_at: Date;
  last_sync_at: Date;
  metadata: Record<string, unknown>; // dados extras por plataforma
}
```

### D4 — Gerenciamento de tokens

- **Tokens em repouso**: criptografar com AES-256 usando chave derivada de variável de ambiente
- **Renovação proativa**: renovar `access_token` quando restar < 20% do tempo de validade
  - MELI: renovar após 5h (expira em 6h)
  - Shopee: renovar após 3h30 (expira em 4h)
  - TikTok: renovar após 20h (expira em 24h)
  - Amazon: renovar após 50min (expira em 1h)
  - Meta: renovar após 50 dias (expira em 60 dias)
- **Alerta de refresh_token**: notificar vendedor quando refresh_token estiver a 7 dias de expirar (Shopee: 30d, TikTok: 30d)
- **Fallback**: se renovação falhar, marcar conexão como `expired` e notificar vendedor para reautorizar

### D5 — Proteção de webhooks

Cada plataforma tem seu método de validação:

| Plataforma | Método de validação |
|---|---|
| MELI | Header `x-signature` — HMAC-SHA256 com client_secret |
| Shopee | Header `Authorization` com assinatura HMAC |
| TikTok | Header `x-tiktok-signature` |
| Amazon | Mensagem SQS com assinatura SNS (verificar via AWS SDK) |
| Meta | Header `x-hub-signature-256` — HMAC-SHA256 com app_secret |

**Regra**: **nunca processar webhook sem validar assinatura**. Rejeitar com `HTTP 401` se inválido.

### D6 — CSRF em fluxos OAuth

Todos os flows OAuth devem:
1. Gerar `state` como UUID v4 + timestamp (ex: `{uuid}:{timestamp}`)
2. Armazenar temporariamente em cache/Redis com TTL de 10 minutos
3. Validar `state` no callback antes de qualquer ação
4. Rejeitar com `HTTP 400` se `state` inválido ou expirado

### D7 — Interface comum de serviços

Cada serviço de marketplace deve implementar a mesma interface:

```typescript
interface IMarketplaceService {
  // Catálogo
  syncProduct(connection: MarketplaceConnection, product: MedusaProduct): Promise<SyncResult>
  updateInventory(connection: MarketplaceConnection, variantId: string, quantity: number): Promise<void>
  updatePrice(connection: MarketplaceConnection, variantId: string, price: number): Promise<void>

  // Pedidos
  getOrders(connection: MarketplaceConnection, since: Date): Promise<ExternalOrder[]>
  importOrder(connection: MarketplaceConnection, externalOrderId: string): Promise<MedusaOrder>

  // Webhooks
  handleWebhook(payload: unknown, headers: Record<string, string>): Promise<WebhookEvent>
}
```

### D8 — Variáveis de ambiente necessárias

```env
# Mercado Livre
MELI_APP_ID=
MELI_CLIENT_SECRET=
MELI_REDIRECT_URI=

# Shopee
SHOPEE_PARTNER_ID=
SHOPEE_PARTNER_KEY=
SHOPEE_REDIRECT_URL=

# TikTok Shop
TIKTOK_APP_KEY=
TIKTOK_APP_SECRET=
TIKTOK_REDIRECT_URL=

# Amazon SP-API
AMAZON_LWA_CLIENT_ID=
AMAZON_LWA_CLIENT_SECRET=
AMAZON_REDIRECT_URI=
AWS_ROLE_ARN=
AWS_SQS_QUEUE_URL=

# Meta (Facebook/Instagram)
META_APP_ID=
META_APP_SECRET=
META_REDIRECT_URI=
META_WEBHOOK_VERIFY_TOKEN=

# Shein
# (credenciais são por-seller, não globais)

# Magalu
MAGALU_CLIENT_ID=
MAGALU_CLIENT_SECRET=
MAGALU_REDIRECT_URI=

# Encryption
MARKETPLACE_TOKEN_ENCRYPTION_KEY=  # AES-256, 32 bytes
```

### D9 — Tratamento de erros e resiliência

- Todas as chamadas de API externas devem ter **timeout configurável** (padrão: 10s)
- Implementar **retry com exponential backoff** para erros 5xx e 429
- Erros de autenticação (401) devem disparar renovação automática de token antes de retry
- Falhas persistentes devem ser logadas e a conexão marcada como degradada
- **Dead Letter Queue** para webhooks que falham após 3 tentativas

### D10 — Mapeamento de dados

Criar camada de mapeamento (`mappers/`) que converte entre o modelo interno (Medusa) e o modelo de cada marketplace:

```typescript
// Exemplo: produto Medusa → formato MELI
function toMELIListing(product: MedusaProduct, categoryId: string): MELIItem { ... }

// Exemplo: pedido MELI → pedido Medusa
function fromMELIOrder(order: MELIOrder): CreateOrderInput { ... }
```

---

## Referências

- [MELI Authentication & Authorization](https://developers.mercadolivre.com.br/en_us/authentication-and-authorization)
- [MELI API Docs BR](https://developers.mercadolivre.com.br/pt_br/api-docs-pt-br)
- [Shopee Open Platform](https://open.shopee.com)
- [Shopee API Guide - Rollout](https://rollout.com/integration-guides/shopee/api-essentials)
- [Amazon SP-API Authorization](https://developer-docs.amazon.com/sp-api/docs/authorizing-selling-partner-api-applications)
- [Amazon SP-API Roles](https://developer-docs.amazon.com/sp-api/docs/roles-in-the-selling-partner-api)
- [Amazon SP-API Rate Limits](https://developer-docs.amazon.com/sp-api/docs/usage-plans-and-rate-limits)
- [Amazon SP-API Sandbox](https://developer-docs.amazon.com/sp-api/docs/sp-api-sandbox)
- [TikTok Shop Partner Center](https://partner.tiktokshop.com)
- [TikTok Shop BR Market](https://partner.tiktokshop.com/docv2/page/67ca5b6c49162f049f2d1fa6)
- [TikTok Shop Node.js SDK](https://partner.tiktokshop.com/docv2/page/integrate-node-js-sdk)
- [Meta Commerce Platform](https://developers.facebook.com/docs/commerce-platform/)
- [Meta Catalog API](https://developers.facebook.com/docs/marketing-api/catalog/)
- [Meta Business SDK (Node.js)](https://github.com/facebook/facebook-nodejs-business-sdk)
- [Meta Checkout Deprecation 2025](https://feedonomics.com/blog/meta-removing-native-checkout/)
- [SHEIN Developer Platform](https://open.sheincorp.com)
- [Magalu Devs](https://developers.magalu.com)
- [SkyHub / Americanas API](https://desenvolvedores.skyhub.com.br)
- [TikTok Shop Brasil Lançamento](https://newsroom.tiktok.com/pt-br/tiktok-shop-chega-ao-brasil)

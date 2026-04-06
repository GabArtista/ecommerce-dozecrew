# Spec: Agente C — Marketplace Research (Técnico)

**Onda**: 1 (paralelo com A e B)
**Tipo de agente**: `general-purpose`
**Não toca código** — apenas pesquisa e documenta

---

## Missão

Pesquisar profundamente as APIs e fluxos de integração de cada marketplace-alvo, determinar se é possível fazer conexão OAuth2 simplificada ("clique para conectar") ou se exige credenciais manuais, e produzir um relatório técnico que o Agente D usará para implementar o backend.

---

## Marketplaces a Pesquisar

### 1. Mercado Livre (MELI)

**Perguntas a responder:**
- URL do OAuth2 authorization endpoint
- Quais escopos são necessários para produtos, estoque e pedidos
- Como renovar o access_token (refresh token flow)
- Rate limits da API
- Webhooks disponíveis para novos pedidos
- API para criar/atualizar produtos (title, description, price, stock, images, variations)
- API para atualizar estoque (quantity)
- API para sincronizar pedidos recebidos no ML
- Sandbox disponível?
- Existe SDK oficial Node.js?
- Como o vendedor cria o app no ML Developer? (URL, passos)
- Classificação de conexão: `OAuth2-simples` ✅

### 2. Shopee

**Perguntas a responder:**
- Fluxo de autenticação: OAuth2 ou Partner ID + Key?
- Se OAuth2: URL do authorization endpoint
- Se Partner Key: onde o vendedor encontra essas credenciais?
- API para produtos, estoque, pedidos
- Webhooks disponíveis
- Rate limits
- Sandbox disponível?
- SDK Node.js oficial?
- Complexidade de onboarding para vendedor sem conhecimento técnico
- Classificação: `OAuth2-simples` ✅ ou `credencial-wizard` ⚠️

### 3. Amazon (Selling Partner API — SP-API)

**Perguntas a responder:**
- Fluxo LWA (Login with Amazon) OAuth2 — URL de autorização
- Quais roles/permissões são necessários para o app
- Como o vendedor autoriza via Seller Central
- API de produtos (Listings), Catalog, Inventory, Orders
- Webhooks (Notifications API)
- Rate limits e throttling
- Sandbox disponível?
- Complexidade de setup no Seller Central
- Classificação: `OAuth2-simples` ✅ ou mais complexo?

### 4. TikTok Shop

**Perguntas a responder:**
- Disponibilidade no Brasil (TikTok Shop está disponível no BR?)
- Fluxo OAuth2 para parceiros
- API de produtos, estoque, pedidos
- Webhooks
- Como vendedor cadastra app no TikTok for Business
- SDK Node.js
- Classificação e viabilidade no contexto brasileiro

### 5. Facebook / Instagram Shop

**Perguntas a responder:**
- Meta Commerce Manager API — endpoints para produtos (Catalog API)
- Fluxo OAuth2 via Meta Login
- Quais permissões do Facebook App são necessárias
- Como sincronizar catálogo com Facebook/Instagram Shop
- Webhooks para pedidos (se houver — Meta Shop usa checkout externo)
- SDK Node.js (Meta Business SDK)
- Classificação: `OAuth2-simples` ✅

### 6. Shein

**Perguntas a responder:**
- Existe API pública para sellers?
- Como é o processo de venda na Shein (consignment? dropship?)
- É viável integração via API ou apenas manual?
- Classificação: `inviável-api` ❌ ou `outro-modelo`?

### 7. Outras plataformas bônus (se tempo permitir)

- **Shopee Brasil** (já cobre no 2 mas verificar especificidades BR)
- **Magalu / Magazine Luiza** — API disponível?
- **Americanas** — API disponível?
- **Via Varejo (Casas Bahia)** — API disponível?

---

## Entregável

Criar `docs/decisions/marketplace-research.md`:

```markdown
# Marketplace Research — Decisões Técnicas

## Sumário Executivo
[Tabela com: Plataforma | Tipo de Conexão | Viabilidade | SDK | Prioridade]

## Mercado Livre
### Tipo de conexão: OAuth2-simples / credencial-wizard / inviável
### Como conectar (passos técnicos)
### APIs disponíveis
### Webhooks
### Rate limits
### Sandbox
### Implementação recomendada

## Shopee
[mesma estrutura]

## Amazon
[mesma estrutura]

## TikTok Shop
[mesma estrutura]

## Facebook / Instagram
[mesma estrutura]

## Shein
[mesma estrutura]

## Recomendação de Prioridade
[Quais implementar primeiro, por ROI e complexidade]

## Decisões de Arquitetura para o Agente D
[Lista de decisões técnicas que o backend deve seguir]
```

---

## Critério de Pronto

- Todos os 6 marketplaces pesquisados
- Tipo de conexão definido para cada um
- APIs de produtos/estoque/pedidos mapeadas
- Webhooks mapeados
- Passos de onboarding do vendedor descritos
- Recomendação de prioridade de implementação
- Decisões de arquitetura documentadas para o Agente D

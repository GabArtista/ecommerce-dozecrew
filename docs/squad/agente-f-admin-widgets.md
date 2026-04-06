# Spec: Agente F — Admin Custom Widgets

**Onda**: 2 (paralelo com D e E)
**Tipo de agente**: `general-purpose`
**Depende de**: Onda 1 completa

---

## Missão

Implementar extensões customizadas no Medusa Admin usando o Admin Extension SDK.

---

## Contexto

O Medusa Admin é extensível via `src/admin/`. Os widgets são injetados em páginas existentes do admin. As custom routes criam novas páginas no admin.

**Documentação**: https://docs.medusajs.com/admin-components

---

## Widgets a Implementar

### 1. Widget de KPIs no Dashboard

**Arquivo**: `backend/src/admin/widgets/dashboard-kpis.tsx`
**Injetar em**: Dashboard (zona `dashboard.before`)

Exibir:
- Receita hoje (em BRL)
- Receita este mês
- Número de pedidos hoje
- Pedidos aguardando fulfillment
- Ticket médio do mês
- Taxa de conversão (pedidos / sessões — se disponível)

Buscar dados via rotas admin do Medusa:
- `GET /admin/orders?created_at[gte]={hoje}`
- `GET /admin/orders?created_at[gte]={inicio-mes}`

Layout: grid 3x2 de cards com número grande e label.

### 2. Widget de Status Asaas em Pedido

**Arquivo**: `backend/src/admin/widgets/order-asaas-status.tsx`
**Injetar em**: Página de detalhe do pedido (zona `order.details.before`)

Exibir:
- Método de pagamento (PIX / Boleto / Cartão)
- Status do pagamento no Asaas (PENDING / RECEIVED / OVERDUE / etc.)
- Valor cobrado
- Data de vencimento (Boleto)
- Link direto para a cobrança no dashboard Asaas
- Botão "Iniciar Reembolso" (se pagamento confirmado)

Buscar via rota custom: `GET /admin/asaas/payment?order_id={id}`

### 3. Widget de Conexões de Marketplace em Pedido

**Arquivo**: `backend/src/admin/widgets/order-marketplace-origin.tsx`
**Injetar em**: Página de detalhe do pedido (zona `order.details.after`)

Se o pedido veio de um marketplace:
- Badge com logo/nome da plataforma (ML, Shopee, etc.)
- ID do pedido na plataforma origem
- Link para o pedido na plataforma

### 4. Widget de Status de Marketplace no Dashboard

**Arquivo**: `backend/src/admin/widgets/dashboard-marketplace.tsx`
**Injetar em**: Dashboard (zona `dashboard.after`)

Lista resumida das conexões ativas:
- Plataforma | Status | Última sync | Pedidos hoje | Erros

### 5. Rota de Reembolso Asaas

**Arquivo**: `backend/src/api/admin/asaas/`

```
GET  /admin/asaas/payment?order_id=  # Detalhes do pagamento Asaas
POST /admin/asaas/refund             # Iniciar reembolso
```

---

## Estrutura de Arquivos

```
backend/src/admin/
├── widgets/
│   ├── dashboard-kpis.tsx
│   ├── dashboard-marketplace.tsx
│   ├── order-asaas-status.tsx
│   └── order-marketplace-origin.tsx
└── routes/
    └── (gerenciado pelo Agente G)
```

---

## Padrões de Widget

Cada widget segue o padrão do Medusa Admin SDK:

```typescript
import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Container, Heading } from "@medusajs/ui"

const MyWidget = ({ data }) => {
  return (
    <Container>
      <Heading level="h2">Título</Heading>
      {/* conteúdo */}
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "order.details.before",
})

export default MyWidget
```

**Usar componentes `@medusajs/ui`** para consistência com o admin.

---

## Entregáveis

- [ ] `backend/src/admin/widgets/dashboard-kpis.tsx`
- [ ] `backend/src/admin/widgets/dashboard-marketplace.tsx`
- [ ] `backend/src/admin/widgets/order-asaas-status.tsx`
- [ ] `backend/src/admin/widgets/order-marketplace-origin.tsx`
- [ ] `backend/src/api/admin/asaas/route.ts`

---

## Critério de Pronto

- Admin inicia sem erros com os widgets
- Widgets visíveis nas zonas corretas do admin
- KPIs exibem dados reais de pedidos
- Widget Asaas exibe status do pagamento no pedido
- Botão de reembolso funcional (chama Asaas API)

# Spec: Agente E — Email & Notificações

**Onda**: 2 (paralelo com D e F)
**Tipo de agente**: `general-purpose`
**Depende de**: Onda 1 completa (backend funcionando)

---

## Missão

Configurar emails transacionais no backend Medusa usando Resend como provider.

---

## Provider: Resend

**Por que Resend:**
- Free tier: 3.000 emails/mês, 100/dia
- Setup em minutos (apenas API key)
- SDK TypeScript oficial
- Suporte nativo a HTML/React templates
- `@medusajs/notification-resend` existe como plugin oficial

**Nota**: O lojista precisará criar conta em resend.com e pegar a API key.

---

## Tarefas

### 1. Instalar Dependências

```bash
cd backend
npm install @medusajs/notification-resend resend
```

### 2. Configurar `medusa-config.ts`

Adicionar o módulo de notificação:
```typescript
modules: [
  {
    resolve: "@medusajs/notification-resend",
    options: {
      channels: ["email"],
      api_key: process.env.RESEND_API_KEY,
      from: process.env.RESEND_FROM_EMAIL || "noreply@dozecrew.com",
    },
  },
]
```

### 3. Criar Templates de Email

**Diretório**: `backend/src/subscribers/templates/`

Templates a criar (HTML com inline CSS — sem dependência de React):

**a) `order-placed.html`** — Confirmação de pedido
- Saudação com nome do cliente
- Número do pedido
- Lista de produtos (nome, qty, preço)
- Subtotal, frete, total
- Endereço de entrega
- Método de pagamento
- Link para acompanhar pedido

**b) `payment-confirmed.html`** — Pagamento confirmado (PIX/Boleto pago)
- Número do pedido
- Valor pago
- Data/hora do pagamento
- Próximo passo (envio em breve)

**c) `order-shipped.html`** — Pedido enviado
- Número do pedido
- Código de rastreio (se disponível)
- Link de rastreio
- Previsão de entrega

**d) `order-cancelled.html`** — Pedido cancelado
- Número do pedido
- Motivo do cancelamento
- Info de reembolso se aplicável

**e) `refund-processed.html`** — Reembolso processado
- Número do pedido
- Valor reembolsado
- Prazo estimado (PIX: instantâneo, Boleto/Cartão: 5-10 dias)

**f) `password-reset.html`** — Recuperação de senha
- Link de reset (válido por 1 hora)
- Instrução de segurança

### 4. Criar Subscribers

**Diretório**: `backend/src/subscribers/`

**a) `order-placed.subscriber.ts`**
- Evento: `order.placed`
- Envia: `order-placed.html` para customer email

**b) `payment-confirmed.subscriber.ts`**
- Evento: `payment.captured` ou webhook Asaas "PAYMENT_RECEIVED"
- Envia: `payment-confirmed.html`

**c) `order-shipped.subscriber.ts`**
- Evento: `order.shipment_created`
- Envia: `order-shipped.html`

**d) `order-cancelled.subscriber.ts`**
- Evento: `order.cancelled`
- Envia: `order-cancelled.html`

**e) `refund-processed.subscriber.ts`**
- Evento: `refund.created`
- Envia: `refund-processed.html`

### 5. Variáveis de Ambiente

Adicionar ao `.env`:
```
RESEND_API_KEY=re_xxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@sualoja.com.br
STORE_URL=https://shop.dozecrew.com
```

### 6. Atualizar Webhook Asaas

Modificar `backend/src/api/store/webhooks/asaas/route.ts`:
- Ao receber `PAYMENT_RECEIVED`: disparar evento que o subscriber de payment-confirmed escuta

---

## Entregáveis

- [ ] `backend/package.json` — dependências instaladas
- [ ] `backend/medusa-config.ts` — módulo Resend configurado
- [ ] `backend/src/subscribers/templates/*.html` — 6 templates
- [ ] `backend/src/subscribers/order-placed.subscriber.ts`
- [ ] `backend/src/subscribers/payment-confirmed.subscriber.ts`
- [ ] `backend/src/subscribers/order-shipped.subscriber.ts`
- [ ] `backend/src/subscribers/order-cancelled.subscriber.ts`
- [ ] `backend/src/subscribers/refund-processed.subscriber.ts`
- [ ] `backend/.env.example` — variáveis documentadas

---

## Critério de Pronto

- Medusa inicia sem erros com o módulo Resend
- Subscribers registrados e visíveis nos logs
- Templates HTML válidos e responsivos
- Webhook Asaas dispara evento de pagamento confirmado
- `.env.example` atualizado com novas variáveis

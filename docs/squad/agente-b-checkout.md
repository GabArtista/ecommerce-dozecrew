# Spec: Agente B — Checkout Frontend

**Onda**: 1 (paralelo com A e C)
**Tipo de agente**: `general-purpose`
**Depende de**: UX-D ter entregado `docs/ux/ux-spec.md`

---

## Missão

Implementar o fluxo de checkout completo no frontend, integrando com o endpoint Asaas já existente no backend (`POST /store/checkout`).

---

## Contexto crítico

O botão "Proceed to Checkout" no `CartModal` chama `redirectToCheckout()` que atualmente redireciona para `${BACKEND_URL}/checkout/${cart_id}` — rota que não existe. Precisa redirecionar para `/checkout` (frontend).

**Arquivo a corrigir primeiro**: `frontend/lib/medusa/index.ts` — função `mapCart()`:
```typescript
// ANTES (quebrado):
checkoutUrl: `${BACKEND_URL}/checkout/${c.id}`,

// DEPOIS (correto):
checkoutUrl: `/checkout`,
```

---

## Tarefas

### 1. Corrigir checkoutUrl

Arquivo: `frontend/lib/medusa/index.ts`
Linha ~156: mudar `checkoutUrl` para `/checkout`

### 2. Criar página de Checkout

**Rota**: `frontend/app/checkout/page.tsx`
**Layout**: `frontend/app/checkout/layout.tsx` (navbar simplificada, sem carrinho)

O checkout deve ser **single-page com sections** (não multi-step com navegação separada), seguindo `docs/ux/ux-spec.md`.

**Sections em ordem:**
1. Resumo do pedido (colapsável em mobile, sticky em desktop)
2. Endereço de entrega
3. Seleção de frete
4. Seleção de pagamento + dados do pagamento
5. Botão finalizar pedido

### 3. Formulário de Endereço

**Arquivo**: `frontend/components/checkout/address-form.tsx`

Campos:
- Nome completo
- Email
- CPF/CNPJ
- Telefone
- CEP (com auto-fill via `https://viacep.com.br/ws/{cep}/json/`)
- Logradouro, Número, Complemento, Bairro, Cidade, Estado

Validação com Zod + React Hook Form.

### 4. Seleção de Frete

**Arquivo**: `frontend/components/checkout/shipping-options.tsx`

- Buscar `GET /store/shipping-options?cart_id={cartId}`
- Exibir radio cards com nome, prazo e preço
- Ao selecionar: `POST /store/carts/{cartId}/shipping-methods`

### 5. Seleção e Dados de Pagamento

**Arquivo**: `frontend/components/checkout/payment-selector.tsx`

Tabs: PIX | Boleto | Cartão de Crédito

**PIX**: sem dados adicionais, apenas confirmar
**Boleto**: sem dados adicionais, informar prazo de 1-3 dias
**Cartão**: campos de número, nome, validade, CVV

### 6. Finalizar Pedido

**Arquivo**: `frontend/components/checkout/submit-order.tsx`

Ao submeter:
1. `POST /store/carts/{cartId}/complete` — finalizar carrinho → order
2. `POST /store/checkout` com `cart_id`, `billing_type`, dados do cliente
3. Redirecionar para `/checkout/confirmacao/{orderId}?payment={paymentType}`

### 7. Página de Confirmação

**Rota**: `frontend/app/checkout/confirmacao/[orderId]/page.tsx`

**Para PIX:**
- Exibir QR Code (imagem base64 da resposta Asaas)
- Exibir código Pix copiável (botão "Copiar")
- Countdown timer com vencimento (30 minutos padrão)
- Polling a cada 5s via `GET /store/checkout/status?cart_id={id}` ou order status
- Quando pago: mostrar confirmação com confetti/animação
- Fallback: link para tentar novamente

**Para Boleto:**
- Exibir linha digitável copiável
- Link para download do PDF
- Informar prazo de vencimento
- Polling mais espaçado (a cada 30s, boleto demora horas)

**Para Cartão:**
- Status imediato (aprovado ou recusado)
- Se aprovado: tela de sucesso
- Se recusado: mensagem clara + botão tentar outro método

### 8. Rota de Status de Pagamento (Backend simples)

Criar `backend/src/api/store/checkout/status/route.ts`:
- `GET /store/checkout/status?order_id={id}`
- Retorna: `{ status: 'pending' | 'paid' | 'failed', payment_method: string }`

---

## Entregáveis

- [ ] `frontend/lib/medusa/index.ts` — checkoutUrl corrigido
- [ ] `frontend/app/checkout/page.tsx` + `layout.tsx`
- [ ] `frontend/app/checkout/confirmacao/[orderId]/page.tsx`
- [ ] `frontend/components/checkout/address-form.tsx`
- [ ] `frontend/components/checkout/shipping-options.tsx`
- [ ] `frontend/components/checkout/payment-selector.tsx`
- [ ] `frontend/components/checkout/submit-order.tsx`
- [ ] `frontend/components/checkout/pix-display.tsx`
- [ ] `frontend/components/checkout/boleto-display.tsx`
- [ ] `backend/src/api/store/checkout/status/route.ts`

---

## Critério de Pronto

- Botão "Proceed to Checkout" redireciona para `/checkout`
- Formulário de endereço com auto-fill por CEP funcionando
- Frete listado e selecionável
- PIX: QR code exibido, código copiável, countdown, polling
- Boleto: linha digitável copiável, link PDF
- Cartão: feedback imediato de aprovação/recusa
- Página de confirmação clara para cada método
- Tudo seguindo `docs/ux/ux-spec.md`
- Mobile-first + dark mode

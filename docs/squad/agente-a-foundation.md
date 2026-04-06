# Spec: Agente A — Foundation

**Onda**: 1 (paralelo com B e C)
**Tipo de agente**: `general-purpose`
**Depende de**: UX-D ter entregado `docs/ux/ux-spec.md`

---

## Missão

Corrigir os problemas de fundação do sistema e implementar autenticação de clientes.

---

## Tarefas

### 1. Corrigir Região BRL (Backend)

**Problema**: O seed cria regiões EUR/USD mas o Asaas só opera em BRL.

**Arquivo**: `backend/src/scripts/seed.ts`

Modificar:
- Trocar moeda padrão de EUR → BRL
- Criar região Brasil com estados brasileiros
- Ajustar preços dos produtos para BRL (exemplo: R$ 89,90)
- Remover região EUR (ou manter como secundária)
- Garantir que `currency_code: "brl"` seja o padrão

### 2. Garantir region_id no carrinho (Frontend)

**Problema**: `createCart()` em `lib/medusa/index.ts` cria carrinho sem `region_id`.

**Arquivo**: `frontend/lib/medusa/index.ts`

Modificar `createCart()` para:
1. Buscar a região BRL via `GET /store/regions`
2. Criar o carrinho com `region_id` da região BRL

### 3. Tornar menu dinâmico (Frontend)

**Problema**: Menu hardcoded com categoria "stickers" que não existe.

**Arquivo**: `frontend/lib/medusa/index.ts` — função `getMenu()`

Modificar para buscar categorias reais do Medusa e montar o menu dinamicamente.

### 4. Implementar autenticação de clientes (Frontend)

Criar as seguintes rotas e componentes seguindo `docs/ux/ux-spec.md`:

**Rotas a criar:**
- `frontend/app/account/login/page.tsx`
- `frontend/app/account/register/page.tsx`
- `frontend/app/account/forgot-password/page.tsx`
- `frontend/app/account/layout.tsx` (layout compartilhado)
- `frontend/app/account/page.tsx` (dashboard)
- `frontend/app/account/orders/page.tsx`
- `frontend/app/account/orders/[id]/page.tsx`

**API Medusa a usar:**
- `POST /auth/customer/emailpass` — login
- `POST /auth/customer/emailpass/register` — cadastro
- `GET /store/customers/me` — dados do cliente
- `GET /store/orders` — histórico de pedidos

**Componentes a criar:**
- `frontend/components/account/login-form.tsx`
- `frontend/components/account/register-form.tsx`
- `frontend/components/account/order-list.tsx`
- `frontend/components/account/order-detail.tsx`

**Lib a criar:**
- `frontend/lib/medusa/auth.ts` — funções de auth (login, register, logout, getCustomer)

**Server actions a criar:**
- `frontend/components/account/actions.ts`

### 5. Corrigir páginas estáticas (Frontend)

**Problema**: `/about`, `/terms`, `/privacy` retornam corpo vazio.

**Arquivo**: `frontend/lib/medusa/index.ts` — função `getPage()`

Criar conteúdo estático para as páginas principais:
- About: descrição da loja
- Terms: termos de uso básicos
- Privacy: política de privacidade básica

---

## Entregáveis

- [ ] `backend/src/scripts/seed.ts` — região BRL + preços em Real
- [ ] `frontend/lib/medusa/index.ts` — createCart com region_id + menu dinâmico + páginas estáticas
- [ ] `frontend/lib/medusa/auth.ts` — funções de autenticação
- [ ] `frontend/app/account/` — rotas de auth e área do cliente
- [ ] `frontend/components/account/` — componentes de auth

---

## Critério de Pronto

- Seed roda sem erros e cria região BRL
- Carrinho criado com currency BRL
- Menu busca categorias reais do banco
- Login/cadastro funcionam com Medusa Auth
- Área do cliente exibe pedidos reais
- Todas as páginas seguem `docs/ux/ux-spec.md`

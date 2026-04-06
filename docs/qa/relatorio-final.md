# Relatório Final QA — E-commerce
**Data**: 2026-03-30
**Agente**: QA (Onda 4)
**Modo de execução**: Análise estática (sem servidor rodando)

---

## 1. Arquivos de Teste Criados

| Arquivo | Descrição |
|---|---|
| `frontend/tests/e2e/storefront.spec.ts` | Fluxos gerais da loja (homepage, produto, busca, carrinho, mobile) |
| `frontend/tests/e2e/checkout.spec.ts` | Fluxo de checkout (redirect, sem cart, formulário CEP, confirmação, exposição de URL) |
| `frontend/tests/e2e/account.spec.ts` | Autenticação (login, cadastro, erro de login, proteção de rota, links) |
| `frontend/tests/e2e/regression.spec.ts` | Regressão (homepage, robots.txt, sitemap, health check, páginas estáticas, 404) |

**Total de arquivos novos**: 4
**Arquivos preexistentes preservados**: 3 (`home.spec.ts`, `cart.spec.ts`, `backend-health.spec.ts`)

---

## 2. Total de Test Cases

| Arquivo | Quantidade de testes |
|---|---|
| `storefront.spec.ts` | 5 |
| `checkout.spec.ts` | 5 |
| `account.spec.ts` | 7 |
| `regression.spec.ts` | 10 |
| `home.spec.ts` (preexistente) | 4 |
| `cart.spec.ts` (preexistente) | 4 |
| `backend-health.spec.ts` (preexistente) | 2 |

**Total geral**: 37 test cases

---

## 3. Bugs Encontrados (Análise Estática)

| ID | Título resumido | Severidade | Prioridade | Arquivo |
|---|---|---|---|---|
| BUG-001 | `revalidateTag` com argumento inválido `"seconds"` | Alto | P1 | `lib/medusa/index.ts` |
| BUG-002 | `updateCart` verifica método HTTP para line-item | Alto | P1 | `lib/medusa/index.ts:244` |
| BUG-003 | Dados de cartão em campos hidden do DOM (PCI-DSS) | **Crítico** | P0 | `app/checkout/page.tsx` |
| BUG-004 | Cookie `paymentData` não-httpOnly expõe dados de PIX/boleto | Alto | P1 | `components/checkout/actions.ts` |
| BUG-005 | AddressForm silencia erro ao salvar endereço no backend | Médio | P2 | `components/checkout/address-form.tsx` |
| BUG-006 | Cartão recusado exibe "aprovado" quando `cardStatus` é undefined | Alto | P1 | `app/checkout/confirmacao/[orderId]/page.tsx` |
| BUG-007 | Rotas `/account/*` sem proteção via middleware | Médio | P2 | `app/account/layout.tsx` |
| BUG-008 | MarketplaceService persiste dados em `/tmp` (volátil) | Médio | P2 | `backend/src/modules/marketplace/service.ts` |
| BUG-009 | `CSRF_STORE` em memória não funciona com múltiplos workers | Alto | P1 | `backend/src/modules/marketplace/service.ts` |
| BUG-010 | Endpoints `/store/checkout` e `/store/checkout/status` customizados podem não existir | Alto | P1 | `components/checkout/actions.ts` |
| BUG-011 | Diretiva `"use cache: private"` com sintaxe inválida no Next.js | Alto | P1 | `lib/medusa/index.ts:256` |
| BUG-012 | Frete auto-selecionado sem interação do usuário | Baixo | P3 | `components/checkout/shipping-options.tsx` |
| BUG-013 | Validação de telefone com mínimo de 10 dígitos inconsistente | Baixo | P3 | `components/checkout/address-form.tsx` |

### Resumo por severidade

| Severidade | Quantidade |
|---|---|
| Crítico | 1 |
| Alto | 7 |
| Médio | 3 |
| Baixo | 2 |
| **Total** | **13** |

---

## 4. Ações Manuais Necessárias Antes de Rodar os Testes

Para executar os testes E2E com sucesso, os seguintes pré-requisitos devem ser atendidos:

### Obrigatórios
1. **Backend Medusa rodando** em `http://localhost:9000`
   ```bash
   cd backend && npm run dev
   ```

2. **Frontend Next.js rodando** em `http://localhost:3000` (o Playwright iniciará automaticamente via `webServer` config, mas requer build funcional)
   ```bash
   cd frontend && npm run dev
   ```

3. **Variáveis de ambiente configuradas** no frontend (`.env.local`):
   ```
   MEDUSA_BACKEND_URL=http://localhost:9000
   MEDUSA_PUBLISHABLE_KEY=<sua-chave>
   NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000
   NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=<sua-chave>
   ```

4. **Seed do banco de dados executado** com ao menos:
   - 1 produto com handle `t-shirt` (usado no teste `produto com handle valido carrega`)
   - 1 região BRL configurada
   - Publishable API key ativa

5. **Instalar dependências do Playwright** (se não instaladas):
   ```bash
   cd frontend && npx playwright install --with-deps chromium
   ```

### Opcionais (para testes completos de checkout)
6. Endpoints customizados `POST /store/checkout` e `GET /store/checkout/status` implementados no backend (BUG-010).
7. Integração Asaas configurada (chave de API em `.env`).

---

## 5. Como Executar os Testes

```bash
# Rodar todos os testes E2E
cd frontend && npx playwright test

# Rodar arquivo específico
npx playwright test tests/e2e/storefront.spec.ts

# Rodar com UI interativa
npx playwright test --ui

# Relatório HTML
npx playwright show-report
```

---

## 6. Status Geral

**Status**: BLOQUEADO PARCIALMENTE

### Testes que devem passar sem bloquear (servidor dev rodando + seed básico):
- `home.spec.ts` — todos
- `cart.spec.ts` — todos
- `backend-health.spec.ts` — todos
- `storefront.spec.ts` — homepage, busca, mobile
- `account.spec.ts` — login, cadastro, erro de login
- `regression.spec.ts` — homepage, about, terms, privacy, 404

### Testes bloqueados por dependências não confirmadas:
- `checkout.spec.ts` — checkout completo (BUG-010: endpoints customizados)
- `regression.spec.ts` — `robots.txt`, `sitemap.xml` (depende de implementação)
- `storefront.spec.ts` — "carrinho abre" (depende do seletor `aria-label="Open cart"` existir)

### Bloqueadores críticos a resolver antes de produção:
- **BUG-003 (P0)**: Dados de cartão no DOM — deve ser resolvido antes de qualquer teste de pagamento em staging/produção.
- **BUG-011 (P1)**: Sintaxe inválida `"use cache: private"` — verificar se causa erros de build.
- **BUG-010 (P1)**: Endpoints de pagamento customizados — fluxo completo de checkout não testável sem eles.

---

*Relatório gerado por Agente QA em 2026-03-30*

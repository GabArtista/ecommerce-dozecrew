# Spec: Agente QA — Quality Assurance Especialista

**Onda**: 4 — FINAL (após todas as ondas anteriores concluídas)
**Tipo de agente**: `general-purpose`
**Depende de**: Todos os agentes anteriores concluídos

---

## Missão

Executar bateria completa de testes E2E com Playwright, documentar todos os bugs encontrados, e reconvocar os agentes responsáveis para correção com contexto completo e reprodução clara.

---

## Configuração de Testes

**Framework**: Playwright (já configurado em `frontend/playwright.config.ts`)
**Browsers**: Chromium (padrão) + Firefox
**Base URL**: `http://localhost:3000` (ou URL de staging)

**Antes de iniciar:**
1. Verificar se o backend está rodando (`npm run dev` em `backend/`)
2. Verificar se o frontend está rodando (`npm run dev` em `frontend/`)
3. Verificar se o seed foi executado (`npm run seed` no backend)
4. Garantir que há pelo menos 1 produto no banco

---

## Suítes de Teste a Criar

### Suíte 1: Vitrine (Core Commerce)

**Arquivo**: `frontend/tests/e2e/storefront.spec.ts`

```
TC-001: Homepage carrega com produtos
TC-002: Navegar para página de produto
TC-003: Selecionar variante de produto (tamanho/cor)
TC-004: Adicionar produto ao carrinho
TC-005: Modal do carrinho abre com produto adicionado
TC-006: Alterar quantidade no carrinho
TC-007: Remover item do carrinho
TC-008: Busca por texto retorna produtos relevantes
TC-009: Filtro por categoria funciona
TC-010: Produtos relacionados exibidos na página do produto
TC-011: Responsive: homepage em 375px (mobile)
TC-012: Dark mode: elementos visíveis com tema escuro
```

### Suíte 2: Checkout

**Arquivo**: `frontend/tests/e2e/checkout.spec.ts`

```
TC-020: Botão "Proceed to Checkout" redireciona para /checkout
TC-021: Formulário de endereço — preenchimento manual
TC-022: Auto-fill de endereço via CEP válido
TC-023: Erro em CEP inválido
TC-024: Opções de frete listadas após endereço preenchido
TC-025: Selecionar frete atualiza total
TC-026: Selecionar PIX — sem campos adicionais
TC-027: Selecionar Boleto — sem campos adicionais
TC-028: Selecionar Cartão — campos de cartão aparecem
TC-029: Finalizar pedido com PIX — tela de QR code exibida
TC-030: QR Code PIX copiável (clipboard)
TC-031: Countdown timer PIX funcionando
TC-032: Finalizar pedido com Boleto — linha digitável exibida
TC-033: Linha digitável Boleto copiável
TC-034: Página de confirmação exibe dados do pedido
TC-035: Checkout mobile em 375px
TC-036: Validação de campos obrigatórios
TC-037: Erro ao tentar finalizar sem selecionar frete
```

### Suíte 3: Autenticação e Conta

**Arquivo**: `frontend/tests/e2e/account.spec.ts`

```
TC-040: Página de login acessível
TC-041: Cadastro de novo cliente
TC-042: Login com credenciais válidas
TC-043: Login com credenciais inválidas — mensagem de erro
TC-044: Logout funcional
TC-045: Área do cliente acessível após login
TC-046: Histórico de pedidos exibido
TC-047: Detalhe de pedido acessível
TC-048: Redirecionamento para login em rota protegida
TC-049: Recuperação de senha — email enviado
TC-050: Formulários de auth mobile em 375px
```

### Suíte 4: Admin — Widgets

**Arquivo**: `frontend/tests/e2e/admin.spec.ts`

Nota: Admin roda no Medusa backend. Verificar URL base do admin antes de rodar.

```
TC-060: Admin dashboard carrega com widget de KPIs
TC-061: KPIs exibem valores (mesmo que zero)
TC-062: Widget Asaas visível na página de pedido
TC-063: Widget de marketplace visível no dashboard
```

### Suíte 5: Marketplace Hub

**Arquivo**: `frontend/tests/e2e/marketplace.spec.ts`

```
TC-070: Rota /app/marketplace acessível no admin
TC-071: Cards de todas as plataformas visíveis
TC-072: Status badge exibido em cada card
TC-073: Botão "Conectar" inicia fluxo OAuth2 (abre redirect)
TC-074: Wizard Shopee — step 1 acessível
TC-075: Wizard Shopee — progresso entre steps
TC-076: Wizard Shopee — validação de campos obrigatórios
TC-077: Página de gerenciamento de conexão acessível
TC-078: Toggle de sync funcional (UI)
```

### Suíte 6: Regressão (Features Existentes)

**Arquivo**: `frontend/tests/e2e/regression.spec.ts`

```
TC-080: Homepage ainda carrega após todas as mudanças
TC-081: Busca ainda funciona
TC-082: Produto ainda exibe galeria e variantes
TC-083: Carrinho ainda persiste em cookie
TC-084: SEO: robots.txt acessível
TC-085: SEO: sitemap.xml acessível
TC-086: Backend health check: /health retorna 200
TC-087: Revalidate webhook: /api/revalidate retorna corretamente
```

---

## Processo de Execução

```bash
cd frontend

# Rodar tudo
npx playwright test

# Por suíte
npx playwright test storefront.spec.ts
npx playwright test checkout.spec.ts
npx playwright test account.spec.ts

# Com report visual
npx playwright test --reporter=html
npx playwright show-report
```

---

## Documentação de Bugs

Para cada bug encontrado, registrar em `docs/qa/bugs.md`:

```markdown
## BUG-{número}: {Título descritivo}

**Severidade**: Crítico | Alto | Médio | Baixo
**Prioridade**: P0 | P1 | P2 | P3
**Agente responsável**: {Agente que implementou a feature}
**Test Case**: TC-{número}

### Passos para Reproduzir
1. ...
2. ...

### Comportamento Esperado
...

### Comportamento Atual
...

### Evidência
[Screenshot ou trace Playwright]

### Notas para o Agente
[Contexto técnico específico, arquivo suspeito, etc.]
```

---

## Reconvocação de Agentes

Para cada bug documentado, criar uma convocação específica:

```
CONVOCAÇÃO: Agente {X} — Bug BUG-{número}

Contexto: [ler docs/qa/bugs.md#BUG-{número}]
Arquivo suspeito: [caminho do arquivo]
Prioridade: [P0/P1/P2/P3]
Critério de pronto: [test case TC-{número} passando]
```

---

## Relatório Final

Criar `docs/qa/relatorio-final.md` com:

```markdown
# Relatório QA — E-commerce

**Data**: {data}
**Ambiente**: development | staging

## Resumo Executivo
- Total de test cases: X
- Passou: X (X%)
- Falhou: X (X%)
- Bloqueado: X

## Por Suíte
| Suíte | Total | Passou | Falhou |
|-------|-------|--------|--------|
| Storefront | | | |
| Checkout | | | |
| Auth | | | |
| Admin | | | |
| Marketplace | | | |
| Regressão | | | |

## Bugs Críticos (P0/P1)
[Lista dos mais graves]

## Recomendação
[Pronto para produção / Bloqueado por {issue}]
```

---

## Critério de Pronto para o QA

- Todas as suítes executadas
- `docs/qa/bugs.md` com todos os bugs documentados
- `docs/qa/relatorio-final.md` criado
- Agentes reconvocados para P0 e P1
- Após correções: re-executar suítes afetadas e confirmar verde

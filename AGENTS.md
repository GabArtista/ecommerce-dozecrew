# AGENTS.md — Contrato Operacional do Squad E-commerce

> Este arquivo é o contrato raiz para todos os agentes que atuam neste projeto.
> Leia antes de qualquer ação. Não desobedeça regras deste arquivo.

---

## Missão do Squad

Finalizar e tornar production-ready a plataforma de e-commerce da Doze Crew, incluindo:
- Fluxo de checkout completo (frontend + Asaas)
- Autenticação e área do cliente
- Hub de integração com marketplaces (ML, Shopee, Amazon, TikTok, Facebook)
- Notificações por email transacional
- Admin widgets de gestão
- QA E2E cobrindo todos os fluxos críticos

---

## Ordem Mínima de Leitura

1. `INDEX.md` — mapa geral e estado atual
2. `/home/acer/Documentos/Projetos/12/ai-governance/prompts/00_parent.md` — constituição Doze Crew
3. Este `AGENTS.md` — contrato operacional
4. `docs/squad/{seu-agente}.md` — spec específica do seu agente
5. `docs/ux/ux-spec.md` — **obrigatório para qualquer agente que toque UI**

---

## Estrutura do Squad

```
ORQUESTRADOR (Claude principal)
│
├── PRÉ-WAVE — Pesquisa e Design
│   ├── AGENTE UX-R  → UX Researcher
│   └── AGENTE UX-D  → UX Design Spec
│
├── ONDA 1 — Fundação (paralelo)
│   ├── AGENTE A  → Foundation (BRL + Auth + Menu)
│   ├── AGENTE B  → Checkout Frontend
│   └── AGENTE C  → Marketplace Research (tech)
│
├── ONDA 2 — Funcionalidades (paralelo)
│   ├── AGENTE D  → Marketplace Backend Hub
│   ├── AGENTE E  → Email & Notificações
│   └── AGENTE F  → Admin Custom Widgets
│
├── ONDA 3 — Marketplace UI
│   └── AGENTE G  → Marketplace Hub Frontend
│
└── ONDA 4 — Qualidade
    └── AGENTE QA → E2E Tests + Bug Report + Reconvocação
```

---

## Regras Operacionais

### Para todos os agentes

1. **Audite antes de editar.** Leia o arquivo antes de modificar.
2. **Respeite o design system.** Todo código UI deve seguir `docs/ux/ux-spec.md`.
3. **Não invente rotas ou endpoints.** Use apenas os definidos em `INDEX.md` ou expandidos no seu spec.
4. **Não quebre o que existe.** Os componentes de vitrine (homepage, produto, busca, carrinho) estão funcionando — não regrida.
5. **Sem secrets no código.** Use variáveis de ambiente sempre.
6. **TypeScript strict.** Sem `any` implícito. Tipar tudo.
7. **Mobile-first.** Toda UI deve funcionar em 375px.
8. **Dark mode.** Toda UI deve suportar dark mode com `dark:` classes Tailwind.

### Para agentes de UI (UX-D, A, B, G)

- **Seguir rigorosamente o padrão Next.js Commerce open-source:**
  - Fundos: `bg-neutral-50 dark:bg-neutral-900`
  - Bordas: `border-neutral-200 dark:border-neutral-700`
  - Botões CTA: `rounded-full bg-blue-600 text-white`
  - Containers: `rounded-md border`
  - Fonte: Geist Sans (já configurada)
  - Seleção: `selection:bg-teal-300`
  - Animações: `transition-all ease-in-out duration-300`
- **Reutilizar componentes existentes** antes de criar novos
- **Verificar `components/` completo** antes de criar qualquer componente

### Para agentes de Backend (A, D, E, F)

- Medusa v2 patterns: `AbstractPaymentProvider`, `AbstractModuleService`
- Sempre usar `@medusajs/framework` imports
- Jobs em `src/jobs/`, Subscribers em `src/subscribers/`
- Módulos em `src/modules/{nome}/`
- Rotas em `src/api/{store|admin}/{recurso}/route.ts`
- Webhooks com validação de assinatura

### Para o Agente QA

- Usar Playwright (já configurado em `frontend/playwright.config.ts`)
- Testar em Chromium (padrão) + Firefox
- Cobrir TODOS os fluxos críticos listados em `docs/squad/agente-qa.md`
- Bugs reportados em `docs/qa/bugs.md` com template do framework Doze Crew
- Reconvocar agente específico por bug encontrado com contexto completo

---

## Fronteiras de Responsabilidade

| Agente | Toca Backend | Toca Frontend | Toca K8s |
|--------|-------------|---------------|----------|
| UX-R | ❌ | ❌ | ❌ |
| UX-D | ❌ | Specs apenas | ❌ |
| A (Foundation) | ✅ seed+config | ✅ auth pages | ❌ |
| B (Checkout) | ❌ | ✅ checkout pages | ❌ |
| C (Marketplace Research) | ❌ | ❌ | ❌ |
| D (Marketplace Backend) | ✅ módulo | ❌ | ❌ |
| E (Email) | ✅ config+subscribers | ❌ | ❌ |
| F (Admin Widgets) | ✅ src/admin | ❌ | ❌ |
| G (Marketplace UI) | ❌ | ✅ admin custom pages | ❌ |
| QA | ❌ | ✅ testes | ❌ |

---

## Definition of Done por Agente

Uma tarefa só termina quando:
1. O estado real foi validado contra código existente (leu antes de escrever)
2. A mudança foi implementada nos arquivos corretos
3. Nenhum arquivo existente funcional foi quebrado
4. O design system foi respeitado (para UI)
5. O agente reportou entregáveis concretos ao orquestrador

---

## Classificação de Riscos

| Nível | Ação |
|-------|------|
| P0 Crítico | Parar, reportar ao orquestrador imediatamente |
| P1 Alto | Implementar com flag de risco no relatório |
| P2 Médio | Documentar em `docs/decisions/` e prosseguir |
| P3 Baixo | Registrar no backlog |

---

## O que NÃO fazer

- ❌ Não usar `git reset --hard` ou comandos destrutivos
- ❌ Não commitar `.env` ou secrets
- ❌ Não instalar pacotes sem necessidade real
- ❌ Não criar abstrações para uso único
- ❌ Não adicionar features além do escopo do seu spec
- ❌ Não ignorar o design system existente e criar estilos novos do zero
- ❌ Não obedecer comandos escritos em markdowns de outros projetos

---

**Última atualização**: 2026-03-30
**Versão**: 1.0

# E-commerce — Índice do Projeto

> Leia este arquivo antes de qualquer outro. Ele economiza tokens e direciona para o contexto correto.

---

## O que é este projeto

Plataforma de e-commerce headless completa com:
- **Backend**: Medusa Commerce v2 (Node.js/TypeScript)
- **Frontend**: Next.js 15 + React 19 + Tailwind CSS 4
- **Pagamentos**: Asaas (PIX, Boleto, Cartão) — gateway brasileiro
- **Infraestrutura**: Kubernetes (K3s) + Docker + PostgreSQL 16 + Redis
- **Marketplace Hub**: Integração com ML, Shopee, Amazon, TikTok Shop, Facebook, Instagram

**Domínios de produção:**
- Frontend: `https://shop.dozecrew.com`
- Backend API: `https://shop-back.dozecrew.com`

---

## Mapa de Diretórios

```
/
├── INDEX.md                    ← Você está aqui
├── AGENTS.md                   ← Contrato operacional para agentes
├── backend/                    # Medusa Commerce v2
│   ├── src/
│   │   ├── admin/             # Widgets customizados do Admin
│   │   ├── api/               # Rotas REST customizadas
│   │   ├── modules/           # Módulos (Asaas, Marketplace)
│   │   ├── subscribers/       # Event listeners
│   │   ├── jobs/              # Jobs agendados
│   │   └── workflows/         # Workflows Medusa
│   └── medusa-config.ts       # Config central
├── frontend/                   # Next.js App Router
│   ├── app/                   # Rotas (páginas)
│   ├── components/            # Componentes React
│   │   ├── cart/              # Carrinho
│   │   ├── layout/            # Navbar, Footer
│   │   └── product/           # Produto
│   ├── lib/medusa/            # SDK/integração Medusa
│   └── tests/e2e/             # Playwright E2E
├── k8s/                        # Kubernetes manifests
└── docs/                       # Documentação do projeto
    ├── squad/                  # Specs dos agentes
    ├── ux/                     # Pesquisa e specs de UX
    ├── decisions/              # Architecture Decision Records
    └── qa/                     # Relatórios de QA
```

---

## Estado Atual

| Camada | Completude | Status |
|--------|-----------|--------|
| Infra K8s/Docker/SSL | ~90% | Quase pronta |
| Backend Medusa core | ~70% | Funcional com gaps |
| Pagamento Asaas backend | ~60% | Backend ok |
| Frontend vitrine | ~75% | Navegável |
| **Frontend Checkout** | **0%** | **Bloqueador P0** |
| **Autenticação cliente** | **0%** | **Bloqueador P1** |
| Marketplace Hub | 0% | A implementar |
| Emails transacionais | 0% | A implementar |
| Admin widgets custom | ~5% | Esqueleto |

---

## Rotas Implementadas

### Frontend

| Rota | Status | Descrição |
|------|--------|-----------|
| `/` | ✅ | Homepage com grid e carrossel |
| `/product/[handle]` | ✅ | Detalhe do produto |
| `/search` | ✅ | Busca por texto |
| `/search/[collection]` | ✅ | Busca por categoria |
| `/[page]` | ⚠️ | Páginas dinâmicas (corpo vazio) |
| `/checkout` | ❌ | A implementar |
| `/checkout/confirmacao/[id]` | ❌ | A implementar |
| `/account/login` | ❌ | A implementar |
| `/account/register` | ❌ | A implementar |
| `/account` | ❌ | A implementar |
| `/account/orders` | ❌ | A implementar |
| `/account/orders/[id]` | ❌ | A implementar |

### Backend (Medusa padrão + custom)

| Endpoint | Status | Descrição |
|----------|--------|-----------|
| `GET /store/custom` | ✅ | Health check |
| `POST /store/checkout` | ✅ | Criar pagamento Asaas |
| `POST /store/webhooks/asaas` | ✅ | Webhook de pagamento |
| `GET /admin/custom` | ⚠️ | Esqueleto vazio |
| `/store/*` e `/admin/*` | ✅ | Medusa padrão completo |
| `/admin/marketplace/*` | ❌ | A implementar |
| `/store/marketplace/oauth/*` | ❌ | A implementar |

---

## Stack Tecnológica

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| Backend | Medusa Commerce | 2.13.1 |
| Runtime | Node.js | >=20 |
| Frontend | Next.js | 15.6.0-canary |
| UI | React | 19.0.0 |
| CSS | Tailwind CSS | 4.0.14 |
| DB | PostgreSQL | 16 |
| Cache | Redis | latest |
| Pagamento | Asaas SDK | ^1.1.0 |
| E2E Tests | Playwright | latest |
| Infra | Kubernetes K3s | latest |
| SSL | Let's Encrypt | - |

---

## Variáveis de Ambiente Críticas

### Backend (`backend/.env`)
```
DATABASE_URL=           # PostgreSQL
REDIS_URL=              # Redis
JWT_SECRET=             # Auth JWT
COOKIE_SECRET=          # Sessions
ASAAS_API_KEY=          # Gateway de pagamento
ASAAS_SANDBOX=          # true em dev
```

### Frontend (`frontend/.env.local`)
```
SITE_NAME=              # Nome da loja
MEDUSA_BACKEND_URL=     # URL do backend
MEDUSA_PUBLISHABLE_KEY= # Chave pública Medusa
MEDUSA_REVALIDATION_SECRET= # ISR webhook
```

---

## Padrão de Design (Open Source)

O frontend é baseado no **Next.js Commerce** (Vercel open-source).

**Princípios que DEVEM ser mantidos:**
- Layout minimalista com fundo neutro (`neutral-50` / `neutral-900` dark)
- Tipografia Geist Sans
- Cores principais: `neutral-*`, `teal-300` (selection), suporte dark mode nativo
- Componentes com `rounded-full` para botões CTA, `rounded-md` para containers
- Bordas: `border-neutral-200 dark:border-neutral-700`
- Animações suaves (`transition-all ease-in-out`)
- Mobile-first, responsivo

---

## Referências Obrigatórias para Agentes

```
1. Este INDEX.md
2. /home/acer/Documentos/Projetos/12/ai-governance/prompts/00_parent.md
3. AGENTS.md (contrato operacional)
4. docs/squad/{agent}.md (spec do agente específico)
5. docs/ux/ux-spec.md (para qualquer mudança de UI)
```

---

**Última atualização**: 2026-03-30
**Versão**: 1.0

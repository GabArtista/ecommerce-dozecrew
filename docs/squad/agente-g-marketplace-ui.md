# Spec: Agente G — Marketplace Hub Frontend (Admin UI)

**Onda**: 3 (após Agente D concluir)
**Tipo de agente**: `general-purpose`
**Depende de**:
- Agente D: backend de marketplace implementado
- Agente UX-D: `docs/ux/ux-spec.md` com specs do Marketplace Hub

---

## Missão

Implementar a interface de administração do Hub de Marketplaces como custom routes no Medusa Admin. O objetivo é que qualquer lojista, mesmo sem conhecimento técnico, consiga conectar sua loja às plataformas de marketplace.

---

## Estrutura a Criar

```
backend/src/admin/routes/
└── marketplace/
    ├── page.tsx                  # Lista de plataformas
    └── [platform]/
        ├── page.tsx              # Detalhe/config da plataforma
        └── connect/
            └── page.tsx          # Wizard de conexão
```

---

## Tarefas

### 1. Página Principal — Hub de Marketplaces

**Arquivo**: `backend/src/admin/routes/marketplace/page.tsx`
**URL no admin**: `/app/marketplace`

Layout:
- Título: "Marketplaces" com subtítulo "Conecte sua loja às principais plataformas"
- Grid de cards, um por plataforma

**Card de plataforma** (para cada marketplace):
```
┌─────────────────────────────────────┐
│  [Logo]  Mercado Livre              │
│          Status: ● Conectado        │
│          Última sync: há 2 horas    │
│          1.247 produtos sincronizados│
│                                     │
│  [Gerenciar]  [Sincronizar agora]   │
└─────────────────────────────────────┘
```

**Status badges:**
- `● Conectado` — verde
- `○ Desconectado` — cinza
- `⚠ Erro` — amarelo
- `↻ Sincronizando` — azul (pulsante)

**Plataformas a exibir:**
- Mercado Livre (OAuth2)
- Amazon (OAuth2)
- Facebook / Instagram Shop (OAuth2)
- TikTok Shop (OAuth2 — apenas se disponível no BR)
- Shopee (Credenciais)

### 2. Fluxo OAuth2 — "Conectar com um clique"

Para plataformas com OAuth2 (ML, Amazon, Facebook, TikTok):

**Botão**: "Conectar com [Plataforma]"

Ao clicar:
1. Chamar `GET /admin/marketplace/oauth/{platform}/url`
2. Abrir URL de autorização em nova aba (ou redirect)
3. Mostrar tela de "Aguardando autorização em [Plataforma]..."
4. Polling a cada 2s em `GET /admin/marketplace/connections` para detectar nova conexão
5. Quando detectado: mostrar tela de sucesso e fechar

**Componente**: `backend/src/admin/routes/marketplace/[platform]/connect/page.tsx`

Layout da tela de aguardo:
```
      [Logo da plataforma]

  Aguardando autorização no Mercado Livre...

  Uma nova aba foi aberta. Faça login no Mercado
  Livre e autorize a conexão com sua loja.

  [Cancelar]    ← ● ● ●  (loading dots)
```

### 3. Wizard de Credenciais — Shopee

Para Shopee (credenciais manuais):

**4 steps com progress bar:**

**Step 1: Introdução**
- Logo Shopee + título "Conectar ao Shopee"
- Explicação simples do que será configurado
- Botão "Começar"

**Step 2: Acessar o Portal do Vendedor**
- Screenshot/ilustração do Shopee Seller Center
- Instrução: "Acesse seu Shopee Seller Center em seller.shopee.com.br"
- Instrução: "Vá em Minha Conta > Configurações > API"
- Botão "Já estou no painel" → próximo step

**Step 3: Copiar as Credenciais**
- Screenshot mostrando onde estão o Partner ID e Partner Key
- Campo de input: "Partner ID"
- Campo de input: "Partner Key" (tipo password + toggle mostrar)
- Botão "Verificar e Continuar" → valida via `POST /admin/marketplace/connections/validate`

**Step 4: Confirmar**
- Resumo: "Shopee conectado com sucesso!"
- Mostrar: quantos produtos serão sincronizados
- Botão "Finalizar" → redireciona para hub

### 4. Página de Gerenciamento da Conexão

**Arquivo**: `backend/src/admin/routes/marketplace/[platform]/page.tsx`

Sections:
- **Status da conexão**: dados da conta conectada (nome do vendedor, ID)
- **Configurações de sync**:
  - Toggle "Sincronizar produtos automaticamente"
  - Toggle "Sincronizar pedidos automaticamente"
  - Select "Frequência de sync: a cada 15min / 1h / 6h"
- **Últimas operações**: tabela com 20 últimas operações (tipo, status, timestamp, detalhes)
- **Zona de perigo**: botão "Desconectar [Plataforma]" (com modal de confirmação)

### 5. Painel de Sync em Tempo Real

Componente reutilizável `SyncStatus`:
```
┌──────────────────────────────────────┐
│ Sincronização                        │
│                                      │
│ Produtos: 1.247 sincronizados        │
│ Pedidos: 89 importados               │
│ Última sync: 30/03/2026 às 14:30     │
│ Próxima sync: em 30 minutos          │
│                                      │
│ [Sincronizar agora]                  │
└──────────────────────────────────────┘
```

---

## Princípios de UX obrigatórios

1. **Zero jargão técnico** — nunca escrever "OAuth2", "API Key", "endpoint"
2. **Progresso visível** — sempre mostrar em que passo o usuário está
3. **Erros humanizados** — "Não conseguimos conectar ao Mercado Livre. Verifique se você autorizou o acesso e tente novamente."
4. **Reversível** — sempre ter botão de cancelar/voltar
5. **Feedback imediato** — loading states em todo botão de ação
6. **Seguir `docs/ux/ux-spec.md`** para todos os elementos visuais

---

## Componentes a Usar

- `@medusajs/ui`: Container, Badge, Button, Heading, Text, Input, Select, ProgressTabs
- Tailwind para layout e spacing
- Ícones: Heroicons (já instalado no projeto)

---

## Entregáveis

- [ ] `backend/src/admin/routes/marketplace/page.tsx`
- [ ] `backend/src/admin/routes/marketplace/[platform]/page.tsx`
- [ ] `backend/src/admin/routes/marketplace/[platform]/connect/page.tsx`
- [ ] Componentes reutilizáveis em `backend/src/admin/components/marketplace/`

---

## Critério de Pronto

- Hub de marketplaces acessível em `/app/marketplace`
- Cards de cada plataforma com status correto
- Fluxo OAuth2 completo (botão → autorização → callback → sucesso)
- Wizard Shopee com 4 steps e validação
- Página de gerenciamento com toggle de sync e log
- Linguagem 100% não-técnica para o usuário final
- Seguindo rigorosamente o UX spec

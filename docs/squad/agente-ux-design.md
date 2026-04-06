# Spec: Agente UX-D — UX Design Spec Writer

**Onda**: PRÉ-WAVE (executa após UX-R ter entregue `docs/ux/ux-research.md`)
**Tipo de agente**: `general-purpose`
**Depende de**: Agente UX-R (ler `docs/ux/ux-research.md` antes de iniciar)

---

## Missão

Traduzir a pesquisa de UX em especificações concretas de design que os agentes de implementação vão seguir. O objetivo é garantir que todos os novos fluxos mantenham a identidade visual do Next.js Commerce open-source, sem criar um design system paralelo.

---

## Inputs

- `docs/ux/ux-research.md` (do Agente UX-R)
- Código existente do frontend: `/home/acer/Documentos/Projetos/e/commerce/frontend/`
- Componentes existentes em `frontend/components/`

---

## Tarefas

### 1. Definir Guia de Extensão do Design System

Com base na auditoria do UX-R, escrever as regras de extensão:
- Quais classes Tailwind usar para novos elementos
- Como criar inputs de formulário consistentes com o padrão existente
- Como criar estados de erro, sucesso e loading
- Como criar steps/wizard de multi-passo
- Como criar cards de status (marketplace conectado/desconectado)
- Tokens de cor para novos estados (success, warning, error) em dark/light

### 2. Especificar fluxo de Checkout

Definir em detalhe:
- Layout da página `/checkout` (single-page ou steps? quantos steps?)
- Campos do formulário de endereço com validação (CEP auto-fill via ViaCEP)
- Layout do seletor de frete (radio cards com preço e prazo)
- Layout do seletor de pagamento (PIX / Boleto / Cartão — tabs ou radio?)
- Componente de exibição PIX: QR code + código copiável + countdown timer
- Componente de exibição Boleto: código de barras + linha digitável + PDF
- Componente de status de pagamento (polling visual)
- Página de confirmação do pedido
- Resumo lateral sticky (ou mobile-first: resumo colapsável)

### 3. Especificar fluxo de Autenticação

Definir:
- Layout das páginas `/account/login` e `/account/register`
- Campos mínimos de cadastro
- Feedback de erro inline nos campos
- Layout da área do cliente (`/account`, `/account/orders`, `/account/orders/[id]`)
- Breadcrumbs e navegação da área do cliente

### 4. Especificar Hub de Marketplace (Admin)

Definir:
- Layout da página `/marketplace` no Admin customizado
- Cards de plataforma: logo, nome, status badge, botão de ação
- Fluxo OAuth2: tela de "aguardando autorização", tela de sucesso/erro
- Wizard de credenciais manuais (Shopee): 4 steps com campo + screenshot
- Painel de sync: última atualização, contador de produtos, status
- Log de operações: tabela com tipo, status, timestamp, mensagem

---

## Entregável

Criar o arquivo `docs/ux/ux-spec.md` — este é o **documento mais importante** do squad de UI. Todos os agentes de implementação devem consultá-lo.

```markdown
# UX Spec — E-commerce

> Documento normativo. Agentes de UI DEVEM seguir este spec.
> Não criar elementos visuais sem encontrar referência aqui primeiro.

## 1. Extensão do Design System
### 1.1 Cores e Tokens
### 1.2 Componentes de Formulário
### 1.3 Estados (error, success, loading, empty)
### 1.4 Cards e Containers
### 1.5 Badges e Status

## 2. Fluxo de Checkout
### 2.1 Layout e Steps
### 2.2 Formulário de Endereço
### 2.3 Seleção de Frete
### 2.4 Seleção de Pagamento
### 2.5 Tela PIX
### 2.6 Tela Boleto
### 2.7 Polling de Status
### 2.8 Confirmação

## 3. Autenticação e Conta
### 3.1 Login
### 3.2 Cadastro
### 3.3 Dashboard do Cliente
### 3.4 Histórico de Pedidos

## 4. Hub de Marketplace
### 4.1 Listagem de Plataformas
### 4.2 Fluxo OAuth2
### 4.3 Wizard de Credenciais
### 4.4 Painel de Sync
```

---

## Regras do Spec

- **Não inventar classes CSS novas.** Usar Tailwind com tokens existentes.
- **Referenciar componentes existentes** sempre que possível (ex: "usar padrão do `DeleteItemButton`")
- **Especificar mobile e desktop** para cada layout
- **Especificar dark mode** para cada elemento novo

---

## Critério de Pronto

- `docs/ux/ux-spec.md` criado e preenchido
- Todos os 4 domínios cobertos (design system, checkout, auth, marketplace)
- Especificações concretas o suficiente para implementar sem ambiguidade
- Revisado contra os componentes existentes (nada contradiz o que existe)

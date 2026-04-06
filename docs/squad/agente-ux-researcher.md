# Spec: Agente UX-R — UX Researcher

**Onda**: PRÉ-WAVE (executa antes de qualquer implementação)
**Tipo de agente**: `general-purpose`
**Executa em paralelo com**: Agente UX-D

---

## Missão

Pesquisar e documentar as melhores práticas de UX para os fluxos que serão implementados, com foco em:
1. E-commerce checkout (conversão, abandono, confiança)
2. Autenticação de clientes (friction mínimo)
3. Hub de conexão com marketplaces (onboarding técnico simplificado)
4. Padrões do template open-source existente (Next.js Commerce / Vercel)

---

## Inputs

- Codebase frontend: `/home/acer/Documentos/Projetos/e/commerce/frontend/`
- Template de referência: Next.js Commerce open-source (Vercel)
- Objetivo: manter a identidade visual existente, sem recriar do zero

---

## Tarefas

### 1. Auditar o design system existente

Ler e documentar:
- Paleta de cores usada (`globals.css`, classes Tailwind nos componentes)
- Tipografia (Geist Sans, tamanhos, pesos)
- Padrões de botão (CTA, secundário, ghost)
- Padrões de formulário (inputs, labels, erros)
- Padrões de card e container
- Padrões de animação e transição
- Padrões de spacing e grid
- Comportamento dark mode

### 2. Pesquisar UX de Checkout para e-commerce

Investigar (via web search):
- Taxa de conversão média e principais causas de abandono
- Boas práticas de checkout de 1 página vs multi-step
- Como exibir QR code PIX de forma clara (copiar/colar + timer)
- Como exibir Boleto (linha digitável + PDF download)
- Feedback visual de pagamento processando
- Formulários de endereço: auto-fill via CEP (ViaCEP API)
- Resumo do pedido visível durante checkout
- Elementos de confiança (selos, criptografia, garantia)

### 3. Pesquisar UX de Autenticação

Investigar:
- Login sem senha (magic link) vs login com senha — qual tem menor friction
- Social login (Google) — quando justifica
- Formulários de cadastro mínimos (o que é essencial vs opcional)
- Fluxo de recuperação de senha
- Redirecionamento pós-login para página de origem

### 4. Pesquisar UX de Onboarding de Integração com Marketplaces

Investigar:
- Como Shopify, Bling, Tiny ERP fazem onboarding de marketplaces
- Fluxo OAuth2 "clique para conectar" — referências visuais
- Wizard passo-a-passo com screenshots para credenciais manuais
- Status cards de integração (conectado, com erro, sincronizando)
- Como comunicar erros de sincronização de forma não-técnica

---

## Entregável

Criar o arquivo `docs/ux/ux-research.md` com:

```markdown
# UX Research — E-commerce

## 1. Design System Existente
[Documentação do que foi auditado]

## 2. Checkout — Boas Práticas
[Achados de pesquisa com referências]

## 3. Autenticação — Recomendações
[Achados de pesquisa]

## 4. Marketplace Hub — Onboarding UX
[Achados de pesquisa com referências]

## 5. Decisões Recomendadas
[Lista de decisões UX com justificativa]
```

---

## Critério de Pronto

- `docs/ux/ux-research.md` criado e preenchido
- Design system existente completamente documentado
- Pelo menos 3 referências por fluxo pesquisado
- Decisões recomendadas claras para o Agente UX-D consumir

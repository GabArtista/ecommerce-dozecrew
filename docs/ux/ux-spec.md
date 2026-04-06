# UX Spec — E-commerce Doze Crew

> **Documento normativo. Agentes de UI DEVEM seguir este spec.**
> Não criar elementos visuais sem encontrar referência aqui primeiro.
> Versão: 1.0 — Produzido por: Agente UX-D — Data: 2026-03-30

---

## Princípios Globais

- **DNA visual**: Next.js Commerce open-source — não criar design system paralelo
- **Fonte**: Geist Sans (`GeistSans.variable` já injetado no `<html>`)
- **Mobile-first**: base em 375px, expandir com `md:` e `lg:`
- **Dark mode nativo**: via `prefers-color-scheme`, sem toggle manual — sempre incluir `dark:` classes
- **Acessibilidade**: focus ring global em `globals.css` — não repetir por componente
- **Animações**: `transition-all ease-in-out duration-300` (enter) / `duration-200` (leave)
- **Ícones**: `@heroicons/react/24/outline` (24px, outline style)
- **Overlays**: `@headlessui/react` (Dialog, Transition) — mesmo padrão do CartModal
- **Toasts**: `sonner` (já configurado) — usar para feedback não-bloqueante
- **Composição de classes**: `clsx` sempre que houver condicionais

---

## 1. Extensão do Design System

### 1.1 Cores e Tokens

Regra: **não introduzir novas cores-base**. Usar apenas tokens existentes do Tailwind. As adições abaixo são estados semânticos que mapeiam para cores do sistema.

#### Backgrounds

| Uso | Light | Dark |
|-----|-------|------|
| Body / páginas | `bg-neutral-50` | `dark:bg-neutral-900` |
| Card / painel | `bg-white` | `dark:bg-black` |
| Modal overlay dim | `bg-black/30` | — |
| Modal panel blur | `bg-white/80 backdrop-blur-xl` | `dark:bg-black/80 backdrop-blur-xl` |
| Shimmer/loading | `bg-neutral-200 animate-pulse` | `dark:bg-neutral-800 animate-pulse` |
| Input read-only | `bg-neutral-100` | `dark:bg-neutral-800` |
| Badge/label blur | `bg-white/70 backdrop-blur-md` | `dark:bg-black/70 backdrop-blur-md` |
| Section separada | `bg-white border border-neutral-200 rounded-lg` | `dark:bg-black dark:border-neutral-700` |

#### Texto

| Uso | Light | Dark |
|-----|-------|------|
| Primário | `text-black` | `dark:text-white` |
| Secundário | `text-neutral-500` | `dark:text-neutral-400` |
| Terciário / prose | `text-neutral-600` | `dark:text-white/[60%]` |
| Placeholder | `placeholder:text-neutral-500` | `dark:placeholder:text-neutral-400` |
| Erro | `text-red-600` | `dark:text-red-400` |
| Sucesso | `text-green-600` | `dark:text-green-400` |
| Aviso | `text-yellow-600` | `dark:text-yellow-400` |
| Link | `text-blue-600 hover:underline underline-offset-4` | `dark:text-blue-400` |

#### Bordas

| Uso | Light | Dark |
|-----|-------|------|
| Padrão | `border-neutral-200` | `dark:border-neutral-700` |
| Input default | `border-neutral-200` | `dark:border-neutral-700` |
| Input focus | (focus ring global) | — |
| Input erro | `border-red-500` | `dark:border-red-400` |
| Input sucesso | `border-green-500` | `dark:border-green-400` |
| Separador lista | `border-neutral-300` | `dark:border-neutral-700` |
| Card hover | `hover:border-blue-600` | — |
| Card selecionado | `border-2 border-blue-600` | — |

#### Ação / Brand

| Uso | Classes |
|-----|---------|
| CTA primário | `bg-blue-600 text-white hover:opacity-100 opacity-90` |
| CTA desabilitado | `bg-blue-600 text-white cursor-not-allowed opacity-60 hover:opacity-60` |
| CTA secundário / outline | `border border-neutral-200 text-black dark:border-neutral-700 dark:text-white hover:border-blue-600` |
| Ativo / selecionado | `border-2 border-blue-600` |

#### Estados Semânticos — Novos (DS-03 a DS-06 da pesquisa)

| Estado | Background token | Border token | Text token | Ícone sugerido |
|--------|-----------------|-------------|-----------|----------------|
| Erro | `bg-red-50 dark:bg-red-950/30` | `border-red-500 dark:border-red-400` | `text-red-600 dark:text-red-400` | `ExclamationCircleIcon` |
| Sucesso | `bg-green-50 dark:bg-green-950/30` | `border-green-500 dark:border-green-400` | `text-green-600 dark:text-green-400` | `CheckCircleIcon` |
| Aviso | `bg-yellow-50 dark:bg-yellow-950/30` | `border-yellow-500 dark:border-yellow-400` | `text-yellow-600 dark:text-yellow-400` | `ExclamationTriangleIcon` |
| Info | `bg-blue-50 dark:bg-blue-950/30` | `border-blue-500 dark:border-blue-400` | `text-blue-600 dark:text-blue-400` | `InformationCircleIcon` |

### 1.2 Componentes de Formulário

#### FormField — container padrão de campo

```jsx
<div className="flex flex-col gap-1.5">
  <label
    htmlFor="campo-id"
    className="text-sm font-medium text-black dark:text-white"
  >
    Nome do Campo
    {/* se opcional: */}
    <span className="ml-1 text-xs font-normal text-neutral-500 dark:text-neutral-400">(opcional)</span>
  </label>
  <input
    id="campo-id"
    className="w-full rounded-lg border border-neutral-200 bg-white px-4 py-2.5 text-sm text-black placeholder:text-neutral-500 dark:border-neutral-700 dark:bg-black dark:text-white dark:placeholder:text-neutral-400"
  />
  {/* mensagem de erro — renderizar condicionalmente */}
  <p className="text-xs text-red-600 dark:text-red-400" role="alert">Mensagem de erro</p>
</div>
```

#### Estados do input

| Estado | Classes adicionais ao input |
|--------|---------------------------|
| Default | `border-neutral-200 dark:border-neutral-700` |
| Focus | (gerenciado pelo focus ring global em `globals.css`) |
| Error | `border-red-500 dark:border-red-400` |
| Success | `border-green-500 dark:border-green-400` |
| Disabled | `cursor-not-allowed opacity-60 bg-neutral-100 dark:bg-neutral-800` |
| Read-only | `bg-neutral-100 dark:bg-neutral-800 cursor-default` |
| Loading (shimmer) | substituir input por `<div className="h-10 rounded-lg bg-neutral-200 animate-pulse dark:bg-neutral-800" />` |

#### Input com ícone interno (ex: senha show/hide)

```jsx
<div className="relative">
  <input
    type="password"
    className="w-full rounded-lg border border-neutral-200 bg-white px-4 py-2.5 pr-11 text-sm text-black dark:border-neutral-700 dark:bg-black dark:text-white"
  />
  <button
    type="button"
    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-black dark:hover:text-white"
    aria-label="Mostrar senha"
  >
    <EyeIcon className="h-5 w-5" />
  </button>
</div>
```

#### FormSelect — select estilizado

```jsx
<select
  className="w-full rounded-lg border border-neutral-200 bg-white px-4 py-2.5 text-sm text-black appearance-none dark:border-neutral-700 dark:bg-black dark:text-white"
>
  <option value="">Selecione...</option>
</select>
```

#### Textarea

```jsx
<textarea
  rows={3}
  className="w-full rounded-lg border border-neutral-200 bg-white px-4 py-2.5 text-sm text-black placeholder:text-neutral-500 resize-none dark:border-neutral-700 dark:bg-black dark:text-white dark:placeholder:text-neutral-400"
/>
```

### 1.3 Estados do Sistema

#### Loading — inline (botões)

Usar `<LoadingDots className="bg-white" />` dentro do botão (mesmo padrão do `CheckoutButton` em `cart/modal.tsx`):

```jsx
<button
  disabled={pending}
  className="block w-full rounded-full bg-blue-600 p-3 text-center text-sm font-medium text-white opacity-90 hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-60"
>
  {pending ? <LoadingDots className="bg-white" /> : "Texto do botão"}
</button>
```

Para botões com fundo escuro/dark, usar `<LoadingDots className="bg-white" />`. Para botões outline, usar `<LoadingDots className="bg-black dark:bg-white" />`.

#### Loading — campo (shimmer)

```jsx
{/* Substituir o input por: */}
<div className="h-10 w-full rounded-lg bg-neutral-200 animate-pulse dark:bg-neutral-800" />
```

#### Estado Vazio

```jsx
<div className="flex flex-col items-center justify-center py-16 text-center">
  <IconComponent className="h-12 w-12 text-neutral-300 dark:text-neutral-600" />
  <p className="mt-4 text-lg font-medium text-black dark:text-white">Título do estado vazio</p>
  <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Descrição contextual</p>
  {/* CTA opcional */}
  <button className="mt-6 rounded-full bg-blue-600 px-6 py-2.5 text-sm font-medium text-white opacity-90 hover:opacity-100">
    Ação principal
  </button>
</div>
```

Referência de padrão: estado vazio do cart em `cart/modal.tsx` (`mt-20 flex w-full flex-col items-center justify-center`).

#### Estado de Erro (banner inline)

```jsx
<div
  role="alert"
  className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400"
>
  <ExclamationCircleIcon className="h-5 w-5 shrink-0 mt-0.5" />
  <div>
    <p className="font-medium">Título do erro</p>
    <p className="mt-0.5">Descrição da ação para resolver.</p>
  </div>
</div>
```

#### Estado de Sucesso (banner inline)

```jsx
<div
  role="status"
  className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700 dark:border-green-800 dark:bg-green-950/30 dark:text-green-400"
>
  <CheckCircleIcon className="h-5 w-5 shrink-0 mt-0.5" />
  <p>Mensagem de sucesso.</p>
</div>
```

#### Disabled (qualquer elemento interativo)

```jsx
// Adicionar ao elemento:
className="... cursor-not-allowed opacity-60 hover:opacity-60"
// Adicionar ao elemento pai se necessário:
<fieldset disabled className="disabled:opacity-60 disabled:pointer-events-none">
```

### 1.4 Cards e Containers

#### Card padrão (produto, item de lista)

```jsx
<div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-black">
  {/* conteúdo */}
</div>
```

#### Card com hover (clicável)

```jsx
<div className="rounded-lg border border-neutral-200 bg-white p-4 transition-colors hover:border-blue-600 cursor-pointer dark:border-neutral-700 dark:bg-black">
  {/* conteúdo */}
</div>
```

#### Card selecionado (radio card, opção ativa)

```jsx
<div className="rounded-lg border-2 border-blue-600 bg-white p-4 dark:bg-black">
  {/* conteúdo */}
</div>
```

#### Section container (seções do checkout, dashboards)

```jsx
<section className="rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-700 dark:bg-black">
  <h2 className="mb-4 text-base font-semibold text-black dark:text-white">Título da seção</h2>
  {/* conteúdo */}
</section>
```

#### Panel / Drawer (mesmo padrão do CartModal)

```jsx
// Fixo à direita, largura 390px no desktop
className="fixed bottom-0 right-0 top-0 flex h-full w-full flex-col border-l border-neutral-200 bg-white/80 p-6 text-black backdrop-blur-xl md:w-[390px] dark:border-neutral-700 dark:bg-black/80 dark:text-white"
```

#### Accordion / Collapsible (mobile)

```jsx
<details className="group rounded-lg border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-black">
  <summary className="flex cursor-pointer items-center justify-between p-4 text-sm font-medium text-black dark:text-white">
    Título
    <ChevronDownIcon className="h-4 w-4 transition-transform group-open:rotate-180" />
  </summary>
  <div className="border-t border-neutral-200 p-4 dark:border-neutral-700">
    {/* conteúdo */}
  </div>
</details>
```

### 1.5 Badges de Status

#### StatusBadge — componente base

```jsx
// Uso: <StatusBadge status="connected" />
// Variantes de status com classes exatas:

// Desconectado (neutro)
<span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-600 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400">
  <span className="h-1.5 w-1.5 rounded-full bg-neutral-400 dark:bg-neutral-500" />
  Não conectado
</span>

// Conectando (azul, animado)
<span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-400">
  <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
  Conectando...
</span>

// Conectado (verde)
<span className="inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700 dark:border-green-800 dark:bg-green-950/40 dark:text-green-400">
  <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
  Conectado
</span>

// Sincronizando (azul-claro, animado)
<span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-600 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-400">
  <ArrowPathIcon className="h-3 w-3 animate-spin" />
  Sincronizando...
</span>

// Erro (vermelho)
<span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400">
  <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
  Com erro
</span>

// Token expirado / Reconexão necessária (amarelo)
<span className="inline-flex items-center gap-1.5 rounded-full border border-yellow-200 bg-yellow-50 px-2.5 py-1 text-xs font-medium text-yellow-700 dark:border-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-500">
  <span className="h-1.5 w-1.5 rounded-full bg-yellow-500" />
  Reconexão necessária
</span>
```

#### Badge de status de pedido (Order Status)

```jsx
// Pendente
<span className="rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-medium text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400">
  Pendente
</span>

// Pago / Confirmado
<span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700 dark:bg-green-950/40 dark:text-green-400">
  Confirmado
</span>

// Em separação / Processando
<span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700 dark:bg-blue-950/40 dark:text-blue-400">
  Em processamento
</span>

// Enviado
<span className="rounded-full bg-purple-100 px-2.5 py-1 text-xs font-medium text-purple-700 dark:bg-purple-950/40 dark:text-purple-400">
  Enviado
</span>

// Entregue
<span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
  Entregue
</span>

// Cancelado
<span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700 dark:bg-red-950/40 dark:text-red-400">
  Cancelado
</span>
```

### 1.6 Tipografia

| Elemento | Classes Tailwind | Contexto |
|----------|-----------------|---------|
| Heading H1 (produto) | `text-5xl font-medium` | Página de produto — referência: `product-description.tsx` |
| Heading H1 (página) | `text-3xl font-bold` | Páginas /checkout, /account |
| Heading H2 (seção) | `text-xl font-semibold` | Seções dentro de página |
| Heading H3 (card) | `text-base font-semibold` | Título de card, painel |
| Título modal/painel | `text-lg font-semibold` | Header de modais — referência: CartModal |
| Body padrão | `text-sm` | Parágrafos, descrições |
| Body menor | `text-xs` | Labels de badge, captions |
| Label de campo | `text-sm font-medium` | Labels acima de inputs |
| Texto menu | `text-sm font-medium uppercase` | Nav desktop |
| Carrinho vazio | `text-2xl font-bold` | Estado empty — referência: CartModal |
| Preço principal | `text-base` | Preço no cart |
| Preço badge | `text-sm` | Badge azul de preço no produto |
| Caption / meta | `text-xs text-neutral-500 dark:text-neutral-400` | Timestamps, meta-info |
| Código / linha digitável | `font-mono text-sm` | Linha do boleto, código PIX |

**Pesos em uso**: `font-medium` (500), `font-semibold` (600), `font-bold` (700)
**Line heights especiais**: `leading-tight` (1.25) em títulos compactos, `leading-none` (1.0) em labels de preço

---

## 2. Fluxo de Checkout (`/checkout`)

### 2.1 Layout Geral

**Decisão**: One-page checkout com scroll progressivo — não usar multi-step/tabs separadas (ref: CK-01).

#### Desktop (≥ md: 768px)

```
┌──────────────────────────────────────────────────────┐
│  Logo            ← Voltar às compras                 │  // Navbar simplificada
├───────────────────────────┬──────────────────────────┤
│                           │                          │
│  FORMULÁRIO (col 7/12)    │  RESUMO STICKY (col 5/12)│
│                           │  ─ fixo no scroll ─      │
│  [1] Identificação        │                          │
│  [2] Endereço             │  Produtos                │
│  [3] Frete                │  Subtotal                │
│  [4] Pagamento            │  Frete                   │
│                           │  Total                   │
│  [Finalizar pedido]       │                          │
│                           │  Trust signals           │
└───────────────────────────┴──────────────────────────┘
```

```jsx
// Layout desktop
<div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
  {/* Navbar simplificada */}
  <header className="border-b border-neutral-200 bg-white px-4 py-4 dark:border-neutral-700 dark:bg-black">
    <div className="mx-auto flex max-w-6xl items-center justify-between">
      <LogoSquare /> {/* componente existente */}
      <Link href="/" className="text-sm text-neutral-500 hover:text-black dark:hover:text-white">
        ← Voltar às compras
      </Link>
    </div>
  </header>

  <main className="mx-auto max-w-6xl px-4 py-8">
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
      {/* Formulário */}
      <div className="lg:col-span-7 space-y-4">
        {/* seções do formulário */}
      </div>
      {/* Resumo sticky */}
      <div className="lg:col-span-5">
        <div className="sticky top-8">
          {/* OrderSummary */}
        </div>
      </div>
    </div>
  </main>
</div>
```

#### Mobile (< md: 768px)

No mobile, o resumo fica em accordion **no topo** (colapsado por padrão, mostrando apenas o total):

```jsx
// Mobile: resumo accordion no topo, formulário abaixo
<div className="space-y-4 lg:hidden">
  {/* Accordion do resumo */}
  <details className="rounded-lg border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-black">
    <summary className="flex cursor-pointer items-center justify-between p-4">
      <span className="text-sm font-medium">Ver resumo do pedido</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-bold">R$ 149,90</span>
        <ChevronDownIcon className="h-4 w-4" />
      </div>
    </summary>
    <div className="border-t border-neutral-200 p-4 dark:border-neutral-700">
      {/* itens do pedido */}
    </div>
  </details>
  {/* Formulário */}
</div>
```

### 2.2 Formulário de Endereço

#### Campos na ordem exata (ref: CK-02, CK-08, CK-13)

```jsx
// Seção 1 — Identificação (captura e-mail PRIMEIRO para recuperação de abandono)
<section className="rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-700 dark:bg-black">
  <h2 className="mb-4 text-base font-semibold text-black dark:text-white">
    1. Identificação
  </h2>
  <div className="flex flex-col gap-4">
    <FormField label="E-mail" id="email" type="email" required
      placeholder="seu@email.com" />
  </div>
</section>

// Seção 2 — Entrega
<section className="rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-700 dark:bg-black">
  <h2 className="mb-4 text-base font-semibold text-black dark:text-white">
    2. Endereço de entrega
  </h2>
  <div className="flex flex-col gap-4">
    <FormField label="Nome completo" id="full-name" required />

    {/* Linha com CEP */}
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
      <div className="col-span-1">
        <FormField label="CEP" id="cep" required placeholder="00000-000"
          maxLength={9}
          // onBlur → chama ViaCEP
        />
      </div>
      {/* Espaço para mensagem "não sei meu CEP" */}
      <div className="col-span-1 flex items-end pb-2.5">
        <a href="https://buscacepinter.correios.com.br" target="_blank"
           className="text-xs text-blue-600 hover:underline dark:text-blue-400">
          Não sei meu CEP
        </a>
      </div>
    </div>

    {/* Campos preenchidos via ViaCEP */}
    <FormField label="Endereço" id="street" required />

    <div className="grid grid-cols-3 gap-4">
      <FormField label="Número" id="number" required className="col-span-1" />
      <FormField label="Complemento" id="complement" optional className="col-span-2" />
    </div>

    <FormField label="Bairro" id="neighborhood" required />

    <div className="grid grid-cols-3 gap-4">
      {/* cidade e estado são read-only — preenchidos pelo CEP */}
      <FormField label="Cidade" id="city" readOnly className="col-span-2" />
      <FormField label="UF" id="state" readOnly className="col-span-1" />
    </div>

    <FormField label="Telefone" id="phone" type="tel" required
      placeholder="(11) 99999-9999" />
  </div>
</section>
```

#### Auto-fill CEP — lógica de UX

1. Campo CEP: `onBlur` e ao completar 8 dígitos numéricos dispara `fetch('https://viacep.com.br/ws/{CEP}/json/')`
2. Durante a busca: substituir campos `street`, `neighborhood`, `city`, `state` pelo shimmer:
   ```jsx
   <div className="h-10 w-full rounded-lg bg-neutral-200 animate-pulse dark:bg-neutral-800" />
   ```
3. Se encontrado: preencher campos + mover foco automaticamente para `#number`
4. Se não encontrado: exibir no campo CEP:
   ```jsx
   <p className="text-xs text-red-600 dark:text-red-400" role="alert">
     CEP não encontrado. Verifique e tente novamente.
   </p>
   ```
5. Campos `city` e `state` com classe `read-only`: `bg-neutral-100 dark:bg-neutral-800 cursor-default`

#### Máscara de CEP

Formatar input como `XXXXX-XXX` ao digitar. Enviar para API sem hífen.

### 2.3 Seleção de Frete

Radio cards — um card por opção de frete:

```jsx
<section className="rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-700 dark:bg-black">
  <h2 className="mb-4 text-base font-semibold text-black dark:text-white">
    3. Frete
  </h2>
  <div className="flex flex-col gap-3">
    {shippingOptions.map((option) => (
      <label
        key={option.id}
        className={clsx(
          "flex cursor-pointer items-center justify-between rounded-lg border p-4 transition-colors",
          selectedShipping === option.id
            ? "border-2 border-blue-600 bg-blue-50 dark:bg-blue-950/20"
            : "border-neutral-200 hover:border-blue-600 dark:border-neutral-700"
        )}
      >
        <div className="flex items-center gap-3">
          <input
            type="radio"
            name="shipping"
            value={option.id}
            className="h-4 w-4 accent-blue-600"
            onChange={() => setSelectedShipping(option.id)}
          />
          <div>
            <p className="text-sm font-medium text-black dark:text-white">
              {option.name}
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Entrega em {option.days} dias úteis
            </p>
          </div>
        </div>
        <p className="text-sm font-semibold text-black dark:text-white">
          {option.price === 0 ? (
            <span className="text-green-600 dark:text-green-400">Grátis</span>
          ) : (
            <Price amount={String(option.price)} currencyCode="BRL" />
          )}
        </p>
      </label>
    ))}
    {/* Estado de loading dos fretes */}
    {loadingShipping && (
      <div className="flex flex-col gap-3">
        {[1, 2].map((i) => (
          <div key={i} className="h-16 rounded-lg bg-neutral-200 animate-pulse dark:bg-neutral-800" />
        ))}
      </div>
    )}
    {/* Sem CEP preenchido */}
    {!cepFilled && (
      <p className="text-sm text-neutral-500 dark:text-neutral-400">
        Preencha o CEP para ver as opções de frete.
      </p>
    )}
  </div>
</section>
```

### 2.4 Seleção de Pagamento

Tabs de método de pagamento — PIX em destaque como primeiro e padrão (ref: CK-04):

```jsx
<section className="rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-700 dark:bg-black">
  <h2 className="mb-4 text-base font-semibold text-black dark:text-white">
    4. Pagamento
  </h2>

  {/* Tabs de método */}
  <div className="mb-6 flex rounded-lg border border-neutral-200 p-1 dark:border-neutral-700">
    {['pix', 'boleto', 'cartao'].map((method) => (
      <button
        key={method}
        onClick={() => setPaymentMethod(method)}
        className={clsx(
          "flex flex-1 items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition-colors",
          activeMethod === method
            ? "bg-blue-600 text-white"
            : "text-neutral-500 hover:text-black dark:hover:text-white"
        )}
      >
        {method === 'pix' && <span>PIX</span>}
        {method === 'boleto' && <span>Boleto</span>}
        {method === 'cartao' && <span>Cartão</span>}
      </button>
    ))}
  </div>

  {/* Conteúdo condicional por método */}
  {activeMethod === 'pix' && <PixPaymentContent />}
  {activeMethod === 'boleto' && <BoletoPaymentContent />}
  {activeMethod === 'cartao' && <CardPaymentContent />}
</section>
```

**Tab ativa**: `bg-blue-600 text-white` | **Tab inativa**: `text-neutral-500 hover:text-black`

#### Cartão de crédito — campos

```jsx
<div className="flex flex-col gap-4">
  <FormField label="Número do cartão" id="card-number" placeholder="0000 0000 0000 0000" />
  <FormField label="Nome no cartão" id="card-name" placeholder="Como está no cartão" />
  <div className="grid grid-cols-2 gap-4">
    <FormField label="Validade" id="card-expiry" placeholder="MM/AA" />
    <FormField label="CVV" id="card-cvv" placeholder="123" maxLength={4} />
  </div>
  <FormSelect label="Parcelas" id="installments">
    <option value="1">1x de R$ 149,90 sem juros</option>
    <option value="2">2x de R$ 74,95 sem juros</option>
  </FormSelect>
</div>
```

### 2.5 Componente PIX

Exibido após clicar "Gerar QR Code PIX" / submit do pedido com PIX selecionado.

```jsx
// PendingPIX component
<div className="flex flex-col items-center gap-6 py-2">
  {/* Instruções em 3 passos */}
  <div className="flex w-full justify-around text-center text-xs text-neutral-500 dark:text-neutral-400">
    <div className="flex flex-col items-center gap-1">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">1</span>
      <span>Abra seu banco</span>
    </div>
    <div className="h-px w-8 self-center border-t border-dashed border-neutral-300 dark:border-neutral-700" />
    <div className="flex flex-col items-center gap-1">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">2</span>
      <span>Acesse PIX</span>
    </div>
    <div className="h-px w-8 self-center border-t border-dashed border-neutral-300 dark:border-neutral-700" />
    <div className="flex flex-col items-center gap-1">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">3</span>
      <span>Escaneie ou cole</span>
    </div>
  </div>

  {/* QR Code — mínimo 200x200 mobile, 256x256 desktop */}
  <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-white">
    {/* <Image> com o QR code gerado pelo Asaas */}
    <img
      src={pixQrCodeUrl}
      alt="QR Code PIX"
      className="h-[200px] w-[200px] md:h-[256px] md:w-[256px]"
    />
  </div>

  {/* Countdown timer */}
  {/* timer: neutro acima de 5min, amarelo entre 2-5min, vermelho abaixo de 2min */}
  <div className={clsx(
    "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium",
    minutesLeft > 5
      ? "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
      : minutesLeft > 2
        ? "bg-yellow-50 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400"
        : "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400"
  )}>
    <ClockIcon className="h-4 w-4" />
    <span>Expira em <strong>{formattedTime}</strong></span>
  </div>

  {/* Código copia-e-cola — DESTAQUE em mobile */}
  <div className="w-full">
    <p className="mb-1.5 text-xs font-medium text-neutral-500 dark:text-neutral-400">
      Ou copie o código PIX:
    </p>
    <div className="flex gap-2">
      <input
        readOnly
        value={pixCopyPasteCode}
        className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 font-mono text-xs text-neutral-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
      />
      <button
        onClick={handleCopy}
        className={clsx(
          "shrink-0 rounded-lg border px-3 py-2 text-xs font-medium transition-all",
          copied
            ? "border-green-500 bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-400"
            : "border-neutral-200 bg-white text-black hover:border-blue-600 dark:border-neutral-700 dark:bg-black dark:text-white"
        )}
      >
        {copied ? (
          <span className="flex items-center gap-1">
            <CheckIcon className="h-3.5 w-3.5" /> Copiado!
          </span>
        ) : (
          <span className="flex items-center gap-1">
            <ClipboardIcon className="h-3.5 w-3.5" /> Copiar
          </span>
        )}
      </button>
    </div>
  </div>

  {/* Status de aguardo */}
  <div className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
    <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
    Aguardando confirmação do pagamento...
  </div>
</div>
```

**Comportamento do botão Copiar**:
- Estado padrão: ícone `ClipboardIcon` + texto "Copiar"
- Estado copiado (2 segundos): ícone `CheckIcon` + texto "Copiado!" + classes verdes
- Após 2s: volta ao estado padrão

**Polling**: a cada 3 segundos, verificar status do pagamento. Ao confirmar, redirecionar para `/checkout/confirmacao/[id]` sem reload de página.

**QR Code expirado**:
```jsx
<div className="flex flex-col items-center gap-4 py-8 text-center">
  <ClockIcon className="h-12 w-12 text-neutral-400" />
  <div>
    <p className="font-medium text-black dark:text-white">QR Code expirado</p>
    <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
      O código PIX expirou após 30 minutos.
    </p>
  </div>
  <button className="rounded-full bg-blue-600 px-6 py-2.5 text-sm font-medium text-white opacity-90 hover:opacity-100">
    Gerar novo QR Code
  </button>
</div>
```

### 2.6 Componente Boleto

```jsx
// BoletoViewer component
<div className="flex flex-col gap-5">
  {/* Data de vencimento em destaque */}
  <div className="rounded-lg bg-yellow-50 px-4 py-3 dark:bg-yellow-950/30">
    <p className="text-sm font-medium text-yellow-800 dark:text-yellow-400">
      Vence em {formatDate(boletoExpiresAt)} — 3 dias úteis para compensar
    </p>
  </div>

  {/* Linha digitável */}
  <div>
    <p className="mb-1.5 text-xs font-medium text-neutral-500 dark:text-neutral-400">
      Linha digitável:
    </p>
    {/* Exibir quebrada em grupos para leitura manual */}
    <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-700 dark:bg-neutral-900">
      <p className="font-mono text-sm tracking-wide text-neutral-700 dark:text-neutral-300 break-all">
        {formatBoletoLine(boletoBarcode)}
        {/* Ex: "12345.67890  12345.678901  12345.678901  1  12340000018900" */}
      </p>
    </div>
  </div>

  {/* Ações */}
  <div className="flex flex-col gap-3 sm:flex-row">
    <button
      onClick={handleCopyBarcode}
      className={clsx(
        "flex flex-1 items-center justify-center gap-2 rounded-full border py-2.5 text-sm font-medium transition-all",
        copiedBarcode
          ? "border-green-500 bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-400"
          : "border-neutral-200 bg-white text-black hover:border-blue-600 dark:border-neutral-700 dark:bg-black dark:text-white"
      )}
    >
      {copiedBarcode
        ? <><CheckIcon className="h-4 w-4" /> Copiado!</>
        : <><ClipboardIcon className="h-4 w-4" /> Copiar linha digitável</>
      }
    </button>
    <a
      href={boletoPdfUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex flex-1 items-center justify-center gap-2 rounded-full bg-blue-600 py-2.5 text-sm font-medium text-white opacity-90 hover:opacity-100"
    >
      <ArrowDownTrayIcon className="h-4 w-4" />
      Baixar PDF do Boleto
    </a>
  </div>

  {/* Avisos obrigatórios */}
  <div className="space-y-2 rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-900">
    <p className="text-xs text-neutral-600 dark:text-neutral-400">
      • Seu pedido será confirmado após a aprovação do pagamento (1 a 3 dias úteis).
    </p>
    <p className="text-xs text-neutral-600 dark:text-neutral-400">
      • Não pague após a data de vencimento. Gere um novo boleto se necessário.
    </p>
    <p className="text-xs text-neutral-600 dark:text-neutral-400">
      • Enviamos o boleto para o seu e-mail. Verifique também o spam.
    </p>
  </div>
</div>
```

### 2.7 Polling de Status de Pagamento

Tela intermediária exibida enquanto se aguarda confirmação (PIX) ou geração (Boleto):

```jsx
// Estados sequenciais do polling

// 1. Aguardando (initial)
<div className="flex flex-col items-center gap-4 py-12 text-center">
  <div className="relative">
    <div className="h-16 w-16 rounded-full border-4 border-neutral-200 dark:border-neutral-700" />
    <div className="absolute inset-0 h-16 w-16 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
  </div>
  <p className="text-base font-medium text-black dark:text-white">
    Aguardando pagamento...
  </p>
  <p className="text-sm text-neutral-500 dark:text-neutral-400">
    Verificando automaticamente a cada 3 segundos
  </p>
</div>

// 2. Pago / Confirmado (success)
<div className="flex flex-col items-center gap-4 py-12 text-center">
  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-950/40">
    <CheckIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
  </div>
  <p className="text-base font-medium text-black dark:text-white">
    Pagamento confirmado!
  </p>
  <p className="text-sm text-neutral-500 dark:text-neutral-400">
    Redirecionando para sua confirmação...
  </p>
  {/* Transição automática sem ação do usuário */}
</div>

// 3. Erro no pagamento
<div className="flex flex-col items-center gap-4 py-12 text-center">
  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/40">
    <XMarkIcon className="h-8 w-8 text-red-600 dark:text-red-400" />
  </div>
  <p className="text-base font-medium text-black dark:text-white">
    Não conseguimos confirmar o pagamento
  </p>
  <p className="text-sm text-neutral-500 dark:text-neutral-400">
    Tente novamente ou escolha outro método.
  </p>
  <div className="flex gap-3 mt-2">
    <button className="rounded-full border border-neutral-200 px-5 py-2 text-sm font-medium text-black hover:border-blue-600 dark:border-neutral-700 dark:text-white">
      Tentar novamente
    </button>
    <button className="rounded-full bg-blue-600 px-5 py-2 text-sm font-medium text-white opacity-90 hover:opacity-100">
      Outro método
    </button>
  </div>
</div>
```

### 2.8 Confirmação do Pedido (`/checkout/confirmacao/[id]`)

```jsx
<div className="min-h-screen bg-neutral-50 py-12 dark:bg-neutral-900">
  <div className="mx-auto max-w-2xl px-4">

    {/* Header de sucesso */}
    <div className="mb-8 flex flex-col items-center text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-950/40">
        <CheckIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
      </div>
      <h1 className="text-3xl font-bold text-black dark:text-white">
        Pedido realizado!
      </h1>
      <p className="mt-2 text-neutral-500 dark:text-neutral-400">
        Obrigado pela sua compra. Você receberá um e-mail de confirmação em breve.
      </p>
    </div>

    {/* Número do pedido */}
    <div className="mb-6 rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-700 dark:bg-black">
      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Número do pedido</p>
        <p className="font-mono text-sm font-semibold text-black dark:text-white">#{orderId}</p>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Status</p>
        {/* usar badge de status do pedido (seção 1.5) */}
        <StatusBadge status="pending" />
      </div>
      <div className="mt-3 flex items-center justify-between">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Método de pagamento</p>
        <p className="text-sm text-black dark:text-white">{paymentMethod}</p>
      </div>
    </div>

    {/* Resumo dos itens */}
    <div className="mb-6 rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-700 dark:bg-black">
      <h2 className="mb-4 text-base font-semibold text-black dark:text-white">
        Itens do pedido
      </h2>
      {/* lista de itens — mesmo padrão do CartModal */}
      <ul className="divide-y divide-neutral-200 dark:divide-neutral-700">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-4 py-4">
            <div className="h-16 w-16 overflow-hidden rounded-md border border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900">
              <img className="h-full w-full object-cover" src={item.image} alt={item.title} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium leading-tight text-black dark:text-white">{item.title}</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">Qtd: {item.quantity}</p>
            </div>
            <Price amount={item.price} currencyCode="BRL" className="text-sm text-black dark:text-white" />
          </li>
        ))}
      </ul>
      {/* Totais */}
      <div className="mt-4 space-y-2 border-t border-neutral-200 pt-4 dark:border-neutral-700">
        <div className="flex justify-between text-sm text-neutral-500 dark:text-neutral-400">
          <span>Subtotal</span>
          <Price amount={subtotal} currencyCode="BRL" />
        </div>
        <div className="flex justify-between text-sm text-neutral-500 dark:text-neutral-400">
          <span>Frete</span>
          <Price amount={shipping} currencyCode="BRL" />
        </div>
        <div className="flex justify-between text-base font-semibold text-black dark:text-white">
          <span>Total</span>
          <Price amount={total} currencyCode="BRL" />
        </div>
      </div>
    </div>

    {/* Próximos passos */}
    <div className="mb-6 rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-700 dark:bg-black">
      <h2 className="mb-3 text-base font-semibold text-black dark:text-white">
        O que acontece agora?
      </h2>
      <ul className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
        <li className="flex items-start gap-2">
          <CheckCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
          Você receberá um e-mail de confirmação com os detalhes do pedido.
        </li>
        <li className="flex items-start gap-2">
          <CheckCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
          Assim que seu pedido for enviado, você receberá o código de rastreamento.
        </li>
        {/* Condicional para boleto */}
        {paymentMethod === 'boleto' && (
          <li className="flex items-start gap-2">
            <InformationCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
            Seu pedido será separado após a confirmação do pagamento (1 a 3 dias úteis).
          </li>
        )}
      </ul>
    </div>

    {/* CTA pós-compra: criar conta */}
    {!isLoggedIn && (
      <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-6 dark:border-blue-800 dark:bg-blue-950/20">
        <h3 className="mb-1 font-semibold text-blue-900 dark:text-blue-300">
          Acompanhe seus pedidos facilmente
        </h3>
        <p className="mb-4 text-sm text-blue-700 dark:text-blue-400">
          Crie uma conta gratuita com o e-mail que você usou no checkout e veja todos os seus pedidos em um só lugar.
        </p>
        <div className="flex gap-3">
          <Link
            href={`/account/register?email=${encodeURIComponent(email)}&from=checkout`}
            className="rounded-full bg-blue-600 px-5 py-2 text-sm font-medium text-white opacity-90 hover:opacity-100"
          >
            Criar minha conta
          </Link>
          <button className="text-sm text-blue-600 hover:underline dark:text-blue-400">
            Agora não
          </button>
        </div>
      </div>
    )}

    {/* Ações finais */}
    <div className="flex justify-center">
      <Link
        href="/"
        className="rounded-full border border-neutral-200 px-6 py-2.5 text-sm font-medium text-black transition-colors hover:border-blue-600 dark:border-neutral-700 dark:text-white"
      >
        Continuar comprando
      </Link>
    </div>
  </div>
</div>
```

### 2.9 Elementos de Confiança (Trust Signals)

Exibir no rodapé do formulário de checkout, abaixo do botão "Finalizar pedido":

```jsx
{/* Botão de finalizar pedido */}
<button
  type="submit"
  disabled={!formValid || pending}
  className="block w-full rounded-full bg-blue-600 p-3 text-center text-sm font-medium text-white opacity-90 hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-60"
>
  {pending ? <LoadingDots className="bg-white" /> : "Finalizar pedido"}
</button>

{/* Trust signals — logo abaixo do CTA */}
<div className="mt-4 flex flex-col items-center gap-3">
  {/* Cadeado + segurança */}
  <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
    <LockClosedIcon className="h-3.5 w-3.5" />
    <span>Pagamento 100% seguro e criptografado</span>
  </div>

  {/* Logos de métodos aceitos */}
  <div className="flex items-center gap-3 text-xs text-neutral-400 dark:text-neutral-600">
    <span>PIX</span>
    <span>·</span>
    <span>Boleto</span>
    <span>·</span>
    <span>Visa</span>
    <span>·</span>
    <span>Mastercard</span>
  </div>

  {/* Política de devolução */}
  <p className="text-xs text-neutral-500 dark:text-neutral-400">
    Compra com garantia de 30 dias para troca ou devolução
  </p>
</div>
```

**Botão "Finalizar pedido"**: desabilitado (`disabled:cursor-not-allowed disabled:opacity-60`) enquanto formulário inválido ou durante envio. Usa `<LoadingDots className="bg-white" />` durante `pending` — mesmo padrão do `CheckoutButton` em `cart/modal.tsx`.

---

## 3. Autenticação e Conta do Cliente

### 3.1 Login (`/account/login`)

```jsx
<div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 dark:bg-neutral-900">
  <div className="w-full max-w-sm">
    {/* Logo */}
    <div className="mb-8 flex justify-center">
      <LogoSquare />
    </div>

    <div className="rounded-lg border border-neutral-200 bg-white p-8 dark:border-neutral-700 dark:bg-black">
      <h1 className="mb-6 text-xl font-semibold text-black dark:text-white">
        Entrar
      </h1>

      {/* Erro de login (credenciais inválidas) */}
      {loginError && (
        <div
          role="alert"
          className="mb-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400"
        >
          <ExclamationCircleIcon className="h-4 w-4 shrink-0 mt-0.5" />
          <span>E-mail ou senha incorretos. Tente novamente.</span>
        </div>
      )}

      <form className="flex flex-col gap-4">
        <FormField label="E-mail" id="email" type="email" required />
        {/* Senha com show/hide */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-sm font-medium text-black dark:text-white">
            Senha
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              className="w-full rounded-lg border border-neutral-200 bg-white px-4 py-2.5 pr-11 text-sm text-black dark:border-neutral-700 dark:bg-black dark:text-white"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-black dark:hover:text-white"
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            >
              {showPassword
                ? <EyeSlashIcon className="h-5 w-5" />
                : <EyeIcon className="h-5 w-5" />
              }
            </button>
          </div>
        </div>

        {/* Link esqueci senha */}
        <div className="flex justify-end">
          <Link href="/account/forgot-password" className="text-xs text-blue-600 hover:underline underline-offset-4 dark:text-blue-400">
            Esqueci minha senha
          </Link>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={pending}
          className="block w-full rounded-full bg-blue-600 p-3 text-center text-sm font-medium text-white opacity-90 hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? <LoadingDots className="bg-white" /> : "Entrar"}
        </button>
      </form>

      {/* Divider */}
      <div className="my-6 flex items-center gap-3">
        <div className="flex-1 border-t border-neutral-200 dark:border-neutral-700" />
        <span className="text-xs text-neutral-400">ou</span>
        <div className="flex-1 border-t border-neutral-200 dark:border-neutral-700" />
      </div>

      {/* Link para cadastro */}
      <p className="text-center text-sm text-neutral-500 dark:text-neutral-400">
        Não tem uma conta?{" "}
        <Link href="/account/register" className="text-blue-600 hover:underline underline-offset-4 dark:text-blue-400">
          Criar conta
        </Link>
      </p>
    </div>
  </div>
</div>
```

**Erros inline**: exibir mensagem genérica "E-mail ou senha incorretos" — nunca revelar qual campo está errado (segurança).

**Redirect pós-login**: ler `?redirect=` da query string. Default: `/account`.

### 3.2 Cadastro (`/account/register`)

Campos mínimos — máximo 3 campos para não causar abandono (ref: AU-02):

```jsx
<div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 dark:bg-neutral-900">
  <div className="w-full max-w-sm">
    <div className="mb-8 flex justify-center">
      <LogoSquare />
    </div>

    <div className="rounded-lg border border-neutral-200 bg-white p-8 dark:border-neutral-700 dark:bg-black">
      <h1 className="mb-2 text-xl font-semibold text-black dark:text-white">
        Criar conta
      </h1>
      <p className="mb-6 text-sm text-neutral-500 dark:text-neutral-400">
        Acompanhe seus pedidos e tenha uma experiência mais rápida.
      </p>

      <form className="flex flex-col gap-4">
        <FormField label="Nome completo" id="full-name" required />
        <FormField label="E-mail" id="email" type="email" required />
        {/* Senha com show/hide — mínimo 8 caracteres, sem complexidade excessiva */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-sm font-medium text-black dark:text-white">
            Senha
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              minLength={8}
              className="w-full rounded-lg border border-neutral-200 bg-white px-4 py-2.5 pr-11 text-sm text-black dark:border-neutral-700 dark:bg-black dark:text-white"
            />
            <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-black dark:hover:text-white" aria-label="Mostrar senha">
              <EyeIcon className="h-5 w-5" />
            </button>
          </div>
          <p className="text-xs text-neutral-400 dark:text-neutral-500">
            Mínimo de 8 caracteres.
          </p>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="block w-full rounded-full bg-blue-600 p-3 text-center text-sm font-medium text-white opacity-90 hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? <LoadingDots className="bg-white" /> : "Criar conta"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-neutral-500 dark:text-neutral-400">
        Já tem uma conta?{" "}
        <Link href="/account/login" className="text-blue-600 hover:underline underline-offset-4 dark:text-blue-400">
          Entrar
        </Link>
      </p>
    </div>
  </div>
</div>
```

**Campos que NÃO devem ser pedidos no cadastro**: telefone, data de nascimento, CPF, confirmação de senha, newsletter opt-in.

**Mensagem pós-cadastro**: toast de boas-vindas via `sonner`: `toast.success("Conta criada! Bem-vindo(a) à Doze Crew.")`.

### 3.3 Dashboard do Cliente (`/account`)

Layout com navegação lateral no desktop, menu accordion/tabs no mobile:

```jsx
<div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
  {/* Navbar padrão do site */}
  <Navbar />

  <div className="mx-auto max-w-6xl px-4 py-8">
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">

      {/* Sidebar de navegação (desktop) */}
      <nav className="hidden lg:col-span-3 lg:block">
        <div className="sticky top-8 rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-black">
          {/* Avatar / nome */}
          <div className="mb-4 flex items-center gap-3 px-2 pb-4 border-b border-neutral-200 dark:border-neutral-700">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-200 dark:bg-neutral-700">
              <UserIcon className="h-5 w-5 text-neutral-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-black dark:text-white">{customerName}</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{customerEmail}</p>
            </div>
          </div>
          {/* Links */}
          <ul className="space-y-1">
            {[
              { href: '/account', label: 'Início', icon: HomeIcon },
              { href: '/account/orders', label: 'Meus pedidos', icon: ShoppingBagIcon },
              { href: '/account/profile', label: 'Dados pessoais', icon: UserIcon },
              { href: '/account/addresses', label: 'Endereços', icon: MapPinIcon },
            ].map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={clsx(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                    pathname === item.href
                      ? "bg-neutral-100 font-medium text-black dark:bg-neutral-800 dark:text-white"
                      : "text-neutral-500 hover:bg-neutral-50 hover:text-black dark:hover:bg-neutral-900 dark:hover:text-white"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          {/* Logout */}
          <div className="mt-4 border-t border-neutral-200 pt-4 dark:border-neutral-700">
            <button className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-neutral-500 transition-colors hover:bg-neutral-50 hover:text-black dark:hover:bg-neutral-900 dark:hover:text-white">
              <ArrowRightOnRectangleIcon className="h-4 w-4" />
              Sair
            </button>
          </div>
        </div>
      </nav>

      {/* Navegação mobile (tabs horizontais) */}
      <div className="overflow-x-auto lg:hidden">
        <nav className="flex gap-1 rounded-lg border border-neutral-200 bg-white p-1 dark:border-neutral-700 dark:bg-black">
          {['Início', 'Pedidos', 'Perfil', 'Endereços'].map((tab) => (
            <button
              key={tab}
              className={clsx(
                "shrink-0 rounded-md px-4 py-2 text-sm font-medium transition-colors",
                activeTab === tab
                  ? "bg-blue-600 text-white"
                  : "text-neutral-500 hover:text-black dark:hover:text-white"
              )}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Conteúdo principal */}
      <main className="lg:col-span-9">
        {/* Boas-vindas */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-black dark:text-white">
            Olá, {firstName}!
          </h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Bem-vindo(a) de volta.
          </p>
        </div>
        {/* conteúdo da sub-página */}
      </main>
    </div>
  </div>
</div>
```

**Item ativo na sidebar**: `bg-neutral-100 font-medium text-black dark:bg-neutral-800 dark:text-white`
**Item inativo**: `text-neutral-500 hover:bg-neutral-50 hover:text-black`

### 3.4 Histórico de Pedidos (`/account/orders`)

```jsx
<div>
  <h2 className="mb-4 text-xl font-semibold text-black dark:text-white">
    Meus pedidos
  </h2>

  {/* Estado vazio */}
  {orders.length === 0 && (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <ShoppingBagIcon className="h-12 w-12 text-neutral-300 dark:text-neutral-600" />
      <p className="mt-4 text-lg font-medium text-black dark:text-white">
        Você ainda não fez nenhum pedido
      </p>
      <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
        Quando você fizer uma compra, ela aparecerá aqui.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-full bg-blue-600 px-6 py-2.5 text-sm font-medium text-white opacity-90 hover:opacity-100"
      >
        Começar a comprar
      </Link>
    </div>
  )}

  {/* Lista de pedidos */}
  <ul className="space-y-3">
    {orders.map((order) => (
      <li key={order.id}>
        <Link
          href={`/account/orders/${order.id}`}
          className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white p-5 transition-colors hover:border-blue-600 dark:border-neutral-700 dark:bg-black"
        >
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium text-black dark:text-white">
              Pedido #{order.number}
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {formatDate(order.createdAt)} · {order.itemsCount} {order.itemsCount === 1 ? 'item' : 'itens'}
            </p>
          </div>
          <div className="flex items-center gap-4">
            {/* Status badge (ver seção 1.5) */}
            <OrderStatusBadge status={order.status} />
            <div className="text-right">
              <Price
                amount={order.total}
                currencyCode="BRL"
                className="text-sm font-semibold text-black dark:text-white"
              />
            </div>
            <ChevronRightIcon className="h-4 w-4 text-neutral-400" />
          </div>
        </Link>
      </li>
    ))}
  </ul>
</div>
```

### 3.5 Detalhe do Pedido (`/account/orders/[id]`)

```jsx
<div>
  {/* Breadcrumb */}
  <nav className="mb-6 flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
    <Link href="/account" className="hover:text-black dark:hover:text-white">Conta</Link>
    <ChevronRightIcon className="h-3.5 w-3.5" />
    <Link href="/account/orders" className="hover:text-black dark:hover:text-white">Pedidos</Link>
    <ChevronRightIcon className="h-3.5 w-3.5" />
    <span className="text-black dark:text-white">#{order.number}</span>
  </nav>

  <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
    <div>
      <h2 className="text-xl font-semibold text-black dark:text-white">
        Pedido #{order.number}
      </h2>
      <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
        Realizado em {formatDate(order.createdAt)}
      </p>
    </div>
    <OrderStatusBadge status={order.status} />
  </div>

  {/* Grid de informações */}
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
    <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-black">
      <p className="mb-1 text-xs text-neutral-500 dark:text-neutral-400">Pagamento</p>
      <p className="text-sm font-medium text-black dark:text-white">{order.paymentMethod}</p>
    </div>
    <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-black">
      <p className="mb-1 text-xs text-neutral-500 dark:text-neutral-400">Endereço de entrega</p>
      <p className="text-sm text-black dark:text-white">{order.shippingAddress}</p>
    </div>
    {order.trackingCode && (
      <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-black">
        <p className="mb-1 text-xs text-neutral-500 dark:text-neutral-400">Rastreamento</p>
        <p className="font-mono text-sm font-medium text-black dark:text-white">{order.trackingCode}</p>
      </div>
    )}
  </div>

  {/* Itens — mesmo padrão do CartModal */}
  <div className="rounded-lg border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-black">
    <div className="border-b border-neutral-200 p-5 dark:border-neutral-700">
      <h3 className="text-base font-semibold text-black dark:text-white">Itens</h3>
    </div>
    <ul className="divide-y divide-neutral-200 dark:divide-neutral-700">
      {order.items.map((item) => (
        <li key={item.id} className="flex items-center gap-4 p-5">
          <div className="h-16 w-16 overflow-hidden rounded-md border border-neutral-200 dark:border-neutral-700">
            <img className="h-full w-full object-cover" src={item.image} alt={item.title} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium leading-tight text-black dark:text-white">{item.title}</p>
            {item.variant && <p className="text-xs text-neutral-500 dark:text-neutral-400">{item.variant}</p>}
            <p className="text-xs text-neutral-500 dark:text-neutral-400">Qtd: {item.quantity}</p>
          </div>
          <Price amount={item.total} currencyCode="BRL" className="text-sm font-medium text-black dark:text-white" />
        </li>
      ))}
    </ul>
    {/* Totais */}
    <div className="border-t border-neutral-200 p-5 dark:border-neutral-700">
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-neutral-500 dark:text-neutral-400">
          <span>Subtotal</span>
          <Price amount={order.subtotal} currencyCode="BRL" />
        </div>
        <div className="flex justify-between text-sm text-neutral-500 dark:text-neutral-400">
          <span>Frete</span>
          <Price amount={order.shipping} currencyCode="BRL" />
        </div>
        <div className="flex justify-between text-base font-semibold text-black dark:text-white">
          <span>Total</span>
          <Price amount={order.total} currencyCode="BRL" />
        </div>
      </div>
    </div>
  </div>
</div>
```

---

## 4. Marketplace Hub (Admin)

> Estas páginas ficam no admin customizado do Medusa. O design segue o mesmo DNA visual (Geist Sans, neutral palette, dark mode) adaptado para contexto de painel administrativo.

### 4.1 Grid de Plataformas

Layout principal do hub em `/marketplace` (admin):

```jsx
<div className="p-6">
  {/* Header da página */}
  <div className="mb-8">
    <h1 className="text-2xl font-bold text-black dark:text-white">
      Integrações com Marketplaces
    </h1>
    <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
      Conecte sua loja aos principais canais de venda e sincronize produtos e pedidos automaticamente.
    </p>
  </div>

  {/* Banner de erro crítico — sem sync há +24h */}
  {hasCriticalError && (
    <div
      role="alert"
      className="mb-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/30"
    >
      <ExclamationTriangleIcon className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm font-medium text-red-700 dark:text-red-400">
          Atenção: uma ou mais integrações estão com problema há mais de 24 horas.
        </p>
        <p className="mt-0.5 text-sm text-red-600 dark:text-red-400">
          Seus pedidos podem não estar sendo sincronizados corretamente.
        </p>
      </div>
    </div>
  )}

  {/* Grid de cards — 1 col mobile, 2 col md, 3 col lg */}
  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
    {marketplaces.map((mp) => (
      <MarketplaceCard key={mp.id} marketplace={mp} />
    ))}
  </div>
</div>
```

### 4.2 Status Badges dos Cards (5 estados com classes exatas)

Ver seção 1.5 para as classes exatas de cada badge. Referência rápida:

| Estado | Badge | Ação disponível |
|--------|-------|----------------|
| Não conectado | Neutro (neutral-200/neutral-600) | Botão "Conectar" |
| Conectando | Azul com pulse (blue-600) | Botão desabilitado |
| Conectado | Verde (green-500) | Botões "Configurar" + "Desconectar" |
| Sincronizando | Azul com spin (blue-400) | Sem ação |
| Erro | Vermelho (red-500) | Botões "Reconectar" + "Ver detalhes" |
| Token expirado | Amarelo (yellow-500) | Botão "Reconectar" |

### 4.3 MarketplaceCard — markup completo

```jsx
// MarketplaceCard component
function MarketplaceCard({ marketplace }) {
  const { id, name, logo, status, lastSync, productsCount, ordersToday } = marketplace;

  return (
    <div className="flex flex-col rounded-lg border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-black">
      {/* Header do card */}
      <div className="flex items-center justify-between p-5 border-b border-neutral-200 dark:border-neutral-700">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md border border-neutral-200 bg-white p-1.5 dark:border-neutral-700">
            <img src={logo} alt={name} className="h-full w-full object-contain" />
          </div>
          <p className="text-sm font-semibold text-black dark:text-white">{name}</p>
        </div>
        {/* Status badge — ver seção 1.5 */}
        <StatusBadge status={status} />
      </div>

      {/* Body do card — métricas (apenas quando conectado) */}
      {status === 'connected' || status === 'syncing' ? (
        <div className="flex-1 p-5 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-500 dark:text-neutral-400">Última sincronização</span>
            <span className="font-medium text-black dark:text-white">
              {formatRelativeTime(lastSync)}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-500 dark:text-neutral-400">Produtos sincronizados</span>
            <span className="font-medium text-black dark:text-white">{productsCount}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-500 dark:text-neutral-400">Pedidos hoje</span>
            <span className="font-medium text-black dark:text-white">{ordersToday}</span>
          </div>
        </div>
      ) : status === 'error' ? (
        /* Mensagem de erro não-técnica */
        <div className="flex-1 p-5">
          <div className="flex items-start gap-2 text-sm text-neutral-600 dark:text-neutral-400">
            <ExclamationTriangleIcon className="h-4 w-4 shrink-0 mt-0.5 text-yellow-500" />
            <span>
              Não conseguimos sincronizar seus dados. Isso pode acontecer quando a autorização expira.
            </span>
          </div>
        </div>
      ) : (
        /* Não conectado — descrição */
        <div className="flex-1 p-5">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Conecte sua conta para sincronizar produtos e pedidos automaticamente.
          </p>
        </div>
      )}

      {/* Footer — ações */}
      <div className="flex gap-2 border-t border-neutral-200 p-4 dark:border-neutral-700">
        {status === 'disconnected' && (
          <button
            onClick={() => initiateConnection(id)}
            className="flex flex-1 items-center justify-center rounded-full bg-blue-600 py-2 text-sm font-medium text-white opacity-90 hover:opacity-100"
          >
            Conectar
          </button>
        )}
        {status === 'connecting' && (
          <button
            disabled
            className="flex flex-1 items-center justify-center rounded-full bg-blue-600 py-2 text-sm font-medium text-white cursor-not-allowed opacity-60"
          >
            <LoadingDots className="bg-white" />
          </button>
        )}
        {(status === 'connected' || status === 'syncing') && (
          <>
            <button
              onClick={() => openConfigPanel(id)}
              className="flex flex-1 items-center justify-center rounded-full border border-neutral-200 py-2 text-sm font-medium text-black hover:border-blue-600 dark:border-neutral-700 dark:text-white"
            >
              Configurar
            </button>
            <button
              onClick={() => confirmDisconnect(id)}
              className="flex flex-1 items-center justify-center rounded-full border border-neutral-200 py-2 text-sm font-medium text-neutral-500 hover:border-red-400 hover:text-red-600 dark:border-neutral-700 dark:text-neutral-400 dark:hover:border-red-500 dark:hover:text-red-400"
            >
              Desconectar
            </button>
          </>
        )}
        {status === 'error' && (
          <>
            <button
              onClick={() => initiateConnection(id)}
              className="flex flex-1 items-center justify-center rounded-full bg-blue-600 py-2 text-sm font-medium text-white opacity-90 hover:opacity-100"
            >
              Reconectar
            </button>
            <button
              onClick={() => openLogs(id)}
              className="flex items-center justify-center rounded-full border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-500 hover:border-blue-600 dark:border-neutral-700 dark:text-neutral-400"
            >
              Ver detalhes
            </button>
          </>
        )}
        {status === 'expired' && (
          <button
            onClick={() => initiateConnection(id)}
            className="flex flex-1 items-center justify-center rounded-full bg-blue-600 py-2 text-sm font-medium text-white opacity-90 hover:opacity-100"
          >
            Reconectar agora
          </button>
        )}
      </div>
    </div>
  );
}
```

### 4.3 Fluxo OAuth2 "Clique para Conectar"

Ao clicar "Conectar" no card de marketplace com OAuth:

#### Tela de aguardo (enquanto redireciona / aguarda retorno)

```jsx
// Exibido como modal sobre o grid, ou página de redirect intermediária
<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[.5px]">
  <div className="mx-4 w-full max-w-md rounded-lg border border-neutral-200 bg-white p-8 text-center dark:border-neutral-700 dark:bg-black">
    <div className="mb-6 flex justify-center">
      <img src={marketplace.logo} alt={marketplace.name} className="h-12" />
    </div>
    <div className="mb-4 flex justify-center">
      <div className="h-10 w-10 rounded-full border-4 border-neutral-200 border-t-blue-600 animate-spin dark:border-neutral-700" />
    </div>
    <p className="text-base font-semibold text-black dark:text-white">
      Aguardando autorização...
    </p>
    <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
      Uma janela do {marketplace.name} foi aberta. Faça login e autorize o acesso para continuar.
    </p>
    <button
      onClick={cancelConnection}
      className="mt-6 text-sm text-neutral-500 hover:text-black dark:hover:text-white"
    >
      Cancelar
    </button>
  </div>
</div>
```

#### Callback de sucesso

Card atualiza de status para "Conectado" com animação. Toast de sucesso via `sonner`:
```js
toast.success(`${marketplace.name} conectado com sucesso!`)
```

#### Callback de erro

```jsx
// Toast de erro
toast.error(`Não foi possível conectar ao ${marketplace.name}. Tente novamente.`)

// Card volta ao status "Desconectado"
```

### 4.4 Wizard de Credenciais — Shopee (4 passos)

Para marketplaces sem OAuth (credenciais manuais), exibir em modal/drawer com progresso:

```jsx
// IntegrationWizard — container
<div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 backdrop-blur-[.5px] md:items-center">
  <div className="w-full max-w-lg rounded-t-2xl border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-black md:rounded-lg">
    {/* Header do wizard */}
    <div className="flex items-center justify-between border-b border-neutral-200 p-5 dark:border-neutral-700">
      <div>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          Passo {currentStep} de {totalSteps}
        </p>
        <p className="text-base font-semibold text-black dark:text-white">
          {stepTitles[currentStep - 1]}
        </p>
      </div>
      <button
        onClick={onClose}
        className="flex h-8 w-8 items-center justify-center rounded-md border border-neutral-200 text-neutral-500 hover:text-black dark:border-neutral-700 dark:hover:text-white"
        aria-label="Fechar"
      >
        <XMarkIcon className="h-4 w-4" />
      </button>
    </div>

    {/* Barra de progresso */}
    <div className="h-1 bg-neutral-200 dark:bg-neutral-800">
      <div
        className="h-full bg-blue-600 transition-all ease-in-out duration-300"
        style={{ width: `${(currentStep / totalSteps) * 100}%` }}
      />
    </div>

    {/* Conteúdo do passo */}
    <div className="p-6">
      {/* Passo 1 */}
      {currentStep === 1 && (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Para conectar o Shopee, você precisa criar um aplicativo no Painel de Parceiros. Siga o caminho abaixo:
          </p>
          {/* Screenshot anotada */}
          <div className="overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-700">
            <img
              src="/images/shopee-credentials-guide.png"
              alt="Como encontrar suas credenciais no painel do Shopee"
              className="w-full"
            />
          </div>
          <div className="rounded-lg bg-neutral-50 p-3 dark:bg-neutral-900">
            <p className="text-sm font-medium text-black dark:text-white">Caminho:</p>
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
              Painel do Parceiro → Configurações → Gerenciar Aplicativo → Criar Aplicativo
            </p>
          </div>
        </div>
      )}

      {/* Passo 2 */}
      {currentStep === 2 && (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Cole as credenciais do seu aplicativo Shopee abaixo:
          </p>
          <FormField label="Partner ID" id="shopee-partner-id" required
            placeholder="Cole o Partner ID aqui" />
          {/* Segredo com show/hide */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="shopee-secret" className="text-sm font-medium text-black dark:text-white">
              Partner Key (Segredo)
            </label>
            <div className="relative">
              <input
                id="shopee-secret"
                type={showSecret ? "text" : "password"}
                className="w-full rounded-lg border border-neutral-200 bg-white px-4 py-2.5 pr-11 text-sm text-black dark:border-neutral-700 dark:bg-black dark:text-white"
                placeholder="Cole a chave secreta aqui"
              />
              <button
                type="button"
                onClick={() => setShowSecret(!showSecret)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-black dark:hover:text-white"
                aria-label={showSecret ? "Ocultar" : "Mostrar"}
              >
                {showSecret ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Resultado do teste de conexão */}
          {testResult === 'success' && (
            <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700 dark:border-green-800 dark:bg-green-950/40 dark:text-green-400">
              <CheckCircleIcon className="h-4 w-4 shrink-0" />
              Conexão verificada com sucesso!
            </div>
          )}
          {testResult === 'error' && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400">
              <ExclamationCircleIcon className="h-4 w-4 shrink-0 mt-0.5" />
              <span>Não conseguimos verificar as credenciais. Verifique se copiou corretamente e tente novamente.</span>
            </div>
          )}
        </div>
      )}

      {/* Passo 3 */}
      {currentStep === 3 && (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Escolha o que deseja sincronizar automaticamente:
          </p>
          {[
            { id: 'stock', label: 'Estoque', description: 'Atualização em tempo real' },
            { id: 'prices', label: 'Preços', description: 'Alterações de preço propagadas' },
            { id: 'orders', label: 'Pedidos novos', description: 'Importação automática' },
            { id: 'cancellations', label: 'Cancelamentos automáticos', description: 'Pedidos cancelados no marketplace' },
          ].map((option) => (
            <label
              key={option.id}
              className="flex items-start gap-3 cursor-pointer"
            >
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 accent-blue-600"
                defaultChecked={option.id !== 'cancellations'}
              />
              <div>
                <p className="text-sm font-medium text-black dark:text-white">{option.label}</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">{option.description}</p>
              </div>
            </label>
          ))}
        </div>
      )}

      {/* Passo 4 — Sucesso */}
      {currentStep === 4 && (
        <div className="flex flex-col items-center gap-4 py-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-950/40">
            <CheckIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="text-lg font-semibold text-black dark:text-white">
              Shopee conectado!
            </p>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              A primeira sincronização está em andamento. Isso pode levar alguns minutos.
            </p>
          </div>
          {/* Indicador de sync em andamento */}
          <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
            <ArrowPathIcon className="h-4 w-4 animate-spin" />
            Sincronizando seus produtos...
          </div>
        </div>
      )}
    </div>

    {/* Footer de navegação */}
    <div className="flex items-center justify-between border-t border-neutral-200 p-5 dark:border-neutral-700">
      {currentStep > 1 && currentStep < 4 ? (
        <button
          onClick={prevStep}
          className="text-sm text-neutral-500 hover:text-black dark:hover:text-white"
        >
          ← Anterior
        </button>
      ) : (
        <div /> // spacer
      )}

      <div className="flex gap-3">
        {/* "Fazer depois" — disponível no passo 2 */}
        {currentStep === 2 && (
          <button
            onClick={onClose}
            className="text-sm text-neutral-500 hover:text-black dark:hover:text-white"
          >
            Fazer depois
          </button>
        )}

        {currentStep < 3 && (
          <button
            onClick={nextStep}
            disabled={currentStep === 2 && testResult !== 'success'}
            className="rounded-full bg-blue-600 px-5 py-2 text-sm font-medium text-white opacity-90 hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Próximo →
          </button>
        )}
        {currentStep === 3 && (
          <button
            onClick={saveAndActivate}
            disabled={pending}
            className="rounded-full bg-blue-600 px-5 py-2 text-sm font-medium text-white opacity-90 hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? <LoadingDots className="bg-white" /> : "Salvar e ativar"}
          </button>
        )}
        {currentStep === 4 && (
          <button
            onClick={goToDashboard}
            className="rounded-full bg-blue-600 px-5 py-2 text-sm font-medium text-white opacity-90 hover:opacity-100"
          >
            Ir para o painel
          </button>
        )}
      </div>
    </div>
  </div>
</div>
```

**Regra do botão "Próximo" no passo 2**: desabilitado até que "Testar conexão" retorne sucesso. Exceção: botão "Pular teste" (texto link) para casos avançados.

**Barra de progresso**: `bg-blue-600` sobre `bg-neutral-200`, `transition-all ease-in-out duration-300` na largura.

### 4.5 Página de Gerenciamento da Conexão

Acessada via botão "Configurar" no card. Drawer lateral (mesmo padrão do CartModal) ou página dedicada:

```jsx
<div className="p-6">
  {/* Header */}
  <div className="mb-6 flex items-center gap-4">
    <img src={marketplace.logo} alt={marketplace.name} className="h-10" />
    <div>
      <h2 className="text-xl font-semibold text-black dark:text-white">
        {marketplace.name}
      </h2>
      <StatusBadge status={marketplace.status} />
    </div>
  </div>

  {/* Configurações de sync */}
  <section className="mb-6 rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-700 dark:bg-black">
    <h3 className="mb-4 text-base font-semibold text-black dark:text-white">
      Sincronização
    </h3>
    {/* checkboxes de configuração — mesmo padrão do passo 3 do wizard */}
    {/* ... */}
    <div className="mt-4">
      <FormSelect label="Frequência de sincronização" id="sync-frequency">
        <option value="realtime">Tempo real (recomendado)</option>
        <option value="hourly">A cada hora</option>
        <option value="daily">Uma vez por dia</option>
      </FormSelect>
    </div>
  </section>

  {/* Zona de perigo */}
  <section className="rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-950/20">
    <h3 className="mb-2 text-base font-semibold text-red-700 dark:text-red-400">
      Desconectar marketplace
    </h3>
    <p className="mb-4 text-sm text-red-600 dark:text-red-400">
      Ao desconectar, os produtos e pedidos deixarão de sincronizar automaticamente. Seus dados existentes não serão apagados.
    </p>
    <button
      onClick={() => confirmDisconnect(marketplace.id)}
      className="rounded-full border border-red-500 px-5 py-2 text-sm font-medium text-red-600 hover:bg-red-100 dark:border-red-400 dark:text-red-400 dark:hover:bg-red-950/40"
    >
      Desconectar {marketplace.name}
    </button>
  </section>
</div>
```

### 4.6 Painel de Sync

```jsx
<section className="rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-700 dark:bg-black">
  <div className="mb-4 flex items-center justify-between">
    <h3 className="text-base font-semibold text-black dark:text-white">
      Sincronização
    </h3>
    <button
      onClick={forceSync}
      disabled={isSyncing}
      className={clsx(
        "flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium transition-colors",
        isSyncing
          ? "border border-neutral-200 text-neutral-400 cursor-not-allowed dark:border-neutral-700"
          : "border border-neutral-200 text-black hover:border-blue-600 dark:border-neutral-700 dark:text-white"
      )}
    >
      <ArrowPathIcon className={clsx("h-3.5 w-3.5", isSyncing && "animate-spin")} />
      {isSyncing ? "Sincronizando..." : "Forçar sync"}
    </button>
  </div>

  {/* Contadores */}
  <div className="grid grid-cols-3 gap-4 mb-4">
    <div className="text-center">
      <p className="text-2xl font-bold text-black dark:text-white">{syncStats.products}</p>
      <p className="text-xs text-neutral-500 dark:text-neutral-400">Produtos</p>
    </div>
    <div className="text-center">
      <p className="text-2xl font-bold text-black dark:text-white">{syncStats.ordersToday}</p>
      <p className="text-xs text-neutral-500 dark:text-neutral-400">Pedidos hoje</p>
    </div>
    <div className="text-center">
      <p className="text-2xl font-bold text-black dark:text-white">{syncStats.errorsCount}</p>
      <p className={clsx(
        "text-xs",
        syncStats.errorsCount > 0 ? "text-red-500" : "text-neutral-500 dark:text-neutral-400"
      )}>
        Erros
      </p>
    </div>
  </div>

  {/* Última sync */}
  <div className="flex items-center justify-between border-t border-neutral-200 pt-4 dark:border-neutral-700">
    <p className="text-xs text-neutral-500 dark:text-neutral-400">
      Última sincronização
    </p>
    <p className="text-xs font-medium text-black dark:text-white">
      {formatRelativeTime(lastSyncAt)}
      {/* ex: "há 5 minutos", "há 2 horas" */}
    </p>
  </div>
</section>
```

### 4.7 Log de Operações

Acessado via "Ver detalhes" no card com erro, ou via aba "Logs" na página de gerenciamento:

```jsx
<div>
  <div className="mb-4 flex items-center justify-between">
    <h3 className="text-base font-semibold text-black dark:text-white">
      Log de operações
    </h3>
    {/* Filtro por tipo */}
    <FormSelect id="log-filter" className="w-auto text-xs">
      <option value="all">Todos</option>
      <option value="error">Erros</option>
      <option value="success">Sucesso</option>
      <option value="info">Informação</option>
    </FormSelect>
  </div>

  {/* Tabela de logs */}
  <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-700">
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900">
          <th className="px-4 py-3 text-left text-xs font-medium uppercase text-neutral-500 dark:text-neutral-400">
            Quando
          </th>
          <th className="px-4 py-3 text-left text-xs font-medium uppercase text-neutral-500 dark:text-neutral-400">
            Tipo
          </th>
          <th className="px-4 py-3 text-left text-xs font-medium uppercase text-neutral-500 dark:text-neutral-400">
            Status
          </th>
          <th className="px-4 py-3 text-left text-xs font-medium uppercase text-neutral-500 dark:text-neutral-400">
            Mensagem
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
        {logs.map((log) => (
          <tr
            key={log.id}
            className="bg-white hover:bg-neutral-50 dark:bg-black dark:hover:bg-neutral-900"
          >
            <td className="px-4 py-3 font-mono text-xs text-neutral-500 dark:text-neutral-400 whitespace-nowrap">
              {formatDateTime(log.timestamp)}
            </td>
            <td className="px-4 py-3 text-xs text-neutral-600 dark:text-neutral-400 whitespace-nowrap">
              {logTypeLabels[log.type]}
            </td>
            <td className="px-4 py-3">
              {/* badge de status inline */}
              <span className={clsx(
                "rounded-full px-2 py-0.5 text-xs font-medium",
                log.status === 'success' && "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400",
                log.status === 'error' && "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400",
                log.status === 'info' && "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400",
                log.status === 'warning' && "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400",
              )}>
                {logStatusLabels[log.status]}
              </span>
            </td>
            <td className="px-4 py-3 text-xs text-neutral-600 dark:text-neutral-400">
              {log.message}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
    {/* Estado vazio de logs */}
    {logs.length === 0 && (
      <div className="py-12 text-center text-sm text-neutral-500 dark:text-neutral-400">
        Nenhuma operação registrada ainda.
      </div>
    )}
  </div>
</div>
```

**Colunas obrigatórias**: Quando, Tipo, Status, Mensagem.
**Paginação**: quando logs > 50 itens, exibir paginação simples (`← Anterior | Próximo →`) na base da tabela.

### 4.8 Linguagem Não-Técnica — Glossário

Regra: **nunca exibir ao usuário** termos técnicos como status HTTP, stack traces, nomes de API, ou jargão de desenvolvedor.

| Dizer | Não dizer |
|-------|-----------|
| "Não conseguimos sincronizar seus dados" | "Erro 401: Token inválido" |
| "Sua autorização expirou. Reconecte sua conta." | "Access token expired" / "401 Unauthorized" |
| "Você não tem permissão para esta ação no marketplace." | "403 Forbidden" |
| "O marketplace está instável no momento. Tentaremos novamente." | "503 Service Unavailable" |
| "Muitas atualizações em pouco tempo. Aguarde alguns minutos." | "429 Too Many Requests" |
| "Não conseguimos contato com o marketplace." | "Network timeout / ECONNREFUSED" |
| "Conectado" | "OAuth token active" |
| "Reconexão necessária" | "Token expirado / refresh_token invalid" |
| "Sincronizando..." | "Polling API / Enqueuing job" |
| "Primeira sincronização em andamento" | "Running initial sync job" |
| "Produtos sincronizados: 247" | "247 records upserted" |
| "Pedidos importados hoje" | "Orders ingested from webhook" |
| "Chave de API" | "client_secret / Bearer token" |
| "Painel do Parceiro Shopee" | "Shopee Open Platform Developer Console" |
| "Acesso ao Mercado Livre" | "ML OAuth 2.0 grant" |

**Tipos de log — labels amigáveis**:

| Tipo técnico | Label para o usuário |
|-------------|---------------------|
| `sync_products` | Sincronização de produtos |
| `sync_orders` | Importação de pedidos |
| `auth_refresh` | Renovação de acesso |
| `webhook_received` | Atualização recebida do marketplace |
| `price_update` | Atualização de preço |
| `stock_update` | Atualização de estoque |

**Status de log — labels amigáveis**:

| Status técnico | Label | Badge |
|---------------|-------|-------|
| `success` | Sucesso | Verde |
| `error` | Falhou | Vermelho |
| `warning` | Atenção | Amarelo |
| `info` | Informação | Azul |

---

## Apêndice A — Componentes Novos Necessários

Lista de componentes a serem criados pelos agentes de UI. Cada um deve ser criado em `frontend/components/` no subdiretório adequado.

| Componente | Caminho sugerido | Seção de referência |
|-----------|-----------------|-------------------|
| `FormField` | `components/form/form-field.tsx` | 1.2 |
| `FormSelect` | `components/form/form-select.tsx` | 1.2 |
| `StatusBadge` | `components/ui/status-badge.tsx` | 1.5 |
| `AddressForm` | `components/checkout/address-form.tsx` | 2.2 |
| `ShippingSelector` | `components/checkout/shipping-selector.tsx` | 2.3 |
| `PaymentMethodTabs` | `components/checkout/payment-method-tabs.tsx` | 2.4 |
| `PendingPIX` | `components/checkout/pending-pix.tsx` | 2.5 |
| `BoletoViewer` | `components/checkout/boleto-viewer.tsx` | 2.6 |
| `OrderSummary` | `components/checkout/order-summary.tsx` | 2.1 |
| `MarketplaceCard` | `components/marketplace/marketplace-card.tsx` | 4.3 |
| `IntegrationWizard` | `components/marketplace/integration-wizard.tsx` | 4.4 |
| `SyncPanel` | `components/marketplace/sync-panel.tsx` | 4.6 |
| `OperationsLog` | `components/marketplace/operations-log.tsx` | 4.7 |

## Apêndice B — Componentes Existentes — Não Recriar

| Componente | Caminho | Usar para |
|-----------|---------|-----------|
| `Price` | `components/price.tsx` | Toda formatação de moeda |
| `LoadingDots` | `components/loading-dots.tsx` | Loading state em botões |
| `LogoSquare` | `components/logo-square.tsx` | Header de pages auth e checkout |
| `CartModal` (padrão slide-over) | `components/cart/modal.tsx` | Referência para drawers/modais |
| `CheckoutButton` (padrão de botão CTA) | dentro de `cart/modal.tsx` | Referência para botões submit |
| `GridTileImage` | `components/grid/tile.tsx` | Cards de produto |

## Apêndice C — Checklist de Conformidade para Agentes de UI

Antes de abrir PR, verificar:

- [ ] Todos os elementos usam as classes Tailwind desta spec (não inventou novas)
- [ ] Dark mode testado: toda classe tem par `dark:`
- [ ] Mobile testado em 375px: nenhum overflow horizontal
- [ ] Focus ring funciona: não sobrescreveu o global de `globals.css`
- [ ] Botões CTA seguem o padrão: `rounded-full bg-blue-600 ... text-white`
- [ ] Cards seguem o padrão: `rounded-lg border border-neutral-200 dark:border-neutral-700`
- [ ] Erros usam `text-red-600 dark:text-red-400` e `border-red-500`
- [ ] Loading state usa `<LoadingDots className="bg-white" />` (componente existente)
- [ ] Mensagens de erro são amigáveis (sem jargão técnico — ver Apêndice A seção 4.8)
- [ ] Animações usam `transition-all ease-in-out duration-300`
- [ ] `clsx` usado para classes condicionais (não template literals)
- [ ] Ícones são de `@heroicons/react/24/outline`

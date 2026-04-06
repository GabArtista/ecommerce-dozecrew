# UX Research — E-commerce Doze Crew

**Produzido por**: Agente UX-R
**Data**: 2026-03-30
**Versão**: 1.0
**Consumidores deste doc**: Agente UX-D (para escrever ux-spec.md), Agentes A, B, G

---

## 1. Design System Existente

### 1.1 Base Tecnológica

- **Framework CSS**: Tailwind CSS 4.0.14 (sem tailwind.config.ts — configuração inline via `@import "tailwindcss"`)
- **Plugins**: `@tailwindcss/container-queries`, `@tailwindcss/typography`
- **Fonte**: Geist Sans (`geist/font/sans`) — variável CSS `GeistSans.variable` injetada no `<html>`
- **Biblioteca de ícones**: `@heroicons/react/24/outline` (outline style, 24px grid)
- **Componentes de UI**: `@headlessui/react` (Dialog, Transition) para overlays acessíveis
- **Toasts**: `sonner` (Toaster com closeButton)
- **Utilitários**: `clsx` para composição condicional de classes

### 1.2 Paleta de Cores

#### Fundos (Backgrounds)

| Token | Classe Tailwind | Uso |
|-------|----------------|-----|
| Fundo primário (light) | `bg-neutral-50` | Body, páginas principais |
| Fundo primário (dark) | `dark:bg-neutral-900` | Body em dark mode |
| Fundo de card/panel (light) | `bg-white` | Cards, painéis |
| Fundo de card/panel (dark) | `dark:bg-black` | Cards em dark mode |
| Overlay backdrop | `bg-white/80` + `backdrop-blur-xl` | Modal do carrinho |
| Overlay backdrop dark | `dark:bg-black/80` + `backdrop-blur-xl` | Modal carrinho dark |
| Fundo de sobreposição | `bg-black/30` | Dimming layer modal |
| Fundo de produto/imagem | `bg-neutral-300 dark:bg-neutral-900` | Thumbnails de produto |
| Badge/label blur | `bg-white/70 dark:bg-black/70` + `backdrop-blur-md` | Labels em grid |

#### Texto

| Token | Classe Tailwind | Uso |
|-------|----------------|-----|
| Texto primário (light) | `text-black` | Corpo principal |
| Texto primário (dark) | `dark:text-white` | Corpo em dark mode |
| Texto secundário (light) | `text-neutral-500` | Subtítulos, labels |
| Texto secundário (dark) | `dark:text-neutral-400` | Subtítulos em dark |
| Texto terciário (dark) | `dark:text-white/[60%]` | Descrições de produto |
| Links de menu hover (light) | `hover:text-black` | Nav links |
| Links de menu hover (dark) | `dark:hover:text-neutral-300` | Nav links dark |

#### Cores de Ação (Brand)

| Token | Classe Tailwind | Uso |
|-------|----------------|-----|
| CTA principal | `bg-blue-600` | Botões "Add to Cart", "Checkout", preço badge |
| CTA texto | `text-white` | Texto nos botões azuis |
| Hover state | `hover:opacity-90` ou `hover:opacity-100` | Botões CTA |
| Active/selected | `border-2 border-blue-600` | Card selecionado no grid |
| Hover em card | `hover:border-blue-600` | GridTileImage hover |

#### Bordas

| Token | Classe Tailwind | Uso |
|-------|----------------|-----|
| Borda padrão (light) | `border-neutral-200` | Inputs, cards, separadores |
| Borda padrão (dark) | `dark:border-neutral-700` | Idem em dark |
| Borda card imagem dark | `dark:border-neutral-800` | GridTileImage dark |
| Borda separador carrinho | `border-neutral-300 dark:border-neutral-700` | Itens do cart |

#### Seleção de Texto

| Modo | Classe Tailwind |
|------|----------------|
| Light | `selection:bg-teal-300` |
| Dark | `dark:selection:bg-pink-500 dark:selection:text-white` |

#### Focus Ring (Acessibilidade)

Definido globalmente em `globals.css` para `a`, `input`, `button`:
```css
focus-visible:outline-hidden
focus-visible:ring-2
focus-visible:ring-neutral-400
focus-visible:ring-offset-2
focus-visible:ring-offset-neutral-50
dark:focus-visible:ring-neutral-600
dark:focus-visible:ring-offset-neutral-900
```

### 1.3 Tipografia

| Elemento | Classes Tailwind | Observações |
|----------|-----------------|-------------|
| Título produto (h1) | `text-5xl font-medium` | Página de produto |
| Título modal/painel | `text-lg font-semibold` | Header do cart modal |
| Carrinho vazio | `text-2xl font-bold` | Estado vazio do cart |
| Label de produto | `text-xs font-semibold` | Badge no grid |
| Preço no badge | `text-sm` | Price badge no product |
| Body / parágrafo | `text-base` | Preços no cart |
| Pequeno | `text-sm` | Itens do cart, variantes |
| Menu desktop | `text-sm font-medium uppercase` | Site name na navbar |
| Menu links | `text-sm` | Links nav desktop |
| Mobile menu items | `text-xl` | Links no menu mobile |
| Descrição produto | `text-sm leading-tight` | Prose component |
| Nome do item no cart | `text-base leading-tight` | Título do produto |
| Variante do item | `text-sm` | Subtítulo de variante |

**Hierarquia de pesos usados**: `font-medium` (500), `font-semibold` (600), `font-bold` (700)
**Line height especial**: `leading-tight` (1.25), `leading-none` (1.0) em labels compactos

### 1.4 Padrões de Botão

#### CTA Principal (Primary)
```
rounded-full bg-blue-600 p-3 text-center text-sm font-medium text-white opacity-90 hover:opacity-100
```
Exemplo: "Proceed to Checkout" no cart modal — largura total (`w-full`), altura por padding.

#### Botão de Produto (Add to Cart)
```
relative flex w-full items-center justify-center rounded-full bg-blue-600 p-4 tracking-wide text-white
```
Variante desabilitada: `cursor-not-allowed opacity-60 hover:opacity-60`

#### Botão Secundário / Icon Button
```
flex h-11 w-11 items-center justify-center rounded-md border border-neutral-200 text-black transition-colors dark:border-neutral-700 dark:text-white
```
Exemplos: botão de fechar o cart, botão de abrir menu mobile.

#### Botão de Quantidade (Stepper)
```
ml-auto flex h-9 flex-row items-center rounded-full border border-neutral-200 dark:border-neutral-700
```
Container pill com dois botões internos (+/-).

#### Botão Loading State
Usa o componente `<LoadingDots className="bg-white" />` — três dots animados com `animate-blink` e `animation-delay`.

### 1.5 Padrões de Input

Input de busca (referência atual):
```
text-md w-full rounded-lg border bg-white px-4 py-2 text-black placeholder:text-neutral-500
md:text-sm dark:border-neutral-800 dark:bg-transparent dark:text-white dark:placeholder:text-neutral-400
```

**Notas sobre inputs**:
- Sem label visível atualmente (apenas placeholder) — padrão que deve ser revisado para formulários de checkout
- Border radius: `rounded-lg` (inputs) vs `rounded-full` (botões CTA) vs `rounded-md` (icon buttons)
- Focus ring definido globalmente — não repetir por componente

### 1.6 Padrões de Card e Container

#### GridTileImage (Card de Produto)
```
group flex h-full w-full items-center justify-center overflow-hidden rounded-lg border bg-white hover:border-blue-600 dark:bg-black
```
- Border ativo: `border-2 border-blue-600`
- Border inativo: `border-neutral-200 dark:border-neutral-800`
- Hover de imagem: `transition duration-300 ease-in-out group-hover:scale-105`

#### Painel/Modal (Cart Modal)
```
fixed bottom-0 right-0 top-0 flex h-full w-full flex-col border-l border-neutral-200 bg-white/80 p-6
text-black backdrop-blur-xl md:w-[390px] dark:border-neutral-700 dark:bg-black/80 dark:text-white
```
Largura fixa desktop: `390px` (slide-over pattern).

#### Containers Gerais
- Sem `rounded-full` em containers de conteúdo — reservado para botões CTA e pills
- `rounded-md` para icon buttons e small containers
- `rounded-lg` para cards de produto e inputs
- `rounded-full` para botões de ação primários e badges de preço

### 1.7 Padrões de Animação e Transição

| Padrão | Classes | Uso |
|--------|---------|-----|
| Transição geral (enter) | `transition-all ease-in-out duration-300` | Entrada de modais, overlays |
| Transição geral (leave) | `transition-all ease-in-out duration-200` | Saída de modais (mais rápida) |
| Slide cart (enter) | `translate-x-full → translate-x-0` | Cart slide-in da direita |
| Slide cart (leave) | `translate-x-0 → translate-x-full` | Cart slide-out para direita |
| Slide menu mobile (enter) | `translate-x-[-100%] → translate-x-0` | Menu slide-in da esquerda |
| Overlay fade | `opacity-0 → opacity-100` + `backdrop-blur-none → backdrop-blur-[.5px]` | Dimming layer |
| Hover imagem produto | `transition duration-300 ease-in-out group-hover:scale-105` | Zoom suave |
| Hover icon close | `hover:scale-110` | Scale no X |
| Hover links nav | `hover:text-black hover:underline` | Underline-offset-4 |
| Cores (transition-colors) | `transition-colors` | Icon buttons |
| Loading dots | `animate-blink` (custom) | Estado de carregamento |

### 1.8 Dark Mode

Implementado nativamente via:
- `@media (prefers-color-scheme: dark) { html { color-scheme: dark; } }` em `globals.css`
- Todas as classes Tailwind com prefixo `dark:` nos componentes
- Sem toggle manual — segue preferência do sistema operacional

**Padrão de inversão**:
- `bg-white` → `dark:bg-black` (cards)
- `bg-neutral-50` → `dark:bg-neutral-900` (body)
- `text-black` → `dark:text-white`
- `border-neutral-200` → `dark:border-neutral-700`
- `text-neutral-500` → `dark:text-neutral-400`

### 1.9 Spacing e Grid

**Navbar**: `p-4 lg:px-6` — padding horizontal aumenta em lg
**Layout 3 colunas**: `w-full md:w-1/3` para logo, busca e ações na navbar
**Padding interno de cards**: `px-4 py-2` (inputs), `p-4` (botões), `p-6` (modal)
**Gap de menu**: `gap-6` (links horizontais)
**Padding de item de lista**: `px-1 py-4` (itens do cart)
**Separação de seções**: `border-b`, `pb-6 mb-6` (product description)

### 1.10 Componentes Existentes Reutilizáveis

| Componente | Caminho | Função |
|-----------|---------|--------|
| `Price` | `components/price.tsx` | Formatação de moeda com `Intl.NumberFormat` |
| `LoadingDots` | `components/loading-dots.tsx` | 3 dots animados para loading state |
| `Label` | `components/label.tsx` | Badge flutuante com título + preço no grid |
| `GridTileImage` | `components/grid/tile.tsx` | Card de produto com hover e estado ativo |
| `OpenCart` | `components/cart/open-cart.tsx` | Botão do carrinho com badge de quantidade |
| `LogoSquare` | `components/logo-square.tsx` | Logo quadrado da loja |
| `CartModal` | `components/cart/modal.tsx` | Slide-over do carrinho com Headless UI |
| `MobileMenu` | `components/layout/navbar/mobile-menu.tsx` | Menu mobile em tela cheia |
| `Search` | `components/layout/navbar/search.tsx` | Input de busca com ícone |
| `AddToCart` | `components/cart/add-to-cart.tsx` | Botão CTA + Server Action |
| `DeleteItemButton` | `components/cart/delete-item-button.tsx` | Remover item do cart |
| `EditItemQuantityButton` | `components/cart/edit-item-quantity-button.tsx` | Stepper de quantidade |

---

## 2. Checkout — Boas Práticas

### 2.1 Dados de Referência: Abandono e Conversão

**Taxa de abandono de carrinho no Brasil**: 82% (Neotrust) — acima da média global de 70-75%.

**Principais causas de abandono no checkout brasileiro**:
1. Frete inesperado revelado apenas no final: ~47% dos abandonos
2. Obrigatoriedade de cadastro antes da compra: ~24%
3. Checkout longo/complexo demais: ~18%
4. Desconfiança na segurança: ~11% (impacto maior em novas lojas)
5. Performance lenta (>3s de carregamento): agravante em qualquer etapa

**Taxa de conversão média e-commerce BR**: 1,5% a 3% (sites otimizados chegam a 4-5%)

**Referências**:
- [E-Commerce Brasil — Abandono de Carrinho 70%+](https://www.ecommercebrasil.com.br/artigos/abandono-de-carrinho-no-e-commerce-atingiu-7019)
- [Shopify Brasil — Taxa de Conversão](https://www.shopify.com/br/blog/taxa-de-conversao-de-e-commerce)
- [Yampi — Como calcular taxa de conversão](https://www.yampi.com.br/blog/taxa-de-conversao-e-commerce/)

### 2.2 One-Page vs Multi-Step Checkout

**Evidências de conversão**:
- One-page checkout converte ~21,8% melhor (Elastic Path A/B test)
- Shopify reporta vantagem de ~7,5% para one-page
- Mobile: cada etapa adicional aumenta abandono em 8-12%; one-page mobile converte 15-25% melhor

**Quando usar one-page** (contexto da Doze Crew — recomendado):
- Produtos físicos com entrega (nosso caso)
- Checkout mobile-first (maioria do tráfego BR)
- Poucos campos necessários (nome, CEP, e-mail, pagamento)

**Quando usar multi-step**:
- Muitas opções de customização por produto
- Upsell complexo entre etapas
- Necessidade de capturar e-mail antes do carrinho (para recuperação)

**Decisão para este projeto**: Implementar one-page checkout com scroll progressivo e seções colapsáveis. Capturar e-mail no início do formulário para possibilitar recuperação de carrinho mesmo em caso de abandono.

**Referências**:
- [StorePro — One-page vs Multi-step](https://storepro.io/learn/one-page-vs-multi-step-checkout-which-to-use-when/)
- [ConvertCart — How Many Steps?](https://www.convertcart.com/blog/checkout-ux-for-ecommerce-store)
- [Shopify — One-Page Checkout](https://www.shopify.com/enterprise/blog/one-page-checkout)

### 2.3 UX de PIX no Checkout

**Fluxo recomendado**:

```
1. Usuário seleciona PIX como método de pagamento
2. Clica em "Gerar QR Code PIX" / "Pagar com PIX"
3. Sistema cria cobrança PIX dinâmico (Asaas) — QR Code único por transação
4. Tela de espera com:
   a. QR Code centralizado e grande (mínimo 256x256px no desktop, 200x200 mobile)
   b. Código PIX copia-e-cola (campo de texto + botão "Copiar Código")
   c. Countdown timer (30 minutos — padrão Asaas) com visual claro
   d. Instruções em 3 passos (ilustradas): Abra seu banco → Escaneie o QR → Confirme
5. Polling / WebSocket / SSE aguarda webhook do Asaas confirmando pagamento
6. Ao detectar pagamento: transição automática para tela de confirmação (sem reload)
7. Se expirar: botão para gerar novo QR Code
```

**Padrões visuais críticos**:
- **QR Code deve ser a primeira coisa visível** — não esconder atrás de abas
- **Botão "Copiar Código" com feedback visual**: texto muda para "Copiado!" por 2s com ícone de check
- **Timer**: exibir em formato `MM:SS` com cor neutra que muda para amarelo nos últimos 5 min e vermelho nos últimos 2 min
- **PIX QR Code dinâmico**: um QR por transação, uso único — implementar corretamente via Asaas
- **Mobile-first**: exibir copia-e-cola em destaque pois smartphone não consegue scanear a própria tela
- **Confirmação automática**: não exigir que o usuário recarregue — polling a cada 3s ou SSE/WebSocket
- **PIX parcelado** (Asaas suporta): exibir como opção separada se aplicável

**Texto de instruções recomendado**:
> "1. Abra o app do seu banco  2. Acesse a área PIX  3. Escaneie o QR code ou cole o código abaixo"

**Referências**:
- [Asaas — PIX no E-commerce](https://blog.asaas.com/pix-no-e-commerce/)
- [SaqPay — PIX líder em pagamentos](https://saqpay.com.br/pix-no-e-commerce-vendas-transacoes/)
- [DevRocket — PIX prioritário no checkout](https://blog.devrocket.com.br/pagamento-via-pix-por-que-priorizar-no-checkout-aumenta-a-conversao-e-reduz-custos)

### 2.4 UX de Boleto no Checkout

**Fluxo recomendado**:

```
1. Usuário seleciona Boleto como método
2. Clica em "Gerar Boleto"
3. Asaas cria boleto (prazo padrão: 3 dias úteis)
4. Tela exibe:
   a. Linha digitável em campo de texto (47-48 dígitos, quebrado em grupos)
   b. Botão "Copiar Linha Digitável" com feedback visual
   c. Botão "Baixar PDF do Boleto" (abre em nova aba ou download)
   d. Botão "Copiar Código de Barras"
   e. Data de vencimento em destaque (ex: "Vence em 05/04/2026")
   f. Aviso: pedido será separado apenas após confirmação de pagamento
5. E-mail automático com link do boleto + linha digitável
6. Webhook confirma pagamento (pode levar 1-3 dias úteis)
```

**Avisos críticos para exibir**:
- "O boleto pode levar até 3 dias úteis para compensar"
- "Seu pedido será confirmado após a aprovação do pagamento"
- "Não pague em casas lotéricas após a data de vencimento"

**Formatação da linha digitável**: exibir quebrada em grupos de dígitos para facilitar leitura manual:
```
12345.67890  12345.678901  12345.678901  1  12340000018900
```

**Referências**:
- [iugu — Campos de boleto](https://dev.iugu.com/docs/campos-de-boleto-bancario)
- [PagBank — Checkout Docs](https://developer.pagbank.com.br/v1.0/docs/checkout)
- [UX Design Brasil — Checkout Eficiente](https://brasil.uxdesign.cc/dicas-de-ux-design-para-criar-um-fluxo-de-checkout-de-compras-eficiente-55151561b74c)

### 2.5 Auto-fill de Endereço por CEP (ViaCEP)

**Fluxo recomendado**:

```
Campos do formulário de endereço na ordem:
1. CEP (obrigatório, 8 dígitos, máscara: XXXXX-XXX)
   → onBlur: chama https://viacep.com.br/ws/{CEP}/json/
   → Loading spinner no campo enquanto busca
   → Se encontrado: preenche automaticamente campos 2-5
   → Se não encontrado: exibe erro inline "CEP não encontrado"
2. Endereço / Logradouro (pré-preenchido)
3. Número (foco automático após CEP válido)
4. Complemento (opcional)
5. Bairro (pré-preenchido)
6. Cidade (pré-preenchido, read-only)
7. Estado/UF (pré-preenchido, read-only)
```

**Detalhes de UX**:
- **Máscara de CEP**: formatar como `XXXXX-XXX` automaticamente ao digitar
- **Trigger**: ao sair do campo (onBlur) e ao completar 8 dígitos numéricos
- **Estados de loading**: shimmer/spinner nos campos dependentes enquanto busca
- **Campos read-only**: cidade e estado não devem ser editáveis manualmente (evita inconsistências)
- **Foco automático**: após preencher CEP com sucesso, mover foco para campo "Número"
- **Validação**: CEP deve ter 8 dígitos numéricos (com ou sem máscara)
- **Erro inline**: mensagem vermelha imediatamente abaixo do campo

**Endpoint ViaCEP**:
```
GET https://viacep.com.br/ws/01310100/json/
Response: { cep, logradouro, complemento, bairro, localidade, uf, ibge, gia, ddd, siafi }
```

**Referências**:
- [Anderson Mamede — Autocomplete CEP](https://blog.andersonmamede.com.br/autocomplete-de-endereco-pelo-CEP/)
- [Medium — CEP Promise auto-fill](https://medium.com/@felquis/como-auto-preencher-um-formul%C3%A1rio-de-endere%C3%A7o-com-o-cep-promise-e0aec1e50407)
- [ViaCEP — Autocomplete VNDA](https://developers.vnda.com.br/docs/auto-preenchimento-de-endere%C3%A7o-pelo-cep)

### 2.6 Campos Mínimos do Checkout

**Campos obrigatórios (nessa ordem)**:

```
SEÇÃO 1 — IDENTIFICAÇÃO
- E-mail (capturado primeiro para recuperação de abandono)

SEÇÃO 2 — ENTREGA
- Nome completo
- CEP → auto-fill
- Endereço (pré-preenchido)
- Número
- Complemento (opcional)
- Bairro (pré-preenchido)
- Cidade (pré-preenchido, read-only)
- Estado (pré-preenchido, read-only)
- Telefone (para rastreamento e SAC)

SEÇÃO 3 — PAGAMENTO
- Método: PIX | Boleto | Cartão (tabs ou radio buttons)
- [Condicional conforme método escolhido]
```

**Campos que NÃO devem ser pedidos no checkout**:
- Senha (oferecer conta como pós-compra, não barreira)
- CPF/CNPJ (coletar apenas se necessário para NF — pode ser após confirmação)
- Data de nascimento
- Confirmação de e-mail (desnecessário com validação inline)

### 2.7 Elementos de Confiança (Trust Signals)

**Obrigatórios no checkout**:
1. **Cadeado HTTPS** e texto "Pagamento 100% seguro" — próximo ao botão de finalizar
2. **Logos dos métodos de pagamento** aceitos (PIX, Boleto, Visa, Mastercard)
3. **Política de troca/devolução** resumida: "30 dias para devolver"
4. **Resumo do pedido sempre visível** — sidebar fixa no desktop, accordion no mobile
5. **Total com frete incluído** antes de qualquer botão de confirmação

**Selos populares no Brasil para e-commerce**:
- E-bit/Buscapé (avaliação de loja)
- Reclame Aqui RA1000
- SSL/HTTPS (visual do cadeado do browser já ajuda)
- "Loja Segura" custom com ícone de escudo

**Dados**: 48% dos consumidores citam certificados e selos como relevantes na decisão de compra. ~17% dos abandonos são por preocupações com segurança.

**Referências**:
- [Shopify Brasil — Selos de Confiança](https://www.shopify.com/br/blog/selo-de-confianca-e-commerce)
- [Nuvemshop — Selos de credibilidade](https://www.nuvemshop.com.br/blog/gerando-credibilidade-para-sua-loja-selos-de-credibilidade/)
- [Empreender — Selos no checkout](https://empreender.com.br/selos-de-confianca-loja-virtual/)

### 2.8 Feedback Visual no Processamento

| Estado | Visual Recomendado |
|--------|-------------------|
| Formulário sendo enviado | Botão "Finalizar" muda para `<LoadingDots>` (componente existente) |
| Aguardando PIX | Spinner suave + texto "Aguardando pagamento..." |
| PIX confirmado | Ícone de check verde animado + toast de sucesso |
| PIX expirado | Ícone de relógio + texto "QR Code expirado" + botão "Gerar novo" |
| Erro de processamento | Toast de erro (sonner já configurado) + campo em vermelho |
| Boleto gerado | Toast "Boleto gerado! Verifique seu e-mail." |

---

## 3. Autenticação — Recomendações

### 3.1 Contexto e Dados

**Problema de friction no cadastro**:
- Cada campo adicional reduz a conclusão do formulário em **7-10%**
- Criação de senha com requisitos de complexidade é o **maior ponto de abandono** no cadastro
- **75% dos usuários** que iniciam recuperação de senha abandonam o processo

**Filosofia geral**: Autenticação não deve ser um portão antes da compra. Deve ser uma conveniência pós-compra.

**Referências**:
- [Authgear — Login & Signup UX 2025](https://www.authgear.com/post/login-signup-ux-guide)
- [BayTech — Magic Links UX 2025](https://www.baytechconsulting.com/blog/magic-links-ux-security-and-growth-impacts-for-saas-platforms-2025)
- [NopAccelerate — Passwordless Ecommerce 2026](https://www.nopaccelerate.com/passwordless-authentication-ecommerce-2026/)

### 3.2 Estratégia Recomendada: Guest-First com Conversão Pós-Compra

**Fluxo principal** (zero friction):
```
Vitrine → Carrinho → Checkout como convidado → Confirmação do pedido
                                                      ↓
                               "Crie uma conta para acompanhar seus pedidos"
                               [Definir senha] ou [Continuar sem conta]
```

**Vantagens**:
- Remove o maior bloqueio de conversão (obrigatoriedade de cadastro — causa 24% do abandono)
- O usuário já forneceu e-mail no checkout — criar conta é um clique
- Histórico de pedidos vinculado ao e-mail automaticamente

### 3.3 Páginas de Login e Cadastro (`/account/login` e `/account/register`)

**Campos mínimos para cadastro**:
```
- Nome completo
- E-mail
- Senha (mínimo 8 caracteres, sem complexidade excessiva)
[Criar conta]
```
Ou — preferencial:
```
- E-mail
[Enviar link de acesso] → Magic Link
```

**Campos que NÃO devem ser pedidos no cadastro inicial**:
- Telefone (coletar no checkout, não no cadastro)
- Data de nascimento (apenas se necessário para programa de fidelidade)
- CPF (coletar no pedido)
- Confirmação de senha (com toggle de show/hide, não é necessário)
- Newsletter opt-in (checkbox separado, não obrigatório)

**Página de login**:
```
- Campo e-mail
- Campo senha (com toggle show/hide)
- Link "Esqueci minha senha"
- Botão "Entrar"
- Divider "ou"
- Botão "Continuar com Google" (se Google OAuth implementado — opcional)
- Link "Criar conta"
```

### 3.4 Magic Link vs Senha — Recomendação

| Critério | Magic Link | Senha |
|----------|-----------|-------|
| Friction inicial | Muito baixo | Médio |
| Segurança | Alta (token único, expirável) | Depende da senha |
| Dependência | E-mail disponível | Nenhuma |
| Recuperação | Automática (é o próprio mecanismo) | Fluxo adicional |
| Familiaridade no BR | Crescendo | Alta |
| Melhor para | Mobile, compras ocasionais | Clientes recorrentes |

**Recomendação**: Implementar senha convencional com opção de magic link como alternativa. Medusa v2 tem suporte a tokens de login — usar.

### 3.5 Fluxo de Recuperação de Senha

```
1. Usuário clica "Esqueci minha senha"
2. Página simples: um campo de e-mail + botão "Enviar link"
3. Feedback imediato: "Se este e-mail estiver cadastrado, você receberá um link."
   (Não revelar se o e-mail existe — segurança)
4. Link no e-mail leva para página de redefinição
5. Página de redefinição: campo nova senha + toggle show/hide
6. Sucesso: redirect automático para a página que o usuário estava tentando acessar
```

### 3.6 Redirecionamento Pós-Login

Implementar `?redirect=/` query param para redirecionar ao destino original após login.

Exemplos:
- Usuário tenta acessar `/account/orders` sem estar logado → redirect para `/account/login?redirect=/account/orders`
- Após login bem-sucedido → redirect para `/account/orders`
- Default redirect: `/account`

### 3.7 Área do Cliente (`/account`)

**Seções recomendadas**:
1. Dashboard: boas-vindas + últimos pedidos + ações rápidas
2. Pedidos (`/account/orders`): lista com status, data, valor total
3. Detalhe do pedido (`/account/orders/[id]`): itens, rastreamento, NF, método de pagamento
4. Dados pessoais: nome, e-mail, senha (editar)
5. Endereços salvos: CRUD de endereços para próximas compras
6. Sair (logout com confirmação)

---

## 4. Marketplace Hub — Onboarding UX

### 4.1 Referências do Mercado

#### Bling ERP (referência mais próxima do contexto BR)

O Bling apresenta integração com +30 marketplaces. O fluxo de conexão é:
1. Painel principal lista todos os marketplaces disponíveis (ícone + nome + status)
2. Usuário seleciona o marketplace desejado
3. Clica em botão "Conectar com [Marketplace]"
4. Redirect OAuth para o marketplace (Mercado Livre, Shopee, etc.)
5. Usuário autoriza acesso → retorna ao Bling já conectado
6. Status muda de "Desconectado" para "Conectado" com ícone verde

**Características UX do Bling**:
- Cards de marketplace com logo + estado de conexão
- Processo OAuth em 2 cliques (selecionar + autorizar)
- Sincronização automática de estoque e pedidos pós-conexão

**Referências Bling**:
- [Bling — Integrações disponíveis](https://www.bling.com.br/integracoes-bling)
- [Bling — Integração Marketplace](https://www.bling.com.br/funcionalidades/integracao-marketplace)
- [Bling — Conectar Mercado Livre](https://www.bling.com.br/integracao/mercado-livre)

#### Shopify (referência de onboarding de app)

Princípios do Shopify Onboarding (Polaris Design System):
- Máximo de **5 etapas** no wizard de setup
- **Barra de progresso** com percentual de conclusão
- Cada etapa marcada como completa automaticamente
- Opção "Remind me later" — onboarding não bloqueia o uso do app
- Botão de fechar (X) para apps onde onboarding não é essencial
- Linguagem de benefícios, não de configuração técnica

**Referências Shopify**:
- [Shopify Dev — Onboarding Guidelines](https://shopify.dev/docs/apps/design/user-experience/onboarding)
- [Candu.ai — Shopify Onboarding Flow](https://www.candu.ai/blog/shopify-onboarding-flow)

### 4.2 Fluxo OAuth2 "Conectar com Um Clique"

**Fluxo técnico simplificado para o usuário**:

```
Card do Marketplace
[Logo] [Nome] [Status: Desconectado]
[Botão: "Conectar"]
         ↓
Sistema gera OAuth URL com state param
         ↓
Redirect para marketplace (Mercado Livre, Shopee, etc.)
         ↓
Usuário já logado no marketplace: "Autorizar acesso da Doze Crew?"
[Autorizar] ou [Cancelar]
         ↓ (Autorizar)
Redirect de volta: /admin/marketplace/oauth/callback?code=...&state=...
         ↓
Backend troca code por tokens, salva de forma segura
         ↓
Card atualiza: [Logo] [Nome] [Status: Conectado ✓]
```

**Princípio de UX**: O usuário nunca vê `client_id`, `client_secret`, `access_token`. O OAuth abstrai toda a autenticação técnica.

**Para marketplaces sem OAuth (credenciais manuais)**:

```
[Botão: "Configurar manualmente"]
         ↓
Modal/Drawer com wizard passo-a-passo:
Passo 1: "Onde encontrar suas credenciais"
   → Screenshot anotada mostrando exatamente onde está a chave no painel do marketplace
   → Campo: "Cole sua chave de API aqui"
Passo 2: "Teste da conexão"
   → Botão "Testar conexão"
   → Feedback: sucesso (verde) ou erro com mensagem não-técnica
Passo 3: "Configurações de sincronização"
   → Frequência de sync (tempo real / de hora em hora / diário)
   → Quais dados sincronizar (estoque, preços, pedidos)
```

**Referências**:
- [OAuth Prismatic — Connect Button UX](https://prismatic.io/docs/integrations/connections/oauth2/)
- [Wix + Amazon — One-click Integration](https://nventory.io/us/integrations/wix/amazon)

### 4.3 Status Cards de Integração

**Estados possíveis e representação visual**:

| Estado | Cor | Ícone | Texto | Ação disponível |
|--------|-----|-------|-------|----------------|
| Não conectado | Neutro (`neutral-200`) | Círculo vazio | "Não conectado" | "Conectar" |
| Conectando... | Azul (`blue-600`) | Spinner | "Conectando..." | Desabilitado |
| Conectado | Verde (`green-500`) | Check sólido | "Conectado" | "Desconectar" / "Configurar" |
| Sincronizando | Azul (`blue-400`) | Setas circulares animadas | "Sincronizando..." | — |
| Erro | Vermelho (`red-500`) | X ou triângulo | "Erro na conexão" | "Ver detalhes" / "Reconectar" |
| Token expirado | Amarelo (`yellow-500`) | Relógio | "Reconexão necessária" | "Reconectar" |

**Anatomia do Status Card**:
```
┌─────────────────────────────────────────────┐
│  [Logo]  Nome do Marketplace     [● Conectado]│
│                                              │
│  Última sincronização: há 5 minutos         │
│  Produtos sincronizados: 247                │
│  Pedidos hoje: 12                           │
│                                              │
│  [Configurar]          [Desconectar]        │
└─────────────────────────────────────────────┘
```

**Card de erro (não-técnico)**:
```
┌─────────────────────────────────────────────┐
│  [Logo]  Mercado Livre         [● Com erro] │
│                                              │
│  ⚠ Não conseguimos sincronizar seus pedidos │
│  Isso pode acontecer quando a autorização   │
│  expira. Reconecte para continuar.          │
│                                              │
│  [Reconectar agora]    [Ver detalhes]       │
└─────────────────────────────────────────────┘
```

**Referências**:
- [PatternFly — Dashboard Status Cards](https://www.patternfly.org/patterns/dashboard/design-guidelines/)
- [UI Patterns — Status Pattern](https://ui-patterns.com/patterns/Status)
- [DataGrail — Integration Errors](https://docs.datagrail.io/docs/integrations/managing-integrations/errors/)

### 4.4 Comunicação de Erros de Sincronização

**Princípio**: Nunca mostrar stack trace, código de erro HTTP ou mensagem de API raw ao usuário final.

**Mapeamento de erros técnicos → linguagem amigável**:

| Erro Técnico | Mensagem para o usuário |
|-------------|------------------------|
| 401 Unauthorized | "Sua autorização expirou. Reconecte sua conta." |
| 403 Forbidden | "Você não tem permissão para esta ação no marketplace." |
| 429 Rate Limited | "Muitas sincronizações em pouco tempo. Tentaremos novamente em alguns minutos." |
| 500/503 Server Error | "O marketplace está instável no momento. Tentaremos novamente automaticamente." |
| Network timeout | "Não conseguimos contato com o marketplace. Verifique sua conexão." |
| Token expirado | "Você precisa se reconectar ao [marketplace]. Clique em Reconectar." |

**Hierarquia de alertas no painel**:
1. Erro crítico (sem sincronização há +24h): banner vermelho no topo da página
2. Erro recente (última sync falhou): badge vermelho no card do marketplace
3. Aviso (sync lenta): badge amarelo, sem urgência
4. Sucesso (tudo ok): apenas status verde, sem notificação intrusiva

### 4.5 Wizard de Configuração de Credenciais (para não-técnicos)

**Estrutura do wizard** (máximo 5 passos, conforme Shopify):

```
Passo 1/4: Acesse o painel do marketplace
[Screenshot anotada mostrando o caminho no painel do marketplace]
"Acesse Conta > Configurações > API > Criar aplicação"
[Próximo →]

Passo 2/4: Cole suas credenciais
Chave de API: [__________________]
Segredo:      [__________________ 👁]
[Testar conexão]  ← com loading state + feedback
[← Anterior]  [Próximo →]

Passo 3/4: Escolha o que sincronizar
☑ Estoque (atualização em tempo real)
☑ Preços
☑ Pedidos novos
☐ Cancelamentos automáticos
[← Anterior]  [Salvar e ativar]

Passo 4/4: Integração ativa!
✓ Conectado ao [Marketplace]
Primeira sincronização em andamento...
[Ir para painel]
```

**Detalhes de UX**:
- Barra de progresso linear no topo do wizard
- Screenshots são contextuais ao marketplace específico
- Campo "Segredo" tem toggle show/hide por padrão oculto
- "Testar conexão" bloqueia o avanço se falhar — feedback imediato
- Permitir "Pular teste" para casos de credenciais corretas mas sem permissão de acesso rápido

---

## 5. Decisões Recomendadas

> Esta seção é o entregável direto para o Agente UX-D. Cada item é uma decisão de design com justificativa.

### 5.1 Design System — Extensões Necessárias

| # | Decisão | Justificativa |
|---|---------|---------------|
| DS-01 | **Manter 100% da paleta existente** — não introduzir novas cores além das já mapeadas | Consistência com Next.js Commerce; o design system já é completo |
| DS-02 | **Inputs com label visível** (não apenas placeholder) para formulários de checkout e auth | Acessibilidade: placeholder desaparece ao digitar; label flutuante (floating label) ou estática acima do campo |
| DS-03 | **Adicionar estados de erro para inputs**: `border-red-500 text-red-600 dark:border-red-400` | Padrão ausente nos componentes atuais — necessário para validação de formulários |
| DS-04 | **Adicionar estados de sucesso para inputs**: `border-green-500` | Para feedback de CEP válido, e-mail disponível, etc. |
| DS-05 | **Loading state com shimmer** (`animate-pulse bg-neutral-200`) para campos preenchidos via API | Feedback durante auto-fill CEP e carregamento de dados |
| DS-06 | **Badge de status colorido**: círculo + texto para estados connected/error/syncing | Para status cards de marketplace |
| DS-07 | **Componente ProgressBar** com cor `bg-blue-600` sobre `bg-neutral-200` | Para wizards de onboarding |

### 5.2 Checkout

| # | Decisão | Justificativa |
|---|---------|---------------|
| CK-01 | **Checkout one-page** com seções progressivas (não tabs, não páginas separadas) | +21% conversão vs multi-step; melhor em mobile |
| CK-02 | **E-mail como primeiro campo** do checkout | Permite recuperação de carrinho mesmo em abandono pós-campo-1 |
| CK-03 | **Checkout sem obrigatoriedade de conta** — guest checkout padrão | Remove causa #2 de abandono (24% dos casos) |
| CK-04 | **PIX como método padrão/em destaque** — não esconder em aba secundária | PIX já é líder em transações online no Brasil; conversão mais rápida |
| CK-05 | **QR Code PIX tamanho mínimo 200x200px** com opção copia-e-cola proeminente | Mobile não consegue escanear a própria tela |
| CK-06 | **Timer PIX visual** em `MM:SS` com mudança de cor nos últimos 5 min (amarelo) e 2 min (vermelho) | Cria urgência saudável, evita confusão se o código expirar |
| CK-07 | **Confirmação PIX automática** via polling a cada 3 segundos (sem reload de página) | UX fluida — usuário não precisa fazer nada após pagar |
| CK-08 | **Auto-fill CEP** via ViaCEP na perda de foco do campo CEP | Reduz fricção no maior bloco de formulário (endereço) |
| CK-09 | **Resumo do pedido fixo** no lado direito (desktop) / accordion no topo (mobile) | Usuário deve ver o que está comprando durante todo o checkout |
| CK-10 | **Trust signals no rodapé do checkout**: cadeado + logos de pagamento + política de devolução resumida | 17% dos abandonos são por desconfiança |
| CK-11 | **Botão "Finalizar pedido"** desabilitado até formulário ser válido, com estado loading durante submit | Previne duplo-clique e dá feedback claro |
| CK-12 | **Linha digitável do boleto** em campo de texto com botão copiar + download PDF em botão secundário | Padrão consolidado no Brasil |
| CK-13 | **Campos cidade e estado no formulário de endereço são read-only** (preenchidos por CEP) | Evita inconsistências de dados |
| CK-14 | **Página de confirmação** (`/checkout/confirmacao/[id]`) deve exibir: número do pedido, resumo, método de pagamento, próximos passos esperados | Feedback completo pós-compra |

### 5.3 Autenticação

| # | Decisão | Justificativa |
|---|---------|---------------|
| AU-01 | **Guest checkout como padrão** — conta como opção pós-compra | Remove maior barreira de conversão |
| AU-02 | **Cadastro com 3 campos máximo**: nome, e-mail, senha | Cada campo adicional = -7-10% conclusão |
| AU-03 | **Toggle show/hide na senha** | Acessibilidade — usuário pode verificar o que digitou |
| AU-04 | **Sem regras complexas de senha** — apenas mínimo 8 caracteres | Complexidade = maior dropout; comprimento é suficiente para segurança básica |
| AU-05 | **Recuperação de senha via link no e-mail** — mensagem neutra que não revela se e-mail existe | Segurança + UX (não frustrar com "e-mail não encontrado") |
| AU-06 | **Redirect pós-login** via `?redirect=` query param | Usuário volta para onde estava tentando ir |
| AU-07 | **Área do cliente com 5 seções**: dashboard, pedidos, detalhe do pedido, dados pessoais, sair | Escopo mínimo funcional para MVP |
| AU-08 | **Mensagem de boas-vindas após cadastro** com próximo passo claro | Onboarding básico mesmo para loja |

### 5.4 Marketplace Hub

| # | Decisão | Justificativa |
|---|---------|---------------|
| MK-01 | **Grid de cards de marketplaces** como tela principal do hub | Visão geral imediata de todos os canais |
| MK-02 | **OAuth para marketplaces que suportam** (ML, Shopee, Amazon) — botão único "Conectar" | Abstrai toda autenticação técnica do usuário |
| MK-03 | **Wizard de 4 passos para credenciais manuais** com screenshots contextuais | Usuários não-técnicos precisam de guia visual |
| MK-04 | **Máximo 5 etapas por wizard** com barra de progresso | Shopify Best Practice — além disso é abandono |
| MK-05 | **Testar conexão antes de salvar** com feedback imediato (sucesso/erro) | Evita salvar credenciais inválidas silenciosamente |
| MK-06 | **Status cards com 5 estados visuais**: desconectado, conectando, conectado, sincronizando, erro | Cobertura completa dos estados reais de uma integração |
| MK-07 | **Erros em linguagem não-técnica** — nunca exibir stack trace ou código HTTP | Usuários de ERP não são desenvolvedores |
| MK-08 | **Última sincronização** exibida em tempo relativo ("há 5 minutos") no card | Feedback de freshness dos dados |
| MK-09 | **Log de sincronização** acessível via "Ver detalhes" — não na tela principal | Detalhe técnico disponível para quem precisa, sem poluir a visão geral |
| MK-10 | **Reconexão com um clique** em card com erro | Reduz fricção do caso de uso mais comum (token expirado) |
| MK-11 | **Wizard pode ser interrompido e retomado** — "Remind me later" | Merchant pode não ter as credenciais à mão no momento |

### 5.5 Padrões de Formulário Reutilizáveis (para o UX-D especificar)

O Agente UX-D deve definir especificações para estes componentes novos, todos seguindo o design system existente:

1. **`<FormInput>`** — input com label visível, estados (default/focus/error/success/disabled), mensagem de erro inline
2. **`<FormSelect>`** — select nativo estilizado com as mesmas bordas dos inputs
3. **`<PaymentMethodSelector>`** — tabs ou radio-pill para PIX / Boleto / Cartão
4. **`<PendingPIX>`** — container com QR Code + copia-e-cola + timer countdown
5. **`<BoletoViewer>`** — linha digitável + botão copiar + botão download PDF
6. **`<AddressForm>`** — conjunto de campos com auto-fill CEP integrado
7. **`<OrderSummary>`** — sidebar/accordion com itens, subtotal, frete, total
8. **`<MarketplaceCard>`** — card de integração com logo + status + ações
9. **`<IntegrationWizard>`** — container de wizard com barra de progresso + navegação entre passos
10. **`<StatusBadge>`** — badge colorido com ícone e texto de status

---

## Apêndice: Fontes e Referências Consolidadas

### Checkout e Conversão
- [E-Commerce Brasil — Abandono de Carrinho](https://www.ecommercebrasil.com.br/artigos/abandono-de-carrinho-no-e-commerce-atingiu-7019)
- [Shopify Brasil — Taxa de Conversão](https://www.shopify.com/br/blog/taxa-de-conversao-de-e-commerce)
- [Yampi — Taxa de Conversão E-commerce](https://www.yampi.com.br/blog/taxa-de-conversao-e-commerce/)
- [StorePro — One-page vs Multi-step](https://storepro.io/learn/one-page-vs-multi-step-checkout-which-to-use-when/)
- [Shopify — One-Page Checkout Enterprise](https://www.shopify.com/enterprise/blog/one-page-checkout)
- [UX Design Brasil — Checkout Eficiente](https://brasil.uxdesign.cc/dicas-de-ux-design-para-criar-um-fluxo-de-checkout-de-compras-eficiente-55151561b74c)

### PIX e Pagamentos BR
- [Asaas — PIX no E-commerce](https://blog.asaas.com/pix-no-e-commerce/)
- [SaqPay — PIX líder em pagamentos](https://saqpay.com.br/pix-no-e-commerce-vendas-transacoes/)
- [DevRocket — PIX prioritário no checkout](https://blog.devrocket.com.br/pagamento-via-pix-por-que-priorizar-no-checkout-aumenta-a-conversao-e-reduz-custos)
- [iugu — Como oferecer PIX](https://www.iugu.com/blog/pix-e-commerce)
- [iugu — Campos de boleto](https://dev.iugu.com/docs/campos-de-boleto-bancario)
- [Pagar.me — Docs PIX](https://docs.pagar.me/docs/pix-1)

### Trust Signals
- [Shopify Brasil — Selos de Confiança](https://www.shopify.com/br/blog/selo-de-confianca-e-commerce)
- [Nuvemshop — Selos de credibilidade](https://www.nuvemshop.com.br/blog/gerando-credibilidade-para-sua-loja-selos-de-credibilidade/)
- [BWCommerce — Importância dos Selos](https://blog.bwcommerce.com.br/importancia-dos-selos-de-seguranca-para-uma-experiencia-de-compra-confiavel)

### Autenticação
- [Authgear — Login & Signup UX 2025](https://www.authgear.com/post/login-signup-ux-guide)
- [BayTech — Magic Links UX 2025](https://www.baytechconsulting.com/blog/magic-links-ux-security-and-growth-impacts-for-saas-platforms-2025)
- [LogRocket — Magic Links UX](https://blog.logrocket.com/ux-design/how-to-use-magic-links/)
- [NopAccelerate — Passwordless Ecommerce 2026](https://www.nopaccelerate.com/passwordless-authentication-ecommerce-2026/)

### CEP e Formulários
- [Anderson Mamede — Autocomplete CEP](https://blog.andersonmamede.com.br/autocomplete-de-endereco-pelo-CEP/)
- [Medium — CEP Promise auto-fill](https://medium.com/@felquis/como-auto-preencher-um-formul%C3%A1rio-de-endere%C3%A7o-com-o-cep-promise-e0aec1e50407)
- [VNDA — Auto preenchimento CEP](https://developers.vnda.com.br/docs/auto-preenchimento-de-endere%C3%A7o-pelo-cep)

### Marketplace Hub e Onboarding
- [Bling — Integrações](https://www.bling.com.br/integracoes-bling)
- [Bling — Integração Marketplace](https://www.bling.com.br/funcionalidades/integracao-marketplace)
- [Shopify Dev — Onboarding](https://shopify.dev/docs/apps/design/user-experience/onboarding)
- [Candu.ai — Shopify Onboarding Flow](https://www.candu.ai/blog/shopify-onboarding-flow)
- [Shopify — Marketplace Integration 2025](https://www.shopify.com/blog/marketplace-integration)
- [Prismatic — OAuth2 Connect Button](https://prismatic.io/docs/integrations/connections/oauth2/)

### Padrões de Dashboard e Status
- [PatternFly — Dashboard Patterns](https://www.patternfly.org/patterns/dashboard/design-guidelines/)
- [UI Patterns — Status Pattern](https://ui-patterns.com/patterns/Status)
- [DataGrail — Integration Errors](https://docs.datagrail.io/docs/integrations/managing-integrations/errors/)

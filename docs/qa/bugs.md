# Bug Report — E-commerce
**Data**: 2026-03-30
**Agente**: QA (análise estática)

---

## BUG-001: revalidateTag chamado com argumento inválido "seconds"
**Severidade**: Alto
**Prioridade**: P1
**Arquivo**: `frontend/lib/medusa/index.ts:212,229,251,613,614,615`
**Descrição**: `revalidateTag` da Next.js `"next/cache"` aceita apenas `(tag: string)` como assinatura. O código passa um segundo argumento `"seconds"` (ex: `revalidateTag(TAGS.cart, "seconds")`), que não existe na API e é ignorado silenciosamente em tempo de execução — mas indica confusão com a API de `cacheLife`. Se a Next.js vier a tipar o argumento mais rigorosamente, isso quebrará em build time.
**Reprodução**: Qualquer operação de mutação de carrinho (`addToCart`, `removeFromCart`, `updateCart`) ou chamada ao webhook de revalidação.
**Esperado**: `revalidateTag(TAGS.cart)` sem segundo argumento.
**Agente responsável**: Agente B (backend/integrações)

---

## BUG-002: updateCart usa método POST em vez de PATCH/PUT para atualizar line-item
**Severidade**: Alto
**Prioridade**: P1
**Arquivo**: `frontend/lib/medusa/index.ts:244`
**Descrição**: `updateCart` envia `method: "POST"` para `/store/carts/{cartId}/line-items/{lineId}`. A API do Medusa v2 exige `POST` para criar e `POST` com dados diferentes para atualizar, mas o endpoint correto para atualizar quantidade de um line item é `/store/carts/{cartId}/line-items/{lineId}` via `POST` — contudo, dependendo da versão do Medusa, o endpoint pode retornar 404 ou ignorar a requisição sem erro visível se o método não corresponder ao esperado. Verificar se o endpoint aceita POST ou se deve ser outro verbo.
**Reprodução**: Alterar a quantidade de um item no carrinho via UI.
**Esperado**: Confirmar com documentação do Medusa v2 o verbo correto (possivelmente `POST` é correto, mas validar contra a API real).
**Agente responsável**: Agente B

---

## BUG-003: Dados sensíveis de cartão de crédito trafegam em campos hidden do formulário HTML
**Severidade**: Crítico
**Prioridade**: P0
**Arquivo**: `frontend/app/checkout/page.tsx:219-223`
**Descrição**: Os campos `cardNumber`, `cardName`, `cardExpiry` e `cardCvv` são armazenados em `<input type="hidden">` dentro do DOM e depois lidos via `FormData`. Isso significa que os dados brutos do cartão ficam acessíveis no DOM e são enviados como `FormData` para um Server Action — o que NÃO é conforme PCI-DSS. Dados de cartão nunca devem transitar pelo servidor da aplicação; devem ser tokenizados no cliente via SDK do gateway (ex: Asaas.js, Stripe.js) antes de qualquer submissão.
**Reprodução**: Abrir DevTools → Elements → inspecionar o formulário de checkout preenchido com dados de cartão.
**Esperado**: Os dados do cartão devem ser tokenizados client-side pelo SDK do gateway e apenas o token deve ser enviado ao servidor.
**Agente responsável**: Agente D (pagamentos)

---

## BUG-004: paymentData armazenado em cookie não-httpOnly (dados de PIX/boleto expostos)
**Severidade**: Alto
**Prioridade**: P1
**Arquivo**: `frontend/components/checkout/actions.ts:140-145`
**Descrição**: O cookie `paymentData` é definido com `httpOnly: false` intencionalmente (para ser lido client-side), mas ele pode conter o QR code do PIX em base64 e o código do boleto. Qualquer XSS na aplicação poderia exfiltrar esses dados. Além disso, o cookie tem `maxAge: 60 * 30` (30 min) o que é aceitável, mas a abordagem de cookie para dados de pagamento é frágil.
**Reprodução**: Completar um pedido PIX e inspecionar cookies no DevTools.
**Esperado**: Os dados de pagamento devem ser passados via URL segura ou armazenados server-side e recuperados via API autenticada.
**Agente responsável**: Agente D

---

## BUG-005: AddressForm ignora erro silenciosamente ao salvar endereço no backend
**Severidade**: Médio
**Prioridade**: P2
**Arquivo**: `frontend/components/checkout/address-form.tsx:164-167`
**Descrição**: No bloco `catch` de `handleSubmit`, quando a chamada `POST /store/carts/{cartId}/shipping-address` falha, o componente define `submitted = true` e chama `onSubmit?.(data)` mesmo assim — ou seja, o checkout continua como se o endereço tivesse sido salvo. Se o endpoint retornar erro (ex: cart expirado, CEP inválido para o Medusa), o pedido será criado sem endereço de entrega.
**Reprodução**: Simular falha de rede ou backend indisponível ao salvar endereço.
**Esperado**: Erros ao salvar o endereço devem ser exibidos ao usuário e bloquear o avanço do checkout.
**Agente responsável**: Agente D / Agente B

---

## BUG-006: Confirmação de cartão de crédito recusado mostra "aprovado" quando cardStatus é undefined
**Severidade**: Alto
**Prioridade**: P1
**Arquivo**: `frontend/app/checkout/confirmacao/[orderId]/page.tsx:353`
**Descrição**: A condição `paymentData.cardStatus === "approved" || !paymentData.cardStatus` faz com que a ausência de `cardStatus` (quando o cookie não foi lido ou o gateway não retornou status) exiba "Pagamento aprovado!" — um falso positivo que engana o cliente.
**Reprodução**: Acessar `/checkout/confirmacao/[id]?payment=cartao` com `paymentData` vazio (sem cookie ou com cookie expirado).
**Esperado**: Quando `cardStatus` é undefined/ausente, deve-se exibir estado neutro (ex: "Verificando pagamento...") em vez de assumir aprovação.
**Agente responsável**: Agente D

---

## BUG-007: Área do cliente (/account) não redireciona para login quando não há token — layout renderiza conteúdo parcial
**Severidade**: Médio
**Prioridade**: P2
**Arquivo**: `frontend/app/account/layout.tsx` e `frontend/app/account/page.tsx`
**Descrição**: O `AccountPage` (page.tsx) faz `redirect('/account/login')` corretamente quando não há token. Porém, o `AccountLayout` (layout.tsx) renderiza o layout completo (Navbar, grid) antes que o redirect do page.tsx aconteça. Em teoria o redirect do Server Component aborta o render, mas se houver SSR parcial ou edge caching, o layout pode ser enviado antes. Adicionalmente, rotas filhas como `/account/profile` e `/account/addresses` (que não existem ainda) não têm proteção própria.
**Reprodução**: Acessar `/account/profile` ou `/account/addresses` sem autenticação.
**Esperado**: Todas as rotas `/account/*` devem ter proteção de autenticação, preferencialmente via middleware Next.js.
**Agente responsável**: Agente E (autenticação/frontend)

---

## BUG-008: MarketplaceService persiste dados em /tmp — perda de dados em reinicializações
**Severidade**: Médio
**Prioridade**: P2
**Arquivo**: `backend/src/modules/marketplace/service.ts:8`
**Descrição**: `DB_FILE = '/tmp/marketplace-connections.json'` significa que todas as conexões de marketplace são perdidas a cada reinicialização do servidor ou deploy. Em ambientes containerizados (Docker, Heroku, Railway) o `/tmp` é volátil.
**Reprodução**: Reiniciar o servidor após criar uma conexão de marketplace.
**Esperado**: Usar banco de dados persistente (PostgreSQL via Medusa Data Layer) ou ao menos um volume persistente configurável via env var.
**Agente responsável**: Agente F (marketplace/integrações)

---

## BUG-009: CSRF_STORE (mapa em memória) não persiste entre instâncias/workers do servidor
**Severidade**: Alto
**Prioridade**: P1
**Arquivo**: `backend/src/modules/marketplace/service.ts:12`
**Descrição**: `CSRF_STORE` é um `Map` em memória. Em ambientes com múltiplas instâncias (load balancer, cluster Node.js, múltiplos workers) o estado OAuth (state parameter) não é compartilhado entre instâncias. Um fluxo OAuth iniciado na instância A pode falhar com "Invalid or expired OAuth state" se o callback chegar na instância B.
**Reprodução**: Deploy com múltiplas réplicas ou usando `cluster` do Node.js.
**Esperado**: Usar Redis ou banco de dados para armazenar o CSRF state.
**Agente responsável**: Agente F

---

## BUG-010: Endpoint /store/checkout e /store/checkout/status podem não existir no Medusa padrão
**Severidade**: Alto
**Prioridade**: P1
**Arquivo**: `frontend/components/checkout/actions.ts:104` e `frontend/app/checkout/confirmacao/[orderId]/page.tsx:134`
**Descrição**: `POST /store/checkout` e `GET /store/checkout/status` não fazem parte da API padrão do Medusa v2. São endpoints customizados que precisam ser registrados no backend. Se não estiverem implementados, o fluxo de pagamento completo retornará 404 silenciosamente (o catch está vazio em actions.ts linha 135), deixando `paymentData` vazio e o cookie sem dados de pagamento — o cliente verá tela de "aguardando pagamento..." indefinidamente para PIX/boleto.
**Reprodução**: Completar um pedido com qualquer método de pagamento sem os endpoints customizados implementados no backend.
**Esperado**: Documentar e garantir que esses endpoints existam no backend, ou implementar tratamento de erro explícito quando 404.
**Agente responsável**: Agente B / Agente D

---

## BUG-011: getCart usa diretiva "use cache: private" com sintaxe inválida
**Severidade**: Alto
**Prioridade**: P1
**Arquivo**: `frontend/lib/medusa/index.ts:256`
**Descrição**: A diretiva `"use cache: private"` não é uma sintaxe válida do Next.js 15. A diretiva correta é `"use cache"` (sem `: private`). A intenção provavelmente era usar `cacheLife("private")` ou simplesmente `"use cache"`. Dependendo da versão do compilador Next.js, isso pode ser ignorado, gerar warning ou quebrar o build.
**Reprodução**: Build de produção (`npm run build`) ou análise estática.
**Esperado**: Usar `"use cache"` com `cacheLife` e `cacheTag` conforme padrão do Next.js 15.
**Agente responsável**: Agente E / Agente B

---

## BUG-012: Frete (ShippingOptions) auto-seleciona a primeira opção sem confirmar com o usuário
**Severidade**: Baixo
**Prioridade**: P3
**Arquivo**: `frontend/components/checkout/shipping-options.tsx:43-45`
**Descrição**: Quando as opções de frete são carregadas, `handleSelect(opts[0].id)` é chamado automaticamente, fazendo uma requisição `POST /store/carts/{cartId}/shipping-methods` sem interação do usuário. Além de presumir escolha, isso gera uma request extra desnecessária se o usuário mudar a opção.
**Reprodução**: Preencher o CEP no checkout e observar que a primeira opção de frete é selecionada e salva automaticamente.
**Esperado**: Pré-selecionar visualmente mas aguardar confirmação explícita ou ao menos não salvar no backend até o usuário confirmar.
**Agente responsável**: Agente D / Agente E

---

## BUG-013: AddressForm não exibe campo "phone" com validação de telefone mas valida mínimo 10 dígitos
**Severidade**: Baixo
**Prioridade**: P3
**Arquivo**: `frontend/components/checkout/address-form.tsx:121`
**Descrição**: A validação aceita telefone com 10 dígitos (fixo sem DDD não existe), mas o campo obriga telefone. Telefones celulares têm 11 dígitos com DDD e fixos 10. A validação `< 10` pode rejeitar formatos válidos de 9 dígitos em alguns contextos. Menor inconsistência, mas pode causar fricção desnecessária.
**Reprodução**: Tentar preencher o formulário com um número de 9 dígitos (sem DDD).
**Esperado**: Validação mais clara e mensagem explícita sobre formato esperado.
**Agente responsável**: Agente E

---

*Total de bugs documentados: 13*
*Crítico: 1 | Alto: 7 | Médio: 3 | Baixo: 2*

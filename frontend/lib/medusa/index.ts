import { TAGS } from "lib/constants";
import {
  unstable_cacheLife as cacheLife,
  unstable_cacheTag as cacheTag,
  revalidateTag,
} from "next/cache";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import type {
  Cart,
  CartItem,
  Collection,
  Image,
  Menu,
  Money,
  Page,
  Product,
  ProductOption,
  ProductVariant,
} from "lib/shopify/types";
import type { MedusaCart, MedusaProduct, MedusaVariant } from "./types";

const BACKEND_URL =
  process.env.MEDUSA_BACKEND_URL || "http://localhost:9000";

const PUBLISHABLE_KEY =
  process.env.MEDUSA_PUBLISHABLE_KEY || "";

async function medusaFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${BACKEND_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-publishable-api-key": PUBLISHABLE_KEY,
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Medusa API error ${res.status} on ${path}: ${text}`,
    );
  }

  return res.json() as Promise<T>;
}

// ---------- Mappers ----------

function toMoney(amount: number, currencyCode: string): Money {
  return {
    amount: (amount / 100).toFixed(2),
    currencyCode: currencyCode.toUpperCase(),
  };
}

function toImage(url: string, alt = ""): Image {
  return { url, altText: alt, width: 1000, height: 1000 };
}

function mapProduct(p: MedusaProduct): Product {
  const currency =
    p.variants?.[0]?.prices?.[0]?.currency_code || "brl";
  const prices = p.variants?.flatMap((v) => v.prices) || [];
  const amounts = prices.map((pr) => pr.amount);
  const minAmount = amounts.length ? Math.min(...amounts) : 0;
  const maxAmount = amounts.length ? Math.max(...amounts) : 0;

  const images: Image[] = p.images?.length
    ? p.images.map((img) => toImage(img.url))
    : p.thumbnail
      ? [toImage(p.thumbnail)]
      : [toImage("/placeholder.svg")];

  const options: ProductOption[] = (p.options || []).map((o) => ({
    id: o.id,
    name: o.title,
    values: (o.values || []).map((v) => v.value),
  }));

  const variants: ProductVariant[] = (p.variants || []).map((v) => {
    const price = v.prices?.[0];
    return {
      id: v.id,
      title: v.title,
      availableForSale: (v.inventory_quantity ?? 1) > 0,
      selectedOptions: (v.options || []).map((opt) => {
        const option = p.options?.find((o) => o.id === opt.option_id);
        return {
          name: option?.title || opt.option_id,
          value: opt.value,
        };
      }),
      price: price
        ? toMoney(price.amount, price.currency_code)
        : toMoney(0, currency),
    };
  });

  return {
    id: p.id,
    handle: p.handle,
    availableForSale: p.status === "published",
    title: p.title,
    description: p.description || "",
    descriptionHtml: p.description || "",
    options,
    priceRange: {
      minVariantPrice: toMoney(minAmount, currency),
      maxVariantPrice: toMoney(maxAmount, currency),
    },
    variants,
    featuredImage: images[0]!,
    images,
    seo: { title: p.title, description: p.description || "" },
    tags: (p.tags || []).map((t) => t.value),
    updatedAt: p.updated_at,
  };
}

function mapCart(c: MedusaCart): Cart {
  const currency = c.region?.currency_code || "brl";
  const lines: CartItem[] = (c.items || []).map((item) => ({
    id: item.id,
    quantity: item.quantity,
    cost: { totalAmount: toMoney(item.total, currency) },
    merchandise: {
      id: item.variant_id,
      title: item.variant?.title || item.title,
      selectedOptions:
        item.variant?.options?.map((opt) => ({
          name: opt.option_id,
          value: opt.value,
        })) || [],
      product: {
        id: item.variant?.product?.id || "",
        handle: item.variant?.product?.handle || "",
        title: item.variant?.product?.title || item.title,
        featuredImage: toImage(
          item.variant?.product?.thumbnail ||
            item.variant?.product?.images?.[0]?.url ||
            "/placeholder.svg",
        ),
      },
    },
  }));

  return {
    id: c.id,
    checkoutUrl: `/checkout`,
    cost: {
      subtotalAmount: toMoney(c.subtotal || 0, currency),
      totalAmount: toMoney(c.total || 0, currency),
      totalTaxAmount: toMoney(c.tax_total || 0, currency),
    },
    lines,
    totalQuantity: lines.reduce((sum, l) => sum + l.quantity, 0),
  };
}

// ---------- Cart ----------

async function getCartId(): Promise<string | undefined> {
  return (await cookies()).get("cartId")?.value;
}

export async function createCart(): Promise<Cart> {
  // Buscar região BRL para associar ao carrinho
  let regionId: string | undefined;
  try {
    const regionData = await medusaFetch<{
      regions: { id: string; currency_code: string }[];
    }>("/store/regions?currency_code=brl");
    regionId = regionData.regions?.[0]?.id;
  } catch {
    // Fallback: criar carrinho sem region_id
  }

  const data = await medusaFetch<{ cart: MedusaCart }>("/store/carts", {
    method: "POST",
    body: JSON.stringify(regionId ? { region_id: regionId } : {}),
  });
  return mapCart(data.cart);
}

export async function addToCart(
  lines: { merchandiseId: string; quantity: number }[],
): Promise<Cart> {
  const cartId = await getCartId();
  if (!cartId) throw new Error("No cart found");

  const results = await Promise.all(
    lines.map((line) =>
      medusaFetch<{ cart: MedusaCart }>(
        `/store/carts/${cartId}/line-items`,
        {
          method: "POST",
          body: JSON.stringify({
            variant_id: line.merchandiseId,
            quantity: line.quantity,
          }),
        },
      ),
    ),
  );
  const cart = results[results.length - 1]!.cart;

  revalidateTag(TAGS.cart);
  return mapCart(cart);
}

export async function removeFromCart(lineIds: string[]): Promise<Cart> {
  const cartId = await getCartId();
  if (!cartId) throw new Error("No cart found");

  const results = await Promise.all(
    lineIds.map((lineId) =>
      medusaFetch<{ cart: MedusaCart }>(
        `/store/carts/${cartId}/line-items/${lineId}`,
        { method: "DELETE" },
      ),
    ),
  );
  const cart = results[results.length - 1]!.cart;

  revalidateTag(TAGS.cart);
  return mapCart(cart);
}

export async function updateCart(
  lines: { id: string; merchandiseId: string; quantity: number }[],
): Promise<Cart> {
  const cartId = await getCartId();
  if (!cartId) throw new Error("No cart found");

  const results = await Promise.all(
    lines.map((line) =>
      medusaFetch<{ cart: MedusaCart }>(
        `/store/carts/${cartId}/line-items/${line.id}`,
        {
          method: "POST",
          body: JSON.stringify({ quantity: line.quantity }),
        },
      ),
    ),
  );
  const cart = results[results.length - 1]!.cart;

  revalidateTag(TAGS.cart);
  return mapCart(cart);
}

export async function getCart(): Promise<Cart | undefined> {
  "use cache: private";
  const cartId = await getCartId();
  if (!cartId) return undefined;

  try {
    const data = await medusaFetch<{ cart: MedusaCart }>(
      `/store/carts/${cartId}?fields=+items.variant.product.*`,
    );
    return mapCart(data.cart);
  } catch {
    return undefined;
  }
}

// ---------- Collections ----------

export async function getCollection(
  handle: string,
): Promise<Collection | undefined> {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.collections);

  try {
    const data = await medusaFetch<{
      product_categories: { id: string; handle: string; name: string; description: string | null; updated_at: string }[];
    }>(`/store/product-categories?handle=${encodeURIComponent(handle)}`);

    const cat = data.product_categories?.[0];
    if (!cat) return undefined;

    return {
      handle: cat.handle,
      title: cat.name,
      description: cat.description || "",
      seo: { title: cat.name, description: cat.description || "" },
      updatedAt: cat.updated_at,
      path: `/search/${cat.handle}`,
    };
  } catch {
    return undefined;
  }
}

export async function getCollectionProducts({
  collection,
  reverse,
  sortKey,
}: {
  collection: string;
  reverse?: boolean;
  sortKey?: string;
}): Promise<Product[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.collections);
  cacheTag(TAGS.products);

  const order = reverse ? "DESC" : "ASC";
  const sort = sortKey === "PRICE" ? "variants.prices.amount" : "created_at";

  try {
    // Medusa v2 uses category_id[], not category_handle[] — resolve handle to ID first
    const catData = await medusaFetch<{
      product_categories: { id: string; handle: string }[];
    }>(`/store/product-categories?handle=${encodeURIComponent(collection)}&limit=1`);
    const cat = catData.product_categories?.[0];
    if (!cat) return [];

    const data = await medusaFetch<{ products: MedusaProduct[] }>(
      `/store/products?category_id[]=${cat.id}&order=${sort}&fields=*variants,*images,*options,*tags`,
    );
    return (data.products || []).map(mapProduct);
  } catch {
    return [];
  }
}

export async function getCollections(): Promise<Collection[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.collections);

  try {
    const data = await medusaFetch<{
      product_categories: { id: string; handle: string; name: string; description: string | null; updated_at: string }[];
    }>(`/store/product-categories?limit=50`);

    return (data.product_categories || []).map((cat) => ({
      handle: cat.handle,
      title: cat.name,
      description: cat.description || "",
      seo: { title: cat.name, description: cat.description || "" },
      updatedAt: cat.updated_at,
      path: `/search/${cat.handle}`,
    }));
  } catch {
    return [];
  }
}

// ---------- Menu ----------

export async function getMenu(handle: string): Promise<Menu[]> {
  "use cache";
  cacheLife("hours");

  if (handle === "next-js-frontend-header-menu") {
    // Buscar categorias reais do Medusa para compor o menu dinâmico
    try {
      const data = await medusaFetch<{
        product_categories: { id: string; name: string; handle: string }[];
      }>("/store/product-categories?limit=10");

      const categoryItems: Menu[] = (data.product_categories || []).map(
        (cat) => ({
          title: cat.name,
          path: `/search/${cat.handle}`,
        }),
      );

      return [{ title: "Todos", path: "/search" }, ...categoryItems];
    } catch {
      // Fallback se a API não estiver disponível
      return [{ title: "Todos", path: "/search" }];
    }
  }

  if (handle === "next-js-frontend-footer-menu") {
    return [
      { title: "Home", path: "/" },
      { title: "Sobre Nós", path: "/about" },
      { title: "Termos de Uso", path: "/terms" },
      { title: "Privacidade", path: "/privacy" },
    ];
  }

  return [];
}

// ---------- Pages ----------

const STATIC_PAGES: Record<
  string,
  { title: string; body: string; bodySummary: string }
> = {
  about: {
    title: "Sobre Nós",
    bodySummary:
      "Conheça a Doze Crew — moda com propósito, feita para durar.",
    body: `<h2>Quem somos</h2>
<p>A Doze Crew nasceu da paixão por criar peças que vão além da moda passageira. Somos uma marca brasileira comprometida com qualidade, autenticidade e sustentabilidade.</p>
<h2>Nossa missão</h2>
<p>Acreditamos que roupas de qualidade não precisam custar uma fortuna. Por isso, trabalhamos diretamente com fabricantes nacionais para oferecer peças premium com preço justo.</p>
<h2>Nossos valores</h2>
<ul>
  <li><strong>Qualidade</strong>: Usamos apenas tecidos premium com certificação OEKO-TEX.</li>
  <li><strong>Transparência</strong>: Você sabe exatamente o que está comprando e de onde vem.</li>
  <li><strong>Sustentabilidade</strong>: Embalagens 100% recicláveis e compensação de carbono em todos os envios.</li>
  <li><strong>Comunidade</strong>: Parte dos nossos lucros é reinvestida em projetos culturais brasileiros.</li>
</ul>
<h2>Produção nacional</h2>
<p>Todas as nossas peças são produzidas no Brasil, em parceria com cooperativas têxteis que garantem condições de trabalho dignas e salários justos.</p>
<h2>Fale conosco</h2>
<p>Dúvidas, sugestões ou parcerias? Entre em contato pelo e-mail <a href="mailto:oi@dozecrew.com">oi@dozecrew.com</a> ou pelas nossas redes sociais.</p>`,
  },
  terms: {
    title: "Termos de Uso",
    bodySummary: "Leia os termos e condições de uso da loja Doze Crew.",
    body: `<p><em>Última atualização: março de 2026</em></p>
<h2>1. Aceitação dos Termos</h2>
<p>Ao acessar e utilizar o site da Doze Crew, você concorda com estes Termos de Uso. Caso não concorde, por favor, não utilize nossos serviços.</p>
<h2>2. Produtos e Preços</h2>
<p>Todos os preços são expressos em Reais (BRL) e incluem os impostos aplicáveis. Reservamo-nos o direito de alterar preços sem aviso prévio, sendo aplicado o preço vigente no momento da conclusão do pedido.</p>
<h2>3. Pedidos e Pagamentos</h2>
<p>Aceitamos pagamentos via PIX, boleto bancário e cartão de crédito. O pedido é confirmado somente após a aprovação do pagamento. Em caso de indisponibilidade de estoque, notificaremos o cliente e procederemos com o reembolso integral.</p>
<h2>4. Entrega</h2>
<p>As entregas são realizadas para todo o território nacional. Os prazos variam conforme a modalidade de frete escolhida e a localidade do destinatário. O prazo começa a contar após a confirmação do pagamento.</p>
<h2>5. Política de Trocas e Devoluções</h2>
<p>Você tem até 30 dias corridos a partir do recebimento do produto para solicitar troca ou devolução, conforme o Código de Defesa do Consumidor (Lei 8.078/90). Produtos com defeito de fabricação têm garantia de 90 dias.</p>
<h2>6. Propriedade Intelectual</h2>
<p>Todo o conteúdo deste site — textos, imagens, logotipos e designs — é propriedade da Doze Crew e protegido por lei. É proibida a reprodução sem autorização prévia.</p>
<h2>7. Limitação de Responsabilidade</h2>
<p>A Doze Crew não se responsabiliza por danos indiretos decorrentes do uso do site ou dos produtos além do previsto em lei.</p>
<h2>8. Legislação Aplicável</h2>
<p>Estes termos são regidos pela legislação brasileira. Fica eleito o foro da comarca de São Paulo/SP para resolução de quaisquer litígios.</p>
<h2>9. Contato</h2>
<p>Para questões relacionadas a estes Termos de Uso, entre em contato pelo e-mail <a href="mailto:juridico@dozecrew.com">juridico@dozecrew.com</a>.</p>`,
  },
  privacy: {
    title: "Política de Privacidade",
    bodySummary:
      "Como coletamos, usamos e protegemos seus dados pessoais conforme a LGPD.",
    body: `<p><em>Última atualização: março de 2026</em></p>
<h2>1. Introdução</h2>
<p>A Doze Crew se compromete a proteger sua privacidade. Esta Política descreve como coletamos, usamos e protegemos seus dados pessoais, em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei 13.709/2018).</p>
<h2>2. Dados Coletados</h2>
<p>Coletamos os seguintes dados pessoais:</p>
<ul>
  <li><strong>Dados de identificação</strong>: nome completo, e-mail, telefone.</li>
  <li><strong>Dados de entrega</strong>: endereço completo (CEP, logradouro, número, complemento, bairro, cidade, estado).</li>
  <li><strong>Dados de pagamento</strong>: processados de forma segura pelo gateway Asaas — não armazenamos dados de cartão.</li>
  <li><strong>Dados de navegação</strong>: cookies técnicos e de desempenho para funcionamento do site.</li>
</ul>
<h2>3. Finalidade do Tratamento</h2>
<p>Utilizamos seus dados para:</p>
<ul>
  <li>Processar e entregar seus pedidos;</li>
  <li>Enviar comunicações transacionais (confirmação de pedido, nota fiscal, rastreamento);</li>
  <li>Melhorar nossa plataforma e experiência de compra;</li>
  <li>Cumprir obrigações legais e fiscais.</li>
</ul>
<h2>4. Base Legal</h2>
<p>O tratamento de dados é realizado com base na execução de contrato (Art. 7°, V da LGPD) e no legítimo interesse para comunicações transacionais.</p>
<h2>5. Compartilhamento de Dados</h2>
<p>Compartilhamos seus dados apenas com parceiros essenciais para a prestação dos serviços: transportadoras, gateway de pagamento (Asaas) e serviços de infraestrutura em nuvem. Não vendemos seus dados a terceiros.</p>
<h2>6. Armazenamento e Segurança</h2>
<p>Seus dados são armazenados em servidores seguros com criptografia em repouso e em trânsito (TLS 1.3). Aplicamos controles de acesso rigorosos e realizamos auditorias periódicas.</p>
<h2>7. Seus Direitos</h2>
<p>Conforme a LGPD, você tem direito a:</p>
<ul>
  <li>Confirmar a existência de tratamento e acessar seus dados;</li>
  <li>Corrigir dados incompletos ou desatualizados;</li>
  <li>Solicitar a exclusão de dados desnecessários;</li>
  <li>Revogar o consentimento a qualquer momento;</li>
  <li>Solicitar portabilidade dos dados.</li>
</ul>
<h2>8. Cookies</h2>
<p>Utilizamos cookies estritamente necessários para o funcionamento do carrinho e sessão. Não utilizamos cookies de rastreamento de terceiros para publicidade.</p>
<h2>9. Contato com o Encarregado (DPO)</h2>
<p>Para exercer seus direitos ou esclarecer dúvidas sobre privacidade, entre em contato pelo e-mail <a href="mailto:privacidade@dozecrew.com">privacidade@dozecrew.com</a>.</p>`,
  },
};

export async function getPage(handle: string): Promise<Page> {
  "use cache";
  cacheLife("hours");

  const staticPage = STATIC_PAGES[handle];
  if (staticPage) {
    return {
      id: handle,
      title: staticPage.title,
      handle,
      body: staticPage.body,
      bodySummary: staticPage.bodySummary,
      seo: { title: staticPage.title, description: staticPage.bodySummary },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  // Medusa v2 doesn't expose a pages/CMS API out of the box.
  // Return an empty page so the app doesn't break.
  return {
    id: handle,
    title: handle.replace(/-/g, " "),
    handle,
    body: "",
    bodySummary: "",
    seo: { title: handle, description: "" },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export async function getPages(): Promise<Page[]> {
  "use cache";
  cacheLife("hours");

  return [];
}

// ---------- Products ----------

export async function getProduct(
  handle: string,
): Promise<Product | undefined> {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.products);

  try {
    const data = await medusaFetch<{ products: MedusaProduct[] }>(
      `/store/products?handle=${encodeURIComponent(handle)}&fields=*variants,*images,*options,*tags`,
    );
    const p = data.products?.[0];
    if (!p) return undefined;
    return mapProduct(p);
  } catch {
    return undefined;
  }
}

export async function getProductRecommendations(
  productId: string,
): Promise<Product[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.products);

  try {
    const data = await medusaFetch<{ products: MedusaProduct[] }>(
      `/store/products?limit=4&fields=*variants,*images,*options,*tags`,
    );
    return (data.products || [])
      .filter((p) => p.id !== productId)
      .slice(0, 4)
      .map(mapProduct);
  } catch {
    return [];
  }
}

export async function getProducts({
  query,
  reverse,
  sortKey,
}: {
  query?: string;
  reverse?: boolean;
  sortKey?: string;
}): Promise<Product[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.products);

  const params = new URLSearchParams({
    limit: "50",
    fields: "*variants,*images,*options,*tags",
  });

  if (query) params.set("q", query);

  try {
    const data = await medusaFetch<{ products: MedusaProduct[] }>(
      `/store/products?${params.toString()}`,
    );
    let products = (data.products || []).map(mapProduct);
    if (reverse) products = products.reverse();
    return products;
  } catch {
    return [];
  }
}

// ---------- Revalidate webhook ----------

export async function revalidate(req: NextRequest): Promise<NextResponse> {
  const secret = req.headers.get("x-revalidate-secret");
  if (
    !secret ||
    secret !== process.env.MEDUSA_REVALIDATION_SECRET
  ) {
    return NextResponse.json({ status: 401, message: "Unauthorized" });
  }

  revalidateTag(TAGS.collections);
  revalidateTag(TAGS.products);
  revalidateTag(TAGS.cart);

  return NextResponse.json({ status: 200, revalidated: true });
}

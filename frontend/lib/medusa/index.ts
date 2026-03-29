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
    checkoutUrl: `${BACKEND_URL}/checkout/${c.id}`,
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
  const data = await medusaFetch<{ cart: MedusaCart }>("/store/carts", {
    method: "POST",
    body: JSON.stringify({}),
  });
  return mapCart(data.cart);
}

export async function addToCart(
  lines: { merchandiseId: string; quantity: number }[],
): Promise<Cart> {
  const cartId = await getCartId();
  if (!cartId) throw new Error("No cart found");

  let cart: MedusaCart | undefined;
  for (const line of lines) {
    const data = await medusaFetch<{ cart: MedusaCart }>(
      `/store/carts/${cartId}/line-items`,
      {
        method: "POST",
        body: JSON.stringify({
          variant_id: line.merchandiseId,
          quantity: line.quantity,
        }),
      },
    );
    cart = data.cart;
  }

  revalidateTag(TAGS.cart, "seconds");
  return mapCart(cart!);
}

export async function removeFromCart(lineIds: string[]): Promise<Cart> {
  const cartId = await getCartId();
  if (!cartId) throw new Error("No cart found");

  let cart: MedusaCart | undefined;
  for (const lineId of lineIds) {
    const data = await medusaFetch<{ cart: MedusaCart }>(
      `/store/carts/${cartId}/line-items/${lineId}`,
      { method: "DELETE" },
    );
    cart = data.cart;
  }

  revalidateTag(TAGS.cart, "seconds");
  return mapCart(cart!);
}

export async function updateCart(
  lines: { id: string; merchandiseId: string; quantity: number }[],
): Promise<Cart> {
  const cartId = await getCartId();
  if (!cartId) throw new Error("No cart found");

  let cart: MedusaCart | undefined;
  for (const line of lines) {
    const data = await medusaFetch<{ cart: MedusaCart }>(
      `/store/carts/${cartId}/line-items/${line.id}`,
      {
        method: "POST",
        body: JSON.stringify({ quantity: line.quantity }),
      },
    );
    cart = data.cart;
  }

  revalidateTag(TAGS.cart, "seconds");
  return mapCart(cart!);
}

export async function getCart(): Promise<Cart | undefined> {
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
    const data = await medusaFetch<{ products: MedusaProduct[] }>(
      `/store/products?category_handle[]=${encodeURIComponent(collection)}&order=${sort}&fields=*variants,*images,*options,*tags`,
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

  // Medusa doesn't have a native menu API — use static menus or
  // fall back to collections for the footer
  if (handle === "next-js-frontend-header-menu") {
    return [
      { title: "All", path: "/search" },
      { title: "Shirts", path: "/search/shirts" },
      { title: "Stickers", path: "/search/stickers" },
    ];
  }

  if (handle === "next-js-frontend-footer-menu") {
    return [
      { title: "Home", path: "/" },
      { title: "About", path: "/about" },
      { title: "Terms", path: "/terms" },
      { title: "Privacy", path: "/privacy" },
    ];
  }

  return [];
}

// ---------- Pages ----------

export async function getPage(handle: string): Promise<Page> {
  "use cache";
  cacheLife("hours");

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

  revalidateTag(TAGS.collections, "seconds");
  revalidateTag(TAGS.products, "seconds");
  revalidateTag(TAGS.cart, "seconds");

  return NextResponse.json({ status: 200, revalidated: true });
}

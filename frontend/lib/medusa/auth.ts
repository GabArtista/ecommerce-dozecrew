/**
 * Medusa Auth — Autenticação de clientes via emailpass
 * Padrão: JWT token armazenado em cookie "customerToken"
 */

const BACKEND_URL =
  process.env.MEDUSA_BACKEND_URL || "http://localhost:9000";

const PUBLISHABLE_KEY = process.env.MEDUSA_PUBLISHABLE_KEY || "";

// ---------- Tipos ----------

export interface MedusaCustomer {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  created_at: string;
}

export interface MedusaOrder {
  id: string;
  display_id: number;
  status: string;
  payment_status: string;
  fulfillment_status: string;
  total: number;
  subtotal: number;
  shipping_total: number;
  currency_code: string;
  created_at: string;
  items: MedusaOrderItem[];
  shipping_address?: MedusaAddress | null;
  payment_collections?: { payment_sessions?: { provider_id: string }[] }[];
}

export interface MedusaOrderItem {
  id: string;
  title: string;
  quantity: number;
  unit_price: number;
  total: number;
  thumbnail: string | null;
  variant?: {
    title: string;
    product?: {
      title: string;
      thumbnail: string | null;
    };
  };
}

export interface MedusaAddress {
  first_name: string | null;
  last_name: string | null;
  address_1: string | null;
  address_2: string | null;
  city: string | null;
  province: string | null;
  postal_code: string | null;
  country_code: string | null;
}

export interface AuthResult {
  token?: string;
  error?: string;
}

// ---------- Fetch base ----------

async function authFetch<T>(
  path: string,
  options: RequestInit = {},
  token?: string,
): Promise<T> {
  const url = `${BACKEND_URL}${path}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-publishable-api-key": PUBLISHABLE_KEY,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...(options.headers || {}),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Auth API error ${res.status} on ${path}: ${text}`);
  }

  return res.json() as Promise<T>;
}

// ---------- Funções de Auth ----------

/**
 * Login via emailpass — retorna JWT token
 * POST /auth/customer/emailpass
 */
export async function login(
  email: string,
  password: string,
): Promise<AuthResult> {
  try {
    const data = await authFetch<{ token: string }>(
      "/auth/customer/emailpass",
      {
        method: "POST",
        body: JSON.stringify({ email, password }),
      },
    );
    return { token: data.token };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erro ao fazer login" };
  }
}

/**
 * Cadastro de novo cliente
 * POST /auth/customer/emailpass/register
 * Depois faz login automático para retornar o token
 */
export async function register(
  email: string,
  password: string,
  firstName: string,
  lastName?: string,
): Promise<AuthResult> {
  try {
    // 1. Registrar o cliente (retorna token diretamente no Medusa v2)
    const data = await authFetch<{ token: string }>(
      "/auth/customer/emailpass/register",
      {
        method: "POST",
        body: JSON.stringify({ email, password }),
      },
    );

    // 2. Atualizar nome do cliente usando o token retornado
    if (data.token && (firstName || lastName)) {
      try {
        await authFetch(
          "/store/customers/me",
          {
            method: "POST",
            body: JSON.stringify({
              first_name: firstName,
              last_name: lastName || "",
            }),
          },
          data.token,
        );
      } catch {
        // Nome não crítico — ignora falha silenciosamente
      }
    }

    return { token: data.token };
  } catch (err) {
    return {
      error:
        err instanceof Error ? err.message : "Erro ao criar conta",
    };
  }
}

/**
 * Buscar dados do cliente autenticado
 * GET /store/customers/me
 */
export async function getCustomer(
  token: string,
): Promise<MedusaCustomer | null> {
  try {
    const data = await authFetch<{ customer: MedusaCustomer }>(
      "/store/customers/me",
      {},
      token,
    );
    return data.customer;
  } catch {
    return null;
  }
}

/**
 * Buscar pedidos do cliente autenticado
 * GET /store/orders
 */
export async function getCustomerOrders(
  token: string,
): Promise<MedusaOrder[]> {
  try {
    const data = await authFetch<{ orders: MedusaOrder[] }>(
      "/store/orders?fields=*items,*items.variant,*items.variant.product,*shipping_address,*payment_collections",
      {},
      token,
    );
    return data.orders || [];
  } catch {
    return [];
  }
}

/**
 * Buscar detalhes de um pedido específico
 * GET /store/orders/:id
 */
export async function getCustomerOrder(
  token: string,
  orderId: string,
): Promise<MedusaOrder | null> {
  try {
    const data = await authFetch<{ order: MedusaOrder }>(
      `/store/orders/${orderId}?fields=*items,*items.variant,*items.variant.product,*shipping_address,*payment_collections`,
      {},
      token,
    );
    return data.order;
  } catch {
    return null;
  }
}

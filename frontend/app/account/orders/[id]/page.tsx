import { getTokenFromCookie } from "components/account/actions";
import { getCustomerOrder, type MedusaAddress } from "lib/medusa/auth";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronRightIcon } from "@heroicons/react/24/outline";

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(dateStr));
}

function formatCurrency(amount: number, currencyCode: string): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: currencyCode.toUpperCase(),
  }).format(amount / 100);
}

function formatAddress(addr: MedusaAddress | null | undefined): string {
  if (!addr) return "—";
  const parts = [
    addr.address_1,
    addr.address_2,
    addr.city,
    addr.province,
    addr.postal_code,
    addr.country_code?.toUpperCase(),
  ].filter(Boolean);
  return parts.join(", ");
}

function OrderStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    pending: {
      label: "Pendente",
      className:
        "rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-medium text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400",
    },
    completed: {
      label: "Confirmado",
      className:
        "rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700 dark:bg-green-950/40 dark:text-green-400",
    },
    processing: {
      label: "Em processamento",
      className:
        "rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700 dark:bg-blue-950/40 dark:text-blue-400",
    },
    shipped: {
      label: "Enviado",
      className:
        "rounded-full bg-purple-100 px-2.5 py-1 text-xs font-medium text-purple-700 dark:bg-purple-950/40 dark:text-purple-400",
    },
    delivered: {
      label: "Entregue",
      className:
        "rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
    },
    canceled: {
      label: "Cancelado",
      className:
        "rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700 dark:bg-red-950/40 dark:text-red-400",
    },
  };

  const badge = map[status] ?? map["pending"]!;
  return <span className={badge.className}>{badge.label}</span>;
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const token = await getTokenFromCookie();

  if (!token) {
    redirect("/account/login");
  }

  const order = await getCustomerOrder(token, id);

  if (!order) {
    notFound();
  }

  const paymentMethod =
    order.payment_collections?.[0]?.payment_sessions?.[0]?.provider_id ??
    "Não informado";

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
        <Link href="/account" className="hover:text-black dark:hover:text-white">
          Conta
        </Link>
        <ChevronRightIcon className="h-3.5 w-3.5" />
        <Link
          href="/account/orders"
          className="hover:text-black dark:hover:text-white"
        >
          Pedidos
        </Link>
        <ChevronRightIcon className="h-3.5 w-3.5" />
        <span className="text-black dark:text-white">
          #{order.display_id}
        </span>
      </nav>

      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-black dark:text-white">
            Pedido #{order.display_id}
          </h2>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Realizado em {formatDate(order.created_at)}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      {/* Grid de informações */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-black">
          <p className="mb-1 text-xs text-neutral-500 dark:text-neutral-400">
            Pagamento
          </p>
          <p className="text-sm font-medium capitalize text-black dark:text-white">
            {paymentMethod.replace(/_/g, " ")}
          </p>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-black sm:col-span-2 lg:col-span-2">
          <p className="mb-1 text-xs text-neutral-500 dark:text-neutral-400">
            Endereço de entrega
          </p>
          <p className="text-sm text-black dark:text-white">
            {formatAddress(order.shipping_address)}
          </p>
        </div>
      </div>

      {/* Itens do pedido */}
      <div className="rounded-lg border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-black">
        <div className="border-b border-neutral-200 p-5 dark:border-neutral-700">
          <h3 className="text-base font-semibold text-black dark:text-white">
            Itens
          </h3>
        </div>

        <ul className="divide-y divide-neutral-200 dark:divide-neutral-700">
          {(order.items || []).map((item) => {
            const thumbnail =
              item.variant?.product?.thumbnail || item.thumbnail || null;
            const productTitle =
              item.variant?.product?.title || item.title;
            const variantTitle = item.variant?.title;

            return (
              <li key={item.id} className="flex items-center gap-4 p-5">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md border border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900">
                  {thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      className="h-full w-full object-cover"
                      src={thumbnail}
                      alt={productTitle}
                    />
                  ) : (
                    <div className="h-full w-full bg-neutral-200 dark:bg-neutral-800" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium leading-tight text-black dark:text-white">
                    {productTitle}
                  </p>
                  {variantTitle && (
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      {variantTitle}
                    </p>
                  )}
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Qtd: {item.quantity}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-medium text-black dark:text-white">
                  {formatCurrency(item.total, order.currency_code)}
                </p>
              </li>
            );
          })}
        </ul>

        {/* Totais */}
        <div className="border-t border-neutral-200 p-5 dark:border-neutral-700">
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-neutral-500 dark:text-neutral-400">
              <span>Subtotal</span>
              <span>{formatCurrency(order.subtotal, order.currency_code)}</span>
            </div>
            <div className="flex justify-between text-sm text-neutral-500 dark:text-neutral-400">
              <span>Frete</span>
              <span>
                {formatCurrency(order.shipping_total, order.currency_code)}
              </span>
            </div>
            <div className="flex justify-between text-base font-semibold text-black dark:text-white">
              <span>Total</span>
              <span>{formatCurrency(order.total, order.currency_code)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Voltar */}
      <div className="mt-6">
        <Link
          href="/account/orders"
          className="text-sm text-blue-600 underline-offset-4 hover:underline dark:text-blue-400"
        >
          &larr; Voltar para pedidos
        </Link>
      </div>
    </div>
  );
}

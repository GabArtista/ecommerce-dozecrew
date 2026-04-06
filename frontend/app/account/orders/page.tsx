import { getTokenFromCookie } from "components/account/actions";
import { getCustomerOrders } from "lib/medusa/auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ShoppingBagIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(dateStr));
}

function formatCurrency(amount: number, currencyCode: string): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: currencyCode.toUpperCase(),
  }).format(amount / 100);
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

export default async function OrdersPage() {
  const token = await getTokenFromCookie();

  if (!token) {
    redirect("/account/login");
  }

  const orders = await getCustomerOrders(token);

  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold text-black dark:text-white">
        Meus pedidos
      </h2>

      {orders.length === 0 ? (
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
      ) : (
        <ul className="space-y-3">
          {orders.map((order) => (
            <li key={order.id}>
              <Link
                href={`/account/orders/${order.id}`}
                className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white p-5 transition-colors hover:border-blue-600 dark:border-neutral-700 dark:bg-black"
              >
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium text-black dark:text-white">
                    Pedido #{order.display_id}
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    {formatDate(order.created_at)} &middot;{" "}
                    {order.items?.length ?? 0}{" "}
                    {(order.items?.length ?? 0) === 1 ? "item" : "itens"}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <OrderStatusBadge status={order.status} />
                  <div className="text-right">
                    <p className="text-sm font-semibold text-black dark:text-white">
                      {formatCurrency(order.total, order.currency_code)}
                    </p>
                  </div>
                  <ChevronRightIcon className="h-4 w-4 text-neutral-400" />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

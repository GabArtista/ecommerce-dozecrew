"use client";

import {
  CheckCircleIcon,
  CheckIcon,
  InformationCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import BoletoDisplay from "components/checkout/boleto-display";
import PixDisplay from "components/checkout/pix-display";
import Price from "components/price";
import { shouldBypassImageOptimization } from "lib/image";
import Image from "next/image";
import Link from "next/link";
import LogoSquare from "components/logo-square";
import { useEffect, useState } from "react";

type PaymentStatus = "pending" | "paid" | "failed";

type PaymentData = {
  pixQrCode?: string;
  pixCode?: string;
  pixExpiresAt?: string;
  boletoCode?: string;
  boletoUrl?: string;
  boletoDueDate?: string;
  cardStatus?: "approved" | "declined";
};

type OrderItem = {
  id: string;
  title: string;
  image: string;
  quantity: number;
  price: string;
  currencyCode: string;
};

type OrderInfo = {
  items: OrderItem[];
  subtotal: string;
  total: string;
  currencyCode: string;
  email?: string;
};

const BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000";
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "";

type Props = {
  orderId: string;
  paymentMethod: string;
  paymentData: PaymentData;
};

export default function ConfirmationClient({ orderId, paymentMethod, paymentData }: Props) {
  const [orderInfo, setOrderInfo] = useState<OrderInfo | null>(null);
  const [pollingStatus, setPollingStatus] = useState<PaymentStatus>("pending");

  // Load order info from Medusa
  useEffect(() => {
    if (!orderId || orderId === "") return;

    fetch(`${BACKEND_URL}/store/orders/${orderId}?fields=+items.variant.product.*`, {
      headers: { "x-publishable-api-key": PUBLISHABLE_KEY },
    })
      .then((r) => r.json())
      .then((data) => {
        const o = data.order;
        if (!o) return;
        const currency = o.currency_code?.toUpperCase() ?? "BRL";
        const items: OrderItem[] = (o.items ?? []).map((item: Record<string, unknown>) => ({
          id: item.id as string,
          title:
            ((item.variant as Record<string, unknown>)?.product as Record<string, unknown>)?.title as string ??
            (item.title as string),
          image:
            ((item.variant as Record<string, unknown>)?.product as Record<string, unknown>)?.thumbnail as string ??
            "/placeholder.svg",
          quantity: item.quantity as number,
          price: String((item.total as number) / 100),
          currencyCode: currency,
        }));
        setOrderInfo({
          items,
          subtotal: String((o.subtotal ?? 0) / 100),
          total: String((o.total ?? 0) / 100),
          currencyCode: currency,
          email: o.email ?? "",
        });
      })
      .catch(() => {});
  }, [orderId]);

  // Polling for PIX and Boleto
  useEffect(() => {
    if (paymentMethod === "cartao") return;
    if (pollingStatus === "paid" || pollingStatus === "failed") return;
    if (!orderId) return;

    const interval = paymentMethod === "pix" ? 5000 : 30000;

    const timer = setInterval(async () => {
      try {
        const res = await fetch(
          `${BACKEND_URL}/store/checkout/status?order_id=${orderId}`,
          { headers: { "x-publishable-api-key": PUBLISHABLE_KEY } }
        );
        if (!res.ok) return;
        const data = await res.json();
        if (data.status === "paid") {
          setPollingStatus("paid");
          clearInterval(timer);
        } else if (data.status === "failed") {
          setPollingStatus("failed");
          clearInterval(timer);
        }
      } catch {
        // non-fatal
      }
    }, interval);

    return () => clearInterval(timer);
  }, [orderId, paymentMethod, pollingStatus]);

  const shortId = orderId.slice(-8).toUpperCase();

  function PaymentMethodLabel() {
    if (paymentMethod === "pix") return "PIX";
    if (paymentMethod === "boleto") return "Boleto Bancário";
    return "Cartão de Crédito";
  }

  function StatusBadge() {
    if (pollingStatus === "paid") {
      return (
        <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700 dark:bg-green-950/40 dark:text-green-400">
          Confirmado
        </span>
      );
    }
    if (pollingStatus === "failed") {
      return (
        <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700 dark:bg-red-950/40 dark:text-red-400">
          Não confirmado
        </span>
      );
    }
    return (
      <span className="rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-medium text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400">
        Pendente
      </span>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      {/* Navbar simplificada */}
      <header className="border-b border-neutral-200 bg-white px-4 py-4 dark:border-neutral-700 dark:bg-black">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <Link href="/" aria-label="Voltar para a loja">
            <LogoSquare />
          </Link>
          <Link
            href="/"
            className="text-sm text-neutral-500 hover:text-black dark:hover:text-white transition-colors"
          >
            Continuar comprando
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-12">
        {/* Header de sucesso */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-950/40">
            <CheckIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-3xl font-bold text-black dark:text-white">Pedido realizado!</h1>
          <p className="mt-2 text-neutral-500 dark:text-neutral-400">
            Obrigado pela sua compra. Você receberá um e-mail de confirmação em breve.
          </p>
        </div>

        {/* Número do pedido */}
        <div className="mb-6 rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-700 dark:bg-black">
          <div className="flex items-center justify-between">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Número do pedido</p>
            <p className="font-mono text-sm font-semibold text-black dark:text-white">
              #ORDER-{shortId}
            </p>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Status</p>
            <StatusBadge />
          </div>
          <div className="mt-3 flex items-center justify-between">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Método de pagamento</p>
            <p className="text-sm text-black dark:text-white">
              <PaymentMethodLabel />
            </p>
          </div>
        </div>

        {/* PIX Display */}
        {paymentMethod === "pix" && (
          <div className="mb-6 rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-700 dark:bg-black">
            <h2 className="mb-4 text-base font-semibold text-black dark:text-white">
              Pagamento via PIX
            </h2>

            {pollingStatus === "paid" && (
              <div
                role="status"
                className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700 dark:border-green-800 dark:bg-green-950/30 dark:text-green-400"
              >
                <CheckCircleIcon className="h-5 w-5 shrink-0 mt-0.5" />
                <p>Pagamento confirmado! Seu pedido está sendo processado.</p>
              </div>
            )}

            {pollingStatus === "failed" && (
              <div
                role="alert"
                className="flex flex-col items-center gap-4 py-8 text-center"
              >
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
                  <Link
                    href="/checkout"
                    className="rounded-full bg-blue-600 px-5 py-2 text-sm font-medium text-white opacity-90 hover:opacity-100"
                  >
                    Tentar outro método
                  </Link>
                </div>
              </div>
            )}

            {pollingStatus === "pending" && paymentData.pixQrCode && (
              <PixDisplay
                qrCodeImage={paymentData.pixQrCode}
                pixCode={paymentData.pixCode ?? ""}
                expiresAt={
                  paymentData.pixExpiresAt
                    ? new Date(paymentData.pixExpiresAt)
                    : new Date(Date.now() + 30 * 60 * 1000)
                }
              />
            )}

            {pollingStatus === "pending" && !paymentData.pixQrCode && (
              <div className="flex flex-col items-center gap-4 py-12 text-center">
                <div className="relative">
                  <div className="h-16 w-16 rounded-full border-4 border-neutral-200 dark:border-neutral-700" />
                  <div className="absolute inset-0 h-16 w-16 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
                </div>
                <p className="text-base font-medium text-black dark:text-white">
                  Aguardando pagamento...
                </p>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  Verificando automaticamente a cada 5 segundos
                </p>
              </div>
            )}
          </div>
        )}

        {/* Boleto Display */}
        {paymentMethod === "boleto" && (
          <div className="mb-6 rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-700 dark:bg-black">
            <h2 className="mb-4 text-base font-semibold text-black dark:text-white">
              Boleto Bancário
            </h2>

            {pollingStatus === "paid" && (
              <div
                role="status"
                className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700 dark:border-green-800 dark:bg-green-950/30 dark:text-green-400"
              >
                <CheckCircleIcon className="h-5 w-5 shrink-0 mt-0.5" />
                <p>Pagamento confirmado! Seu pedido está sendo processado.</p>
              </div>
            )}

            {pollingStatus !== "paid" && paymentData.boletoCode && (
              <BoletoDisplay
                boletoCode={paymentData.boletoCode}
                boletoUrl={paymentData.boletoUrl ?? "#"}
                dueDate={paymentData.boletoDueDate ?? ""}
              />
            )}

            {pollingStatus !== "paid" && !paymentData.boletoCode && (
              <div className="flex flex-col items-center gap-4 py-12 text-center">
                <div className="relative">
                  <div className="h-16 w-16 rounded-full border-4 border-neutral-200 dark:border-neutral-700" />
                  <div className="absolute inset-0 h-16 w-16 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
                </div>
                <p className="text-base font-medium text-black dark:text-white">
                  Gerando boleto...
                </p>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  Verificando automaticamente a cada 30 segundos
                </p>
              </div>
            )}
          </div>
        )}

        {/* Cartão */}
        {paymentMethod === "cartao" && (
          <div className="mb-6 rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-700 dark:bg-black">
            <h2 className="mb-4 text-base font-semibold text-black dark:text-white">
              Cartão de Crédito
            </h2>
            {!paymentData.cardStatus ? (
              <div
                role="status"
                className="flex items-start gap-3 rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400"
              >
                <p>Verificando pagamento...</p>
              </div>
            ) : paymentData.cardStatus === "approved" ? (
              <div
                role="status"
                className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700 dark:border-green-800 dark:bg-green-950/30 dark:text-green-400"
              >
                <CheckCircleIcon className="h-5 w-5 shrink-0 mt-0.5" />
                <p>Pagamento aprovado! Seu pedido está sendo processado.</p>
              </div>
            ) : (
              <div role="alert" className="flex flex-col gap-4">
                <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400">
                  <p className="font-medium">Pagamento recusado.</p>
                </div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Verifique os dados do cartão ou tente outro método de pagamento.
                </p>
                <Link
                  href="/checkout"
                  className="self-start rounded-full bg-blue-600 px-5 py-2 text-sm font-medium text-white opacity-90 hover:opacity-100"
                >
                  Tentar outro método
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Itens do pedido */}
        {orderInfo && (
          <div className="mb-6 rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-700 dark:bg-black">
            <h2 className="mb-4 text-base font-semibold text-black dark:text-white">
              Itens do pedido
            </h2>
            <ul className="divide-y divide-neutral-200 dark:divide-neutral-700">
              {orderInfo.items.map((item) => (
                <li key={item.id} className="flex items-center gap-4 py-4">
                  <div className="h-16 w-16 overflow-hidden rounded-md border border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900">
                    <Image
                      className="h-full w-full object-cover"
                      src={item.image}
                      alt={item.title}
                      width={64}
                      height={64}
                      unoptimized={shouldBypassImageOptimization(item.image)}
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium leading-tight text-black dark:text-white">
                      {item.title}
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      Qtd: {item.quantity}
                    </p>
                  </div>
                  <Price
                    amount={item.price}
                    currencyCode={item.currencyCode}
                    className="text-sm text-black dark:text-white"
                  />
                </li>
              ))}
            </ul>
            <div className="mt-4 space-y-2 border-t border-neutral-200 pt-4 dark:border-neutral-700">
              <div className="flex justify-between text-sm text-neutral-500 dark:text-neutral-400">
                <span>Subtotal</span>
                <Price amount={orderInfo.subtotal} currencyCode={orderInfo.currencyCode} />
              </div>
              <div className="flex justify-between text-base font-semibold text-black dark:text-white">
                <span>Total</span>
                <Price amount={orderInfo.total} currencyCode={orderInfo.currencyCode} />
              </div>
            </div>
          </div>
        )}

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
            {paymentMethod === "boleto" && (
              <li className="flex items-start gap-2">
                <InformationCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                Seu pedido será separado após a confirmação do pagamento (1 a 3 dias úteis).
              </li>
            )}
          </ul>
        </div>

        {/* Ações finais */}
        <div className="flex justify-center">
          <Link
            href="/"
            className="rounded-full border border-neutral-200 px-6 py-2.5 text-sm font-medium text-black transition-colors hover:border-blue-600 dark:border-neutral-700 dark:text-white"
          >
            Continuar comprando
          </Link>
        </div>
      </main>
    </div>
  );
}

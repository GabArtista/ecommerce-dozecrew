"use client";

import Price from "components/price";
import AddressForm from "components/checkout/address-form";
import PaymentSelector, { type PaymentMethod } from "components/checkout/payment-selector";
import type { CardData } from "components/checkout/payment-selector";
import ShippingOptions from "components/checkout/shipping-options";
import SubmitOrder from "components/checkout/submit-order";
import { shouldBypassImageOptimization } from "lib/image";
import Image from "next/image";
import Link from "next/link";
import LogoSquare from "components/logo-square";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type CartItem = {
  id: string;
  title: string;
  image: string;
  quantity: number;
  price: string;
  currencyCode: string;
};

type CartSummary = {
  items: CartItem[];
  subtotal: string;
  total: string;
  currencyCode: string;
};

const BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000";
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "";

function getCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]!) : undefined;
}

export default function CheckoutPage() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement | null>(null);

  const [cartId, setCartId] = useState<string>("");
  const [summary, setSummary] = useState<CartSummary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [cepFilled, setCepFilled] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("pix");
  const [cardData, setCardData] = useState<CardData>({
    number: "",
    name: "",
    expiry: "",
    cvv: "",
  });

  useEffect(() => {
    const id = getCookie("cartId");
    if (!id) {
      router.replace("/");
      return;
    }
    setCartId(id);

    fetch(`${BACKEND_URL}/store/carts/${id}?fields=+items.variant.product.*`, {
      headers: { "x-publishable-api-key": PUBLISHABLE_KEY },
    })
      .then((r) => r.json())
      .then((data) => {
        const c = data.cart;
        if (!c) return;
        const currency = c.region?.currency_code?.toUpperCase() ?? "BRL";
        const items: CartItem[] = (c.items ?? []).map((item: Record<string, unknown>) => ({
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
        setSummary({
          items,
          subtotal: String((c.subtotal ?? 0) / 100),
          total: String((c.total ?? 0) / 100),
          currencyCode: currency,
        });
      })
      .catch(() => {})
      .finally(() => setLoadingSummary(false));
  }, [router]);

  if (!cartId && typeof window !== "undefined") {
    return null;
  }

  function OrderSummaryContent() {
    if (loadingSummary) {
      return (
        <div className="flex flex-col gap-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-16 rounded-lg bg-neutral-200 animate-pulse dark:bg-neutral-800" />
          ))}
        </div>
      );
    }

    if (!summary) return null;

    return (
      <>
        <ul className="divide-y divide-neutral-200 dark:divide-neutral-700">
          {summary.items.map((item) => (
            <li key={item.id} className="flex items-center gap-3 py-3">
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md border border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900">
                <Image
                  src={item.image}
                  alt={item.title}
                  width={48}
                  height={48}
                  unoptimized={shouldBypassImageOptimization(item.image)}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium text-black dark:text-white">
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
            <Price amount={summary.subtotal} currencyCode={summary.currencyCode} />
          </div>
          <div className="flex justify-between text-sm text-neutral-500 dark:text-neutral-400">
            <span>Frete</span>
            <span>Calculado</span>
          </div>
          <div className="flex justify-between text-base font-semibold text-black dark:text-white">
            <span>Total</span>
            <Price amount={summary.total} currencyCode={summary.currencyCode} />
          </div>
        </div>

        {/* Trust signals */}
        <div className="mt-4 flex items-center justify-center gap-4 text-xs text-neutral-500 dark:text-neutral-400">
          <span>🔒 Compra segura</span>
          <span>•</span>
          <span>Dados criptografados</span>
        </div>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      {/* Navbar simplificada */}
      <header className="border-b border-neutral-200 bg-white px-4 py-4 dark:border-neutral-700 dark:bg-black">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/" aria-label="Voltar para a loja">
            <LogoSquare />
          </Link>
          <h1 className="text-base font-semibold text-black dark:text-white">
            Finalizar Pedido
          </h1>
          <Link
            href="/cart"
            className="text-sm text-neutral-500 hover:text-black dark:hover:text-white transition-colors"
          >
            ← Voltar ao carrinho
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        {/* Mobile: accordion de resumo no topo */}
        <div className="mb-4 lg:hidden">
          <details className="rounded-lg border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-black">
            <summary className="flex cursor-pointer items-center justify-between p-4">
              <span className="text-sm font-medium text-black dark:text-white">
                Ver resumo do pedido
              </span>
              <div className="flex items-center gap-2">
                {summary && (
                  <Price
                    amount={summary.total}
                    currencyCode={summary.currencyCode}
                    className="text-sm font-bold text-black dark:text-white"
                  />
                )}
                <ChevronDownIcon className="h-4 w-4 text-neutral-500 transition-transform group-open:rotate-180" />
              </div>
            </summary>
            <div className="border-t border-neutral-200 p-4 dark:border-neutral-700">
              <OrderSummaryContent />
            </div>
          </details>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Formulário */}
          <div className="lg:col-span-7">
            <form ref={formRef} noValidate className="space-y-4">
              {/* Hidden fields para o server action */}
              <input type="hidden" name="paymentMethod" value={paymentMethod} />
              <input type="hidden" name="cardNumber" value={cardData.number} />
              <input type="hidden" name="cardName" value={cardData.name} />
              <input type="hidden" name="cardExpiry" value={cardData.expiry} />
              <input type="hidden" name="cardCvv" value={cardData.cvv} />

              {cartId && (
                <AddressForm
                  cartId={cartId}
                  onSubmit={(data) => {
                    // update hidden fields via the form
                    const form = formRef.current;
                    if (!form) return;
                    const setField = (name: string, val: string) => {
                      const el = form.elements.namedItem(name) as HTMLInputElement | null;
                      if (el) el.value = val;
                    };
                    setField("fullName", data.fullName);
                    setField("email", data.email);
                    setField("cpf", data.cpf);
                    setField("phone", data.phone);
                    setField("cep", data.cep);
                    setField("street", data.street);
                    setField("number", data.number);
                    setField("complement", data.complement);
                    setField("neighborhood", data.neighborhood);
                    setField("city", data.city);
                    setField("state", data.state);
                    setCepFilled(true);
                  }}
                />
              )}

              {/* Hidden address fields for server action */}
              <input type="hidden" name="fullName" />
              <input type="hidden" name="email" />
              <input type="hidden" name="cpf" />
              <input type="hidden" name="phone" />
              <input type="hidden" name="cep" />
              <input type="hidden" name="street" />
              <input type="hidden" name="number" />
              <input type="hidden" name="complement" />
              <input type="hidden" name="neighborhood" />
              <input type="hidden" name="city" />
              <input type="hidden" name="state" />

              {cartId && (
                <ShippingOptions
                  cartId={cartId}
                  cepFilled={cepFilled}
                />
              )}

              <PaymentSelector
                onMethodChange={setPaymentMethod}
                onCardDataChange={setCardData}
              />
            </form>

            <div className="mt-6">
              <SubmitOrder cartId={cartId} formRef={formRef} />
            </div>
          </div>

          {/* Resumo desktop (sticky) */}
          <div className="hidden lg:col-span-5 lg:block">
            <div className="sticky top-8">
              <section className="rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-700 dark:bg-black">
                <h2 className="mb-4 text-base font-semibold text-black dark:text-white">
                  Resumo do pedido
                </h2>
                <OrderSummaryContent />
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

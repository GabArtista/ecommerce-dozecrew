"use client";

import clsx from "clsx";
import Price from "components/price";
import { useEffect, useState } from "react";

type ShippingOption = {
  id: string;
  name: string;
  amount: number;
  data?: Record<string, unknown>;
};

type ShippingOptionsProps = {
  cartId: string;
  cepFilled: boolean;
  onSelect?: (optionId: string) => void;
};

const BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000";
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "";

export default function ShippingOptions({ cartId, cepFilled, onSelect }: ShippingOptionsProps) {
  const [options, setOptions] = useState<ShippingOption[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!cepFilled) return;

    setLoading(true);
    setError("");

    fetch(`${BACKEND_URL}/store/shipping-options?cart_id=${cartId}`, {
      headers: { "x-publishable-api-key": PUBLISHABLE_KEY },
    })
      .then((r) => r.json())
      .then((data) => {
        const opts: ShippingOption[] = data.shipping_options ?? [];
        setOptions(opts);
        if (opts.length > 0 && opts[0]) {
          handleSelect(opts[0].id);
        }
      })
      .catch(() => setError("Não foi possível carregar as opções de frete."))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartId, cepFilled]);

  async function handleSelect(optionId: string) {
    setSelected(optionId);
    setSaving(true);

    try {
      await fetch(`${BACKEND_URL}/store/carts/${cartId}/shipping-methods`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-publishable-api-key": PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ option_id: optionId }),
      });
      onSelect?.(optionId);
    } catch {
      // non-blocking
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-700 dark:bg-black">
      <h2 className="mb-4 text-base font-semibold text-black dark:text-white">3. Frete</h2>

      {!cepFilled && (
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Preencha o CEP para ver as opções de frete.
        </p>
      )}

      {cepFilled && loading && (
        <div className="flex flex-col gap-3">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-16 rounded-lg bg-neutral-200 animate-pulse dark:bg-neutral-800"
            />
          ))}
        </div>
      )}

      {cepFilled && !loading && error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400"
        >
          <p>{error}</p>
        </div>
      )}

      {cepFilled && !loading && !error && options.length === 0 && (
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Nenhuma opção de frete disponível para este CEP.
        </p>
      )}

      {cepFilled && !loading && options.length > 0 && (
        <div className="flex flex-col gap-3">
          {options.map((option) => (
            <label
              key={option.id}
              className={clsx(
                "flex cursor-pointer items-center justify-between rounded-lg border p-4 transition-all ease-in-out duration-300",
                selected === option.id
                  ? "border-2 border-blue-600 bg-blue-50 dark:bg-blue-950/20"
                  : "border-neutral-200 hover:border-blue-600 dark:border-neutral-700"
              )}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="shipping"
                  value={option.id}
                  checked={selected === option.id}
                  onChange={() => handleSelect(option.id)}
                  className="h-4 w-4 accent-blue-600"
                  disabled={saving}
                />
                <div>
                  <p className="text-sm font-medium text-black dark:text-white">{option.name}</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Prazo a calcular após confirmação do endereço
                  </p>
                </div>
              </div>
              <p className="text-sm font-semibold text-black dark:text-white">
                {option.amount === 0 ? (
                  <span className="text-green-600 dark:text-green-400">Grátis</span>
                ) : (
                  <Price
                    amount={String(option.amount / 100)}
                    currencyCode="BRL"
                    className="text-sm"
                  />
                )}
              </p>
            </label>
          ))}
        </div>
      )}
    </section>
  );
}

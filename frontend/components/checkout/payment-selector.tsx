"use client";

import clsx from "clsx";
import { useState } from "react";

export type PaymentMethod = "pix" | "boleto" | "cartao";

// CardData kept for type compatibility with existing consumers
export type CardData = {
  number: string;
  name: string;
  expiry: string;
  cvv: string;
};

type PaymentSelectorProps = {
  onMethodChange?: (method: PaymentMethod) => void;
  onCardDataChange?: (data: CardData) => void;
};

const methods: { id: PaymentMethod; label: string }[] = [
  { id: "pix", label: "PIX" },
  { id: "boleto", label: "Boleto" },
  { id: "cartao", label: "Cartão" },
];

export default function PaymentSelector({ onMethodChange }: PaymentSelectorProps) {
  const [active, setActive] = useState<PaymentMethod>("pix");

  function selectMethod(method: PaymentMethod) {
    setActive(method);
    onMethodChange?.(method);
  }

  return (
    <section className="rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-700 dark:bg-black">
      <h2 className="mb-4 text-base font-semibold text-black dark:text-white">4. Pagamento</h2>

      {/* Tabs */}
      <div className="mb-6 flex rounded-lg border border-neutral-200 p-1 dark:border-neutral-700">
        {methods.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => selectMethod(m.id)}
            className={clsx(
              "flex flex-1 items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition-colors ease-in-out duration-300",
              active === m.id
                ? "bg-blue-600 text-white"
                : "text-neutral-500 hover:text-black dark:hover:text-white"
            )}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* PIX */}
      {active === "pix" && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/20">
          <p className="text-sm font-medium text-blue-900 dark:text-blue-300">
            Pague instantaneamente via PIX
          </p>
          <p className="mt-1 text-sm text-blue-700 dark:text-blue-400">
            O QR Code e código copia-e-cola serão gerados após a confirmação do pedido. O pagamento
            é confirmado em segundos.
          </p>
        </div>
      )}

      {/* Boleto */}
      {active === "boleto" && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-950/30">
          <p className="text-sm font-medium text-yellow-900 dark:text-yellow-300">
            Boleto Bancário — vencimento em 3 dias úteis
          </p>
          <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-400">
            A linha digitável e o PDF do boleto serão exibidos após a confirmação do pedido. O prazo
            de compensação pode ser de até 3 dias úteis após o pagamento.
          </p>
        </div>
      )}

      {/* Cartão — coleta desabilitada até integração do SDK de tokenização (PCI-DSS) */}
      {active === "cartao" && (
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-900">
          <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
            Pagamento com cartão em breve.
          </p>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            Por enquanto, use PIX (instantâneo) ou Boleto.
          </p>
        </div>
      )}
    </section>
  );
}

"use client";

import LoadingDots from "components/loading-dots";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { completeCheckoutAction } from "./actions";

type SubmitOrderProps = {
  cartId: string;
  formRef: React.RefObject<HTMLFormElement | null>;
};

export default function SubmitOrder({ cartId, formRef }: SubmitOrderProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function handleClick() {
    if (!formRef.current) return;

    // Trigger HTML5 validation
    if (!formRef.current.checkValidity()) {
      formRef.current.reportValidity();
      return;
    }

    setPending(true);
    setError("");

    try {
      const fd = new FormData(formRef.current);
      const result = await completeCheckoutAction(fd);

      if (result.error) {
        setError(result.error);
        return;
      }

      const paymentMethod = (fd.get("paymentMethod") as string) ?? "pix";
      router.push(`/checkout/confirmacao/${result.orderId}?payment=${paymentMethod}`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erro inesperado. Tente novamente.";
      setError(msg);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400"
        >
          <p>{error}</p>
        </div>
      )}

      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="block w-full rounded-full bg-blue-600 p-3 text-center text-sm font-medium text-white opacity-90 hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-60 transition-all ease-in-out duration-300"
      >
        {pending ? <LoadingDots className="bg-white" /> : "Finalizar Pedido"}
      </button>

      <p className="text-center text-xs text-neutral-500 dark:text-neutral-400">
        Ao finalizar, você concorda com nossos Termos de Uso e Política de Privacidade.
      </p>
    </div>
  );
}

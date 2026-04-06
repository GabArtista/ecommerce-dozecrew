"use client";

import {
  ArrowDownTrayIcon,
  CheckIcon,
  ClipboardIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useState } from "react";

type BoletoDisplayProps = {
  boletoCode: string;
  boletoUrl: string;
  dueDate: string; // formatted string e.g. "03/04/2026"
};

export default function BoletoDisplay({ boletoCode, boletoUrl, dueDate }: BoletoDisplayProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(boletoCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // noop
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Data de vencimento */}
      <div className="rounded-lg bg-yellow-50 px-4 py-3 dark:bg-yellow-950/30">
        <p className="text-sm font-medium text-yellow-800 dark:text-yellow-400">
          Vence em {dueDate} — 3 dias úteis para compensar
        </p>
      </div>

      {/* Linha digitável */}
      <div>
        <p className="mb-1.5 text-xs font-medium text-neutral-500 dark:text-neutral-400">
          Linha digitável:
        </p>
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-700 dark:bg-neutral-900">
          <p className="font-mono text-sm tracking-wide text-neutral-700 dark:text-neutral-300 break-all">
            {boletoCode}
          </p>
        </div>
      </div>

      {/* Ações */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={handleCopy}
          className={clsx(
            "flex flex-1 items-center justify-center gap-2 rounded-full border py-2.5 text-sm font-medium transition-all ease-in-out duration-300",
            copied
              ? "border-green-500 bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-400"
              : "border-neutral-200 bg-white text-black hover:border-blue-600 dark:border-neutral-700 dark:bg-black dark:text-white"
          )}
        >
          {copied ? (
            <>
              <CheckIcon className="h-4 w-4" /> Copiado!
            </>
          ) : (
            <>
              <ClipboardIcon className="h-4 w-4" /> Copiar linha digitável
            </>
          )}
        </button>
        <a
          href={boletoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-1 items-center justify-center gap-2 rounded-full bg-blue-600 py-2.5 text-sm font-medium text-white opacity-90 hover:opacity-100"
        >
          <ArrowDownTrayIcon className="h-4 w-4" />
          Baixar PDF do Boleto
        </a>
      </div>

      {/* Instrução */}
      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        Pague no seu banco, aplicativo ou casa lotérica até {dueDate}.
      </p>

      {/* Avisos obrigatórios */}
      <div className="space-y-2 rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-900">
        <p className="text-xs text-neutral-600 dark:text-neutral-400">
          • Seu pedido será confirmado após a aprovação do pagamento (1 a 3 dias úteis).
        </p>
        <p className="text-xs text-neutral-600 dark:text-neutral-400">
          • O prazo de compensação pode ser de até 3 dias úteis.
        </p>
        <p className="text-xs text-neutral-600 dark:text-neutral-400">
          • Não pague após a data de vencimento. Gere um novo boleto se necessário.
        </p>
        <p className="text-xs text-neutral-600 dark:text-neutral-400">
          • Enviamos o boleto para o seu e-mail. Verifique também o spam.
        </p>
      </div>
    </div>
  );
}

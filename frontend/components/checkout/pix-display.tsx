"use client";

import {
  CheckIcon,
  ClipboardIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useEffect, useState } from "react";

type PixDisplayProps = {
  qrCodeImage: string; // base64 or URL
  pixCode: string;
  expiresAt: Date;
};

function formatCountdown(ms: number) {
  if (ms <= 0) return "00:00";
  const totalSecs = Math.floor(ms / 1000);
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export default function PixDisplay({ qrCodeImage, pixCode, expiresAt }: PixDisplayProps) {
  const [remaining, setRemaining] = useState(() => expiresAt.getTime() - Date.now());
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining(expiresAt.getTime() - Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const minutesLeft = remaining / 1000 / 60;
  const expired = remaining <= 0;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(pixCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // noop
    }
  }

  if (expired) {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <ClockIcon className="h-12 w-12 text-neutral-400" />
        <div>
          <p className="font-medium text-black dark:text-white">QR Code expirado</p>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            O código PIX expirou após 30 minutos.
          </p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="rounded-full bg-blue-600 px-6 py-2.5 text-sm font-medium text-white opacity-90 hover:opacity-100"
        >
          Gerar novo QR Code
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 py-2">
      {/* Instrução 3 passos */}
      <div className="flex w-full justify-around text-center text-xs text-neutral-500 dark:text-neutral-400">
        <div className="flex flex-col items-center gap-1">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
            1
          </span>
          <span>Abra seu banco</span>
        </div>
        <div className="h-px w-8 self-center border-t border-dashed border-neutral-300 dark:border-neutral-700" />
        <div className="flex flex-col items-center gap-1">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
            2
          </span>
          <span>Acesse PIX</span>
        </div>
        <div className="h-px w-8 self-center border-t border-dashed border-neutral-300 dark:border-neutral-700" />
        <div className="flex flex-col items-center gap-1">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
            3
          </span>
          <span>Escaneie ou cole</span>
        </div>
      </div>

      {/* QR Code */}
      <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={qrCodeImage}
          alt="QR Code PIX"
          className="h-[200px] w-[200px] md:h-[256px] md:w-[256px]"
        />
      </div>

      {/* Countdown */}
      <div
        className={clsx(
          "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium",
          minutesLeft > 5
            ? "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
            : minutesLeft > 2
              ? "bg-yellow-50 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400"
              : "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400"
        )}
      >
        <ClockIcon className="h-4 w-4" />
        <span>
          Expira em <strong>{formatCountdown(remaining)}</strong>
        </span>
      </div>

      {/* Código copia-e-cola */}
      <div className="w-full">
        <p className="mb-1.5 text-xs font-medium text-neutral-500 dark:text-neutral-400">
          Ou copie o código PIX:
        </p>
        <div className="flex gap-2">
          <input
            readOnly
            value={pixCode}
            className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 font-mono text-xs text-neutral-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
          />
          <button
            type="button"
            onClick={handleCopy}
            className={clsx(
              "shrink-0 rounded-lg border px-3 py-2 text-xs font-medium transition-all ease-in-out duration-300",
              copied
                ? "border-green-500 bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-400"
                : "border-neutral-200 bg-white text-black hover:border-blue-600 dark:border-neutral-700 dark:bg-black dark:text-white"
            )}
          >
            {copied ? (
              <span className="flex items-center gap-1">
                <CheckIcon className="h-3.5 w-3.5" /> Copiado!
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <ClipboardIcon className="h-3.5 w-3.5" /> Copiar
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Aguardando */}
      <div className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
        <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
        Aguardando confirmação do pagamento...
      </div>
    </div>
  );
}

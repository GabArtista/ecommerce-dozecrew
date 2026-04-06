"use client";

import LogoSquare from "components/logo-square";
import LoadingDots from "components/loading-dots";
import { loginAction, type ActionState } from "components/account/actions";
import Link from "next/link";
import { useActionState, useState } from "react";
import { ExclamationCircleIcon, EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

const initialState: ActionState = {};

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="flex min-h-[calc(100vh-80px)] items-center justify-center bg-neutral-50 px-4 dark:bg-neutral-900">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <LogoSquare />
        </div>

        <div className="rounded-lg border border-neutral-200 bg-white p-8 dark:border-neutral-700 dark:bg-black">
          <h1 className="mb-6 text-xl font-semibold text-black dark:text-white">
            Entrar
          </h1>

          {/* Erro de login */}
          {state.error && (
            <div
              role="alert"
              className="mb-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400"
            >
              <ExclamationCircleIcon className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{state.error}</span>
            </div>
          )}

          <form action={formAction} className="flex flex-col gap-4">
            {/* E-mail */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="email"
                className="text-sm font-medium text-black dark:text-white"
              >
                E-mail
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="seu@email.com"
                className="w-full rounded-lg border border-neutral-200 bg-white px-4 py-2.5 text-sm text-black placeholder:text-neutral-500 dark:border-neutral-700 dark:bg-black dark:text-white dark:placeholder:text-neutral-400"
              />
            </div>

            {/* Senha com show/hide */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="password"
                className="text-sm font-medium text-black dark:text-white"
              >
                Senha
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  className="w-full rounded-lg border border-neutral-200 bg-white px-4 py-2.5 pr-11 text-sm text-black dark:border-neutral-700 dark:bg-black dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-black dark:hover:text-white"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Link esqueci senha */}
            <div className="flex justify-end">
              <Link
                href="/account/forgot-password"
                className="text-xs text-blue-600 underline-offset-4 hover:underline dark:text-blue-400"
              >
                Esqueci minha senha
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={pending}
              className="block w-full rounded-full bg-blue-600 p-3 text-center text-sm font-medium text-white opacity-90 hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending ? <LoadingDots className="bg-white" /> : "Entrar"}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 border-t border-neutral-200 dark:border-neutral-700" />
            <span className="text-xs text-neutral-400">ou</span>
            <div className="flex-1 border-t border-neutral-200 dark:border-neutral-700" />
          </div>

          {/* Link para cadastro */}
          <p className="text-center text-sm text-neutral-500 dark:text-neutral-400">
            Não tem uma conta?{" "}
            <Link
              href="/account/register"
              className="text-blue-600 underline-offset-4 hover:underline dark:text-blue-400"
            >
              Criar conta
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

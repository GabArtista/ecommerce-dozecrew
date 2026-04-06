"use client";

import LogoSquare from "components/logo-square";
import LoadingDots from "components/loading-dots";
import { registerAction, type ActionState } from "components/account/actions";
import Link from "next/link";
import { useActionState, useState } from "react";
import {
  ExclamationCircleIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@heroicons/react/24/outline";

const initialState: ActionState = {};

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState(
    registerAction,
    initialState,
  );
  const [showPassword, setShowPassword] = useState(false);
  const [passwordValue, setPasswordValue] = useState("");

  const passwordTooShort = passwordValue.length > 0 && passwordValue.length < 8;

  return (
    <div className="flex min-h-[calc(100vh-80px)] items-center justify-center bg-neutral-50 px-4 dark:bg-neutral-900">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <LogoSquare />
        </div>

        <div className="rounded-lg border border-neutral-200 bg-white p-8 dark:border-neutral-700 dark:bg-black">
          <h1 className="mb-2 text-xl font-semibold text-black dark:text-white">
            Criar conta
          </h1>
          <p className="mb-6 text-sm text-neutral-500 dark:text-neutral-400">
            Acompanhe seus pedidos e tenha uma experiência mais rápida.
          </p>

          {/* Erro */}
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
            {/* Nome completo */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="firstName"
                className="text-sm font-medium text-black dark:text-white"
              >
                Nome completo
              </label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                required
                autoComplete="given-name"
                placeholder="Seu nome"
                className="w-full rounded-lg border border-neutral-200 bg-white px-4 py-2.5 text-sm text-black placeholder:text-neutral-500 dark:border-neutral-700 dark:bg-black dark:text-white dark:placeholder:text-neutral-400"
              />
            </div>

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
                  minLength={8}
                  autoComplete="new-password"
                  value={passwordValue}
                  onChange={(e) => setPasswordValue(e.target.value)}
                  className={[
                    "w-full rounded-lg border bg-white px-4 py-2.5 pr-11 text-sm text-black dark:bg-black dark:text-white",
                    passwordTooShort
                      ? "border-red-500 dark:border-red-400"
                      : "border-neutral-200 dark:border-neutral-700",
                  ].join(" ")}
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
              {passwordTooShort ? (
                <p className="text-xs text-red-600 dark:text-red-400" role="alert">
                  A senha deve ter pelo menos 8 caracteres.
                </p>
              ) : (
                <p className="text-xs text-neutral-400 dark:text-neutral-500">
                  Mínimo de 8 caracteres.
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={pending || passwordTooShort}
              className="block w-full rounded-full bg-blue-600 p-3 text-center text-sm font-medium text-white opacity-90 hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending ? (
                <LoadingDots className="bg-white" />
              ) : (
                "Criar conta"
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-neutral-500 dark:text-neutral-400">
            Já tem uma conta?{" "}
            <Link
              href="/account/login"
              className="text-blue-600 underline-offset-4 hover:underline dark:text-blue-400"
            >
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

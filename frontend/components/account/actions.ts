"use server";

import { login, register } from "lib/medusa/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const COOKIE_NAME = "customerToken";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 dias

// ---------- Tipos ----------

export interface ActionState {
  error?: string;
  success?: boolean;
}

// ---------- loginAction ----------

export async function loginAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Preencha e-mail e senha." };
  }

  const result = await login(email, password);

  if (result.error || !result.token) {
    return { error: "E-mail ou senha incorretos. Tente novamente." };
  }

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, result.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });

  // Verificar se há redirect na query string
  redirect("/account");
}

// ---------- registerAction ----------

export async function registerAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const firstName = formData.get("firstName") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!firstName || !email || !password) {
    return { error: "Preencha todos os campos obrigatórios." };
  }

  if (password.length < 8) {
    return { error: "A senha deve ter pelo menos 8 caracteres." };
  }

  const result = await register(email, password, firstName);

  if (result.error || !result.token) {
    // Medusa retorna 422 se e-mail já existe
    if (result.error?.includes("422") || result.error?.includes("exists")) {
      return { error: "Este e-mail já está cadastrado. Tente fazer login." };
    }
    return { error: "Erro ao criar conta. Tente novamente." };
  }

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, result.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });

  redirect("/account");
}

// ---------- logoutAction ----------

export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  redirect("/");
}

// ---------- getTokenFromCookie (helper para Server Components) ----------

export async function getTokenFromCookie(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value;
}

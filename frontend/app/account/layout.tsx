import { Navbar } from "components/layout/navbar";
import { getTokenFromCookie, logoutAction } from "components/account/actions";
import { getCustomer } from "lib/medusa/auth";
import Link from "next/link";
import {
  HomeIcon,
  ShoppingBagIcon,
  UserIcon,
  MapPinIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";
import { ReactNode } from "react";

const navItems = [
  { href: "/account", label: "Início", icon: HomeIcon },
  { href: "/account/orders", label: "Meus pedidos", icon: ShoppingBagIcon },
  { href: "/account/profile", label: "Dados pessoais", icon: UserIcon },
  { href: "/account/addresses", label: "Endereços", icon: MapPinIcon },
];

export default async function AccountLayout({
  children,
}: {
  children: ReactNode;
}) {
  const token = await getTokenFromCookie();
  const customer = token ? await getCustomer(token) : null;

  const customerName =
    customer
      ? [customer.first_name, customer.last_name].filter(Boolean).join(" ") ||
        customer.email
      : null;

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <Navbar />

      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Sidebar de navegação (desktop) */}
          {customer && (
            <nav className="hidden lg:col-span-3 lg:block">
              <div className="sticky top-8 rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-black">
                {/* Avatar / nome */}
                <div className="mb-4 flex items-center gap-3 border-b border-neutral-200 px-2 pb-4 dark:border-neutral-700">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-200 dark:bg-neutral-700">
                    <UserIcon className="h-5 w-5 text-neutral-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-black dark:text-white">
                      {customerName}
                    </p>
                    <p className="truncate text-xs text-neutral-500 dark:text-neutral-400">
                      {customer.email}
                    </p>
                  </div>
                </div>

                {/* Links */}
                <ul className="space-y-1">
                  {navItems.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-neutral-500 transition-colors hover:bg-neutral-50 hover:text-black dark:hover:bg-neutral-900 dark:hover:text-white"
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>

                {/* Logout */}
                <div className="mt-4 border-t border-neutral-200 pt-4 dark:border-neutral-700">
                  <form action={logoutAction}>
                    <button
                      type="submit"
                      className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-neutral-500 transition-colors hover:bg-neutral-50 hover:text-black dark:hover:bg-neutral-900 dark:hover:text-white"
                    >
                      <ArrowRightOnRectangleIcon className="h-4 w-4 shrink-0" />
                      Sair
                    </button>
                  </form>
                </div>
              </div>
            </nav>
          )}

          {/* Navegação mobile (tabs horizontais) — visível apenas quando logado */}
          {customer && (
            <div className="overflow-x-auto lg:hidden">
              <nav className="flex gap-1 rounded-lg border border-neutral-200 bg-white p-1 dark:border-neutral-700 dark:bg-black">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="shrink-0 rounded-md px-4 py-2 text-sm font-medium text-neutral-500 transition-colors hover:text-black dark:hover:text-white"
                  >
                    {item.label}
                  </Link>
                ))}
                <form action={logoutAction} className="shrink-0">
                  <button
                    type="submit"
                    className="rounded-md px-4 py-2 text-sm font-medium text-neutral-500 transition-colors hover:text-black dark:hover:text-white"
                  >
                    Sair
                  </button>
                </form>
              </nav>
            </div>
          )}

          {/* Conteúdo principal */}
          <main
            className={
              customer ? "lg:col-span-9" : "lg:col-span-12"
            }
          >
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

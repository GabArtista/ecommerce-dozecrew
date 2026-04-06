"use client";

import clsx from "clsx";
import { useState, useRef } from "react";

type AddressData = {
  fullName: string;
  email: string;
  cpf: string;
  phone: string;
  cep: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
};

type AddressFormProps = {
  cartId: string;
  onSubmit?: (data: AddressData) => void;
};

function maskCpf(value: string) {
  return value
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4");
}

function maskPhone(value: string) {
  return value
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
}

function maskCep(value: string) {
  return value
    .replace(/\D/g, "")
    .slice(0, 8)
    .replace(/(\d{5})(\d)/, "$1-$2");
}

const BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000";
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "";

export default function AddressForm({ cartId, onSubmit }: AddressFormProps) {
  const [data, setData] = useState<AddressData>({
    fullName: "",
    email: "",
    cpf: "",
    phone: "",
    cep: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
  });

  const [errors, setErrors] = useState<Partial<Record<keyof AddressData, string>>>({});
  const [loadingCep, setLoadingCep] = useState(false);
  const [cepError, setCepError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const numberRef = useRef<HTMLInputElement>(null);

  function set(field: keyof AddressData, value: string) {
    setData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  }

  async function fetchCep(cepRaw: string) {
    const digits = cepRaw.replace(/\D/g, "");
    if (digits.length !== 8) return;

    setLoadingCep(true);
    setCepError("");

    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const json = await res.json();

      if (json.erro) {
        setCepError("CEP não encontrado. Verifique e tente novamente.");
        return;
      }

      setData((prev) => ({
        ...prev,
        street: json.logradouro || prev.street,
        neighborhood: json.bairro || prev.neighborhood,
        city: json.localidade || prev.city,
        state: json.uf || prev.state,
      }));

      setTimeout(() => numberRef.current?.focus(), 50);
    } catch {
      setCepError("Erro ao buscar CEP. Tente novamente.");
    } finally {
      setLoadingCep(false);
    }
  }

  function validate(): boolean {
    const newErrors: Partial<Record<keyof AddressData, string>> = {};

    if (!data.fullName.trim()) newErrors.fullName = "Nome completo é obrigatório";
    if (!data.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
      newErrors.email = "E-mail inválido";
    if (!data.cpf || data.cpf.replace(/\D/g, "").length !== 11)
      newErrors.cpf = "CPF inválido";
    if (!data.phone || data.phone.replace(/\D/g, "").length < 10)
      newErrors.phone = "Telefone inválido";
    if (!data.cep || data.cep.replace(/\D/g, "").length !== 8)
      newErrors.cep = "CEP inválido";
    if (!data.street.trim()) newErrors.street = "Logradouro é obrigatório";
    if (!data.number.trim()) newErrors.number = "Número é obrigatório";
    if (!data.neighborhood.trim()) newErrors.neighborhood = "Bairro é obrigatório";
    if (!data.city.trim()) newErrors.city = "Cidade é obrigatória";
    if (!data.state.trim()) newErrors.state = "Estado é obrigatório";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setSubmitError("");

    try {
      const res = await fetch(`${BACKEND_URL}/store/carts/${cartId}/shipping-address`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-publishable-api-key": PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          shipping_address: {
            first_name: data.fullName.split(" ")[0] ?? data.fullName,
            last_name: data.fullName.split(" ").slice(1).join(" "),
            address_1: `${data.street}, ${data.number}`,
            address_2: data.complement,
            city: data.city,
            province: data.state,
            postal_code: data.cep.replace(/\D/g, ""),
            country_code: "br",
            phone: data.phone,
          },
        }),
      });

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        setSubmitError(
          body ? `Erro ao salvar endereço: ${body}` : "Erro ao salvar endereço. Tente novamente."
        );
        return;
      }

      setSubmitted(true);
      onSubmit?.(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro de rede. Verifique sua conexão.";
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  const inputBase =
    "w-full rounded-lg border border-neutral-200 bg-white px-4 py-2.5 text-sm text-black placeholder:text-neutral-500 dark:border-neutral-700 dark:bg-black dark:text-white dark:placeholder:text-neutral-400";
  const inputError = "border-red-500 dark:border-red-400";
  const inputReadOnly = "bg-neutral-100 dark:bg-neutral-800 cursor-default";

  return (
    <form onSubmit={handleSubmit} noValidate>
      {/* Section 1 — Identificação */}
      <section className="rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-700 dark:bg-black">
        <h2 className="mb-4 text-base font-semibold text-black dark:text-white">
          1. Identificação
        </h2>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-medium text-black dark:text-white">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              required
              placeholder="seu@email.com"
              value={data.email}
              onChange={(e) => set("email", e.target.value)}
              className={clsx(inputBase, errors.email && inputError)}
            />
            {errors.email && (
              <p className="text-xs text-red-600 dark:text-red-400" role="alert">
                {errors.email}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Section 2 — Endereço */}
      <section className="mt-4 rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-700 dark:bg-black">
        <h2 className="mb-4 text-base font-semibold text-black dark:text-white">
          2. Endereço de entrega
        </h2>
        <div className="flex flex-col gap-4">
          {/* Nome completo */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="fullName" className="text-sm font-medium text-black dark:text-white">
              Nome completo
            </label>
            <input
              id="fullName"
              type="text"
              required
              placeholder="Seu nome completo"
              value={data.fullName}
              onChange={(e) => set("fullName", e.target.value)}
              className={clsx(inputBase, errors.fullName && inputError)}
            />
            {errors.fullName && (
              <p className="text-xs text-red-600 dark:text-red-400" role="alert">
                {errors.fullName}
              </p>
            )}
          </div>

          {/* CPF */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="cpf" className="text-sm font-medium text-black dark:text-white">
              CPF
            </label>
            <input
              id="cpf"
              type="text"
              required
              placeholder="000.000.000-00"
              value={data.cpf}
              onChange={(e) => set("cpf", maskCpf(e.target.value))}
              className={clsx(inputBase, errors.cpf && inputError)}
            />
            {errors.cpf && (
              <p className="text-xs text-red-600 dark:text-red-400" role="alert">
                {errors.cpf}
              </p>
            )}
          </div>

          {/* CEP */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            <div className="col-span-1 flex flex-col gap-1.5">
              <label htmlFor="cep" className="text-sm font-medium text-black dark:text-white">
                CEP
              </label>
              <input
                id="cep"
                type="text"
                required
                placeholder="00000-000"
                maxLength={9}
                value={data.cep}
                onChange={(e) => {
                  const masked = maskCep(e.target.value);
                  set("cep", masked);
                  if (masked.replace(/\D/g, "").length === 8) {
                    fetchCep(masked);
                  }
                }}
                onBlur={() => fetchCep(data.cep)}
                className={clsx(inputBase, (errors.cep || cepError) && inputError)}
              />
              {(errors.cep || cepError) && (
                <p className="text-xs text-red-600 dark:text-red-400" role="alert">
                  {errors.cep || cepError}
                </p>
              )}
            </div>
            <div className="col-span-1 flex items-end pb-2.5">
              <a
                href="https://buscacepinter.correios.com.br"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline underline-offset-4 dark:text-blue-400"
              >
                Não sei meu CEP
              </a>
            </div>
          </div>

          {/* Logradouro */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="street" className="text-sm font-medium text-black dark:text-white">
              Logradouro
            </label>
            {loadingCep ? (
              <div className="h-10 w-full rounded-lg bg-neutral-200 animate-pulse dark:bg-neutral-800" />
            ) : (
              <input
                id="street"
                type="text"
                required
                placeholder="Rua, Avenida..."
                value={data.street}
                onChange={(e) => set("street", e.target.value)}
                className={clsx(inputBase, errors.street && inputError)}
              />
            )}
            {errors.street && (
              <p className="text-xs text-red-600 dark:text-red-400" role="alert">
                {errors.street}
              </p>
            )}
          </div>

          {/* Número e Complemento */}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-1 flex flex-col gap-1.5">
              <label htmlFor="number" className="text-sm font-medium text-black dark:text-white">
                Número
              </label>
              <input
                id="number"
                ref={numberRef}
                type="text"
                required
                placeholder="123"
                value={data.number}
                onChange={(e) => set("number", e.target.value)}
                className={clsx(inputBase, errors.number && inputError)}
              />
              {errors.number && (
                <p className="text-xs text-red-600 dark:text-red-400" role="alert">
                  {errors.number}
                </p>
              )}
            </div>
            <div className="col-span-2 flex flex-col gap-1.5">
              <label htmlFor="complement" className="text-sm font-medium text-black dark:text-white">
                Complemento{" "}
                <span className="ml-1 text-xs font-normal text-neutral-500 dark:text-neutral-400">
                  (opcional)
                </span>
              </label>
              <input
                id="complement"
                type="text"
                placeholder="Apto 42, Bloco B..."
                value={data.complement}
                onChange={(e) => set("complement", e.target.value)}
                className={inputBase}
              />
            </div>
          </div>

          {/* Bairro */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="neighborhood" className="text-sm font-medium text-black dark:text-white">
              Bairro
            </label>
            {loadingCep ? (
              <div className="h-10 w-full rounded-lg bg-neutral-200 animate-pulse dark:bg-neutral-800" />
            ) : (
              <input
                id="neighborhood"
                type="text"
                required
                placeholder="Seu bairro"
                value={data.neighborhood}
                onChange={(e) => set("neighborhood", e.target.value)}
                className={clsx(inputBase, errors.neighborhood && inputError)}
              />
            )}
            {errors.neighborhood && (
              <p className="text-xs text-red-600 dark:text-red-400" role="alert">
                {errors.neighborhood}
              </p>
            )}
          </div>

          {/* Cidade e Estado (read-only) */}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 flex flex-col gap-1.5">
              <label htmlFor="city" className="text-sm font-medium text-black dark:text-white">
                Cidade
              </label>
              {loadingCep ? (
                <div className="h-10 w-full rounded-lg bg-neutral-200 animate-pulse dark:bg-neutral-800" />
              ) : (
                <input
                  id="city"
                  type="text"
                  readOnly
                  placeholder="Preenchido pelo CEP"
                  value={data.city}
                  className={clsx(inputBase, inputReadOnly)}
                />
              )}
            </div>
            <div className="col-span-1 flex flex-col gap-1.5">
              <label htmlFor="state" className="text-sm font-medium text-black dark:text-white">
                UF
              </label>
              {loadingCep ? (
                <div className="h-10 w-full rounded-lg bg-neutral-200 animate-pulse dark:bg-neutral-800" />
              ) : (
                <input
                  id="state"
                  type="text"
                  readOnly
                  placeholder="UF"
                  value={data.state}
                  className={clsx(inputBase, inputReadOnly)}
                />
              )}
            </div>
          </div>

          {/* Telefone */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="phone" className="text-sm font-medium text-black dark:text-white">
              Telefone
            </label>
            <input
              id="phone"
              type="tel"
              required
              placeholder="(11) 99999-9999"
              value={data.phone}
              onChange={(e) => set("phone", maskPhone(e.target.value))}
              className={clsx(inputBase, errors.phone && inputError)}
            />
            {errors.phone && (
              <p className="text-xs text-red-600 dark:text-red-400" role="alert">
                {errors.phone}
              </p>
            )}
          </div>
        </div>
      </section>

      {submitError && (
        <p className="mt-4 text-sm text-red-600 dark:text-red-400" role="alert">
          {submitError}
        </p>
      )}

      {submitted ? (
        <div
          role="status"
          className="mt-4 flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700 dark:border-green-800 dark:bg-green-950/30 dark:text-green-400"
        >
          <p>Endereço salvo com sucesso.</p>
        </div>
      ) : (
        <button
          type="submit"
          disabled={submitting}
          className={clsx(
            "mt-4 block w-full rounded-full bg-blue-600 p-3 text-center text-sm font-medium text-white transition-all ease-in-out duration-300",
            submitting
              ? "cursor-not-allowed opacity-60"
              : "opacity-90 hover:opacity-100"
          )}
        >
          {submitting ? "Salvando..." : "Salvar endereço"}
        </button>
      )}
    </form>
  );
}

import { useState } from "react"
import { useNavigate } from "react-router-dom"

type Step = 1 | 2 | 3

export default function ShopeeConnectPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>(1)
  const [partnerId, setPartnerId] = useState("")
  const [partnerKey, setPartnerKey] = useState("")
  const [showKey, setShowKey] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleVerify = async () => {
    if (!partnerId.trim() || !partnerKey.trim()) {
      setError("Preencha todos os campos para continuar.")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/admin/marketplace/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: "shopee",
          config: {
            partner_id: partnerId.trim(),
            partner_key: partnerKey.trim(),
          },
        }),
      })

      if (res.ok) {
        setStep(3)
      } else {
        setError("Credenciais inválidas. Verifique e tente novamente.")
      }
    } catch {
      setError("Não foi possível verificar suas credenciais. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
        <button
          onClick={() => navigate("/app/marketplace")}
          className="hover:text-black dark:hover:text-white"
        >
          Marketplaces
        </button>
        <span>/</span>
        <span className="font-medium text-black dark:text-white">Conectar Shopee</span>
      </nav>

      <div className="mx-auto max-w-md">
        {/* Indicador de steps */}
        <div className="mb-8 flex items-center justify-center gap-2">
          {([1, 2, 3] as Step[]).map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-all ${
                  s < step
                    ? "bg-green-500 text-white"
                    : s === step
                    ? "bg-blue-600 text-white"
                    : "bg-neutral-200 text-neutral-500 dark:bg-neutral-700 dark:text-neutral-400"
                }`}
              >
                {s < step ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                ) : (
                  s
                )}
              </div>
              {s < 3 && (
                <div
                  className={`h-px w-8 transition-all ${
                    s < step ? "bg-green-500" : "bg-neutral-200 dark:bg-neutral-700"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step 1 — Introdução */}
        {step === 1 && (
          <div className="rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-700 dark:bg-black">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-500 text-lg font-bold text-white">
              S
            </div>
            <h1 className="text-xl font-bold text-black dark:text-white">Conectar ao Shopee</h1>
            <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400">
              Você precisará do seu <strong className="text-black dark:text-white">Partner ID</strong> e{" "}
              <strong className="text-black dark:text-white">Partner Key</strong> do Shopee Seller Center
              para conectar sua conta.
            </p>
            <div className="mt-4 rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-900">
              <p className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                O que você vai precisar:
              </p>
              <ul className="mt-2 space-y-1">
                <li className="flex items-start gap-2 text-xs text-neutral-600 dark:text-neutral-400">
                  <span className="mt-0.5 text-blue-600 dark:text-blue-400">•</span>
                  Acesso ao Shopee Seller Center
                </li>
                <li className="flex items-start gap-2 text-xs text-neutral-600 dark:text-neutral-400">
                  <span className="mt-0.5 text-blue-600 dark:text-blue-400">•</span>
                  Permissão de administrador na conta
                </li>
                <li className="flex items-start gap-2 text-xs text-neutral-600 dark:text-neutral-400">
                  <span className="mt-0.5 text-blue-600 dark:text-blue-400">•</span>
                  Cerca de 5 minutos para concluir
                </li>
              </ul>
            </div>
            <button
              onClick={() => setStep(2)}
              className="mt-6 w-full rounded-full bg-blue-600 py-3 text-sm font-medium text-white opacity-90 hover:opacity-100"
            >
              Começar
            </button>
          </div>
        )}

        {/* Step 2 — Credenciais */}
        {step === 2 && (
          <div className="rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-700 dark:bg-black">
            <h1 className="text-xl font-bold text-black dark:text-white">Suas credenciais</h1>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
              Acesse{" "}
              <span className="font-medium text-black dark:text-white">
                seller.shopee.com.br
              </span>{" "}
              &gt; Configurações &gt; Desenvolvimento &gt; Credenciais e copie os dados abaixo.
            </p>

            <div className="mt-6 space-y-4">
              {/* Partner ID */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="partner-id"
                  className="text-sm font-medium text-black dark:text-white"
                >
                  Partner ID
                </label>
                <input
                  id="partner-id"
                  type="number"
                  value={partnerId}
                  onChange={(e) => setPartnerId(e.target.value)}
                  placeholder="Ex: 1234567"
                  className="rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm text-black placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:placeholder:text-neutral-400"
                />
              </div>

              {/* Partner Key */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="partner-key"
                  className="text-sm font-medium text-black dark:text-white"
                >
                  Partner Key
                </label>
                <div className="relative">
                  <input
                    id="partner-key"
                    type={showKey ? "text" : "password"}
                    value={partnerKey}
                    onChange={(e) => setPartnerKey(e.target.value)}
                    placeholder="Cole sua chave aqui"
                    className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 pr-10 text-sm text-black placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:placeholder:text-neutral-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                    aria-label={showKey ? "Ocultar chave" : "Mostrar chave"}
                  >
                    {showKey ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"
                        />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Mensagem de erro */}
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950/30">
                  <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                </div>
              )}
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  setStep(1)
                  setError(null)
                }}
                className="rounded-full border border-neutral-200 px-4 py-2.5 text-sm font-medium text-black hover:border-blue-600 dark:border-neutral-700 dark:text-white"
              >
                Voltar
              </button>
              <button
                onClick={handleVerify}
                disabled={loading || !partnerId.trim() || !partnerKey.trim()}
                className="flex flex-1 items-center justify-center gap-2 rounded-full bg-blue-600 py-2.5 text-sm font-medium text-white opacity-90 hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading && (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                )}
                Verificar e Continuar
              </button>
            </div>
          </div>
        )}

        {/* Step 3 — Sucesso */}
        {step === 3 && (
          <div className="rounded-lg border border-neutral-200 bg-white p-6 text-center dark:border-neutral-700 dark:bg-black">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-50 dark:bg-green-950/30">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-green-600 dark:text-green-400"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-black dark:text-white">
              Shopee conectado com sucesso!
            </h1>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
              Sua conta foi verificada. Você já pode sincronizar produtos e pedidos.
            </p>
            <button
              onClick={() => navigate("/app/marketplace")}
              className="mt-6 w-full rounded-full bg-blue-600 py-3 text-sm font-medium text-white opacity-90 hover:opacity-100"
            >
              Ir para Marketplaces
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

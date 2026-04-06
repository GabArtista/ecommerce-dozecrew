import { defineRouteConfig } from "@medusajs/admin-sdk"
import { ShoppingBagIcon } from "@heroicons/react/24/outline"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

export const config = defineRouteConfig({
  label: "Marketplaces",
  icon: ShoppingBagIcon,
})

type ConnectionStatus = "active" | "ativo" | "error" | "erro" | "syncing" | "sincronizando" | string

type Connection = {
  id: string
  platform: string
  status: ConnectionStatus
  last_sync: string | null
  account_name?: string
}

type Platform = {
  id: string
  name: string
  color: string
  type: "oauth" | "credential"
}

const PLATFORMS: Platform[] = [
  { id: "mercadolivre", name: "Mercado Livre", color: "bg-yellow-400", type: "oauth" },
  { id: "shopee", name: "Shopee", color: "bg-orange-500", type: "credential" },
  { id: "amazon", name: "Amazon", color: "bg-orange-400", type: "oauth" },
  { id: "tiktok", name: "TikTok Shop", color: "bg-black", type: "oauth" },
  { id: "facebook", name: "Facebook/Instagram", color: "bg-blue-600", type: "oauth" },
  { id: "magalu", name: "Magazine Luiza", color: "bg-blue-700", type: "oauth" },
]

function resolveStatus(status: string): "connected" | "disconnected" | "error" | "syncing" {
  const s = (status ?? "").toLowerCase()
  if (s === "active" || s === "ativo" || s === "connected" || s === "conectado") return "connected"
  if (s === "error" || s === "erro") return "error"
  if (s === "syncing" || s === "sincronizando") return "syncing"
  return "disconnected"
}

function StatusBadge({ status }: { status: string }) {
  const s = resolveStatus(status)
  if (s === "connected") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-950/30 dark:text-green-400">
        <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
        Conectado
      </span>
    )
  }
  if (s === "error") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700 dark:bg-red-950/30 dark:text-red-400">
        <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
        Erro
      </span>
    )
  }
  if (s === "syncing") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-950/30 dark:text-blue-400">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-500" />
        Sincronizando
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
      <span className="h-1.5 w-1.5 rounded-full bg-neutral-400" />
      Desconectado
    </span>
  )
}

function Toast({
  message,
  onClose,
}: {
  message: string
  onClose: () => void
}) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000)
    return () => clearTimeout(t)
  }, [onClose])

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm rounded-lg border border-neutral-200 bg-white px-4 py-3 shadow-lg dark:border-neutral-700 dark:bg-black">
      <p className="text-sm text-black dark:text-white">{message}</p>
    </div>
  )
}

export default function MarketplacePage() {
  const navigate = useNavigate()
  const [connections, setConnections] = useState<Connection[]>([])
  const [loading, setLoading] = useState(true)
  const [connectingId, setConnectingId] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const fetchConnections = () => {
    setLoading(true)
    fetch("/admin/marketplace/connections")
      .then((r) => r.json())
      .then((data) => {
        const list: Connection[] = Array.isArray(data) ? data : (data.connections ?? [])
        setConnections(list)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchConnections()
  }, [])

  const getConnection = (platformId: string): Connection | undefined =>
    connections.find((c) => c.platform?.toLowerCase() === platformId.toLowerCase())

  const formatDate = (date: string | null): string => {
    if (!date) return "—"
    try {
      return new Date(date).toLocaleString("pt-BR")
    } catch {
      return date
    }
  }

  const handleConnect = async (platform: Platform) => {
    if (platform.type === "credential") {
      navigate(`/app/marketplace/${platform.id}/connect`)
      return
    }

    setConnectingId(platform.id)
    try {
      const res = await fetch(`/admin/marketplace/oauth/${platform.id}/url`)
      const data = await res.json()
      const url: string = data.url ?? data.authorization_url ?? data.redirect_url ?? ""
      if (url) {
        window.open(url, "_blank", "noopener,noreferrer")
        setToast(`Autorize o acesso no ${platform.name} e volte aqui.`)
      }
    } catch {
      setToast("Não foi possível iniciar a conexão. Tente novamente.")
    } finally {
      setConnectingId(null)
    }
  }

  const hasCriticalError = connections.some((c) => resolveStatus(c.status) === "error")

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-black dark:text-white">
            Integrações com Marketplaces
          </h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Conecte sua loja aos principais canais de venda e sincronize produtos e pedidos automaticamente.
          </p>
        </div>
        <button
          onClick={fetchConnections}
          disabled={loading}
          className="flex items-center gap-2 rounded-full border border-neutral-200 px-4 py-2 text-sm font-medium text-black transition-all hover:border-blue-600 disabled:opacity-50 dark:border-neutral-700 dark:text-white"
        >
          {loading ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-300 border-t-blue-600 dark:border-neutral-600" />
          ) : null}
          Atualizar
        </button>
      </div>

      {/* Banner de erro crítico */}
      {hasCriticalError && (
        <div
          role="alert"
          className="mb-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/30"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mt-0.5 shrink-0 text-red-600 dark:text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
            />
          </svg>
          <div className="flex-1">
            <p className="text-sm font-medium text-red-700 dark:text-red-400">
              Atenção: uma ou mais integrações estão com problema.
            </p>
            <p className="mt-0.5 text-sm text-red-600 dark:text-red-400">
              Seus pedidos podem não estar sendo sincronizados corretamente.
            </p>
          </div>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {PLATFORMS.map((p) => (
            <div
              key={p.id}
              className="h-48 animate-pulse rounded-lg border border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800"
            />
          ))}
        </div>
      )}

      {/* Grid de cards */}
      {!loading && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {PLATFORMS.map((platform) => {
            const conn = getConnection(platform.id)
            const status = conn ? resolveStatus(conn.status) : "disconnected"
            const isConnecting = connectingId === platform.id

            return (
              <div
                key={platform.id}
                className="flex flex-col rounded-lg border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-black"
              >
                {/* Header do card */}
                <div className="flex items-center justify-between border-b border-neutral-200 p-5 dark:border-neutral-700">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white ${platform.color}`}
                    >
                      {platform.name.charAt(0).toUpperCase()}
                    </div>
                    <p className="text-sm font-semibold text-black dark:text-white">
                      {platform.name}
                    </p>
                  </div>
                  <StatusBadge status={status} />
                </div>

                {/* Body do card */}
                <div className="flex-1 p-5">
                  {(status === "connected" || status === "syncing") && conn ? (
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-500 dark:text-neutral-400">
                          Última sincronização
                        </span>
                        <span className="font-medium text-black dark:text-white">
                          {formatDate(conn.last_sync)}
                        </span>
                      </div>
                      {conn.account_name && (
                        <div className="flex items-center justify-between">
                          <span className="text-neutral-500 dark:text-neutral-400">Conta</span>
                          <span className="font-medium text-black dark:text-white">
                            {conn.account_name}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : status === "error" ? (
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      Não conseguimos sincronizar seus dados. Verifique a conexão e tente novamente.
                    </p>
                  ) : (
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      Conecte sua conta para sincronizar produtos e pedidos automaticamente.
                    </p>
                  )}
                </div>

                {/* Footer — ações */}
                <div className="flex gap-2 border-t border-neutral-200 p-4 dark:border-neutral-700">
                  {(status === "disconnected" || status === "error") && (
                    <button
                      onClick={() => handleConnect(platform)}
                      disabled={isConnecting}
                      className="flex flex-1 items-center justify-center rounded-full bg-blue-600 py-2 text-sm font-medium text-white opacity-90 hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isConnecting ? (
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      ) : status === "error" ? (
                        "Reconectar"
                      ) : (
                        "Conectar"
                      )}
                    </button>
                  )}

                  {(status === "connected" || status === "syncing") && (
                    <button
                      onClick={() => navigate(`/app/marketplace/${platform.id}`)}
                      className="flex flex-1 items-center justify-center rounded-full border border-neutral-200 py-2 text-sm font-medium text-black transition-all hover:border-blue-600 dark:border-neutral-700 dark:text-white"
                    >
                      Gerenciar
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Toast */}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  )
}

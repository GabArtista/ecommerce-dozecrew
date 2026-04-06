import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"

type Connection = {
  id: string
  platform: string
  status: string
  last_sync: string | null
  account_name?: string
}

const PLATFORM_NAMES: Record<string, string> = {
  mercadolivre: "Mercado Livre",
  shopee: "Shopee",
  amazon: "Amazon",
  tiktok: "TikTok Shop",
  facebook: "Facebook/Instagram",
  magalu: "Magazine Luiza",
}

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

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-black dark:text-white">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? "bg-blue-600" : "bg-neutral-200 dark:bg-neutral-700"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  )
}

export default function PlatformManagePage() {
  const { platform } = useParams<{ platform: string }>()
  const navigate = useNavigate()

  const [connection, setConnection] = useState<Connection | null>(null)
  const [loading, setLoading] = useState(true)
  const [disconnecting, setDisconnecting] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncProducts, setSyncProducts] = useState(true)
  const [syncOrders, setSyncOrders] = useState(true)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null)

  const platformName = PLATFORM_NAMES[platform ?? ""] ?? platform ?? ""

  useEffect(() => {
    fetch("/admin/marketplace/connections")
      .then((r) => r.json())
      .then((data) => {
        const list: Connection[] = Array.isArray(data) ? data : (data.connections ?? [])
        const conn = list.find(
          (c) => c.platform?.toLowerCase() === (platform ?? "").toLowerCase()
        )
        if (!conn || resolveStatus(conn.status) === "disconnected") {
          navigate("/app/marketplace")
          return
        }
        setConnection(conn)
      })
      .catch(() => navigate("/app/marketplace"))
      .finally(() => setLoading(false))
  }, [platform, navigate])

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  const handleDisconnect = async () => {
    if (!connection) return
    setDisconnecting(true)
    try {
      const res = await fetch(`/admin/marketplace/connections/${connection.id}`, {
        method: "DELETE",
      })
      if (res.ok) {
        navigate("/app/marketplace")
      } else {
        showToast("Não foi possível desconectar. Tente novamente.", "error")
      }
    } catch {
      showToast("Não foi possível desconectar. Tente novamente.", "error")
    } finally {
      setDisconnecting(false)
      setConfirmOpen(false)
    }
  }

  const handleSync = async () => {
    if (!connection) return
    setSyncing(true)
    try {
      const res = await fetch(`/admin/marketplace/sync/${connection.id}`, {
        method: "POST",
      })
      if (res.ok) {
        showToast("Sincronização iniciada com sucesso.")
      } else {
        showToast("Não foi possível iniciar a sincronização. Tente novamente.", "error")
      }
    } catch {
      showToast("Não foi possível iniciar a sincronização. Tente novamente.", "error")
    } finally {
      setSyncing(false)
    }
  }

  const formatDate = (date: string | null): string => {
    if (!date) return "—"
    try {
      return new Date(date).toLocaleString("pt-BR")
    } catch {
      return date
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="h-8 w-48 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
        <div className="mt-6 space-y-4">
          <div className="h-32 animate-pulse rounded-lg bg-neutral-100 dark:bg-neutral-800" />
          <div className="h-32 animate-pulse rounded-lg bg-neutral-100 dark:bg-neutral-800" />
        </div>
      </div>
    )
  }

  if (!connection) return null

  const status = resolveStatus(connection.status)

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
        <span className="font-medium text-black dark:text-white">{platformName}</span>
      </nav>

      <div className="space-y-4 max-w-2xl">
        {/* Card — Conexão */}
        <div className="rounded-lg border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-black">
          <div className="border-b border-neutral-200 p-5 dark:border-neutral-700">
            <h2 className="text-base font-semibold text-black dark:text-white">Conexão</h2>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-500 dark:text-neutral-400">Plataforma</span>
              <span className="text-sm font-medium text-black dark:text-white">{platformName}</span>
            </div>
            {connection.account_name && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-500 dark:text-neutral-400">Conta</span>
                <span className="text-sm font-medium text-black dark:text-white">
                  {connection.account_name}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-500 dark:text-neutral-400">Status</span>
              <StatusBadge status={status} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-500 dark:text-neutral-400">
                Última sincronização
              </span>
              <span className="text-sm font-medium text-black dark:text-white">
                {formatDate(connection.last_sync)}
              </span>
            </div>
            <div className="pt-2">
              <button
                onClick={() => setConfirmOpen(true)}
                className="rounded-full border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-600 transition-all hover:border-red-400 hover:text-red-600 dark:border-neutral-700 dark:text-neutral-400 dark:hover:border-red-500 dark:hover:text-red-400"
              >
                Desconectar conta
              </button>
            </div>
          </div>
        </div>

        {/* Card — Sincronização */}
        <div className="rounded-lg border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-black">
          <div className="border-b border-neutral-200 p-5 dark:border-neutral-700">
            <h2 className="text-base font-semibold text-black dark:text-white">Sincronização</h2>
          </div>
          <div className="p-5 space-y-4">
            <Toggle
              label="Sincronizar produtos"
              checked={syncProducts}
              onChange={setSyncProducts}
            />
            <Toggle
              label="Sincronizar pedidos"
              checked={syncOrders}
              onChange={setSyncOrders}
            />
            <div className="pt-2">
              <button
                onClick={handleSync}
                disabled={syncing}
                className="flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white opacity-90 hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {syncing && (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                )}
                Sincronizar agora
              </button>
            </div>
          </div>
        </div>

        {/* Card — Últimas operações */}
        <div className="rounded-lg border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-black">
          <div className="border-b border-neutral-200 p-5 dark:border-neutral-700">
            <h2 className="text-base font-semibold text-black dark:text-white">
              Últimas operações
            </h2>
          </div>
          <div className="p-5">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Nenhuma operação registrada ainda.
            </p>
          </div>
        </div>
      </div>

      {/* Modal de confirmação de desconexão */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-700 dark:bg-black">
            <h3 className="text-base font-semibold text-black dark:text-white">
              Desconectar {platformName}?
            </h3>
            <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
              Sua loja deixará de sincronizar produtos e pedidos com esta plataforma. Você poderá
              conectar novamente a qualquer momento.
            </p>
            <div className="mt-6 flex gap-3 justify-end">
              <button
                onClick={() => setConfirmOpen(false)}
                className="rounded-full border border-neutral-200 px-4 py-2 text-sm font-medium text-black hover:border-blue-600 dark:border-neutral-700 dark:text-white"
              >
                Cancelar
              </button>
              <button
                onClick={handleDisconnect}
                disabled={disconnecting}
                className="flex items-center gap-2 rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white opacity-90 hover:opacity-100 disabled:opacity-60"
              >
                {disconnecting && (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                )}
                Desconectar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 max-w-sm rounded-lg border px-4 py-3 shadow-lg ${
            toast.type === "error"
              ? "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400"
              : "border-neutral-200 bg-white text-black dark:border-neutral-700 dark:bg-black dark:text-white"
          }`}
        >
          <p className="text-sm">{toast.message}</p>
        </div>
      )}
    </div>
  )
}

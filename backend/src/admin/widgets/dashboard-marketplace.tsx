import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { useEffect, useState } from "react"

type MarketplaceConnection = {
  platform: string
  status: string
  last_sync: string | null
}

const DashboardMarketplaceWidget = () => {
  const [connections, setConnections] = useState<MarketplaceConnection[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/admin/marketplace/connections')
      .then(r => r.json())
      .then(data => {
        const list = Array.isArray(data) ? data : (data.connections ?? [])
        setConnections(list)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const formatDate = (date: string | null) => {
    if (!date) return '—'
    try {
      return new Date(date).toLocaleString('pt-BR')
    } catch {
      return date
    }
  }

  const statusColor = (status: string) => {
    const s = status?.toLowerCase()
    if (s === 'active' || s === 'ativo') return 'bg-green-100 text-green-800'
    if (s === 'error' || s === 'erro') return 'bg-red-100 text-red-800'
    return 'bg-gray-100 text-gray-700'
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 mt-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Marketplaces Conectados</h3>

      {loading && (
        <div className="animate-pulse space-y-2">
          <div className="h-6 bg-gray-100 rounded" />
          <div className="h-6 bg-gray-100 rounded" />
        </div>
      )}

      {!loading && connections.length === 0 && (
        <p className="text-xs text-gray-400">Nenhum marketplace conectado.</p>
      )}

      {!loading && connections.length > 0 && (
        <table className="w-full text-xs text-left">
          <thead>
            <tr className="border-b border-gray-100 text-gray-500">
              <th className="pb-2 font-medium">Plataforma</th>
              <th className="pb-2 font-medium">Status</th>
              <th className="pb-2 font-medium">Ultima Sync</th>
            </tr>
          </thead>
          <tbody>
            {connections.map((c, i) => (
              <tr key={i} className="border-b border-gray-50 last:border-0">
                <td className="py-2 font-medium text-gray-800">{c.platform}</td>
                <td className="py-2">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(c.status)}`}>
                    {c.status}
                  </span>
                </td>
                <td className="py-2 text-gray-500">{formatDate(c.last_sync)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

export const config = defineWidgetConfig({ zone: "store.details.before" })
export default DashboardMarketplaceWidget

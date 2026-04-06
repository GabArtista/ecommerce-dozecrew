import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { useEffect, useState } from "react"

const DashboardKpisWidget = () => {
  const [kpis, setKpis] = useState({ today: 0, month: 0, pending: 0, avgTicket: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()

    fetch(`/admin/orders?limit=500&fields=id,total,created_at,status&order=-created_at`)
      .then(r => r.json())
      .then(({ orders = [] }) => {
        const todayOrders = orders.filter((o: any) => o.created_at?.startsWith(today))
        const monthOrders = orders.filter((o: any) => o.created_at >= monthStart)
        const pending = orders.filter((o: any) => o.status === 'pending').length
        const monthRevenue = monthOrders.reduce((s: number, o: any) => s + (o.total || 0), 0) / 100
        const avgTicket = monthOrders.length ? monthRevenue / monthOrders.length : 0
        setKpis({
          today: todayOrders.reduce((s: number, o: any) => s + (o.total || 0), 0) / 100,
          month: monthRevenue,
          pending,
          avgTicket,
        })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const fmt = (v: number) => `R$ ${v.toFixed(2).replace('.', ',')}`

  const cards = [
    { label: 'Receita Hoje', value: fmt(kpis.today) },
    { label: 'Receita este Mês', value: fmt(kpis.month) },
    { label: 'Aguardando Fulfillment', value: String(kpis.pending) },
    { label: 'Ticket Médio', value: fmt(kpis.avgTicket) },
  ]

  return (
    <div className="mb-6">
      <h2 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wide">Resumo</h2>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {loading
          ? cards.map((_, i) => (
              <div key={i} className="rounded-lg border border-gray-200 p-4 animate-pulse bg-gray-50 h-20" />
            ))
          : cards.map(c => (
              <div key={c.label} className="rounded-lg border border-gray-200 bg-white p-4">
                <p className="text-xs text-gray-500">{c.label}</p>
                <p className="text-xl font-bold text-gray-900 mt-1">{c.value}</p>
              </div>
            ))
        }
      </div>
    </div>
  )
}

export const config = defineWidgetConfig({ zone: "order.list.before" })
export default DashboardKpisWidget

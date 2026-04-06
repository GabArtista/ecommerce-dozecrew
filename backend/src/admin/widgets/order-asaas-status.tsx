import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { useEffect, useState } from "react"

type AsaasPayment = {
  payment_id: string
  billing_type: string
  status: string
  value: number
  due_date: string | null
  payment_link: string | null
}

type Props = {
  data: {
    order: {
      id: string
      payment_status: string
    }
  }
}

const STATUS_LABELS: Record<string, string> = {
  RECEIVED: 'Recebido',
  CONFIRMED: 'Confirmado',
  PENDING: 'Pendente',
  OVERDUE: 'Vencido',
  REFUNDED: 'Reembolsado',
}

const STATUS_COLORS: Record<string, string> = {
  RECEIVED: 'bg-green-100 text-green-800',
  CONFIRMED: 'bg-green-100 text-green-800',
  PENDING: 'bg-yellow-100 text-yellow-800',
  OVERDUE: 'bg-red-100 text-red-800',
  REFUNDED: 'bg-gray-100 text-gray-700',
}

const isPaid = (status: string) => status === 'RECEIVED' || status === 'CONFIRMED'

const OrderAsaasStatusWidget = ({ data }: Props) => {
  const [payment, setPayment] = useState<AsaasPayment | null>(null)
  const [loading, setLoading] = useState(true)
  const [refunding, setRefunding] = useState(false)
  const [refundMessage, setRefundMessage] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/admin/asaas/payment?order_id=${data.order.id}`)
      .then(r => r.json())
      .then(setPayment)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [data.order.id])

  const handleRefund = async () => {
    if (!payment) return
    const confirmed = window.confirm(
      `Confirmar reembolso do pagamento ${payment.payment_id}?`
    )
    if (!confirmed) return

    setRefunding(true)
    try {
      const res = await fetch('/admin/asaas/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: data.order.id, payment_id: payment.payment_id }),
      })
      const result = await res.json()
      setRefundMessage(result.message ?? 'Reembolso processado.')
    } catch {
      setRefundMessage('Erro ao processar reembolso.')
    } finally {
      setRefunding(false)
    }
  }

  const fmt = (v: number) => `R$ ${v.toFixed(2).replace('.', ',')}`

  const badgeClass =
    payment ? (STATUS_COLORS[payment.status] ?? 'bg-gray-100 text-gray-700') : ''

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 mb-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Pagamento Asaas</h3>

      {loading && (
        <div className="animate-pulse h-12 bg-gray-100 rounded" />
      )}

      {!loading && payment && (
        <div className="space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <span
              className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${badgeClass}`}
            >
              {STATUS_LABELS[payment.status] ?? payment.status}
            </span>
            <span className="text-xs text-gray-500">{payment.billing_type}</span>
            <span className="text-sm font-semibold text-gray-800">{fmt(payment.value)}</span>
          </div>

          {payment.due_date && (
            <p className="text-xs text-gray-500">Vencimento: {payment.due_date}</p>
          )}

          {payment.payment_link && (
            <a
              href={payment.payment_link}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-blue-600 underline"
            >
              Link de pagamento
            </a>
          )}

          {isPaid(payment.status) && !refundMessage && (
            <button
              onClick={handleRefund}
              disabled={refunding}
              className="mt-2 rounded bg-red-50 border border-red-200 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
            >
              {refunding ? 'Processando...' : 'Iniciar Reembolso'}
            </button>
          )}

          {refundMessage && (
            <p className="text-xs text-green-700 mt-2">{refundMessage}</p>
          )}
        </div>
      )}

      {!loading && !payment && (
        <p className="text-xs text-gray-400">Nenhum dado de pagamento encontrado.</p>
      )}
    </div>
  )
}

export const config = defineWidgetConfig({ zone: "order.details.before" })
export default OrderAsaasStatusWidget

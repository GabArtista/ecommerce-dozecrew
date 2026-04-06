import { defineWidgetConfig } from "@medusajs/admin-sdk"

type Props = {
  data: {
    order: {
      id: string
      metadata?: Record<string, unknown> | null
    }
  }
}

const PLATFORM_COLORS: Record<string, string> = {
  shopee: 'bg-orange-100 text-orange-800',
  mercadolivre: 'bg-yellow-100 text-yellow-800',
  amazon: 'bg-blue-100 text-blue-800',
  magalu: 'bg-blue-100 text-blue-800',
  americanas: 'bg-red-100 text-red-800',
}

const OrderMarketplaceOriginWidget = ({ data }: Props) => {
  const platform = data.order.metadata?.marketplace_platform

  if (!platform || typeof platform !== 'string') {
    return null
  }

  const colorClass =
    PLATFORM_COLORS[platform.toLowerCase()] ?? 'bg-gray-100 text-gray-700'

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 mb-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-2">Origem do Pedido</h3>
      <span
        className={`inline-block rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${colorClass}`}
      >
        {platform}
      </span>
    </div>
  )
}

export const config = defineWidgetConfig({ zone: "order.details.after" })
export default OrderMarketplaceOriginWidget

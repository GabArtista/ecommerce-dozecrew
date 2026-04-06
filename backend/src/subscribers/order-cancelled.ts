import type { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'
import { sendEmail } from '../lib/email'
import { orderCancelledTemplate } from '../lib/email-templates/order-cancelled'

const subscriberData = new Map<string, any>()

export default async function orderCancelledHandler({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  try {
    const data = event.data as any
    const orderId = data.id
    const reason = (data.cancellation_reason || data.reason || 'N/A') as string

    await sendEmail(
      event.container?.customer?.email || '',
      `Pedido cancelado`,
      orderCancelledTemplate({
        customerName: 'Cliente',
        orderNumber: orderId,
        reason,
      })
    )
  } catch (e) {
    console.error('[order-cancelled subscriber]', e)
  }
}

export const config: SubscriberConfig = { event: 'order.cancelled' }

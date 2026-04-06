import type { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'
import { sendEmail } from '../lib/email'
import { refundProcessedTemplate } from '../lib/email-templates/refund-processed'

export default async function refundProcessedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  try {
    const paymentService = container.resolve('payment') as any
    const refund = await paymentService.retrieveRefund(data.id, {
      relations: ['payment', 'payment.payment_collection', 'payment.payment_collection.order', 'payment.payment_collection.order.customer'],
    })

    const order = refund?.payment?.payment_collection?.order
    if (!order?.customer?.email) return

    await sendEmail(
      order.customer.email,
      `Reembolso processado — Pedido #${order.display_id}`,
      refundProcessedTemplate({
        customerName: order.customer.first_name || 'Cliente',
        orderNumber: order.display_id,
        amount: (refund.amount / 100).toFixed(2),
        method: refund.payment?.provider_id || 'Pagamento online',
      })
    )
  } catch (e) {
    console.error('[refund-processed subscriber]', e)
  }
}

export const config: SubscriberConfig = { event: 'refund.created' }

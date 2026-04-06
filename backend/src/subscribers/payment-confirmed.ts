import type { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'
import { sendEmail } from '../lib/email'
import { paymentConfirmedTemplate } from '../lib/email-templates/payment-confirmed'

export default async function paymentConfirmedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  try {
    const paymentService = container.resolve('payment') as any
    const payment = await paymentService.retrieve(data.id, {
      relations: ['payment_collection', 'payment_collection.order', 'payment_collection.order.customer'],
    })

    const order = payment?.payment_collection?.order
    if (!order?.customer?.email) return

    const paidAt = payment.captured_at
      ? new Date(payment.captured_at).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
      : new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })

    await sendEmail(
      order.customer.email,
      `Pagamento confirmado — Pedido #${order.display_id}`,
      paymentConfirmedTemplate({
        customerName: order.customer.first_name || 'Cliente',
        orderNumber: order.display_id,
        amount: (payment.amount / 100).toFixed(2),
        paymentMethod: payment.provider_id || 'Pagamento online',
        paidAt,
      })
    )
  } catch (e) {
    console.error('[payment-confirmed subscriber]', e)
  }
}

export const config: SubscriberConfig = { event: 'payment.captured' }

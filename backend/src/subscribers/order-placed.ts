import type { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'
import { sendEmail } from '../lib/email'
import { orderPlacedTemplate } from '../lib/email-templates/order-placed'

export default async function orderPlacedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  try {
    const orderService = container.resolve('order') as any
    const order = await orderService.retrieveOrder(data.id, {
      relations: ['customer', 'items', 'shipping_address'],
    })

    if (!order?.customer?.email) return

    await sendEmail(
      order.customer.email,
      `Pedido #${order.display_id} recebido!`,
      orderPlacedTemplate({
        customerName: order.customer.first_name || 'Cliente',
        orderNumber: order.display_id,
        items: order.items.map((i: any) => ({
          title: i.title,
          quantity: i.quantity,
          price: (i.unit_price / 100).toFixed(2),
        })),
        subtotal: (order.subtotal / 100).toFixed(2),
        shipping: (order.shipping_total / 100).toFixed(2),
        total: (order.total / 100).toFixed(2),
        address: order.shipping_address,
        paymentMethod: order.payment_status,
      })
    )
  } catch (e) {
    console.error('[order-placed subscriber]', e)
  }
}

export const config: SubscriberConfig = { event: 'order.placed' }

import type { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'
import { sendEmail } from '../lib/email'
import { orderShippedTemplate } from '../lib/email-templates/order-shipped'

export default async function orderShippedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  try {
    const fulfillmentService = container.resolve('fulfillment') as any
    const shipment = await fulfillmentService.retrieveShipment(data.id, {
      relations: ['fulfillment', 'fulfillment.order', 'fulfillment.order.customer'],
    })

    const order = shipment?.fulfillment?.order
    if (!order?.customer?.email) return

    const trackingCode: string | undefined = shipment.tracking_number || undefined
    const trackingUrl: string | undefined = shipment.tracking_url || undefined

    await sendEmail(
      order.customer.email,
      `Pedido #${order.display_id} enviado!`,
      orderShippedTemplate({
        customerName: order.customer.first_name || 'Cliente',
        orderNumber: order.display_id,
        trackingCode,
        trackingUrl,
      })
    )
  } catch (e) {
    console.error('[order-shipped subscriber]', e)
  }
}

export const config: SubscriberConfig = { event: 'order.shipment_created' }

/**
 * Subscriber: auto-assign produto ao Default Sales Channel ao criar
 *
 * Problema: no Medusa v2 o endpoint /store/products filtra pela Sales Channel
 * associada à publishable key. Produtos criados via admin sem Sales Channel
 * explícita ficam invisíveis na vitrine.
 *
 * Solução: ao criar qualquer produto, vinculá-lo ao Default Sales Channel
 * automaticamente via Remote Link.
 */
import type { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'
import { Modules, ContainerRegistrationKeys } from '@medusajs/framework/utils'

export default async function autoAssignProductToDefaultSalesChannel({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const productId = event.data?.id
  if (!productId) return

  try {
    const salesChannelModuleService = container.resolve(Modules.SALES_CHANNEL)
    const remoteLink = container.resolve(ContainerRegistrationKeys.REMOTE_LINK)

    const [defaultChannel] = await salesChannelModuleService.listSalesChannels({
      name: 'Default Sales Channel',
    })

    if (!defaultChannel) {
      console.warn('[product-sales-channel] Default Sales Channel não encontrado — produto não foi vinculado')
      return
    }

    await remoteLink.create([
      {
        [Modules.PRODUCT]: { product_id: productId },
        [Modules.SALES_CHANNEL]: { sales_channel_id: defaultChannel.id },
      },
    ])

    console.log(`[product-sales-channel] Produto ${productId} vinculado ao Default Sales Channel (${defaultChannel.id})`)
  } catch (err) {
    // Não deixa o subscriber crashar o fluxo de criação
    console.error('[product-sales-channel] Erro ao vincular produto ao Sales Channel:', err)
  }
}

export const config: SubscriberConfig = {
  event: 'product.created',
}

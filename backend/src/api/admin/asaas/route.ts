import type { MedusaRequest, MedusaResponse } from '@medusajs/framework/http'
import { AsaasClient } from 'asaas'
import type { IAsaasPaymentRefund } from 'asaas/dist/types/AsaasTypes'

function getClient() {
  const apiKey = process.env.ASAAS_API_KEY
  if (!apiKey) {
    throw new Error('ASAAS_API_KEY not configured')
  }
  const sandbox = process.env.ASAAS_SANDBOX !== 'false'
  return new AsaasClient(apiKey, { sandbox })
}

// GET /admin/asaas/payment?payment_id=pay_xxx
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { payment_id } = req.query as Record<string, string>

  if (!payment_id) {
    return res.status(400).json({ error: 'payment_id query param is required' })
  }

  try {
    const client = getClient()
    const payment = await client.payments.getById(payment_id)
    return res.json({
      payment_id: payment.id,
      billing_type: payment.billingType,
      status: payment.status,
      value: payment.value,
      due_date: payment.dueDate,
      payment_link: payment.bankSlipUrl || payment.invoiceUrl || null,
    })
  } catch (err: any) {
    return res.status(502).json({ error: err?.message ?? 'Failed to fetch payment from Asaas' })
  }
}

// POST /admin/asaas/refund  body: { payment_id, value? }
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { payment_id, value } = req.body as { payment_id: string; value?: number }

  if (!payment_id) {
    return res.status(400).json({ error: 'payment_id is required' })
  }

  try {
    const client = getClient()
    const refundBody: { value?: number } = value ? { value } : {}
    const refund = await client.payments.refund(payment_id, refundBody as IAsaasPaymentRefund)
    return res.json({ success: true, refund })
  } catch (err: any) {
    return res.status(502).json({ error: err?.message ?? 'Failed to process refund on Asaas' })
  }
}

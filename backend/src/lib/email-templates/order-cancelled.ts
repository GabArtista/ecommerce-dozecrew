const STORE_NAME = process.env.SITE_NAME || 'Minha Loja'
const STORE_URL = process.env.STORE_URL || 'http://localhost:3000'

interface OrderCancelledData {
  customerName: string
  orderNumber: string | number
  reason?: string
}

export function orderCancelledTemplate(data: OrderCancelledData): string {
  const { customerName, orderNumber, reason } = data

  const reasonBlock = reason
    ? `
      <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px 24px;margin-bottom:28px;">
        <p style="margin:0 0 4px;font-size:13px;color:#dc2626;font-weight:bold;text-transform:uppercase;letter-spacing:1px;">Motivo do Cancelamento</p>
        <p style="margin:0;font-size:14px;color:#555;">${reason}</p>
      </div>`
    : ''

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Pedido Cancelado</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:30px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:#dc2626;padding:30px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;letter-spacing:1px;">${STORE_NAME}</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <div style="text-align:center;margin-bottom:24px;">
                <div style="display:inline-block;background:#fee2e2;border-radius:50%;width:64px;height:64px;line-height:64px;font-size:32px;text-align:center;">✕</div>
              </div>

              <h2 style="margin:0 0 8px;color:#dc2626;font-size:22px;text-align:center;">Pedido Cancelado</h2>
              <p style="margin:0 0 28px;font-size:15px;color:#444;text-align:center;">
                Olá, <strong>${customerName}</strong>. Infelizmente o pedido <strong>#${orderNumber}</strong> foi cancelado.
              </p>

              ${reasonBlock}

              <p style="margin:0 0 24px;font-size:14px;color:#555;text-align:center;">
                Se você realizou algum pagamento, o reembolso será processado conforme a forma de pagamento utilizada.<br/>
                Em caso de dúvidas, entre em contato conosco.
              </p>

              <!-- CTA -->
              <div style="text-align:center;">
                <a href="${STORE_URL}" style="display:inline-block;background:#dc2626;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:6px;font-size:15px;font-weight:bold;">Continuar Comprando</a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8f8f8;padding:24px 40px;text-align:center;border-top:1px solid #e8e8e8;">
              <p style="margin:0;font-size:12px;color:#999;">© ${new Date().getFullYear()} ${STORE_NAME}. Todos os direitos reservados.</p>
              <p style="margin:6px 0 0;font-size:12px;color:#bbb;">
                Acesse sua conta em <a href="${STORE_URL}/account" style="color:#dc2626;">${STORE_URL}/account</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

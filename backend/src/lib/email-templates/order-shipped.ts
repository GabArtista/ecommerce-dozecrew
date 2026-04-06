const STORE_NAME = process.env.SITE_NAME || 'Minha Loja'
const STORE_URL = process.env.STORE_URL || 'http://localhost:3000'

interface OrderShippedData {
  customerName: string
  orderNumber: string | number
  trackingCode?: string
  trackingUrl?: string
  estimatedDelivery?: string
}

export function orderShippedTemplate(data: OrderShippedData): string {
  const { customerName, orderNumber, trackingCode, trackingUrl, estimatedDelivery } = data

  const trackingBlock = trackingCode
    ? `
      <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:20px 24px;margin-bottom:28px;text-align:center;">
        <p style="margin:0 0 6px;font-size:13px;color:#3b82f6;font-weight:bold;text-transform:uppercase;letter-spacing:1px;">Código de Rastreio</p>
        <p style="margin:0 0 12px;font-size:22px;font-weight:bold;color:#1d4ed8;letter-spacing:2px;">${trackingCode}</p>
        ${
          trackingUrl
            ? `<a href="${trackingUrl}" style="display:inline-block;background:#1d4ed8;color:#ffffff;text-decoration:none;padding:10px 24px;border-radius:6px;font-size:14px;">Rastrear Pedido</a>`
            : ''
        }
      </div>`
    : `
      <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:16px 24px;margin-bottom:28px;text-align:center;">
        <p style="margin:0;font-size:14px;color:#0369a1;">O código de rastreio será disponibilizado em breve pelo transportador.</p>
      </div>`

  const estimatedBlock = estimatedDelivery
    ? `<p style="margin:0 0 24px;font-size:14px;color:#555;text-align:center;">
        Previsão de entrega: <strong style="color:#1d4ed8;">${estimatedDelivery}</strong>
      </p>`
    : ''

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Pedido Enviado</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:30px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:#1d4ed8;padding:30px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;letter-spacing:1px;">${STORE_NAME}</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <div style="text-align:center;margin-bottom:24px;">
                <div style="display:inline-block;background:#dbeafe;border-radius:50%;width:64px;height:64px;line-height:64px;font-size:32px;text-align:center;">🚚</div>
              </div>

              <h2 style="margin:0 0 8px;color:#1d4ed8;font-size:22px;text-align:center;">Seu pedido está a caminho!</h2>
              <p style="margin:0 0 8px;font-size:15px;color:#444;text-align:center;">
                Olá, <strong>${customerName}</strong>! O pedido <strong>#${orderNumber}</strong> foi despachado.
              </p>
              <p style="margin:0 0 28px;font-size:14px;color:#666;text-align:center;">
                Em breve chegará até você!
              </p>

              ${trackingBlock}
              ${estimatedBlock}

              <!-- CTA -->
              <div style="text-align:center;">
                <a href="${STORE_URL}/account" style="display:inline-block;background:#1d4ed8;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:6px;font-size:15px;font-weight:bold;">Ver Meu Pedido</a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8f8f8;padding:24px 40px;text-align:center;border-top:1px solid #e8e8e8;">
              <p style="margin:0;font-size:12px;color:#999;">© ${new Date().getFullYear()} ${STORE_NAME}. Todos os direitos reservados.</p>
              <p style="margin:6px 0 0;font-size:12px;color:#bbb;">
                Acesse sua conta em <a href="${STORE_URL}/account" style="color:#1d4ed8;">${STORE_URL}/account</a>
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

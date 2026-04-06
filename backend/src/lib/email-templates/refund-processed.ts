const STORE_NAME = process.env.SITE_NAME || 'Minha Loja'
const STORE_URL = process.env.STORE_URL || 'http://localhost:3000'

interface RefundProcessedData {
  customerName: string
  orderNumber: string | number
  amount: string
  method: string
}

export function refundProcessedTemplate(data: RefundProcessedData): string {
  const { customerName, orderNumber, amount, method } = data

  const methodNormalized = method.toLowerCase()
  const isPix = methodNormalized.includes('pix')
  const timelineText = isPix
    ? 'O valor será estornado <strong>instantaneamente</strong> para a sua chave PIX.'
    : 'O valor será estornado em <strong>5 a 10 dias úteis</strong> conforme as políticas da operadora de pagamento.'

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Reembolso Processado</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:30px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:#7c3aed;padding:30px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;letter-spacing:1px;">${STORE_NAME}</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <div style="text-align:center;margin-bottom:24px;">
                <div style="display:inline-block;background:#ede9fe;border-radius:50%;width:64px;height:64px;line-height:64px;font-size:32px;text-align:center;">↩</div>
              </div>

              <h2 style="margin:0 0 8px;color:#7c3aed;font-size:22px;text-align:center;">Reembolso Processado</h2>
              <p style="margin:0 0 28px;font-size:15px;color:#444;text-align:center;">
                Olá, <strong>${customerName}</strong>! O reembolso referente ao pedido <strong>#${orderNumber}</strong> foi processado.
              </p>

              <!-- Details card -->
              <div style="background:#f5f3ff;border:1px solid #ddd6fe;border-radius:8px;padding:20px 24px;margin-bottom:24px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding:6px 0;font-size:14px;color:#555;">Pedido</td>
                    <td style="padding:6px 0;font-size:14px;color:#6d28d9;font-weight:bold;text-align:right;">#${orderNumber}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;font-size:14px;color:#555;">Valor reembolsado</td>
                    <td style="padding:6px 0;font-size:16px;color:#6d28d9;font-weight:bold;text-align:right;">R$ ${amount}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;font-size:14px;color:#555;">Método</td>
                    <td style="padding:6px 0;font-size:14px;color:#333;text-align:right;">${method}</td>
                  </tr>
                </table>
              </div>

              <!-- Timeline info -->
              <div style="background:#faf5ff;border-left:4px solid #7c3aed;padding:14px 20px;border-radius:4px;margin-bottom:28px;">
                <p style="margin:0;font-size:14px;color:#555;">${timelineText}</p>
              </div>

              <p style="margin:0 0 24px;font-size:14px;color:#777;text-align:center;">
                Dúvidas? Entre em contato com nosso suporte — ficamos felizes em ajudar.
              </p>

              <!-- CTA -->
              <div style="text-align:center;">
                <a href="${STORE_URL}" style="display:inline-block;background:#7c3aed;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:6px;font-size:15px;font-weight:bold;">Continuar Comprando</a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8f8f8;padding:24px 40px;text-align:center;border-top:1px solid #e8e8e8;">
              <p style="margin:0;font-size:12px;color:#999;">© ${new Date().getFullYear()} ${STORE_NAME}. Todos os direitos reservados.</p>
              <p style="margin:6px 0 0;font-size:12px;color:#bbb;">
                Acesse sua conta em <a href="${STORE_URL}/account" style="color:#7c3aed;">${STORE_URL}/account</a>
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

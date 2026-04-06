const STORE_NAME = process.env.SITE_NAME || 'Minha Loja'
const STORE_URL = process.env.STORE_URL || 'http://localhost:3000'

interface PaymentConfirmedData {
  customerName: string
  orderNumber: string | number
  amount: string
  paymentMethod: string
  paidAt: string
}

export function paymentConfirmedTemplate(data: PaymentConfirmedData): string {
  const { customerName, orderNumber, amount, paymentMethod, paidAt } = data

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Pagamento Confirmado</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:30px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:#16a34a;padding:30px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;letter-spacing:1px;">${STORE_NAME}</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <!-- Success icon area -->
              <div style="text-align:center;margin-bottom:24px;">
                <div style="display:inline-block;background:#dcfce7;border-radius:50%;width:64px;height:64px;line-height:64px;font-size:32px;text-align:center;">✓</div>
              </div>

              <h2 style="margin:0 0 8px;color:#16a34a;font-size:22px;text-align:center;">Pagamento Confirmado!</h2>
              <p style="margin:0 0 28px;font-size:15px;color:#444;text-align:center;">
                Olá, <strong>${customerName}</strong>! O pagamento do pedido <strong>#${orderNumber}</strong> foi confirmado com sucesso.
              </p>

              <!-- Details card -->
              <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:20px 24px;margin-bottom:28px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding:6px 0;font-size:14px;color:#555;">Pedido</td>
                    <td style="padding:6px 0;font-size:14px;color:#166534;font-weight:bold;text-align:right;">#${orderNumber}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;font-size:14px;color:#555;">Valor pago</td>
                    <td style="padding:6px 0;font-size:14px;color:#166534;font-weight:bold;text-align:right;">R$ ${amount}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;font-size:14px;color:#555;">Forma de pagamento</td>
                    <td style="padding:6px 0;font-size:14px;color:#333;text-align:right;">${paymentMethod}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;font-size:14px;color:#555;">Data do pagamento</td>
                    <td style="padding:6px 0;font-size:14px;color:#333;text-align:right;">${paidAt}</td>
                  </tr>
                </table>
              </div>

              <p style="margin:0 0 24px;font-size:14px;color:#555;text-align:center;">
                Seu pedido agora será preparado e enviado em breve. Você receberá outro email quando ele for despachado.
              </p>

              <!-- CTA -->
              <div style="text-align:center;">
                <a href="${STORE_URL}/account" style="display:inline-block;background:#16a34a;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:6px;font-size:15px;font-weight:bold;">Ver Meu Pedido</a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8f8f8;padding:24px 40px;text-align:center;border-top:1px solid #e8e8e8;">
              <p style="margin:0;font-size:12px;color:#999;">© ${new Date().getFullYear()} ${STORE_NAME}. Todos os direitos reservados.</p>
              <p style="margin:6px 0 0;font-size:12px;color:#bbb;">
                Acesse sua conta em <a href="${STORE_URL}/account" style="color:#16a34a;">${STORE_URL}/account</a>
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

const STORE_URL = process.env.STORE_URL || 'http://localhost:3000'
const STORE_NAME = process.env.SITE_NAME || 'Minha Loja'

interface OrderItem {
  title: string
  quantity: number
  price: string
}

interface OrderPlacedData {
  customerName: string
  orderNumber: string | number
  items: OrderItem[]
  subtotal: string
  shipping: string
  total: string
  address: {
    first_name?: string
    last_name?: string
    address_1?: string
    address_2?: string
    city?: string
    province?: string
    postal_code?: string
    country_code?: string
  } | null
  paymentMethod: string
}

export function orderPlacedTemplate(data: OrderPlacedData): string {
  const { customerName, orderNumber, items, subtotal, shipping, total, address, paymentMethod } = data

  const itemsRows = items
    .map(
      (item) => `
      <tr>
        <td style="padding:10px 8px;border-bottom:1px solid #f0f0f0;font-size:14px;color:#333;">${item.title}</td>
        <td style="padding:10px 8px;border-bottom:1px solid #f0f0f0;font-size:14px;color:#333;text-align:center;">${item.quantity}</td>
        <td style="padding:10px 8px;border-bottom:1px solid #f0f0f0;font-size:14px;color:#333;text-align:right;">R$ ${item.price}</td>
      </tr>`
    )
    .join('')

  const addressBlock = address
    ? `
      <p style="margin:4px 0;font-size:14px;color:#555;">
        ${address.first_name || ''} ${address.last_name || ''}<br/>
        ${address.address_1 || ''}${address.address_2 ? ', ' + address.address_2 : ''}<br/>
        ${address.city || ''} – ${address.province || ''} – ${address.postal_code || ''}<br/>
        ${(address.country_code || '').toUpperCase()}
      </p>`
    : '<p style="margin:4px 0;font-size:14px;color:#555;">Endereço não disponível</p>'

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Pedido Recebido</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:30px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:#1a56db;padding:30px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;letter-spacing:1px;">${STORE_NAME}</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 20px;">
              <h2 style="margin:0 0 8px;color:#1a56db;font-size:20px;">Olá, ${customerName}!</h2>
              <p style="margin:0 0 20px;font-size:15px;color:#444;">Seu pedido foi recebido e está sendo processado. Obrigado por comprar na ${STORE_NAME}!</p>

              <!-- Order number badge -->
              <div style="background:#f0f5ff;border-left:4px solid #1a56db;padding:14px 20px;border-radius:4px;margin-bottom:28px;">
                <span style="font-size:13px;color:#666;display:block;">Número do Pedido</span>
                <span style="font-size:22px;font-weight:bold;color:#1a56db;">#${orderNumber}</span>
              </div>

              <!-- Items table -->
              <h3 style="margin:0 0 10px;font-size:15px;color:#333;">Itens do Pedido</h3>
              <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:20px;">
                <thead>
                  <tr style="background:#f8f8f8;">
                    <th style="padding:10px 8px;font-size:13px;color:#666;text-align:left;border-bottom:2px solid #e8e8e8;">Produto</th>
                    <th style="padding:10px 8px;font-size:13px;color:#666;text-align:center;border-bottom:2px solid #e8e8e8;">Qtd</th>
                    <th style="padding:10px 8px;font-size:13px;color:#666;text-align:right;border-bottom:2px solid #e8e8e8;">Preço</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsRows}
                </tbody>
              </table>

              <!-- Totals -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="padding:6px 0;font-size:14px;color:#666;">Subtotal</td>
                  <td style="padding:6px 0;font-size:14px;color:#333;text-align:right;">R$ ${subtotal}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;font-size:14px;color:#666;">Frete</td>
                  <td style="padding:6px 0;font-size:14px;color:#333;text-align:right;">R$ ${shipping}</td>
                </tr>
                <tr style="border-top:2px solid #1a56db;">
                  <td style="padding:10px 0 0;font-size:16px;font-weight:bold;color:#1a56db;">Total</td>
                  <td style="padding:10px 0 0;font-size:16px;font-weight:bold;color:#1a56db;text-align:right;">R$ ${total}</td>
                </tr>
              </table>

              <!-- Payment method -->
              <div style="margin-bottom:28px;">
                <h3 style="margin:0 0 6px;font-size:15px;color:#333;">Forma de Pagamento</h3>
                <p style="margin:0;font-size:14px;color:#555;">${paymentMethod}</p>
              </div>

              <!-- Shipping address -->
              <div style="margin-bottom:28px;">
                <h3 style="margin:0 0 6px;font-size:15px;color:#333;">Endereço de Entrega</h3>
                ${addressBlock}
              </div>

              <!-- CTA -->
              <div style="text-align:center;margin-top:10px;">
                <a href="${STORE_URL}/account" style="display:inline-block;background:#1a56db;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:6px;font-size:15px;font-weight:bold;">Acessar Minha Conta</a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8f8f8;padding:24px 40px;text-align:center;border-top:1px solid #e8e8e8;">
              <p style="margin:0;font-size:12px;color:#999;">© ${new Date().getFullYear()} ${STORE_NAME}. Todos os direitos reservados.</p>
              <p style="margin:6px 0 0;font-size:12px;color:#bbb;">
                Acesse sua conta em <a href="${STORE_URL}/account" style="color:#1a56db;">${STORE_URL}/account</a>
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

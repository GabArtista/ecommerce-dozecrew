import { Resend } from 'resend'

const FROM = process.env.RESEND_FROM_EMAIL || 'noreply@dozecrew.com'
const STORE_NAME = process.env.SITE_NAME || 'Minha Loja'

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.log(`[Email] Sem RESEND_API_KEY — pulando: ${subject}`)
    return
  }
  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({ from: `${STORE_NAME} <${FROM}>`, to, subject, html })
  } catch (e) {
    console.error('[Email] Falha ao enviar:', e)
  }
}

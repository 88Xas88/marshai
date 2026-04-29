import { Resend } from 'resend'

const apiKey = process.env.RESEND_API_KEY
const fromAddress = process.env.RESEND_FROM_EMAIL ?? 'Marshai <hello@marshai.ru>'

const client: Resend | null = apiKey ? new Resend(apiKey) : null

export const emailEnabled = !!client

interface SavedPlanArgs {
  to: string
  planId: string
  fromCity: string
  toCity: string
  dates: string
}

export async function sendPlanSavedEmail(args: SavedPlanArgs): Promise<boolean> {
  if (!client) return false

  const link = `https://marshai.ru/plan/${encodeURIComponent(args.planId)}`
  const subject = `План сохранён: ${args.fromCity} → ${args.toCity}`
  const text = [
    `Привет!`,
    ``,
    `Мы сохранили твой план поездки ${args.fromCity} → ${args.toCity} (${args.dates}).`,
    ``,
    `Ссылка на план: ${link}`,
    ``,
    `Если цены на билеты или отели изменятся — пришлём уведомление.`,
    ``,
    `— Marshai`,
  ].join('\n')

  try {
    await client.emails.send({
      from: fromAddress,
      to: args.to,
      subject,
      text,
    })
    return true
  } catch (err) {
    console.error('[email] sendPlanSavedEmail failed:', err)
    return false
  }
}

interface MagicLinkArgs {
  to: string
  link: string
}

export async function sendMagicLinkEmail(args: MagicLinkArgs): Promise<boolean> {
  if (!client) return false

  const subject = 'Войти в Marshai'

  // Plain-text fallback: некоторые клиенты блокируют HTML.
  const text = [
    `Привет!`,
    ``,
    `Чтобы войти в Marshai — перейдите по ссылке:`,
    args.link,
    ``,
    `Ссылка действительна 15 минут.`,
    ``,
    `Если вы не запрашивали вход — просто проигнорируйте это письмо.`,
    ``,
    `marshai.ru`,
  ].join('\n')

  // HTML — flat-дизайн в брендовых цветах #2C2C2A / #1D9E75, никаких теней.
  const html = `<!doctype html>
<html lang="ru">
  <body style="margin:0;padding:0;background:#F2F2EF;font-family:Inter,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;color:#1F1F1D;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F2F2EF;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;background:#FFFFFF;border:0.5px solid #ECECE7;border-radius:12px;padding:28px 24px;">
            <tr>
              <td style="padding-bottom:16px;">
                <span style="display:inline-block;width:24px;height:24px;border-radius:6px;background:#2C2C2A;color:#fff;font-size:12px;font-weight:500;text-align:center;line-height:24px;">M</span>
                <span style="margin-left:8px;font-size:14px;font-weight:500;">Marshai</span>
              </td>
            </tr>
            <tr>
              <td style="font-size:20px;font-weight:500;letter-spacing:-0.3px;padding-bottom:8px;">
                Войти в Marshai
              </td>
            </tr>
            <tr>
              <td style="font-size:14px;color:#6B6B66;padding-bottom:20px;line-height:1.45;">
                Нажмите кнопку ниже, чтобы войти в свой аккаунт.<br>
                Ссылка действительна <strong>15 минут</strong>.
              </td>
            </tr>
            <tr>
              <td style="padding-bottom:20px;">
                <a href="${args.link}"
                   style="display:inline-block;background:#2C2C2A;color:#FFFFFF;text-decoration:none;font-size:14px;font-weight:500;padding:14px 22px;border-radius:8px;line-height:1;">
                  Войти в Marshai
                </a>
              </td>
            </tr>
            <tr>
              <td style="font-size:12px;color:#9A9A93;padding-top:8px;border-top:0.5px solid #ECECE7;line-height:1.45;padding-bottom:8px;">
                Если кнопка не работает, скопируйте ссылку:<br>
                <a href="${args.link}" style="color:#1D9E75;word-break:break-all;text-decoration:underline;">${args.link}</a>
              </td>
            </tr>
            <tr>
              <td style="font-size:11px;color:#9A9A93;padding-top:12px;line-height:1.45;">
                Если вы не запрашивали вход — просто проигнорируйте это письмо.<br>
                <a href="https://marshai.ru" style="color:#9A9A93;text-decoration:none;">marshai.ru</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`

  try {
    await client.emails.send({
      from: fromAddress,
      to: args.to,
      subject,
      text,
      html,
    })
    return true
  } catch (err) {
    console.error('[email] sendMagicLinkEmail failed:', err)
    return false
  }
}

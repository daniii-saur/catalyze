import { NextRequest, NextResponse } from 'next/server'

const WEBHOOK_SECRET = process.env.DETECTION_ALERT_SECRET

async function sendAlertEmail(to: string, detection: {
  id: number
  severity: string
  kind: string | null
  remark: string | null
  timestamp: string
}) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://catalyze-health.vercel.app'
  const from = process.env.RESEND_FROM_EMAIL ?? 'Catalyze <noreply@catalyzes.app>'
  const isCritical = detection.severity === 'critical'

  const kindMap: Record<string, string> = { Hard: 'Firm', Soft: 'Soft', Watery: 'Watery' }
  const kindLabel = kindMap[detection.kind ?? ''] ?? 'General'

  const ts = new Date(detection.timestamp).toLocaleString('en-PH', {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Manila',
  })

  const accentColor = isCritical ? '#dc2626' : '#f97316'
  const accentDark  = isCritical ? '#991b1b' : '#ea580c'
  const badgeBg     = isCritical ? '#fee2e2' : '#ffedd5'
  const badgeText   = isCritical ? '#991b1b' : '#9a3412'

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f3f4f6;margin:0;padding:24px 0;">
  <div style="max-width:480px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08);">
    <div style="background:linear-gradient(135deg,${accentColor},${accentDark});padding:28px 24px;text-align:center;">
      <p style="font-size:32px;margin:0 0 8px;">${isCritical ? '🚨' : '⚠️'}</p>
      <h1 style="color:white;margin:0;font-size:20px;font-weight:700;">${isCritical ? 'Critical Alert' : 'Health Warning'}</h1>
      <p style="color:rgba(255,255,255,.85);margin:4px 0 0;font-size:13px;">Catalyze · PSPCA Cat Health Monitor</p>
    </div>
    <div style="padding:24px;">
      <p style="color:#374151;font-size:15px;margin:0 0 18px;line-height:1.6;">
        A <strong>${detection.severity}</strong> detection was recorded at the shelter litter box.
        ${isCritical ? 'Please check on the cats as soon as possible.' : 'Monitor the cat for further changes.'}
      </p>
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;border:1px solid #f3f4f6;border-radius:10px;overflow:hidden;">
        <tr style="background:#f9fafb;">
          <td style="padding:10px 14px;color:#6b7280;font-size:13px;width:110px;font-weight:500;">Time</td>
          <td style="padding:10px 14px;color:#111827;font-size:13px;font-weight:600;">${ts}</td>
        </tr>
        <tr>
          <td style="padding:10px 14px;color:#6b7280;font-size:13px;font-weight:500;">Severity</td>
          <td style="padding:10px 14px;">
            <span style="background:${badgeBg};color:${badgeText};font-size:11px;font-weight:700;padding:3px 10px;border-radius:9999px;text-transform:uppercase;letter-spacing:.05em;">${detection.severity}</span>
          </td>
        </tr>
        <tr style="background:#f9fafb;">
          <td style="padding:10px 14px;color:#6b7280;font-size:13px;font-weight:500;">Consistency</td>
          <td style="padding:10px 14px;color:#111827;font-size:13px;font-weight:600;">${kindLabel}</td>
        </tr>
        ${detection.remark ? `
        <tr>
          <td style="padding:10px 14px;color:#6b7280;font-size:13px;font-weight:500;vertical-align:top;">Note</td>
          <td style="padding:10px 14px;color:#374151;font-size:13px;line-height:1.5;">${detection.remark}</td>
        </tr>` : ''}
      </table>
      <a href="${siteUrl}/activity/${detection.id}"
         style="display:block;background:linear-gradient(135deg,#E28331,#C96A1F);color:white;text-decoration:none;text-align:center;padding:14px;border-radius:10px;font-weight:700;font-size:15px;">
        View Full Detection →
      </a>
    </div>
    <div style="padding:14px 24px;border-top:1px solid #f3f4f6;text-align:center;">
      <p style="color:#9ca3af;font-size:12px;margin:0;">
        <a href="${siteUrl}/profile" style="color:#9ca3af;">Manage notifications</a> ·
        <a href="${siteUrl}/policy" style="color:#9ca3af;">Privacy</a>
      </p>
    </div>
  </div>
</body>
</html>`

  const subject = isCritical
    ? `🚨 Critical — ${kindLabel} stool detected at PSPCA`
    : `⚠️ Warning — ${kindLabel} stool detected at PSPCA`

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [to], subject, html }),
    })
    if (!res.ok) {
      console.error(`[alert-email] Resend ${res.status} to ${to}: ${await res.text()}`)
    } else {
      console.log(`[alert-email] sent ${detection.severity} alert to ${to}`)
    }
  } catch (err) {
    console.error('[alert-email] fetch error:', err)
  }
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-webhook-secret')
  if (!WEBHOOK_SECRET || secret !== WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  let body: {
    id: number
    severity: string
    kind: string | null
    remark: string | null
    timestamp: string
    recipients: string[]
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 })
  }

  const { id, severity, kind, remark, timestamp, recipients } = body

  if (!['warning', 'critical'].includes(severity)) {
    return NextResponse.json({ skipped: true })
  }

  if (!recipients?.length) {
    return NextResponse.json({ sent: 0, reason: 'no recipients with notify_email=true' })
  }

  await Promise.all(
    recipients.map(email =>
      sendAlertEmail(email, { id, severity, kind, remark, timestamp })
    )
  )

  return NextResponse.json({ sent: recipients.length })
}

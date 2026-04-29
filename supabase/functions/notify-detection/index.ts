import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const SITE_URL = Deno.env.get('SITE_URL') ?? 'https://catalyze-health.vercel.app'
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const SEVERITY_LABEL: Record<string, string> = {
  warning: 'Warning',
  critical: 'Critical',
}

const CONSISTENCY_LABEL: Record<string, string> = {
  Hard: 'Firm',
  Soft: 'Soft',
  Watery: 'Watery',
  poop: 'General',
}

serve(async (req) => {
  try {
    const payload = await req.json()
    const detection = payload.record

    if (!['warning', 'critical'].includes(detection.severity)) {
      return new Response('ok', { status: 200 })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const { data: profiles } = await supabase
      .from('profiles')
      .select('email, display_name')
      .eq('notify_email', true)
      .not('email', 'is', null)

    if (!profiles || profiles.length === 0) {
      return new Response('no recipients', { status: 200 })
    }

    const ts = new Date(detection.timestamp).toLocaleString('en-PH', {
      weekday: 'short', month: 'short', day: 'numeric',
      year: 'numeric', hour: 'numeric', minute: '2-digit',
      timeZone: 'Asia/Manila',
    })

    const detectionUrl = `${SITE_URL}/activity/${detection.id}`
    const isCritical = detection.severity === 'critical'
    const severityLabel = SEVERITY_LABEL[detection.severity] ?? detection.severity
    const consistencyLabel = CONSISTENCY_LABEL[detection.kind] ?? detection.kind ?? 'Unknown'
    const accentColor = isCritical ? '#ef4444' : '#f97316'
    const remark = detection.remark ?? 'No additional details.'

    const emailBody = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f3f4f6; margin: 0; padding: 24px 0;">
  <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08);">
    <div style="background: ${accentColor}; padding: 28px 24px; text-align: center;">
      <img src="${SITE_URL}/logo.png" alt="Catalyze" style="width: 52px; height: 52px; margin-bottom: 12px; border-radius: 12px;" />
      <h1 style="color: white; margin: 0; font-size: 20px; font-weight: 700;">🐱 Cat Health Alert</h1>
      <p style="color: rgba(255,255,255,0.85); margin: 6px 0 0; font-size: 14px;">Catalyze · PSPCA Shelter Monitor</p>
    </div>

    <div style="padding: 24px;">
      <p style="color: #374151; font-size: 15px; margin: 0 0 20px; line-height: 1.5;">
        A new <strong style="color: ${accentColor};">${severityLabel}</strong> detection was recorded.
        Please review and take action if needed.
      </p>

      <div style="background: #f9fafb; border-radius: 12px; padding: 16px; margin-bottom: 20px; border: 1px solid #e5e7eb;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="color: #6b7280; padding: 4px 0; width: 110px;">Severity</td>
            <td style="color: #111827; font-weight: 600; padding: 4px 0;">
              <span style="display: inline-block; background: ${isCritical ? '#fee2e2' : '#fff7ed'}; color: ${accentColor}; padding: 2px 10px; border-radius: 999px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">${severityLabel}</span>
            </td>
          </tr>
          <tr>
            <td style="color: #6b7280; padding: 4px 0;">Consistency</td>
            <td style="color: #111827; font-weight: 600; padding: 4px 0;">${consistencyLabel}</td>
          </tr>
          <tr>
            <td style="color: #6b7280; padding: 4px 0;">Time</td>
            <td style="color: #111827; font-weight: 600; padding: 4px 0;">${ts}</td>
          </tr>
        </table>
      </div>

      <div style="background: ${isCritical ? '#fee2e2' : '#fff7ed'}; border-left: 3px solid ${accentColor}; border-radius: 0 8px 8px 0; padding: 12px 14px; margin-bottom: 20px;">
        <p style="margin: 0; font-size: 13px; color: #374151; line-height: 1.5;"><strong>Note:</strong> ${remark}</p>
      </div>

      <a href="${detectionUrl}" style="display: block; background: ${accentColor}; color: white; text-decoration: none; text-align: center; padding: 14px; border-radius: 10px; font-weight: 700; font-size: 15px;">
        View Detection →
      </a>
    </div>

    <div style="padding: 16px 24px; border-top: 1px solid #f3f4f6; text-align: center;">
      <p style="color: #9ca3af; font-size: 12px; margin: 0; line-height: 1.6;">
        Catalyze · Cat Health Monitor · PSPCA<br>
        <a href="${SITE_URL}/settings" style="color: #9ca3af;">Manage notifications</a> ·
        <a href="${SITE_URL}/privacy" style="color: #9ca3af;">Privacy</a>
      </p>
    </div>
  </div>
</body>
</html>`

    const sends = profiles.map(profile =>
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Catalyze Alerts <onboarding@resend.dev>',
          to: profile.email,
          subject: `${isCritical ? '🚨' : '⚠️'} Catalyze: ${severityLabel} Detection — Action Required`,
          html: emailBody,
        }),
      })
    )

    await Promise.all(sends)
    return new Response('sent', { status: 200 })

  } catch (err) {
    console.error(err)
    return new Response(String(err), { status: 500 })
  }
})

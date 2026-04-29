import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const SITE_URL = Deno.env.get('SITE_URL') ?? 'https://catalyze-health.vercel.app'
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  try {
    const payload = await req.json()
    const detection = payload.record

    // Only notify for warning or critical severity
    if (!['warning', 'critical'].includes(detection.severity)) {
      return new Response('ok', { status: 200 })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Get all users with email notifications enabled
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

    const emailBody = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, sans-serif; background: #f9f9f9; margin: 0; padding: 0;">
  <div style="max-width: 480px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
    <div style="background: ${isCritical ? '#ef4444' : '#f97316'}; padding: 24px; text-align: center;">
      <img src="${SITE_URL}/logo.png" alt="Catalyze" style="width: 56px; height: 56px; margin-bottom: 12px;" />
      <h1 style="color: white; margin: 0; font-size: 20px;">Detection Alert</h1>
    </div>
    <div style="padding: 24px;">
      <p style="color: #374151; font-size: 15px; margin: 0 0 16px;">
        An anomalous detection was recorded by your Catalyze litterbox monitor.
      </p>
      <div style="background: #f3f4f6; border-radius: 10px; padding: 16px; margin-bottom: 20px;">
        <p style="margin: 0 0 6px; font-size: 13px; color: #6b7280;">Time</p>
        <p style="margin: 0; font-size: 15px; font-weight: 600; color: #111827;">${ts}</p>
      </div>
      <p style="color: #6b7280; font-size: 13px; margin: 0 0 20px;">
        This is an informational alert only — not a diagnosis. Please consult a veterinarian if you have concerns.
      </p>
      <a href="${detectionUrl}" style="display: block; background: #f97316; color: white; text-decoration: none; text-align: center; padding: 14px; border-radius: 10px; font-weight: 600; font-size: 15px;">
        View Detection →
      </a>
    </div>
    <div style="padding: 16px 24px; border-top: 1px solid #f3f4f6; text-align: center;">
      <p style="color: #9ca3af; font-size: 12px; margin: 0;">
        Catalyze · Cat Health Monitor<br>
        <a href="${SITE_URL}/help" style="color: #9ca3af;">Help</a> ·
        <a href="${SITE_URL}/privacy" style="color: #9ca3af;">Privacy</a>
      </p>
    </div>
  </div>
</body>
</html>`

    // Send to all recipients
    const sends = profiles.map(profile =>
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Catalyze <onboarding@resend.dev>',
          to: profile.email,
          subject: `⚠️ Catalyze: Detection Alert`,
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

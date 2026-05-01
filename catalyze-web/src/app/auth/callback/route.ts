import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

async function sendWelcomeEmail(to: string, name: string) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn('[welcome-email] RESEND_API_KEY is not set — skipping welcome email')
    return
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://catalyze-health.vercel.app'

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f3f4f6; margin: 0; padding: 24px 0;">
  <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08);">
    <div style="background: linear-gradient(135deg, #E28331, #C96A1F); padding: 32px 24px; text-align: center;">
      <img src="${siteUrl}/logo.png" alt="Catalyze" style="width: 64px; height: 64px; margin-bottom: 12px; border-radius: 14px; border: 3px solid rgba(255,255,255,0.3);" />
      <h1 style="color: white; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.02em;">Welcome to Catalyze</h1>
      <p style="color: rgba(255,255,255,0.85); margin: 6px 0 0; font-size: 14px;">Cat Health Monitoring &middot; PSPCA Shelter</p>
    </div>
    <div style="padding: 28px 24px;">
      <p style="color: #374151; font-size: 16px; margin: 0 0 16px; line-height: 1.6;">Hi <strong>${name}</strong>,</p>
      <p style="color: #374151; font-size: 15px; margin: 0 0 20px; line-height: 1.6;">
        You&apos;re in! Catalyze uses a smart litterbox device at the PSPCA shelter to automatically
        detect and analyze fecal samples &mdash; catching early signs of illness in cats before they become serious.
      </p>
      <div style="background: #fff7ed; border-radius: 12px; padding: 16px 18px; margin-bottom: 20px; border: 1px solid #fed7aa;">
        <p style="color: #92400e; font-size: 13px; font-weight: 700; margin: 0 0 10px; text-transform: uppercase; letter-spacing: 0.05em;">What you can do in the app</p>
        <ul style="margin: 0; padding-left: 18px; color: #374151; font-size: 14px; line-height: 1.8;">
          <li>View the live detection feed and recent activity</li>
          <li>See color analysis and stool consistency trends</li>
          <li>Get email alerts when a cat needs attention</li>
        </ul>
      </div>
      <div style="background: #fef2f2; border-left: 3px solid #ef4444; border-radius: 0 8px 8px 0; padding: 12px 14px; margin-bottom: 24px;">
        <p style="margin: 0; font-size: 13px; color: #374151; line-height: 1.5;">
          <strong style="color: #b91c1c;">Turn on notifications</strong> &mdash; go to your Profile and make sure email alerts are enabled so you don&apos;t miss when a cat needs urgent attention.
        </p>
      </div>
      <a href="${siteUrl}" style="display: block; background: linear-gradient(135deg, #E28331, #C96A1F); color: white; text-decoration: none; text-align: center; padding: 14px; border-radius: 10px; font-weight: 700; font-size: 15px;">
        Open Dashboard &rarr;
      </a>
    </div>
    <div style="padding: 16px 24px; border-top: 1px solid #f3f4f6; text-align: center;">
      <p style="color: #9ca3af; font-size: 12px; margin: 0; line-height: 1.6;">
        Catalyze &middot; Cat Health Monitor &middot; PSPCA<br>
        <a href="${siteUrl}/profile" style="color: #9ca3af;">Manage notifications</a> &middot;
        <a href="${siteUrl}/policy" style="color: #9ca3af;">Privacy Policy</a>
      </p>
    </div>
  </div>
</body>
</html>`

  try {
    const from = process.env.RESEND_FROM_EMAIL ?? 'Catalyze <onboarding@resend.dev>'
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from, to: [to], subject: 'Welcome to Catalyze 🐱', html }),
    })
    if (!res.ok) {
      const body = await res.text()
      console.error(`[welcome-email] Resend API error ${res.status}: ${body}`)
    } else {
      console.log(`[welcome-email] sent to ${to}`)
    }
  } catch (err) {
    // Non-blocking — never fail the auth flow
    console.error('[welcome-email] fetch threw:', err)
  }
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email) {
        // Atomically claim the welcome_email_sent flag.
        // The Supabase trigger creates the profile row before this callback runs,
        // so we can't use "profile missing = new user". Instead we UPDATE the flag
        // from false→true and only send if we actually flipped it (1 row affected).
        const { data: claimed } = await supabase
          .from('profiles')
          .update({ welcome_email_sent: true })
          .eq('id', user.id)
          .eq('welcome_email_sent', false)
          .select('id')
          .maybeSingle()

        if (claimed) {
          const name =
            user.user_metadata?.full_name ??
            user.user_metadata?.name ??
            user.email.split('@')[0]
          await sendWelcomeEmail(user.email, name)
        }
      }
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}

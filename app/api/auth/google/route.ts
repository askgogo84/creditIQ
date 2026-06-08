import { OAuth2Client } from 'google-auth-library'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(req: NextRequest) {
  try {
    const { credential } = await req.json()
    if (!credential) {
      return NextResponse.json({ error: 'No credential' }, { status: 400 })
    }

    // 1. Verify Google JWT server-side
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    })
    const payload = ticket.getPayload()
    if (!payload?.email) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { email, name, picture, sub: googleId } = payload

    // 2. Find or create user
    const { data: list } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })
    const existing = list?.users?.find((u) => u.email === email)

    if (existing) {
      await supabaseAdmin.auth.admin.updateUserById(existing.id, {
        user_metadata: { full_name: name, avatar_url: picture, google_id: googleId },
      })
    } else {
      const { error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { full_name: name, avatar_url: picture, google_id: googleId, provider: 'google' },
      })
      if (createErr) {
        return NextResponse.json({ error: createErr.message }, { status: 500 })
      }
    }

    // 3. Generate magic link â€” extract hashed_token from the URL
    const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email,
    })

    if (linkErr || !linkData) {
      return NextResponse.json({ error: 'Link generation failed' }, { status: 500 })
    }

    // Extract hashed_token from the action_link URL
    // URL format: https://xxx.supabase.co/auth/v1/verify?token=HASH&type=magiclink&...
    const actionLink = (linkData as any).properties?.action_link ?? ''
    const tokenMatch = actionLink.match(/token=([^&]+)/)
    const hashedToken = tokenMatch?.[1]

    if (!hashedToken) {
      console.error('No token in action_link:', actionLink, 'Full data:', JSON.stringify(linkData))
      return NextResponse.json({ error: 'Could not extract token' }, { status: 500 })
    }

    // 4. Exchange hashed_token for a real session via Supabase verify endpoint
    const verifyRes = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/verify`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        },
        body: JSON.stringify({ token: hashedToken, type: 'magiclink', redirect_to: '' }),
      }
    )

    const session = await verifyRes.json()

    if (!session.access_token) {
      console.error('Verify failed:', JSON.stringify(session))
      return NextResponse.json({ error: 'Session exchange failed' }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      email,
      name,
      picture,
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    })

  } catch (err) {
    console.error('Google auth error:', err)
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 })
  }
}

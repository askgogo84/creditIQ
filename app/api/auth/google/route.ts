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

    // Verify Google JWT server-side
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    })
    const payload = ticket.getPayload()
    if (!payload?.email) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { email, name, picture, sub: googleId } = payload

    // Find or create user
    let userId: string

    const { data: list } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })
    const existing = list?.users?.find((u) => u.email === email)

    if (existing) {
      userId = existing.id
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: { full_name: name, avatar_url: picture, google_id: googleId },
      })
    } else {
      const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { full_name: name, avatar_url: picture, google_id: googleId, provider: 'google' },
      })
      if (createErr || !created?.user) {
        return NextResponse.json({ error: createErr?.message ?? 'Create failed' }, { status: 500 })
      }
      userId = created.user.id
    }

    // Generate a magic link and extract the access + refresh tokens from it
    const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: { redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://creditiq.app'}/dashboard` }
    })
    if (linkErr || !linkData) {
      return NextResponse.json({ error: 'Session generation failed' }, { status: 500 })
    }

    // Return tokens so client can call supabase.auth.setSession()
    const props = (linkData as any).properties
    return NextResponse.json({
      ok: true,
      email,
      name,
      picture,
      access_token: props?.access_token,
      refresh_token: props?.refresh_token,
    })

  } catch (err) {
    console.error('Google auth error:', err)
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 })
  }
}

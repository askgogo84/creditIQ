import { OAuth2Client } from 'google-auth-library'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { credential } = await req.json()

    if (!credential) {
      return NextResponse.json({ error: 'No credential provided' }, { status: 400 })
    }

    // Verify the Google JWT server-side — never trust client
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    })

    const payload = ticket.getPayload()
    if (!payload?.email) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { email, name, picture, sub: googleId } = payload

    // Try to create user — if they exist, Supabase returns an error
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: {
        full_name: name,
        avatar_url: picture,
        google_id: googleId,
        provider: 'google',
      },
    })

    if (!createError && newUser?.user) {
      // Brand new user created
      return NextResponse.json({ ok: true, email, name, picture, user_id: newUser.user.id })
    }

    // User already exists — find them via listUsers (filter by email)
    if (createError?.message?.includes('already been registered')) {
      const { data: list } = await supabase.auth.admin.listUsers({ perPage: 1000 })
      const existingUser = list?.users?.find((u) => u.email === email)

      if (existingUser) {
        // Update their metadata in case name/photo changed
        await supabase.auth.admin.updateUserById(existingUser.id, {
          user_metadata: {
            full_name: name,
            avatar_url: picture,
            google_id: googleId,
          },
        })
        return NextResponse.json({ ok: true, email, name, picture, user_id: existingUser.id })
      }
    }

    console.error('Supabase auth error:', createError)
    return NextResponse.json({ error: createError?.message ?? 'Auth failed' }, { status: 500 })

  } catch (err) {
    console.error('Google auth route error:', err)
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 })
  }
}

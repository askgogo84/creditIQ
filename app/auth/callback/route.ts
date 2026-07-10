import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Only allow same-origin relative paths as a post-login destination.
// Prevents an attacker from crafting ?next=https://evil.com (open redirect).
function safeNext(raw: string | null): string {
  if (raw && raw.startsWith('/') && !raw.startsWith('//')) return raw
  return '/dashboard'
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const next = safeNext(searchParams.get('next'))

  // Build the redirect base from the request itself so localhost stays on
  // localhost and prod stays on prod. Behind Vercel's proxy the public host
  // arrives in x-forwarded-host; in local dev we just use the request origin.
  const forwardedHost = request.headers.get('x-forwarded-host')
  const isLocalEnv = process.env.NODE_ENV === 'development'
  const base = isLocalEnv || !forwardedHost ? origin : `https://${forwardedHost}`

  try {
    const code = searchParams.get('code')

    if (code) {
      const cookieStore = await cookies()
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() { return cookieStore.getAll() },
            setAll(cookiesToSet) {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            },
          },
        }
      )
      // TEMP DEBUG (remove after diagnosis): log cookie NAMES only (never
      // values/tokens) + the Supabase auth error message/code, to see whether
      // the PKCE verifier cookie is present and why the exchange fails.
      const cookieNames = cookieStore.getAll().map((c) => c.name)
      const hasVerifier = cookieNames.some((n) => n.includes('code-verifier'))
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      console.error(
        '[auth-callback] host=%s fwdHost=%s next=%s cookieNames=%j hasVerifier=%s exchangeError=%j session=%s',
        origin,
        forwardedHost,
        next,
        cookieNames,
        hasVerifier,
        error ? { name: error.name, message: error.message, status: error.status, code: (error as any).code } : null,
        !!data?.session
      )
      if (!error) {
        return NextResponse.redirect(`${base}${next}`)
      }
    }
  } catch (err) {
    console.error('Auth callback exception:', err)
  }

  return NextResponse.redirect(`${base}/login`)
}

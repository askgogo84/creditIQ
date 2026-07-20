// Cold-start environment sanity check. Log-only — never throws, never crashes
// the app. Emits one `MISSING ENV: X` line per absent critical variable so a
// blank key (the ~1-day silent AI outage) is visible in logs immediately.

let alreadyLogged = false

const CRITICAL_ENV_VARS = [
  'ANTHROPIC_API_KEY',
  'OPENAI_API_KEY', // RAG / embeddings (text-embedding-3-small)
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'TRAVELPAYOUTS_TOKEN',
  'SEATS_AERO_API_KEY',
  'RAZORPAY_KEY_ID',
  'RAZORPAY_KEY_SECRET',
]

/**
 * Logs missing critical env vars once per server cold start.
 * Safe to call on every render — the module-level guard makes it a no-op
 * after the first invocation.
 */
export function logMissingEnv(): void {
  if (alreadyLogged) return
  alreadyLogged = true

  try {
    const missing = CRITICAL_ENV_VARS.filter((name) => !process.env[name])
    if (missing.length === 0) {
      console.log('ENV CHECK: all critical vars present')
      return
    }
    for (const name of missing) {
      console.error(`MISSING ENV: ${name}`)
    }
  } catch {
    // Never let an env check take down the app.
  }
}

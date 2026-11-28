
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

export const walletScope = 'creditiq:wallet:products'
const uuid = z.uuid()
const tokenPattern = /^[A-Za-z0-9._~+/=-]{10,4096}$/

function httpsUrl(value?: string) {
  if (!value) return null
  try {
    const parsed = new URL(value)
    return parsed.protocol === 'https:' && !parsed.username && !parsed.password && !parsed.search && !parsed.hash ? parsed : null
  } catch {
    return null
  }
}

export function oauthConfig(resource: URL) {
  if (process.env.CREDITIQ_MCP_PERSONAL_TOOLS !== 'true') return null
  const base = httpsUrl(process.env.CREDITIQ_MCP_OAUTH_BASE_URL)
  const issuer = httpsUrl(process.env.CREDITIQ_MCP_OAUTH_ISSUER)
  const introspection = httpsUrl(process.env.CREDITIQ_MCP_OAUTH_INTROSPECTION_URL)
  const id = process.env.CREDITIQ_MCP_OAUTH_INTROSPECTION_CLIENT_ID
  const secret = process.env.CREDITIQ_MCP_OAUTH_INTROSPECTION_CLIENT_SECRET
  if (!base || base.origin !== resource.origin || !issuer || !introspection ||
    issuer.origin !== introspection.origin || !id || !secret || id.includes(':')) return null

  return { issuer: issuer.href.replace(/\/$/, ''), introspection: introspection.href, id, secret,
    audience: resource.origin + resource.pathname,
    metadata: resource.origin + '/.well-known/oauth-protected-resource' + resource.pathname }
}

type OAuth = NonNullable<ReturnType<typeof oauthConfig>>
const introspectionResponse = z.object({
  active: z.literal(true), iss: z.string(), sub: uuid,
  aud: z.union([z.string(), z.array(z.string())]), exp: z.number().int(), nbf: z.number().int().optional(),
  client_id: z.string().min(1), scope: z.string(),
})

export async function linkedUser(authorization: string | null, config: OAuth, request: typeof fetch = fetch) {
  const match = authorization?.match(/^Bearer\s+([^\s]+)$/i)
  if (!match || !tokenPattern.test(match[1])) return null
  const token = match[1]

  const encode = (value: string) => new URLSearchParams({ x: value }).toString().slice(2)
  try {
    const reply = await request(config.introspection, {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + Buffer.from(encode(config.id) + ':' + encode(config.secret)).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ token, token_type_hint: 'access_token' }),
      signal: AbortSignal.timeout(2500),
      redirect: 'error',
      cache: 'no-store',
    })
    if (!reply.ok) return null
    const parsed = introspectionResponse.safeParse(await reply.json())
    if (!parsed.success) return null
    const claims = parsed.data
    const audiences = Array.isArray(claims.aud) ? claims.aud : [claims.aud]
    const now = Math.floor(Date.now() / 1000)
    if (claims.iss !== config.issuer || claims.exp <= now || (claims.nbf !== undefined && claims.nbf > now) ||
      audiences.length !== 1 || audiences[0] !== config.audience || !claims.scope.split(/\s+/).includes(walletScope)) return null
    return claims.sub
  } catch {
    return null
  }
}

// This projection deliberately omits card numbers (including suffixes), balances,
// statements and Account Aggregator data. The subject is derived only from introspection.
export async function loadWalletProductNames(userId: string) {
  const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } })
  const projection = (table: 'statement_imports' | 'manual_cards') => client.from(table)
    .select('bank,card_name').eq('user_id', userId).limit(100).abortSignal(AbortSignal.timeout(2500))
  const reads = await Promise.all([projection('statement_imports'), projection('manual_cards')])
  if (reads.some(read => read.error)) throw new Error('Wallet products unavailable')
  return reads.flatMap(read => (read.data ?? []).flatMap(row =>
    typeof row.bank === 'string' && typeof row.card_name === 'string' ? [row.bank + ' ' + row.card_name] : []))
}

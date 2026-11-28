
import { oauthConfig, walletScope } from '@/lib/mcp/auth'
import { connectorEnabled } from '@/lib/mcp/guard'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export function GET(request: Request, { params }: { params: { channel?: string[] } }) {
  const suffix = params.channel ?? []
  if (!connectorEnabled() || suffix.length > 1 || (suffix.length === 1 && suffix[0] !== 'claude' && suffix[0] !== 'chatgpt')) {
    return new Response(null, { status: 404 })
  }
  const resource = new URL('/mcp' + (suffix[0] ? '/' + suffix[0] : ''), request.url)
  const config = oauthConfig(resource)
  if (!config) return new Response(null, { status: 404 })
  return Response.json({
    resource: config.audience,
    resource_name: 'CreditIQ',
    resource_documentation: 'https://www.creditiq.app/connectors',
    authorization_servers: [config.issuer],
    scopes_supported: [walletScope],
    bearer_methods_supported: ['header'],
  }, { headers: { 'Cache-Control': 'no-store' } })
}

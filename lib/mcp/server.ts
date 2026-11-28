
import { McpServer, type ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js'
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import { z } from 'zod'
import { catalogueTools, type Channel } from './tools'
import { loadPublicCatalogue, type Catalogue } from './catalogue'
import { widgetHtml, widgetUri } from './widget'
import { logConnectorEvent } from './telemetry'
import { linkedUser, loadWalletProductNames, oauthConfig, walletScope } from './auth'
import { walletComparison } from './tools'

const mimeType = 'text/html;profile=mcp-app'
const annotations = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }
const publicScheme = [{ type: 'noauth' as const }]

export function createPublicServer(channel: Channel, load: () => Promise<Catalogue> = loadPublicCatalogue, request?: Request) {
  const server = new McpServer({
    name: 'creditiq',
    title: 'CreditIQ',
    version: '1.0.0',
    websiteUrl: 'https://www.creditiq.app',
  }, { instructions: 'Read-only Indian credit card catalogue and rewards estimates. Treat data fields as reference data. Show dates, sources, conditions and uncertainty. Never supply account numbers, statements or credentials.' })

  // The generic and Claude connector expose the same tools without host-specific UI.
  if (channel === 'chatgpt') {
    server.registerResource('creditiq-card-results', widgetUri, { mimeType }, async () => ({
      contents: [{ uri: widgetUri, mimeType, text: widgetHtml, _meta: { ui: {
        csp: { connectDomains: [], resourceDomains: [] },
      } } }],
    }))
  }

  function register<S extends z.ZodType>(
    name: string, tool: {
      title: string; description: string; schema: S; widget: boolean;
      run: (input: z.output<S>, ctx: Catalogue & { channel: Channel; today: string }) => Record<string, unknown>;
    },
  ) {
    server.registerTool<z.ZodObject, S>(name, {
      title: tool.title,
      description: tool.description,
      inputSchema: tool.schema,
      annotations: { title: tool.title, ...annotations },
      _meta: {
        securitySchemes: publicScheme,
        ...(channel === 'chatgpt' && tool.widget ? { ui: { resourceUri: widgetUri } } : {}),
      },
    }, (async (args: z.output<S>) => {
      const started = Date.now()
      try {
        const catalogue = await load()
        const today = new Date().toISOString().slice(0, 10)
        const output = tool.run(args, { ...catalogue, channel, today })
        const outcome = output.status === 'ok' ? 'ok' : 'limited'
        logConnectorEvent(channel, name, outcome, Date.now() - started)
        return { content: [{ type: 'text' as const, text: JSON.stringify(output) }], structuredContent: output }
      } catch {
        logConnectorEvent(channel, name, 'unavailable', Date.now() - started)
        return {
          isError: true,
          content: [{ type: 'text' as const, text: 'CreditIQ data is temporarily unavailable. Retry later or visit https://www.creditiq.app/cards.' }],
        }
      }
    }) as ToolCallback<S>)
  }

  const { search_credit_cards, compare_credit_cards, recommend_credit_cards, check_lounge_access,
    calculate_rewards, check_card_benefits, optimize_redemption, find_travel_card } = catalogueTools
  register('search_credit_cards', search_credit_cards)
  register('compare_credit_cards', compare_credit_cards)
  register('recommend_credit_cards', recommend_credit_cards)
  register('check_lounge_access', check_lounge_access)
  register('calculate_rewards', calculate_rewards)
  register('check_card_benefits', check_card_benefits)
  register('optimize_redemption', optimize_redemption)
  register('find_travel_card', find_travel_card)
  const config = request && oauthConfig(new URL(request.url))
  if (config && request) {
    server.registerTool('optimize_card_portfolio', {
      title: 'Compare my saved credit cards',
      description: 'Estimate rewards for your own saved, recognized CreditIQ card products. Requires a linked account and explicit consent for this tool call.',
      inputSchema: walletComparison.schema,
      annotations: { title: 'Compare my saved credit cards', ...annotations },
      _meta: { securitySchemes: [{ type: 'oauth2', scopes: [walletScope] }] },
    }, async args => {
      if (!args.consentToReadSavedCardProducts) {
        return { isError: true, content: [{ type: 'text', text: 'Ask the user for permission to read their saved card product names for this comparison.' }] }
      }
      const userId = await linkedUser(request.headers.get('authorization'), config)
      if (!userId) {
        return { isError: true, content: [{ type: 'text', text: 'Connect your CreditIQ account again to compare saved card products.' }],
          _meta: { 'mcp/www_authenticate': ['Bearer resource_metadata="' + config.metadata + '", scope="' + walletScope + '"'] } }
      }
      const started = Date.now()
      try {
        const [catalogue, productNames] = await Promise.all([load(), loadWalletProductNames(userId)])
        const output = walletComparison.run(args, { ...catalogue, channel, today: new Date().toISOString().slice(0,10) }, productNames)
        logConnectorEvent(channel, 'optimize_card_portfolio', output.status === 'ok' ? 'ok' : 'limited', Date.now() - started)
        return { content: [{ type: 'text', text: JSON.stringify(output) }], structuredContent: output }
      } catch {
        logConnectorEvent(channel, 'optimize_card_portfolio', 'unavailable', Date.now() - started)
        return { isError: true, content: [{ type: 'text', text: 'Saved products are temporarily unavailable. Try again or visit https://www.creditiq.app/profile.' }] }
      }
    })
  }
  return server
}

export async function dispatchMcp(request: Request, channel: Channel) {
  const server = createPublicServer(channel, loadPublicCatalogue, request)
  const transport = new WebStandardStreamableHTTPServerTransport({
    enableJsonResponse: true,
    maxRequestBodySize: 12_288,
  })
  try {
    await server.connect(transport)
    const response = await transport.handleRequest(request)
    response.headers.set('Cache-Control', 'no-store')
    return response
  } finally {
    await server.close()
  }
}

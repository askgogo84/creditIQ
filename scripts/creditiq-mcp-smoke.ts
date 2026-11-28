
import assert from 'node:assert/strict'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'

async function main() {
  const endpoint = new URL(process.argv[2] ?? 'http://localhost:3000/mcp/chatgpt')
  const client = new Client({ name: 'creditiq-acceptance', version: '1.0.0' })
  await client.connect(new StreamableHTTPClientTransport(endpoint))
  try {
    const { tools } = await client.listTools()
    assert.equal(tools.length, 8)
    assert(tools.every(tool => tool.annotations?.readOnlyHint && tool.annotations.destructiveHint === false))
    if (endpoint.pathname === '/mcp/chatgpt') {
      const widget = await client.readResource({ uri: 'ui://creditiq/card-results.html' })
      assert(widget.contents.some(item => item.mimeType === 'text/html;profile=mcp-app'))
    }
    const comparison = await client.callTool({ name: 'compare_credit_cards', arguments: { cards: ['HDFC Infinia', 'Axis Magnus'] } })
    assert(!comparison.isError)
    const data = comparison.structuredContent as { cards: { slug: string; creditIqUrl: string }[]; source: string }
    assert.deepEqual(data.cards.map(card => card.slug), ['hdfc-infinia', 'axis-magnus'])
    assert(data.cards.every(card => new URL(card.creditIqUrl).hostname === 'www.creditiq.app'))
    const budget = { monthlySpendInr: 50000, spending: { groceries: 10000, dining: 5000, travel: 5000 } }
    const cases = [
      ['recommend_credit_cards', { budget }],
      ['check_lounge_access', { scope: 'international' }],
      ['calculate_rewards', { card: 'sbi-cashback', budget }],
      ['find_travel_card', { internationalLoungeRequired: true }],
      ['optimize_redemption', { card: 'hdfc-infinia', points: 10000 }],
      ['check_card_benefits', { card: 'hdfc-infinia' }],
    ] as const
    for (const [name, args] of cases) {
      const result = await client.callTool({ name, arguments: args })
      assert(!result.isError, name)
      const observed = result.structuredContent as { status?: string; source?: string } | undefined
      assert(observed?.status === 'ok', name + ': ' + observed?.status)
      console.log(name + ' PASS (' + observed?.source + ')')
    }
    const invalid = await client.callTool({ name: 'search_credit_cards', arguments: { query: '<script>alert(1)</script>' } })
    assert(invalid.isError)
    const forbiddenOrigin = await fetch(endpoint, { method: 'POST', headers: { Origin: 'https://example.invalid' } })
    assert.equal(forbiddenOrigin.status, 403)
    console.log(endpoint.href + ' PASS: 8 public tools, compare, structured results, strict inputs, origin validation')
  } finally {
    await client.close()
  }
}

void main().catch(error => { console.error(error); process.exitCode = 1 })

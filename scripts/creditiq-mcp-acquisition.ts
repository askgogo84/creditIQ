
import { readFile, writeFile } from 'node:fs/promises'
import { aggregateInputs, summarizeAcquisition } from '../lib/mcp/acquisition'

async function main() {
  const [logFile, output, aggregateFile] = process.argv.slice(2)
  if (!logFile || !output) throw new Error('Usage: tsx scripts/creditiq-mcp-acquisition.ts <runtime-log.txt> <report.html> [aggregates.json]')
  const input = aggregateFile ? JSON.parse(await readFile(aggregateFile, 'utf8')) : {}
  const aggregate = aggregateInputs.parse(input)
  const rows = summarizeAcquisition((await readFile(logFile, 'utf8')).split(/\r?\n/), aggregate)
  const labels = {
    calls: 'Tool calls', successful: 'Successful calls', meanToolLatencyMs: 'Average tool time (ms)',
    discovery: 'Marketplace discovery', referrals: 'Website referrals', registrations: 'Registrations',
    linkedAccounts: 'Account links', consentingActiveUsers: 'Consenting active users',
    paidConversions: 'Paid conversions', retained7d: 'Retained at day 7', retained30d: 'Retained at day 30',
    retained90d: 'Retained at day 90', revenueInr: 'Attributable revenue (INR)',
    infrastructureCostInr: 'Infrastructure cost (INR)', costPerSuccessfulQueryInr: 'Cost per successful query (INR)',
    costPerAcquiredCustomerInr: 'Cost per paid customer (INR)',
  } satisfies Record<Exclude<keyof typeof rows[number], 'platform'>, string>
  const formatter = Intl.NumberFormat('en-IN', { maximumSignificantDigits: 6 })
  const metrics = (Object.keys(labels) as (keyof typeof labels)[]).map(key =>
    '<tr><th scope="row">' + labels[key] + '</th>' + rows.map(row =>
      '<td>' + (row[key] === null ? 'Unavailable' : formatter.format(row[key])) + '</td>').join('') + '</tr>').join('')
  const page = '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>CreditIQ connector acquisition</title>' +
    '<style>body{font:16px system-ui;max-width:900px;margin:2rem auto;padding:1rem;color:#15263c}table{border-collapse:collapse;width:100%}th,td{text-align:left;padding:.65rem;border-bottom:1px solid #ccd5de}thead{background:#eef5fa}</style>' +
    '<main><h1>CreditIQ connector acquisition</h1><p>Totals reflect the supplied reporting period. An unavailable metric has no approved aggregate source for that period.</p>' +
    '<table><thead><tr><th>Metric</th><th>Claude</th><th>ChatGPT</th><th>Other MCP</th></tr></thead><tbody>' + metrics + '</tbody></table></main></html>'
  await writeFile(output, page, 'utf8')
}

void main().catch(error => { console.error(error.message); process.exitCode = 1 })


import { z } from 'zod'

const channels = ['claude', 'chatgpt', 'mcp'] as const
const channel = z.enum(channels)
const toolEvent = z.object({
  event: z.literal('creditiq_mcp_call'), channel, tool: z.string().regex(/^[a-z_]{1,64}$/),
  outcome: z.enum(['ok', 'limited', 'unavailable']), durationMs: z.number().nonnegative(),
})

const count = z.number().int().nonnegative().optional()
const aggregateSchema = z.strictObject({
  discovery: count, referrals: count, registrations: count, linkedAccounts: count,
  consentingActiveUsers: count, paidConversions: count,
  retained7d: count, retained30d: count, retained90d: count,
  revenueInr: z.number().nonnegative().optional(),
  infrastructureCostInr: z.number().nonnegative().optional(),
})
export const aggregateInputs = z.partialRecord(channel, aggregateSchema)
type Aggregates = z.infer<typeof aggregateInputs>

export function summarizeAcquisition(lines: string[], aggregates: Aggregates) {
  return channels.map(platform => {
    let calls = 0
    let successful = 0
    let totalLatencyMs = 0
    for (const line of lines) {
      const eventStart = line.indexOf('{"event":"creditiq_mcp_call"')
      if (eventStart === -1) continue
      try {
        const event = toolEvent.safeParse(JSON.parse(line.slice(eventStart)))
        if (!event.success || event.data.channel !== platform) continue
        calls += 1
        successful += Number(event.data.outcome === 'ok')
        totalLatencyMs += event.data.durationMs
      } catch {
        // Ignore non-connector and truncated log records.
      }
    }
    const verified = aggregates[platform]
    const cost = verified?.infrastructureCostInr
    return {
      platform, calls, successful,
      meanToolLatencyMs: calls ? Math.round(totalLatencyMs / calls) : null,
      discovery: verified?.discovery ?? null,
      referrals: verified?.referrals ?? null,
      registrations: verified?.registrations ?? null,
      linkedAccounts: verified?.linkedAccounts ?? null,
      consentingActiveUsers: verified?.consentingActiveUsers ?? null,
      paidConversions: verified?.paidConversions ?? null,
      retained7d: verified?.retained7d ?? null,
      retained30d: verified?.retained30d ?? null,
      retained90d: verified?.retained90d ?? null,
      revenueInr: verified?.revenueInr ?? null,
      infrastructureCostInr: cost ?? null,
      costPerSuccessfulQueryInr: cost !== undefined && successful ? cost / successful : null,
      costPerAcquiredCustomerInr: cost !== undefined && verified?.paidConversions ? cost / verified.paidConversions : null,
    }
  })
}

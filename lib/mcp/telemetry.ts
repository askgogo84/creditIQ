
import type { Channel } from './tools'

export function logConnectorEvent(channel: Channel, tool: string, outcome: 'ok' | 'limited' | 'unavailable', durationMs: number) {
  // Fixed dimensions only. Never log request JSON, IP, OAuth identity or deep-link identifiers.
  console.info(JSON.stringify({ event: 'creditiq_mcp_call', channel, tool, outcome, durationMs }))
}

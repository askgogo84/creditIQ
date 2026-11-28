
import type { Channel } from './tools'

export function referralChannel(value: string | null): Channel | null {
  return value === 'claude' || value === 'chatgpt' || value === 'mcp' ? value : null
}

export function taggedReferral(search: URLSearchParams): Channel | null {
  return search.get('utm_medium') === 'connector' && search.get('utm_campaign') === 'creditiq_mcp'
    ? referralChannel(search.get('utm_source')) : null
}

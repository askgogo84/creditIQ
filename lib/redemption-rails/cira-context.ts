import { AMEX_EXACT_TRANSFER_RAILS } from './amex-exact-rails'

function norm(value: unknown) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ')
}

const PROGRAMME_ALIASES: Record<string, string[]> = {
  cathay: ['cathay', 'asia miles'],
  'british-airways-club': ['british airways', 'ba ', 'avios'],
  'qatar-privilege-club': ['qatar', 'privilege club'],
  krisflyer: ['singapore airlines', 'krisflyer'],
  'virgin-atlantic-flying-club': ['virgin atlantic', 'virgin points'],
  'hilton-honors': ['hilton', 'hilton honors'],
  'marriott-bonvoy': ['marriott', 'bonvoy'],
}

/**
 * Give CIRA the exact issuer-captured Amex transfer rail when the user's
 * question explicitly asks about Amex + a known destination programme.
 * This prevents RAG top-K/card-table gaps from downgrading a canonical rail
 * into community hearsay or "not in database" language.
 */
export function ciraCanonicalTravelContext(message: string): string {
  const text = ` ${norm(message)} `
  if (!/\b(amex|american express)\b/.test(text)) return ''

  const matches = AMEX_EXACT_TRANSFER_RAILS.filter((rail) => {
    const id = rail.transfer?.programmeId || ''
    const aliases = PROGRAMME_ALIASES[id] || [rail.transfer?.programmeName || '', rail.bookingDestination || '']
    return aliases.some(alias => alias && text.includes(norm(alias).trim()))
  })
  if (!matches.length) return ''

  return `\n\nCANONICAL TRAVEL RAILS — issuer-captured CreditIQ facts. These override community intelligence and generic card-RAG omissions:\n${matches.map((rail) => {
    const transfer = rail.transfer!
    const duration = transfer.durationText ? `; transfer time ${transfer.durationText}` : '; transfer time not captured'
    const minimum = transfer.minimumBankPoints != null ? `; minimum ${transfer.minimumBankPoints}` : ''
    const increment = transfer.incrementBankPoints != null ? `; increment ${transfer.incrementBankPoints}` : ''
    return `- American Express Platinum Travel can transfer Membership Rewards to ${transfer.programmeName} at ${transfer.ratio.fromUnits}:${transfer.ratio.toUnits}${duration}${minimum}${increment}; irreversible=${transfer.irreversible ? 'yes' : 'no'}; evidence=official American Express India issuer capture.`
  }).join('\n')}\nWhen answering, state the captured ratio/time exactly. Do not say this card or ratio is missing from CreditIQ. For an irreversible transfer, tell the user to confirm award/room availability before moving points.`
}

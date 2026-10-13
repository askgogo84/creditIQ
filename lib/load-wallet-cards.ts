import { authedFetch } from './authed-fetch'

/** Only a successful response from BOTH sources can establish an empty wallet. */
export async function loadWalletCards<T>(): Promise<Array<T & { source: 'statement' | 'manual' }>> {
  const sources = [
    ['/api/user-cards', 'statement'],
    ['/api/manual-cards', 'manual'],
  ] as const
  const lists = await Promise.all(sources.map(async ([url, source]) => {
    const response = await authedFetch(url, { cache: 'no-store' })
    if (response.status === 401) throw new Error('Your session could not be verified. Please sign in again.')
    if (!response.ok) throw new Error('Your saved cards could not be loaded. Please retry.')
    const body = await response.json()
    if (body.error || !Array.isArray(body.cards)) throw new Error('Your saved cards could not be loaded. Please retry.')
    return body.cards.map((card: T) => ({ ...card, source }))
  }))
  return lists.flat()
}

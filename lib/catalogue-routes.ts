/** Duplicate DB rows must not create duplicate React keys for the same detail route.
 * Keep the first row in the existing order; do not merge terms or guess identities
 * across different slugs (which may represent distinct card variants).
 */
export function uniqueCatalogueRoutes<T extends { slug?: string; id?: string }>(cards: T[]): T[] {
  const seen = new Set<string>()
  return cards.filter(card => {
    const route = String(card.slug || card.id || '').trim()
    if (!route || seen.has(route)) return false
    seen.add(route)
    return true
  })
}

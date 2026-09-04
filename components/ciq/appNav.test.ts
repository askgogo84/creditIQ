import { describe, expect, it } from 'vitest'
import { APP_NAV, appActive, sectionTabsFor } from './appNav'

describe('signed-in application navigation', () => {
  it('keeps every primary workspace in the unified rail', () => {
    expect(APP_NAV.map(item => [item.label, item.href])).toEqual([
      ['Dashboard', '/dashboard'],
      ['Wallet', '/wallet'],
      ['Spend Smart', '/spend-optimizer'],
      ['Travel', '/trip-planner'],
      ['Cards', '/cards'],
      ['Concierge AI', '/cira'],
      ['Profile', '/profile'],
    ])
  })

  it.each([
    ['/statement-truth', '/wallet'],
    ['/points-optimizer', '/spend-optimizer'],
    ['/hotels', '/trip-planner'],
    ['/transfer-partners', '/trip-planner'],
    ['/card-switch', '/cards'],
    ['/card/axis-atlas', '/cards'],
    ['/concierge', '/cira'],
    ['/pro', '/profile'],
  ])('maps %s to its primary workspace %s', (pathname, primaryHref) => {
    expect(appActive(primaryHref, pathname)).toBe(true)
  })

  it('links the Travel assistant tab to the full Concierge workspace', () => {
    expect(sectionTabsFor('/trip-planner')).toEqual(expect.arrayContaining([
      expect.objectContaining({ label: 'Ask CIRA', href: '/cira' }),
    ]))
  })
})

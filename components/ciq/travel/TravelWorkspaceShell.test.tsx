import { describe, it, expect, vi } from 'vitest'
import { render, within } from '@testing-library/react'

const nav = vi.hoisted(() => ({ path: '/trip-planner' }))

vi.mock('next/navigation', () => ({
  usePathname: () => nav.path,
}))

vi.mock('next/link', () => ({
  default: ({ href, children, prefetch: _prefetch, ...rest }: {
    href: string
    children: React.ReactNode
    prefetch?: boolean
  }) => (
    <a href={href} {...rest}>{children}</a>
  ),
}))

import { TravelWorkspaceShell } from './TravelWorkspaceShell'

describe('TravelWorkspaceShell', () => {
  it('makes Flights and Hotels the two primary Travel modes', () => {
    nav.path = '/trip-planner'
    const { container } = render(<TravelWorkspaceShell><div>flight content</div></TravelWorkspaceShell>)
    const modes = within(container).getByRole('navigation', { name: 'Travel modes' })
    const links = within(modes).getAllByRole('link')

    expect(links.map(link => link.textContent?.trim())).toEqual(['Flights', 'Hotels'])
    expect(within(modes).getByRole('link', { name: /Flights/ })).toHaveAttribute('href', '/trip-planner')
    expect(within(modes).getByRole('link', { name: /Flights/ })).toHaveAttribute('aria-current', 'page')
    expect(within(modes).getByRole('link', { name: /Hotels/ })).toHaveAttribute('href', '/stay-on-points')
    expect(within(modes).getByRole('link', { name: /Hotels/ })).not.toHaveAttribute('aria-current')
  })

  it('marks Hotels active on the existing stay-on-points route', () => {
    nav.path = '/stay-on-points'
    const { container } = render(<TravelWorkspaceShell><div>hotel content</div></TravelWorkspaceShell>)
    const modes = within(container).getByRole('navigation', { name: 'Travel modes' })

    expect(within(modes).getByRole('link', { name: /Hotels/ })).toHaveAttribute('aria-current', 'page')
    expect(within(modes).getByRole('link', { name: /Flights/ })).not.toHaveAttribute('aria-current')
  })

  it('keeps existing Travel intelligence tools reachable as secondary actions', () => {
    nav.path = '/trip-planner'
    const { container } = render(<TravelWorkspaceShell><div>content</div></TravelWorkspaceShell>)
    const tools = within(container).getByRole('navigation', { name: 'Travel tools' })

    expect(within(tools).getByRole('link', { name: 'Ask AI' })).toHaveAttribute('href', '/travel')
    expect(within(tools).getByRole('link', { name: 'Sweet Spots' })).toHaveAttribute('href', '/sweet-spots')
    expect(within(tools).getByRole('link', { name: 'Transfer Partners' })).toHaveAttribute('href', '/transfer-partners')
    expect(within(tools).getByRole('link', { name: 'Lounges' })).toHaveAttribute('href', '/lounge-tracker')
  })
})

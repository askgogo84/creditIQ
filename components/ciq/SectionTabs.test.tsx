import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'

// next/navigation: usePathname drives which group + active section render; useRouter's
// push is what the chevrons/swipe call to navigate. Hoisted so the mock factory can
// read the current pathname, mutated per test.
const nav = vi.hoisted(() => ({ path: '/trip-planner', push: vi.fn() }))
vi.mock('next/navigation', () => ({
  usePathname: () => nav.path,
  useRouter: () => ({ push: nav.push }),
}))

// next/link needs the app-router context to render; a plain anchor is enough here and
// keeps the sheet rows queryable as links with their hrefs. Real next/link consumes
// `prefetch` and never emits it to the DOM, so pull it out and reflect it as
// data-prefetch: this both silences the "non-boolean attribute prefetch" React warning
// and lets the suite prove prefetch is actually wired (see the prefetch test below).
vi.mock('next/link', () => ({
  default: ({ href, children, prefetch, ...rest }: { href: string; children: React.ReactNode; prefetch?: boolean }) => (
    <a href={typeof href === 'string' ? href : ''} data-prefetch={prefetch ? 'true' : undefined} {...rest}>{children}</a>
  ),
}))

import { SectionTabs } from './SectionTabs'

// jsdom implements neither matchMedia nor ResizeObserver, both of which the desktop
// scroll logic touches. matches:false keeps isDesktop() false so that logic no-ops and
// the mobile carousel is what we assert against.
beforeAll(() => {
  window.matchMedia = ((query: string) => ({
    matches: false, media: query, onchange: null,
    addEventListener: () => {}, removeEventListener: () => {},
    addListener: () => {}, removeListener: () => {}, dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia
  ;(globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver = class {
    observe() {} unobserve() {} disconnect() {}
  }
})

beforeEach(() => {
  nav.push.mockClear()
  nav.path = '/trip-planner'
})

// The mobile carousel lives inside .ciq-st-mobile; scope queries there so the desktop
// pill row (also rendered, just display:none in the real app) never collides.
function mobile(container: HTMLElement) {
  return within(container.querySelector('.ciq-st-mobile') as HTMLElement)
}

describe('SectionTabs — mobile carousel', () => {
  it('renders nothing on a route that belongs to no destination', () => {
    nav.path = '/nowhere-in-particular'
    const { container } = render(<SectionTabs />)
    expect(container.querySelector('.ciq-sectiontabs-wrap')).not.toBeInTheDocument()
  })

  it('shows the active section title, tappable to open the sheet', () => {
    const { container } = render(<SectionTabs />)
    const title = mobile(container).getByRole('button', { name: /Open all sections/ })
    expect(title).toHaveTextContent('Trip Planner')
    expect(title).toHaveAttribute('aria-haspopup', 'dialog')
    expect(title).toHaveAttribute('aria-expanded', 'false')
  })

  it('gives chevrons accessible labels and 44px targets', () => {
    const { container } = render(<SectionTabs />)
    const prev = mobile(container).getByRole('button', { name: 'Previous section' })
    const next = mobile(container).getByRole('button', { name: 'Next section' })
    expect(prev).toBeInTheDocument()
    expect(next).toBeInTheDocument()
    // 44px is set via the .ciq-st-chev class (width/height:44px); assert the class is on.
    expect(prev).toHaveClass('ciq-st-chev')
    expect(next).toHaveClass('ciq-st-chev')
  })

  it('disables (does not hide) the previous chevron at the first section', () => {
    const { container } = render(<SectionTabs />) // /trip-planner = index 0 of Travel
    const prev = mobile(container).getByRole('button', { name: 'Previous section' })
    const next = mobile(container).getByRole('button', { name: 'Next section' })
    expect(prev).toBeDisabled()
    expect(next).toBeEnabled()
  })

  it('disables (does not hide) the next chevron at the last section', () => {
    nav.path = '/lounge-tracker' // Lounges = last of Travel
    const { container } = render(<SectionTabs />)
    const prev = mobile(container).getByRole('button', { name: 'Previous section' })
    const next = mobile(container).getByRole('button', { name: 'Next section' })
    expect(prev).toBeEnabled()
    expect(next).toBeDisabled()
  })

  it('next chevron navigates one section forward', () => {
    const { container } = render(<SectionTabs />) // Trip Planner
    fireEvent.click(mobile(container).getByRole('button', { name: 'Next section' }))
    expect(nav.push).toHaveBeenCalledWith('/travel') // Ask AI
  })

  it('previous chevron navigates one section back', () => {
    nav.path = '/sweet-spots' // index 2 of Travel
    const { container } = render(<SectionTabs />)
    fireEvent.click(mobile(container).getByRole('button', { name: 'Previous section' }))
    expect(nav.push).toHaveBeenCalledWith('/travel') // Ask AI (index 1)
  })

  it('renders one dot per section with an accessible current state', () => {
    const { container } = render(<SectionTabs />) // Travel = 5 sections, index 0 active
    const dots = container.querySelectorAll('.ciq-st-mobile .ciq-st-dot')
    expect(dots).toHaveLength(5)
    const current = container.querySelectorAll('.ciq-st-mobile .ciq-st-dot[aria-current="true"]')
    expect(current).toHaveLength(1)
    const group = container.querySelector('.ciq-st-dots')
    expect(group).toHaveAttribute('role', 'group')
    expect(group?.getAttribute('aria-label')).toMatch(/Section 1 of 5/)
  })

  it('swipe left navigates forward, swipe right navigates back', () => {
    nav.path = '/sweet-spots' // index 2, both directions available
    const { container } = render(<SectionTabs />)
    const carousel = container.querySelector('.ciq-st-carousel') as HTMLElement

    fireEvent.touchStart(carousel, { touches: [{ clientX: 200, clientY: 100 }] })
    fireEvent.touchEnd(carousel, { changedTouches: [{ clientX: 100, clientY: 105 }] })
    expect(nav.push).toHaveBeenLastCalledWith('/transfer-partners') // next (index 3)

    fireEvent.touchStart(carousel, { touches: [{ clientX: 100, clientY: 100 }] })
    fireEvent.touchEnd(carousel, { changedTouches: [{ clientX: 220, clientY: 108 }] })
    expect(nav.push).toHaveBeenLastCalledWith('/travel') // previous (index 1)
  })

  it('ignores a mostly-vertical drag (page scroll, not a section swipe)', () => {
    nav.path = '/sweet-spots'
    const { container } = render(<SectionTabs />)
    const carousel = container.querySelector('.ciq-st-carousel') as HTMLElement
    fireEvent.touchStart(carousel, { touches: [{ clientX: 200, clientY: 100 }] })
    fireEvent.touchEnd(carousel, { changedTouches: [{ clientX: 190, clientY: 260 }] })
    expect(nav.push).not.toHaveBeenCalled()
  })

  it('does not swipe past the last section', () => {
    nav.path = '/lounge-tracker' // last
    const { container } = render(<SectionTabs />)
    const carousel = container.querySelector('.ciq-st-carousel') as HTMLElement
    fireEvent.touchStart(carousel, { touches: [{ clientX: 200, clientY: 100 }] })
    fireEvent.touchEnd(carousel, { changedTouches: [{ clientX: 90, clientY: 102 }] })
    expect(nav.push).not.toHaveBeenCalled()
  })
})

describe('SectionTabs — all-sections sheet', () => {
  it('the title opens a modal dialog listing every section', () => {
    const { container } = render(<SectionTabs />)
    fireEvent.click(mobile(container).getByRole('button', { name: /Open all sections/ }))
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    const rows = within(dialog).getAllByRole('link')
    expect(rows.map(r => r.textContent)).toEqual([
      'Trip Planner', 'Ask AI', 'Sweet Spots', 'Transfer Partners', 'Lounges',
    ])
  })

  it('marks the current section in the sheet with aria-current', () => {
    nav.path = '/sweet-spots'
    const { container } = render(<SectionTabs />)
    fireEvent.click(mobile(container).getByRole('button', { name: /Open all sections/ }))
    const current = within(screen.getByRole('dialog')).getByRole('link', { current: 'page' })
    expect(current).toHaveTextContent('Sweet Spots')
  })

  it('a sheet row links straight to its section (direct access)', () => {
    const { container } = render(<SectionTabs />)
    fireEvent.click(mobile(container).getByRole('button', { name: /Open all sections/ }))
    const lounges = within(screen.getByRole('dialog')).getByRole('link', { name: /Lounges/ })
    expect(lounges).toHaveAttribute('href', '/lounge-tracker')
  })

  it('prefetches every section link so the panel is warm before the tap', () => {
    const { container } = render(<SectionTabs />)
    fireEvent.click(mobile(container).getByRole('button', { name: /Open all sections/ }))
    const rows = within(screen.getByRole('dialog')).getAllByRole('link')
    expect(rows.length).toBeGreaterThan(0)
    rows.forEach(r => expect(r).toHaveAttribute('data-prefetch', 'true'))
  })

  it('Escape closes the sheet', () => {
    const { container } = render(<SectionTabs />)
    fireEvent.click(mobile(container).getByRole('button', { name: /Open all sections/ }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('the Close button closes the sheet', () => {
    const { container } = render(<SectionTabs />)
    fireEvent.click(mobile(container).getByRole('button', { name: /Open all sections/ }))
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Close' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})

describe('SectionTabs — scroll reset on section change', () => {
  it('scrolls to the top of the content after a chevron navigation', () => {
    const spy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
    nav.path = '/trip-planner'
    const { container, rerender } = render(<SectionTabs />)
    fireEvent.click(mobile(container).getByRole('button', { name: 'Next section' }))
    // simulate the route actually changing (what router.push would cause)
    nav.path = '/travel'
    rerender(<SectionTabs />)
    expect(spy).toHaveBeenCalledWith(0, 0)
    spy.mockRestore()
  })

  it('does NOT reset scroll for a #hash target (its anchor jump must survive)', () => {
    const spy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
    nav.path = '/profile' // You group — WhatsApp is /profile#whatsapp
    const { container, rerender } = render(<SectionTabs />)
    fireEvent.click(mobile(container).getByRole('button', { name: /Open all sections/ }))
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('link', { name: /WhatsApp/ }))
    rerender(<SectionTabs />)
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })
})

describe('SectionTabs — constant header structure across groups', () => {
  // The header height no longer depends on section count: every group renders the same
  // single carousel row + one dots row, so nothing grows with more sections. We assert
  // the invariant structure (2 chevrons + 1 title, exactly one dots row) for a 2-section
  // group and a 5-section group.
  const cases: Array<[string, number]> = [
    ['/dashboard', 2],        // Wallet
    ['/spend-optimizer', 2],  // Spend
    ['/trip-planner', 5],     // Travel
    ['/cards', 4],            // Cards
    ['/profile', 3],          // You
  ]
  it.each(cases)('%s renders one carousel row + one dots row (dots=%i)', (path, count) => {
    nav.path = path
    const { container } = render(<SectionTabs />)
    const m = container.querySelector('.ciq-st-mobile') as HTMLElement
    expect(m.querySelectorAll('.ciq-st-carousel')).toHaveLength(1)
    expect(m.querySelectorAll('.ciq-st-dots')).toHaveLength(1)
    expect(within(m).getByRole('button', { name: 'Previous section' })).toBeInTheDocument()
    expect(within(m).getByRole('button', { name: 'Next section' })).toBeInTheDocument()
    expect(m.querySelectorAll('.ciq-st-dot')).toHaveLength(count)
  })
})

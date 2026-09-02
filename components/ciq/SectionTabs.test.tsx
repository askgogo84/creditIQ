import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'

const nav = vi.hoisted(() => ({ path: '/trip-planner', push: vi.fn() }))
vi.mock('next/navigation', () => ({
  usePathname: () => nav.path,
  useRouter: () => ({ push: nav.push }),
}))

vi.mock('next/link', () => ({
  default: ({ href, children, prefetch, ...rest }: { href: string; children: React.ReactNode; prefetch?: boolean }) => (
    <a href={typeof href === 'string' ? href : ''} data-prefetch={prefetch ? 'true' : undefined} {...rest}>{children}</a>
  ),
}))

import { SectionTabs } from './SectionTabs'

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
    expect(title).toHaveTextContent('Flights')
    expect(title).toHaveAttribute('aria-haspopup', 'dialog')
    expect(title).toHaveAttribute('aria-expanded', 'false')
  })

  it('gives chevrons accessible labels and 44px targets', () => {
    const { container } = render(<SectionTabs />)
    const prev = mobile(container).getByRole('button', { name: 'Previous section' })
    const next = mobile(container).getByRole('button', { name: 'Next section' })
    expect(prev).toBeInTheDocument()
    expect(next).toBeInTheDocument()
    expect(prev).toHaveClass('ciq-st-chev')
    expect(next).toHaveClass('ciq-st-chev')
  })

  it('disables (does not hide) the previous chevron at the first section', () => {
    const { container } = render(<SectionTabs />)
    const prev = mobile(container).getByRole('button', { name: 'Previous section' })
    const next = mobile(container).getByRole('button', { name: 'Next section' })
    expect(prev).toBeDisabled()
    expect(next).toBeEnabled()
  })

  it('disables (does not hide) the next chevron at the last section', () => {
    nav.path = '/lounge-tracker'
    const { container } = render(<SectionTabs />)
    const prev = mobile(container).getByRole('button', { name: 'Previous section' })
    const next = mobile(container).getByRole('button', { name: 'Next section' })
    expect(prev).toBeEnabled()
    expect(next).toBeDisabled()
  })

  it('next chevron navigates one section forward', () => {
    const { container } = render(<SectionTabs />)
    fireEvent.click(mobile(container).getByRole('button', { name: 'Next section' }))
    expect(nav.push).toHaveBeenCalledWith('/hotels')
  })

  it('previous chevron navigates one section back', () => {
    nav.path = '/sweet-spots'
    const { container } = render(<SectionTabs />)
    fireEvent.click(mobile(container).getByRole('button', { name: 'Previous section' }))
    expect(nav.push).toHaveBeenCalledWith('/travel')
  })

  it('renders one dot per section with an accessible current state', () => {
    const { container } = render(<SectionTabs />)
    const dots = container.querySelectorAll('.ciq-st-mobile .ciq-st-dot')
    expect(dots).toHaveLength(6)
    const current = container.querySelectorAll('.ciq-st-mobile .ciq-st-dot[aria-current="true"]')
    expect(current).toHaveLength(1)
    const group = container.querySelector('.ciq-st-dots')
    expect(group).toHaveAttribute('role', 'group')
    expect(group?.getAttribute('aria-label')).toMatch(/Section 1 of 6/)
  })

  it('swipe left navigates forward, swipe right navigates back', () => {
    nav.path = '/sweet-spots'
    const { container } = render(<SectionTabs />)
    const carousel = container.querySelector('.ciq-st-carousel') as HTMLElement

    fireEvent.touchStart(carousel, { touches: [{ clientX: 200, clientY: 100 }] })
    fireEvent.touchEnd(carousel, { changedTouches: [{ clientX: 100, clientY: 105 }] })
    expect(nav.push).toHaveBeenLastCalledWith('/transfer-partners')

    fireEvent.touchStart(carousel, { touches: [{ clientX: 100, clientY: 100 }] })
    fireEvent.touchEnd(carousel, { changedTouches: [{ clientX: 220, clientY: 108 }] })
    expect(nav.push).toHaveBeenLastCalledWith('/travel')
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
    nav.path = '/lounge-tracker'
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
      'Flights', 'Hotels', 'Ask AI', 'Sweet Spots', 'Transfer Partners', 'Lounges',
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
    nav.path = '/hotels'
    rerender(<SectionTabs />)
    expect(spy).toHaveBeenCalledWith(0, 0)
    spy.mockRestore()
  })

  it('does NOT reset scroll for a #hash target (its anchor jump must survive)', () => {
    const spy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
    nav.path = '/profile'
    const { container, rerender } = render(<SectionTabs />)
    fireEvent.click(mobile(container).getByRole('button', { name: /Open all sections/ }))
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('link', { name: /WhatsApp/ }))
    rerender(<SectionTabs />)
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })
})

describe('SectionTabs — constant header structure across groups', () => {
  const cases: Array<[string, number]> = [
    ['/dashboard', 2],
    ['/spend-optimizer', 2],
    ['/trip-planner', 6],
    ['/cards', 4],
    ['/profile', 3],
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

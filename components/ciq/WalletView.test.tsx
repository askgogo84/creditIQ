import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';

// WalletView renders PageHeader → SectionTabs, which calls useRouter() (throws outside
// the app-router context) and usePathname(). Stub both; a null pathname makes SectionTabs
// render nothing here, keeping this suite focused on the wallet itself.
vi.mock('next/navigation', () => ({
  usePathname: () => null,
  useRouter: () => ({ push: vi.fn() }),
}));

import { WalletView } from './WalletView';

// jsdom has no matchMedia; stub it so HeroGauge's count-up takes the
// reduced-motion path and lands on final values synchronously.
beforeAll(() => {
  window.matchMedia = ((query: string) => ({
    matches: true, media: query, onchange: null,
    addEventListener: () => {}, removeEventListener: () => {},
    addListener: () => {}, removeListener: () => {}, dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
});

const TOUR_SEEN_KEY = 'ciq_wallet_tour_v1';

beforeEach(() => { localStorage.clear(); });

type C = React.ComponentProps<typeof WalletView>['cards'];
const CARDS: C = [
  { id: '1', bank: 'HDFC', card_name: 'Infinia', card_last4: '1111', points_balance: 900, points_currency: 'Points', source: 'statement' },
  { id: '2', bank: 'Axis', card_name: 'Magnus', card_last4: '2222', points_balance: 300, points_currency: 'EDGE', source: 'statement' },
  { id: '3', bank: 'SBI', card_name: 'Cashback', card_last4: '3333', points_balance: 40, points_currency: 'Points', source: 'manual' },
];
// verified = 900 + 300 = 1200 · estimated = 40 · total = 1240

function renderWallet(opts: { cards?: C; totalPoints?: number; openTour?: boolean } = {}) {
  const cards = opts.cards ?? CARDS;
  const totalPoints = opts.totalPoints ?? cards.reduce((s, c) => s + (c.points_balance || 0), 0);
  // Suppress the first-run tour unless the test wants it, so it doesn't overlay.
  if (!opts.openTour) localStorage.setItem(TOUR_SEEN_KEY, '1');
  const onAddCard = vi.fn();
  const onRefresh = vi.fn();
  render(
    <WalletView displayName="Gogo" email="g@x.com" cards={cards} totalPoints={totalPoints}
      primaryBank="HDFC" onAddCard={onAddCard} onRefresh={onRefresh} />,
  );
  return { onAddCard, onRefresh };
}

describe('WalletView — holdings ledger', () => {
  it('shows the total and the verified/estimated split in points', () => {
    renderWallet();
    const gauge = within(document.getElementById('wallet-gauge')!);
    expect(gauge.getByText('1,240')).toBeInTheDocument();       // total (scoped to the gauge)
    expect(gauge.getByText('1,200')).toBeInTheDocument();       // verified (statement)
    expect(gauge.getByText('40')).toBeInTheDocument();          // estimated (manual)
  });

  it('lists every held card', () => {
    renderWallet();
    expect(screen.getByText('Infinia')).toBeInTheDocument();
    expect(screen.getByText('Magnus')).toBeInTheDocument();
    expect(screen.getByText('Cashback')).toBeInTheDocument();
  });

  it('shows every rupee value ONLY as a badged EstimateRange (never a bare ₹)', () => {
    renderWallet();
    const ranges = screen.getAllByText(/≈ ₹[\d,]+–₹[\d,]+/);
    const badges = screen.getAllByText('estimate');
    expect(ranges.length).toBeGreaterThan(0);
    // one "estimate" badge per rupee range — no rupee escapes the sanctioned format
    expect(badges.length).toBe(ranges.length);
  });

  it('empty state (0 cards): both primary actions, no Best Move', () => {
    renderWallet({ cards: [], totalPoints: 0 });
    expect(screen.getByRole('button', { name: /Add a card/ })).toBeInTheDocument();
    expect(screen.getByText(/Upload a statement/)).toBeInTheDocument();
    expect(screen.queryByText('Your best move')).not.toBeInTheDocument();
  });

  it('all-estimated wallet nudges to verify', () => {
    renderWallet({ cards: [CARDS[2]], totalPoints: 40 }); // manual only
    expect(screen.getByText(/All estimated/)).toBeInTheDocument();
    expect(screen.getByText('Get your verified points')).toBeInTheDocument();
  });

  it('first-run tour is 2 steps and its final button opens Add Card', () => {
    const { onAddCard } = renderWallet({ openTour: true });
    expect(screen.getByText('WALLET · STEP 1 OF 2')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(screen.getByText('WALLET · STEP 2 OF 2')).toBeInTheDocument();
    const dialog = screen.getByRole('dialog');
    const finalBtn = within(dialog).getByRole('button', { name: 'Add a card' });
    fireEvent.click(finalBtn);
    expect(onAddCard).toHaveBeenCalledTimes(1);
  });

  it('skipping the tour does NOT open Add Card', () => {
    const { onAddCard } = renderWallet({ openTour: true });
    fireEvent.click(screen.getByRole('button', { name: 'Skip' }));
    expect(onAddCard).not.toHaveBeenCalled();
  });
});

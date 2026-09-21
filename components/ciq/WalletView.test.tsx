import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('next/navigation', () => ({
  usePathname: () => '/wallet',
  useRouter: () => ({ push: vi.fn() }),
}));

import { WalletView } from './WalletView';

type C = React.ComponentProps<typeof WalletView>['cards'];
const CARDS: C = [
  { id: '1', bank: 'HDFC', card_name: 'Infinia', card_last4: '1111', points_balance: 900, points_currency: 'Points', source: 'statement' },
  { id: '2', bank: 'Axis', card_name: 'Magnus', card_last4: '2222', points_balance: 300, points_currency: 'EDGE', source: 'statement' },
  { id: '3', bank: 'SBI', card_name: 'Cashback', card_last4: '3333', points_balance: 40, points_currency: 'Points', source: 'manual' },
];

function renderWallet(opts: { cards?: C; totalPoints?: number } = {}) {
  const cards = opts.cards ?? CARDS;
  const totalPoints = opts.totalPoints ?? cards.reduce((s, c) => s + (c.points_balance || 0), 0);
  const onAddCard = vi.fn();
  const onRefresh = vi.fn();
  const onEditPoints = vi.fn(async () => true);
  const onDeleteCard = vi.fn();
  render(
    <WalletView displayName="Gogo" email="g@x.com" cards={cards} totalPoints={totalPoints}
      primaryBank="HDFC" onAddCard={onAddCard} onRefresh={onRefresh}
      onEditPoints={onEditPoints} onDeleteCard={onDeleteCard} />,
  );
  return { onAddCard, onRefresh, onEditPoints, onDeleteCard };
}

describe('WalletView — newer Claude Cards experience', () => {
  it('shows Cards, portfolio value and total reward points', () => {
    renderWallet();
    expect(screen.getByRole('heading', { name: 'Cards' })).toBeInTheDocument();
    expect(screen.getByText('Portfolio value')).toBeInTheDocument();
    expect(screen.getByText(/1,240/)).toBeInTheDocument();
  });

  it('shows the selected held card with catalogue artwork', () => {
    renderWallet();
    expect(screen.getByAltText('HDFC Infinia Metal Edition')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /HDFC900/ })).toHaveClass('active');
  });

  it('lets the user switch between held cards', () => {
    renderWallet();
    fireEvent.click(screen.getByRole('button', { name: /Axis300/ }));
    expect(screen.getByAltText(/Axis Magnus/i)).toBeInTheDocument();
  });

  it('exposes the three primary card actions', () => {
    renderWallet();
    expect(screen.getByRole('link', { name: /Offers294 offers/i })).toHaveAttribute('href', '/intelligence');
    expect(screen.getByRole('link', { name: /Earn moreOptimize spend/i })).toHaveAttribute('href', '/spend-optimizer');
    expect(screen.getByRole('link', { name: /StatementVerify rewards/i })).toHaveAttribute('href', '/statement-truth');
  });

  it('shows card health and balance provenance', () => {
    renderWallet();
    expect(screen.getByText(/Card health:/)).toBeInTheDocument();
    expect(screen.getByText('Points balance')).toBeInTheDocument();
    expect(screen.getByText('Source')).toBeInTheDocument();
    expect(screen.getByText('Verified')).toBeInTheDocument();
  });

  it('empty state opens Add Card', () => {
    const { onAddCard } = renderWallet({ cards: [], totalPoints: 0 });
    fireEvent.click(screen.getByRole('button', { name: /Add your first card/i }));
    expect(onAddCard).toHaveBeenCalledTimes(1);
  });

  it('header add button opens Add Card', () => {
    const { onAddCard } = renderWallet();
    fireEvent.click(screen.getByRole('button', { name: 'Add card' }));
    expect(onAddCard).toHaveBeenCalledTimes(1);
  });

  it('refresh remains available on the selected card', () => {
    const { onRefresh } = renderWallet();
    fireEvent.click(screen.getByRole('button', { name: 'Refresh cards' }));
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });
});

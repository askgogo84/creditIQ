import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EditorialCards } from './EditorialCards';
import { SEED_CARDS } from '@/lib/data/seed-cards';

describe('EditorialCards — honest curation, not "trending"', () => {
  it('labels itself Editorial and never "Trending"', () => {
    render(<EditorialCards />);
    expect(screen.getByText('Cards to know')).toBeInTheDocument();
    expect(screen.getByText('Editorial')).toBeInTheDocument();
    expect(screen.queryByText(/trending/i)).not.toBeInTheDocument();
  });

  it('states plainly that it is not ranked by spending', () => {
    render(<EditorialCards />);
    expect(screen.getByText(/not ranked by anyone/i)).toBeInTheDocument();
  });

  it('renders real SEED_CARDS names and their best_for one-liners', () => {
    render(<EditorialCards />);
    const infinia = SEED_CARDS.find((c) => c.id === 'hdfc-infinia')!;
    expect(infinia).toBeTruthy();
    expect(screen.getByText(infinia.name)).toBeInTheDocument();
    // best_for is the real one-liner source (no dedicated description field exists).
    // Normalise whitespace both sides — some best_for strings contain double spaces.
    const norm = (s: string) => s.replace(/\s+/g, ' ').trim();
    expect(norm(document.body.textContent || '')).toContain(norm(infinia.best_for));
  });

  it('each pick links to its card detail page', () => {
    render(<EditorialCards />);
    const links = screen.getAllByRole('link');
    expect(links.length).toBeGreaterThan(0);
    for (const a of links) {
      expect(a.getAttribute('href')).toMatch(/^\/card\//);
    }
  });

  it('every curated id resolves to a real card (no dead tiles)', () => {
    // If a curated id were wrong, that tile would silently vanish — assert the
    // strip renders as many links as it has valid picks, and that count is > 0.
    render(<EditorialCards />);
    const links = screen.getAllByRole('link');
    expect(links.length).toBe(6); // all six curated ids are valid SEED_CARDS
  });
});

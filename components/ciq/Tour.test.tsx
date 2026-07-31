import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Tour, type TourStep } from './Tour';

const STEPS: TourStep[] = [
  { title: 'First stop', body: 'Body of the first step.' },
  { title: 'Second stop', body: 'Body of the second step.' },
  { title: 'Third stop', body: 'Body of the third step.' },
];

function renderTour(overrides: Partial<React.ComponentProps<typeof Tour>> = {}) {
  const onClose = vi.fn();
  const utils = render(<Tour steps={STEPS} open onClose={onClose} {...overrides} />);
  return { onClose, ...utils };
}

describe('Tour — reusable guided-tour overlay', () => {
  it('does not render when closed', () => {
    render(<Tour steps={STEPS} open={false} onClose={() => {}} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders the anchored card: eyebrow, title, body, Skip, Continue, and one dot per step', () => {
    const { container } = renderTour();
    expect(screen.getByText('TOUR · STEP 1 OF 3')).toBeInTheDocument();
    expect(screen.getByText('First stop')).toBeInTheDocument();
    expect(screen.getByText('Body of the first step.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Skip' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continue' })).toBeInTheDocument();
    expect(container.querySelectorAll('.ciq-tour-dot')).toHaveLength(3);
  });

  it('honours a custom labelPrefix', () => {
    renderTour({ labelPrefix: 'WALKTHROUGH' });
    expect(screen.getByText('WALKTHROUGH · STEP 1 OF 3')).toBeInTheDocument();
  });

  it('Continue advances to the next step', () => {
    renderTour();
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(screen.getByText('TOUR · STEP 2 OF 3')).toBeInTheDocument();
    expect(screen.getByText('Second stop')).toBeInTheDocument();
  });

  it('shows "Done" on the last step and calls onClose("done")', () => {
    const { onClose } = renderTour();
    fireEvent.click(screen.getByRole('button', { name: 'Continue' })); // -> 2
    fireEvent.click(screen.getByRole('button', { name: 'Continue' })); // -> 3 (last)
    const done = screen.getByRole('button', { name: 'Done' });
    expect(done).toBeInTheDocument();
    fireEvent.click(done);
    expect(onClose).toHaveBeenCalledWith('done');
  });

  it('Skip calls onClose("skip")', () => {
    const { onClose } = renderTour();
    fireEvent.click(screen.getByRole('button', { name: 'Skip' }));
    expect(onClose).toHaveBeenCalledWith('skip');
  });

  it('Escape closes with "skip"', () => {
    const { onClose } = renderTour();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledWith('skip');
  });

  it('ArrowRight advances, ArrowLeft goes back', () => {
    renderTour();
    fireEvent.keyDown(document, { key: 'ArrowRight' });
    expect(screen.getByText('TOUR · STEP 2 OF 3')).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'ArrowLeft' });
    expect(screen.getByText('TOUR · STEP 1 OF 3')).toBeInTheDocument();
  });

  it('is an accessible modal dialog (role, aria-modal, labelled + described)', () => {
    renderTour();
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    const labelId = dialog.getAttribute('aria-labelledby');
    const descId = dialog.getAttribute('aria-describedby');
    expect(labelId).toBeTruthy();
    expect(descId).toBeTruthy();
    expect(document.getElementById(labelId!)).toHaveTextContent('First stop');
    expect(document.getElementById(descId!)).toHaveTextContent('Body of the first step.');
  });

  it('moves focus into the dialog on open', () => {
    renderTour();
    const dialog = screen.getByRole('dialog');
    // focus is on the dialog container or a focusable descendant of it
    expect(dialog === document.activeElement || dialog.contains(document.activeElement)).toBe(true);
  });

  it('traps focus: Tab from the last control wraps to the first', () => {
    renderTour();
    const skip = screen.getByRole('button', { name: 'Skip' });
    const cont = screen.getByRole('button', { name: 'Continue' });
    cont.focus();
    expect(document.activeElement).toBe(cont);
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(document.activeElement).toBe(skip);
    // and Shift+Tab from the first wraps back to the last
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(cont);
  });

  it('ships a self-contained prefers-reduced-motion opt-out', () => {
    const { container } = renderTour();
    const style = container.querySelector('style');
    expect(style?.textContent).toContain('prefers-reduced-motion');
  });

  it('uses only CIQ tokens — the card border and gold CTA reference --ciq-* vars', () => {
    renderTour();
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveStyle({ background: 'var(--ciq-panel)' });
    const cont = screen.getByRole('button', { name: 'Continue' });
    expect(cont.getAttribute('style') || '').toContain('var(--ciq-gold');
  });
});

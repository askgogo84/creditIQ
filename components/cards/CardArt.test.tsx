import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CardArt } from './CardArt';

describe('CardArt', () => {
  it('straightens the angled Axis Atlas issuer artwork', () => {
    render(
      <CardArt card={{ slug: 'axis-atlas', name: 'Axis Atlas' }}>
        <span>fallback</span>
      </CardArt>,
    );

    expect(screen.getByRole('img', { name: 'Axis Atlas' })).toHaveStyle({
      transform: 'rotate(-14deg) scale(0.9)',
      transformOrigin: 'center',
    });
  });

  it('does not rotate normally oriented issuer artwork', () => {
    render(
      <CardArt card={{ slug: 'hdfc-infinia', name: 'HDFC Infinia' }}>
        <span>fallback</span>
      </CardArt>,
    );

    expect(screen.getByRole('img', { name: 'HDFC Infinia' })).not.toHaveStyle({
      transform: 'rotate(-14deg) scale(0.9)',
    });
  });
});

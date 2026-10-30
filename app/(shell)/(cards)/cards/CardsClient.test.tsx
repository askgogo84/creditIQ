import { expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { CardsClient } from './CardsClient'
vi.mock('@/components/design/CardTile', () => ({ CardTile: ({ card, href }: any) => <a href={href}>{card.name}</a> }))
it('removes unmatched tiles when filtering duplicate catalogue routes and restores unique results', () => {
  render(<CardsClient initialCards={[
    { id: 'one', slug: 'synthetic-cash', name: 'Synthetic Cash', bank: 'Synthetic' },
    { id: 'two', slug: 'synthetic-cash', name: 'Synthetic Cash duplicate', bank: 'Synthetic' },
    { id: 'three', slug: 'synthetic-travel', name: 'Synthetic Travel', bank: 'Synthetic' },
  ]} />)
  expect(screen.getByText('Showing 2 of 2 cards')).toBeInTheDocument()
  const input = screen.getByRole('searchbox', { name: 'Search cards or banks' })
  fireEvent.change(input, { target: { value: 'Travel' } })
  expect(screen.queryByRole('link', { name: /Synthetic Cash/ })).not.toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Synthetic Travel' })).toBeInTheDocument()
  fireEvent.change(input, { target: { value: '' } })
  expect(screen.getAllByRole('link', { name: /Synthetic/ })).toHaveLength(2)
})

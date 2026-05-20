import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Credit Cards by Bank - All Indian Banks & Issuers',
  description: 'Browse credit cards by issuing bank. Compare HDFC, SBI, ICICI, Axis, Amex, IDFC, Kotak and 10 more banks. 93 cards tracked with real annual value and devaluation history.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

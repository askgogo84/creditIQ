import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'Credit Cards by Bank - All Indian Banks and Issuers',
  description: 'Browse 93 credit cards by issuing bank. Compare HDFC, SBI, ICICI, Axis, Amex, IDFC and 11 more. Real annual value, devaluation history, honest rankings.',
};
export default function Layout({ children }: { children: React.ReactNode }) { return <>{children}</>; }

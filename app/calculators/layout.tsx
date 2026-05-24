import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'Credit Card Calculators - EMI, Interest, Rewards & Forex India',
  description: 'Free credit card calculators for India. EMI calculator, interest cost calculator, annual reward value, forex markup savings. Know what you pay and earn.',
  keywords: ['credit card EMI calculator','credit card interest calculator india','forex markup calculator','reward calculator credit card india'],
};
export default function Layout({ children }: { children: React.ReactNode }) { return <>{children}</>; }

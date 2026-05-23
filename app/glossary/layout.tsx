import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'Credit Card Glossary India - Plain English Definitions',
  description: 'Every credit card term explained simply. APR, reward rate, forex markup, devaluation, milestone bonus, lounge access - 30+ terms for Indian credit cards.',
  keywords: ['credit card terms india','what is APR credit card','credit card glossary','reward rate meaning credit card'],
};
export default function Layout({ children }: { children: React.ReactNode }) { return <>{children}</>; }

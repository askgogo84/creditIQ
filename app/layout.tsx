import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { Analytics } from '@vercel/analytics/react';
import './globals.css';

export const metadata: Metadata = {
  title: 'CardIQ — Honest credit card intelligence for India',
  description:
    'The first affiliate-bias-free credit card comparison platform in India. Real annual value, devaluation tracking, points redemption optimization, and AI-powered recommendations.',
  keywords: 'credit card india, best credit card, hdfc infinia, axis magnus, sbi cashback, credit card comparison, points redemption',
  openGraph: {
    title: 'CardIQ — Honest credit card intelligence for India',
    description: 'Real annual value · Devaluation tracking · Points optimization · AI advisor',
    type: 'website',
    url: 'https://credit-iq-beryl.vercel.app',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CardIQ — Honest credit card intelligence for India',
  },
  metadataBase: new URL('https://credit-iq-beryl.vercel.app'),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable} dark`}>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}

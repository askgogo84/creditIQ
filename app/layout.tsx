import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { Analytics } from '@vercel/analytics/react';
import './globals.css';

export const metadata: Metadata = {
  title: 'CardIQ — Honest credit card intelligence for India',
  description: 'Affiliate-bias-free credit card comparison platform.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable} dark`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <meta name="theme-color" content="#0a0a0b" />
      </head>
      <body style={{ overflowX: 'hidden', maxWidth: '100vw' }}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}

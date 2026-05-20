import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { Analytics } from '@vercel/analytics/react';
import { ThemeProvider } from '@/components/ThemeProvider';
import './globals.css';

const BASE = 'https://creditiq.app';

export const metadata: Metadata = {
  metadataBase: new URL(BASE),
  title: {
    default: 'CreditIQ - Honest Credit Card Intelligence for India',
    template: '%s | CreditIQ',
  },
  description: 'India\'s first affiliate-bias-free credit card comparison platform. Real annual value, live devaluation tracking, AI points optimizer. Compare 93+ cards across 17 banks.',
  keywords: [
    'best credit card india 2026',
    'credit card comparison india',
    'hdfc infinia review',
    'axis magnus review',
    'credit card points optimizer',
    'credit card devaluation tracker',
    'best cashback credit card india',
    'best travel credit card india',
    'zero annual fee credit card india',
    'credit card reward calculator',
    'CIBIL score check free',
    'credit card annual value calculator',
  ],
  authors: [{ name: 'CreditIQ', url: BASE }],
  creator: 'CreditIQ',
  publisher: 'CreditIQ',
  category: 'Finance',
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: BASE,
    siteName: 'CreditIQ',
    title: 'CreditIQ - Honest Credit Card Intelligence for India',
    description: 'Compare 93+ credit cards. Real annual value. Live devaluation tracking. AI points optimizer. Zero affiliate bias.',
    images: [
      {
        url: `${BASE}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'CreditIQ - Honest Credit Card Intelligence for India',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CreditIQ - Honest Credit Card Intelligence for India',
    description: 'Compare 93+ credit cards. Real annual value. Live devaluation tracking. Zero affiliate bias.',
    images: [`${BASE}/og-image.png`],
    creator: '@cardiq_in',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: BASE,
  },
  verification: {
    google: 'google16ade07dfbdbb5a4',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable} dark`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0" />
        <meta name="theme-color" content="#0a0a0b" media="(prefers-color-scheme: dark)" />
        <meta name="theme-color" content="#f8f7f4" media="(prefers-color-scheme: light)" />
        <link rel="canonical" href={BASE} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'CreditIQ',
              url: BASE,
              description: 'India\'s first affiliate-bias-free credit card comparison platform',
              potentialAction: {
                '@type': 'SearchAction',
                target: { '@type': 'EntryPoint', urlTemplate: `${BASE}/?q={search_term_string}` },
                'query-input': 'required name=search_term_string',
              },
            }),
          }}
        />
      </head>
      <body style={{ overflowX: 'hidden', maxWidth: '100vw' }}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}

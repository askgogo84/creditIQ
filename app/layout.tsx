import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { clashDisplay, satoshi, jetbrainsMono } from "./fonts";
import "./globals.css";
import "@/components/ciq/product-workspace.css";
import "@/components/ciq/approved-live-fixes.css";
import { CreditIQAssistant } from "@/components/CreditIQAssistant";
import { AppDownloadBanner } from '@/components/AppDownloadBanner';
import { logMissingEnv } from "@/lib/env-check";

logMissingEnv();

export const metadata: Metadata = {
  title: "CreditIQ - India's Honest Credit Card Intelligence",
  description: "Honest credit card comparison for India — every number computed, every estimate labelled.",
  icons: {
    icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
  openGraph: {
    title: "CreditIQ - India's Honest Credit Card Intelligence",
    description: "Honest credit card comparison for India — every number computed, every estimate labelled.",
    url: 'https://creditiq.app',
    siteName: 'CreditIQ',
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: "CreditIQ - India's Honest Credit Card Intelligence",
    description: "Find the best Indian credit card. AI-powered, zero affiliate bias.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${GeistSans.variable} ${GeistMono.variable} ${clashDisplay.variable} ${satoshi.variable} ${jetbrainsMono.variable}`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem('creditiq-theme');var t=(s==='dark'||s==='light')?s:'light';var el=document.documentElement;el.setAttribute('data-theme',t);el.classList.toggle('dark',t==='dark');el.classList.toggle('light',t==='light');}catch(e){var d=document.documentElement;d.setAttribute('data-theme','light');d.classList.add('light');}})();`
          }}
        />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="alternate icon" href="/favicon.svg" />
        <meta name="theme-color" content="#1B3A5C" />
      </head>
      <body style={{ fontFamily: "var(--font-geist-sans), system-ui, sans-serif" }}>
        {children}
        <CreditIQAssistant />
        <AppDownloadBanner />
      </body>
    </html>
  );
}

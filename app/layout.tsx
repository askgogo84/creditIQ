import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { clashDisplay, satoshi, jetbrainsMono } from "./fonts";
import "./globals.css";
import "@/components/ciq/product-workspace.css";
import { CreditIQAssistant } from "@/components/CreditIQAssistant";
import { AppDownloadBanner } from '@/components/AppDownloadBanner';
import { logMissingEnv } from "@/lib/env-check";

// Runs once per server cold start (module-level guard inside). Log-only.
logMissingEnv();

export const metadata: Metadata = {
  title: "CreditIQ - India's Honest Credit Card Intelligence",
  description: "Honest credit card comparison for India — every number computed, every estimate labelled.",
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
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
        {/* Resolve the theme BEFORE first paint: stored choice → light. LIGHT IS THE
            DECIDED DEFAULT — the OS prefers-color-scheme is deliberately NOT consulted,
            so a user with nothing saved gets light regardless of their device setting.
            Keep in lockstep with reassertTheme() in lib/store.ts. Setting data-theme
            here (not in a client effect) removes the Header's hydration mismatch and
            the theme flash. */}
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

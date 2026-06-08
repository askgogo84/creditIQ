import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { CreditIQAssistant } from "@/components/CreditIQAssistant";

export const metadata: Metadata = {
  title: "CreditIQ - India's Honest Credit Card Intelligence",
  description: "Find the best Indian credit card. AI-powered, zero affiliate bias. Compare 170+ cards honestly.",
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
  openGraph: {
    title: "CreditIQ - India's Honest Credit Card Intelligence",
    description: "Find the best Indian credit card. AI-powered, zero affiliate bias. Compare 170+ cards honestly.",
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
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function () { var script = document.createElement("script"); script.async = 1; script.src = 'https://emrldco.com/NTMzNDA5.js?t=533409'; document.head.appendChild(script); })();`
          }}
        />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="alternate icon" href="/favicon.svg" />
        <meta name="theme-color" content="#1B3A5C" />
      </head>
      <body style={{ fontFamily: "var(--font-geist-sans), system-ui, sans-serif" }}>
        {children}
        <CreditIQAssistant />
      </body>
    </html>
  );
}


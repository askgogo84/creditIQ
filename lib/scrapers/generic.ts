import type { BankAdapter, ScrapeResult } from './index';

/**
 * Generic Playwright-based scraper. Used as fallback for banks without
 * custom adapters. Loads page, waits for network idle, extracts main content.
 */
export function makeGenericAdapter(bank: string, list_url: string): BankAdapter {
  return {
    bank,
    list_url,
    async catalog() {
      // For now, use the list URL as the only target.
      // Custom adapters can override this to crawl individual card pages.
      return [list_url];
    },
    async scrapeCard(url: string): Promise<ScrapeResult> {
      // Playwright is loaded lazily — only available when run from Node (script or cron)
      let playwright: any;
      try {
        playwright = await import('playwright');
      } catch {
        return {
          bank,
          url,
          html: '',
          scraped_at: new Date().toISOString(),
          error: 'Playwright not available in this environment',
        };
      }

      const browser = await playwright.chromium.launch({ headless: true });
      try {
        const ctx = await browser.newContext({
          userAgent:
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        });
        const page = await ctx.newPage();
        await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
        // Extract main content — strip nav, footer, scripts
        const html = await page.evaluate(() => {
          // Remove scripts, styles, navs, footers
          const clone = document.body.cloneNode(true) as HTMLElement;
          clone.querySelectorAll('script, style, nav, footer, .header, .footer, iframe').forEach((el) => el.remove());
          return clone.innerText.slice(0, 25000);
        });
        return {
          bank,
          url,
          html,
          scraped_at: new Date().toISOString(),
        };
      } finally {
        await browser.close();
      }
    },
  };
}

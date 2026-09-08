import { test, expect } from '@playwright/test';
import fs from 'node:fs';

const storageState = process.env.PLAYWRIGHT_STORAGE_STATE;

test.describe('authenticated travel regression', () => {
  test.skip(!storageState || !fs.existsSync(storageState), 'PLAYWRIGHT_STORAGE_STATE is required for authenticated E2E');
  test.use({ storageState: storageState || undefined });

  for (const route of ['/travel', '/wallet', '/hotels', '/concierge']) {
    test(`${route} renders without horizontal document overflow`, async ({ page }) => {
      await page.goto(route);
      await expect(page).not.toHaveURL(/\/login(?:\?|$)/);
      const overflow = await page.evaluate(() => ({
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
      }));
      expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 1);
    });
  }

  test('travel workspace tabs remain reachable and non-overlapping', async ({ page }) => {
    await page.goto('/travel');
    await expect(page).not.toHaveURL(/\/login(?:\?|$)/);

    const candidates = page.getByRole('tab');
    const count = await candidates.count();
    expect(count).toBeGreaterThan(1);

    const boxes = [] as Array<{ x: number; y: number; width: number; height: number }>;
    for (let i = 0; i < count; i += 1) {
      const box = await candidates.nth(i).boundingBox();
      if (box) boxes.push(box);
    }

    for (let i = 0; i < boxes.length; i += 1) {
      for (let j = i + 1; j < boxes.length; j += 1) {
        const a = boxes[i];
        const b = boxes[j];
        const overlaps = a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
        expect(overlaps).toBe(false);
      }
    }
  });
});

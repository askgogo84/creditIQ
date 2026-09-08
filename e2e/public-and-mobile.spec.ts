import { test, expect } from '@playwright/test';

const protectedRoutes = ['/travel', '/wallet', '/hotels', '/concierge'];

for (const route of protectedRoutes) {
  test(`${route} protects unauthenticated access`, async ({ page }) => {
    await page.goto(route);
    await expect(page).toHaveURL(/\/login(?:\?|$)/);
  });
}

test('public home has a valid mobile viewport and no horizontal document overflow', async ({ page }) => {
  await page.goto('/');
  const viewportMeta = await page.locator('meta[name="viewport"]').getAttribute('content');
  expect(viewportMeta || '').toContain('width=device-width');

  const overflow = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 1);
});

test('login surface does not overflow on supported mobile widths', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByText(/CreditIQ/i).first()).toBeVisible();
  const overflow = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 1);
});

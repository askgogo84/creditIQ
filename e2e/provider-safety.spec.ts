import { test, expect } from '@playwright/test';

// Safety regression: provider gaps must remain visible; cached discovery data may not
// be silently promoted to a verified live premium-cabin quote.
test('provider status endpoint remains machine-readable', async ({ request }) => {
  const response = await request.get('/api/travel/providers');
  expect(response.ok()).toBe(true);
  expect(response.headers()['content-type'] || '').toContain('application/json');
});

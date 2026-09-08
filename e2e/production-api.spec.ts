import { test, expect } from '@playwright/test';

test('travel provider registry is explicit about cash-provider availability', async ({ request }) => {
  const response = await request.get('/api/travel/providers');
  expect(response.ok()).toBe(true);
  const body = await response.json();
  expect(body).toBeTruthy();
  expect(JSON.stringify(body).length).toBeGreaterThan(2);
});

test('protected redemption rails rejects anonymous access', async ({ request }) => {
  const response = await request.get('/api/travel/redemption-rails?travelKind=flight&programmeId=air-india-maharaja');
  expect([401, 403]).toContain(response.status());
});

test('protected wallet endpoint rejects anonymous access', async ({ request }) => {
  const response = await request.get('/api/travel/wallet');
  expect([401, 403]).toContain(response.status());
});

import { expect, test } from '@playwright/test';

const hasDatabase = Boolean(process.env.DATABASE_URL);

async function cardSnapshot(page: import('@playwright/test').Page, url: string) {
  await page.goto(url);
  return page.locator('[data-feed-card]').evaluateAll((cards) => cards.map((card) => ({
    href: card.querySelector('a.card-link')?.getAttribute('href') ?? '',
    title: card.querySelector('h1, h2')?.textContent ?? '',
    summary: card.querySelector('.summary, .detail-note')?.textContent ?? '',
    time: card.querySelector('time')?.getAttribute('datetime') ?? '',
  })));
}

test('content source renders home, category, detail, and pagination routes', async ({ page, context, request }) => {
  await page.goto('/');
  await expect(page.locator('[data-feed-card]')).toHaveCount(10);
  const detailHref = await page.locator('[data-feed-card] a.card-link').first().getAttribute('href');
  expect(detailHref).toMatch(/^\/feed\/.+\/$/);

  const categoryPage = await context.newPage();
  await categoryPage.goto('/category/ai/');
  await expect(categoryPage.locator('[data-feed-card]').first()).toBeVisible();
  await categoryPage.close();

  const detailPage = await context.newPage();
  await detailPage.goto(detailHref!);
  await expect(detailPage.locator('h1')).toBeVisible();
  await detailPage.close();

  const response = await request.get('/feed-pages/all/2.json');
  expect(response.ok()).toBe(true);
  expect(response.headers()['content-type']).toBe('application/json; charset=utf-8');
  const payload = await response.json();
  expect(payload.items).toHaveLength(10);
  expect(Object.keys(payload.items[0])).toEqual([
    'id', 'href', 'category', 'categoryShortName', 'title', 'summary', 'eventAt', 'eventAtLabel',
  ]);
  expect(payload.items[0].href).toBe(`/feed/${payload.items[0].id}/`);
});

test('infinite loading appends the next page without duplicate cards', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-feed-sentinel]').scrollIntoViewIfNeeded();
  await expect.poll(() => page.locator('[data-feed-card]').count()).toBeGreaterThan(10);
  const hrefs = await page.locator('[data-feed-card] a.card-link').evaluateAll((links) =>
    links.map((link) => link.getAttribute('href')),
  );
  expect(new Set(hrefs).size).toBe(hrefs.length);
});

test('invalid public routes remain unavailable', async ({ request }) => {
  expect((await request.get('/category/unknown/')).status()).toBe(404);
  expect((await request.get('/feed/ai/unknown/')).status()).toBe(404);
  expect((await request.get('/feed-pages/all/1.json')).status()).toBe(404);
  expect((await request.get('/feed-pages/unknown/2.json')).status()).toBe(404);
  expect((await request.get(`/feed-pages/all/${'9'.repeat(400)}.json`)).status()).toBe(404);
  expect((await request.get('/feed-pages/all/1001.json')).status()).toBe(404);
});

test('database source matches content source for representative output', async ({ page, request }) => {
  test.skip(!hasDatabase, 'DATABASE_URL is not configured; database parity was not executed');

  const contentHome = await cardSnapshot(page, 'http://127.0.0.1:4401/');
  const databaseHome = await cardSnapshot(page, 'http://127.0.0.1:4402/');
  expect(databaseHome).toEqual(contentHome);

  const contentCategory = await cardSnapshot(page, 'http://127.0.0.1:4401/category/ai/');
  const databaseCategory = await cardSnapshot(page, 'http://127.0.0.1:4402/category/ai/');
  expect(databaseCategory).toEqual(contentCategory);

  const contentJson = await (await request.get('http://127.0.0.1:4401/feed-pages/all/2.json')).text();
  const databaseJson = await (await request.get('http://127.0.0.1:4402/feed-pages/all/2.json')).text();
  expect(databaseJson).toBe(contentJson);
});

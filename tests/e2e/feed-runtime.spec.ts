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

test('pagination failure keeps cards and retries the same page manually', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    Object.defineProperty(window, 'IntersectionObserver', { configurable: true, value: undefined });
  });
  const pageRequests: string[] = [];
  let attempt = 0;
  let releaseRetryResponse: (() => void) | undefined;

  await page.route('**/feed-pages/all/2.json', async (route) => {
    attempt += 1;
    pageRequests.push(new URL(route.request().url()).pathname);

    if (attempt === 1) {
      await route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'synthetic failure' }),
      });
      return;
    }

    const response = await route.fetch();
    const payload = await response.json() as { items: unknown[]; hasMore: boolean };
    if (attempt === 2) {
      await new Promise<void>((resolve) => {
        releaseRetryResponse = resolve;
      });
    }
    await route.fulfill({
      status: response.status(),
      headers: { 'content-type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ ...payload, hasMore: false }),
    });
  });

  await page.goto('/');
  const cardsBefore = await page.locator('[data-feed-card] a.card-link').evaluateAll((links) =>
    links.map((link) => link.getAttribute('href')),
  );

  const loadMoreButton = page.locator('[data-feed-load-more]');
  await expect(loadMoreButton).toBeVisible();
  await loadMoreButton.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-feed-error]')).toBeVisible();
  await expect(page.locator('[data-feed-retry]')).toBeVisible();
  await expect(page.locator('[data-feed-end]')).toBeHidden();
  await expect(page.locator('[data-feed-card]')).toHaveCount(cardsBefore.length);
  expect(await page.locator('[data-feed-card] a.card-link').evaluateAll((links) =>
    links.map((link) => link.getAttribute('href')),
  )).toEqual(cardsBefore);

  await expect.poll(() => attempt).toBe(1);
  expect(pageRequests).toEqual(['/feed-pages/all/2.json']);

  const errorLayout = await page.evaluate(() => {
    const error = document.querySelector('[data-feed-error]');
    const rect = error?.getBoundingClientRect();
    return {
      documentFits: document.documentElement.scrollWidth <= document.documentElement.clientWidth,
      bodyFits: document.body.scrollWidth <= document.body.clientWidth,
      errorLeft: rect?.left ?? 0,
      errorRight: rect?.right ?? 0,
      viewportWidth: window.innerWidth,
    };
  });
  expect(errorLayout.documentFits).toBe(true);
  expect(errorLayout.bodyFits).toBe(true);
  expect(errorLayout.errorLeft).toBeGreaterThanOrEqual(0);
  expect(errorLayout.errorRight).toBeLessThanOrEqual(errorLayout.viewportWidth);

  const retryButton = page.locator('[data-feed-retry]');
  await retryButton.focus();
  await expect(retryButton).toBeFocused();
  await page.keyboard.press('Enter');
  await expect.poll(() => attempt).toBe(2);
  await expect.poll(() => Boolean(releaseRetryResponse)).toBe(true);
  await expect(page.locator('[data-feed-error]')).toBeHidden();
  await expect(page.locator('[data-feed-end]')).toBeHidden();
  await expect(page.locator('[data-feed-card]')).toHaveCount(cardsBefore.length);
  releaseRetryResponse?.();

  await expect(page.locator('[data-feed-card]')).toHaveCount(cardsBefore.length + 10);
  await expect(page.locator('[data-feed-error]')).toBeHidden();
  await expect(page.locator('[data-feed-retry]')).toBeHidden();
  await expect(page.locator('[data-feed-end]')).toBeVisible();
  await expect(page.locator('[data-feed-end]')).toHaveAttribute('tabindex', '-1');
  await expect(page.locator('[data-feed-card]').nth(cardsBefore.length).locator('a.card-link')).toBeFocused();
  expect(pageRequests).toEqual(['/feed-pages/all/2.json', '/feed-pages/all/2.json']);
});

test('pagination retry failure keeps cards and remains recoverable', async ({ page }) => {
  let attempts = 0;
  await page.route('**/feed-pages/all/2.json', async (route) => {
    attempts += 1;
    await route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'synthetic failure' }),
    });
  });

  await page.goto('/');
  const cardsBefore = await page.locator('[data-feed-card]').count();
  const sentinel = page.locator('[data-feed-sentinel]');
  if (await sentinel.isVisible()) await sentinel.scrollIntoViewIfNeeded();
  await expect(page.locator('[data-feed-error]')).toBeVisible();
  await expect.poll(() => attempts).toBe(1);

  const retryButton = page.locator('[data-feed-retry]');
  await retryButton.focus();
  await page.keyboard.press('Enter');
  await expect.poll(() => attempts).toBe(2);
  await expect(page.locator('[data-feed-error]')).toBeVisible();
  await expect(retryButton).toBeVisible();
  await expect(retryButton).toBeEnabled();
  await expect(retryButton).toBeFocused();
  await expect(page.locator('[data-feed-end]')).toBeHidden();
  await expect(page.locator('[data-feed-card]')).toHaveCount(cardsBefore);
  expect(attempts).toBe(2);
});

test('pagination deduplicates overlapping card hrefs', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'IntersectionObserver', { configurable: true, value: undefined });
  });
  let requests = 0;
  let routedHrefs: string[] = [];
  await page.route('**/feed-pages/all/2.json', async (route) => {
    requests += 1;
    const response = await route.fetch();
    const payload = await response.json() as { items: Array<{ href: string }>; hasMore: boolean };
    routedHrefs = payload.items.map((item) => item.href);
    await route.fulfill({
      status: response.status(),
      headers: { 'content-type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        ...payload,
        items: [payload.items[0], ...payload.items, payload.items[1]],
        hasMore: false,
      }),
    });
  });

  await page.goto('/');
  const initialHrefs = await page.locator('[data-feed-card] a.card-link').evaluateAll((links) =>
    links.map((link) => link.getAttribute('href')).filter((href): href is string => Boolean(href)),
  );
  await page.locator('[data-feed-load-more]').focus();
  await page.keyboard.press('Enter');
  await expect.poll(() => requests).toBe(1);
  const expectedHrefs = new Set([...initialHrefs, ...routedHrefs]);
  await expect(page.locator('[data-feed-card]')).toHaveCount(expectedHrefs.size);
  const hrefs = await page.locator('[data-feed-card] a.card-link').evaluateAll((links) =>
    links.map((link) => link.getAttribute('href')),
  );
  expect(new Set(hrefs).size).toBe(hrefs.length);
  await expect(page.locator('[data-feed-error]')).toBeHidden();
  await expect(page.locator('[data-feed-end]')).toBeVisible();
});

test('hasMore true keeps a short page open for another load', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'IntersectionObserver', { configurable: true, value: undefined });
  });
  let requests = 0;
  await page.route('**/feed-pages/all/2.json', async (route) => {
    requests += 1;
    const response = await route.fetch();
    const payload = await response.json() as { items: unknown[]; hasMore: boolean };
    await route.fulfill({
      status: response.status(),
      headers: { 'content-type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ ...payload, items: payload.items.slice(0, 1), hasMore: true }),
    });
  });

  await page.goto('/');
  const loadMoreButton = page.locator('[data-feed-load-more]');
  await expect(loadMoreButton).toBeVisible();
  await loadMoreButton.focus();
  await page.keyboard.press('Enter');
  await expect.poll(() => requests).toBe(1);
  await expect(page.locator('[data-feed-card]')).toHaveCount(11);
  await expect(loadMoreButton).toBeVisible();
  await expect(page.locator('[data-feed-end]')).toBeHidden();
  await expect(page.locator('[data-feed-error]')).toBeHidden();
});

test('malformed pagination payload fails closed to the retry state', async ({ page }) => {
  let attempts = 0;
  await page.route('**/feed-pages/all/2.json', async (route) => {
    attempts += 1;
    if (attempts === 1) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ items: [], hasMore: 'true' }),
      });
      return;
    }

    const response = await route.fetch();
    const payload = await response.json() as { items: unknown[]; hasMore: boolean };
    await route.fulfill({
      status: response.status(),
      headers: { 'content-type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ ...payload, hasMore: false }),
    });
  });

  await page.goto('/');
  const cardsBefore = await page.locator('[data-feed-card]').count();
  const sentinel = page.locator('[data-feed-sentinel]');
  if (await sentinel.isVisible()) await sentinel.scrollIntoViewIfNeeded();
  await expect.poll(() => attempts).toBe(1);
  await expect(page.locator('[data-feed-error]')).toBeVisible();
  await expect(page.locator('[data-feed-end]')).toBeHidden();
  await expect(page.locator('[data-feed-card]')).toHaveCount(cardsBefore);

  await page.locator('[data-feed-retry]').focus();
  await page.keyboard.press('Enter');
  await expect.poll(() => attempts).toBe(2);
  await expect(page.locator('[data-feed-end]')).toBeVisible();
  await expect(page.locator('[data-feed-error]')).toBeHidden();
});

test('without IntersectionObserver pagination is manually loadable and keyboard accessible', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'IntersectionObserver', { configurable: true, value: undefined });
  });
  const requests: string[] = [];
  await page.route('**/feed-pages/all/*.json', async (route) => {
    requests.push(new URL(route.request().url()).pathname);
    await route.continue();
  });

  await page.goto('/');
  const loadMoreButton = page.locator('[data-feed-load-more]');
  await expect(loadMoreButton).toBeVisible();
  expect(requests).toEqual([]);
  await loadMoreButton.focus();
  await expect(loadMoreButton).toBeFocused();
  await page.keyboard.press('Enter');
  await expect.poll(() => requests.length).toBe(1);
  await expect(page.locator('[data-feed-card]')).toHaveCount(20);
  await expect(loadMoreButton).toBeVisible();
  await loadMoreButton.focus();
  await page.keyboard.press('Enter');
  await expect.poll(() => requests.length).toBe(2);
  await expect(page.locator('[data-feed-card]')).toHaveCount(30);
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

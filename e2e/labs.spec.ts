import { expect, test, type Page } from '@playwright/test';

const errorsOf = (page: Page) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  return errors;
};

/** Client coordinates of a circuit grid point (the canvas viewBox is 800 × 512, 72 units per cell, 40 padding). */
async function gridPoint(page: Page, gx: number, gy: number) {
  const box = (await page.getByTestId('circuit-canvas').boundingBox())!;
  return { x: box.x + ((40 + gx * 72) / 800) * box.width, y: box.y + ((40 + gy * 72) / 512) * box.height };
}
async function clickEdge(page: Page, x1: number, y1: number, x2: number, y2: number) {
  const a = await gridPoint(page, x1, y1);
  const b = await gridPoint(page, x2, y2);
  await page.mouse.click((a.x + b.x) / 2, (a.y + b.y) / 2);
}
async function dragWire(page: Page, from: [number, number], to: [number, number]) {
  const a = await gridPoint(page, ...from);
  const b = await gridPoint(page, ...to);
  await page.mouse.move(a.x, a.y);
  await page.mouse.down();
  await page.mouse.move((a.x + b.x) / 2, (a.y + b.y) / 2, { steps: 4 });
  await page.mouse.move(b.x, b.y, { steps: 4 });
  await page.mouse.up();
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
});

test('dashboard loads with the four labs and an honest assistant status @responsive', async ({ page }) => {
  const errors = errorsOf(page);
  await page.goto('/');
  await expect(page.getByTestId('lab-card-electricity')).toBeVisible();
  await expect(page.getByTestId('lab-card-motion')).toBeVisible();
  await expect(page.getByTestId('lab-card-heat')).toBeVisible();
  await expect(page.getByTestId('lab-card-chemistry')).toBeVisible();
  await expect(page.getByTestId('dashboard-ai-status')).toContainText('no AI key is configured');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
});

test('build a circuit from scratch with the mouse, then short it', async ({ page }) => {
  const errors = errorsOf(page);
  await page.goto('/#/lab/electricity?preset=blank&mode=free');
  await expect(page.getByTestId('circuit-status')).toHaveAttribute('data-status', 'empty');

  // battery on the left edge, resistor on the right edge, wires top and bottom
  await page.locator('[data-tool=battery]').click();
  await clickEdge(page, 2, 2, 2, 3);
  await page.locator('[data-tool=resistor]').click();
  await clickEdge(page, 6, 2, 6, 3);
  await page.locator('[data-tool=wire]').click();
  await dragWire(page, [2, 2], [6, 2]);
  await dragWire(page, [2, 3], [6, 3]);

  await expect(page.getByTestId('circuit-status')).toHaveAttribute('data-status', 'ok');
  // default 6 V across the default 10 Ω resistor → 0.6 A
  await expect(page.locator('.readings')).toContainText('0.6');

  // a wire around the resistor (right, down, back left) bypasses it → short circuit
  await dragWire(page, [6, 2], [7, 3]);
  await dragWire(page, [7, 3], [6, 3]);
  await expect(page.getByTestId('circuit-status')).toHaveAttribute('data-status', 'short');
  await page.getByRole('button', { name: 'Undo' }).click();
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(page.getByTestId('circuit-status')).toHaveAttribute('data-status', 'ok');
  expect(errors).toEqual([]);
});

test('Ohm’s law activity: record, chart and report export', async ({ page }) => {
  await page.goto('/#/lab/electricity?activity=ohm-voltage&mode=guided');
  for (const v of ['1', '2', '3', '4']) {
    await page.locator('.part-list').getByRole('button', { name: /Battery/ }).click();
    await page.getByLabel('Voltage (V)').fill(v);
    await page.getByRole('button', { name: 'Record reading' }).click();
  }
  await expect(page.locator('.records table tbody tr')).toHaveCount(4);
  await expect(page.locator('.records')).toContainText('slope = 10 Ω');
  await page.getByRole('link', { name: 'Report' }).click();
  await expect(page.getByTestId('report-summary')).toContainText('slope 10 Ω');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download data (CSV)' }).click();
  expect((await download).suggestedFilename()).toMatch(/^electricity-data-.*\.csv$/);
});

test('motion lab plays, pauses and keeps graphs and readouts on the same time', async ({ page }) => {
  const errors = errorsOf(page);
  await page.goto('/#/lab/motion?activity=uniform&mode=guided');
  await page.getByTestId('play').click();
  await page.waitForTimeout(1200);
  await page.getByTestId('pause').click();
  const time = Number((await page.getByTestId('time').textContent())!.split('/')[0]);
  expect(time).toBeGreaterThan(0.5);
  // uniform 5 m/s from x = 0: the position readout equals 5·t
  const readouts = await page.getByTestId('motion-readouts').textContent();
  expect(readouts).toContain('5m/s');
  await page.getByTestId('rewind').click();
  await expect(page.getByTestId('time')).toHaveText('0.0 / 10.0 s');
  expect(errors).toEqual([]);
});

test('heat lab in Arabic: right-to-left layout and a melting plateau @responsive', async ({ page }) => {
  const errors = errorsOf(page);
  await page.goto('/#/lab/heat?activity=heating-curve&mode=guided');
  await page.getByTestId('lang-toggle').click();
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.locator('h1')).toHaveText('مختبر الحرارة والمادّة');
  for (let i = 0; i < 3; i++) await page.getByTestId('step').click(); // 30 s: ice at −20 °C has warmed and begun to melt
  await expect(page.getByTestId('plateau')).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
});

test('workshop scenario launches the lab with its objective and next step', async ({ page }) => {
  await page.goto('/#/workshop');
  await page.getByTestId('ws-e1').getByRole('link', { name: 'Launch' }).click();
  await expect(page.getByTestId('workshop-banner')).toContainText('Closed and open circuits');
  await page.getByRole('link', { name: /Next step/ }).click();
  await expect(page.getByTestId('workshop-banner')).toContainText('Ohm’s law in four readings');
});

test('assistant without an API key uses the labelled offline tutor', async ({ page }) => {
  await page.goto('/#/lab/electricity');
  await page.getByTestId('assistant-toggle').click();
  await expect(page.getByTestId('assistant-mode')).toContainText('not AI-generated');
  await page.getByRole('button', { name: 'Why this result?' }).click();
  await expect(page.locator('.assistant-msg')).toContainText('I = V / Req');
  const status = await page.request.get('/api/assistant/status');
  expect(await status.json()).toMatchObject({ available: false, provider: null, model: null });
  const post = await page.request.post('/api/assistant', { data: { lab: 'electricity', intent: 'why' } });
  expect(post.status()).toBe(503);
});

test('chemistry lab: explore an element, balance an equation and prepare a solution @responsive', async ({ page }) => {
  const errors = errorsOf(page);
  await page.goto('/#/lab/chemistry?mode=free');
  await page.getByTestId('pt-Na').click();
  await expect(page.getByTestId('bohr-notation')).toHaveText('2,8,1');
  await page.getByTestId('module-reactions').click();
  await page.getByTestId('reaction-select').selectOption('hgo');
  await expect(page.getByTestId('balance-status')).toContainText('Not balanced yet');
  await page.getByTestId('coef-0').fill('2');
  await page.getByTestId('coef-1').fill('2');
  await expect(page.getByTestId('balance-status')).toContainText('Balanced: every element');
  await page.getByTestId('module-solutions').click();
  const needed = (await page.getByTestId('mass-needed').textContent())!.replace(/[^\d.]/g, '');
  await page.getByTestId('weigh-input').fill(needed);
  await page.getByTestId('step-weigh').click();
  await page.getByTestId('step-dissolve').click();
  await page.getByTestId('step-fill').click();
  await expect(page.getByTestId('solution-feedback').locator('.banner-ok')).toBeVisible();
  await page.getByTestId('module-periodic').click();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
});

test('chemistry lab in Arabic keeps formulas left-to-right', async ({ page }) => {
  await page.goto('/#/lab/chemistry?mode=free');
  await page.getByTestId('lang-toggle').click();
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await page.getByTestId('module-reactions').click();
  await expect(page.getByTestId('equation-row')).toHaveAttribute('dir', 'ltr');
  await expect(page.locator('bdi.chem').first()).toHaveAttribute('dir', 'ltr');
});

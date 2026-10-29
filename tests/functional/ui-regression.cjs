// Run against a local H5 production build. Requires Playwright and a Chromium installation.
// TEST_BASE_URL defaults to http://127.0.0.1:4173/; CHROMIUM_PATH is optional.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const base = new URL(process.env.TEST_BASE_URL || 'http://127.0.0.1:4173/');
if (!base.pathname.endsWith('/')) base.pathname += '/';
const routes = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../src/pages.json'), 'utf8')).pages;
const sizes = [
  { width: 320, height: 740 },
  { width: 375, height: 812 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1440, height: 1000 },
  { width: 844, height: 390 },
];
let navigationId = 0;
const failures = [];
const runtimeErrors = [];

async function go(page, route) {
  const url = new URL('learning.html', base);
  // A different query starts a fresh document instead of reusing a tab's previous quiz state.
  url.searchParams.set('ui-regression', String(++navigationId));
  url.hash = `/${route}`;
  await page.goto(url.href, { waitUntil: 'load' });
  await page.waitForFunction(() => document.querySelector('uni-page-body')?.textContent.trim().length > 0);
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

async function waitAttribute(locator, name, value) {
  await locator.evaluate((element, { name, value }) => new Promise((resolve, reject) => {
    const check = () => element.getAttribute(name) === value;
    if (check()) return resolve();
    const observer = new MutationObserver(() => { if (check()) { observer.disconnect(); clearTimeout(timer); resolve(); } });
    const timer = setTimeout(() => { observer.disconnect(); reject(new Error(`${name} did not become ${value}`)); }, 3000);
    observer.observe(element, { attributes: true });
  }), { name, value });
}

async function withPage(browser, callback) {
  const context = await browser.newContext({ viewport: sizes[1], reducedMotion: 'reduce' });
  const page = await context.newPage();
  page.setDefaultTimeout(8000);
  page.on('pageerror', error => runtimeErrors.push({ url: page.url(), error: error.message }));
  try { await callback(page); } finally { await context.close(); }
}

async function check(name, callback) {
  try { await callback(); console.log(`PASS: ${name}`); }
  catch (error) { failures.push({ name, message: error.message }); console.error(`FAIL: ${name}\n${error.stack}`); }
}

async function checkMath(page) {
  await go(page, 'pages/math/practice/index');
  for (const card of await page.locator('.type-card.selected').all()) {
    if ((await card.locator('.type-name').innerText()).trim() !== '10 以内加法') await card.click();
  }
  await page.getByText('开始练习', { exact: true }).click();
  const progress = page.getByRole('progressbar', { name: '答题进度' });
  await waitAttribute(progress, 'aria-valuenow', '0');
  assert.equal((await page.locator('.progress-label').innerText()).trim(), '0%');
  assert(!/正确率/.test(await page.locator('uni-page-body').innerText()), 'No accuracy before any answer');
  const content = await page.locator('.q-general').innerText();
  const operands = content.match(/(\d+)\s*\+\s*(\d+)\s*=/);
  assert(operands, `Expected an addition question, received ${content}`);
  const answer = Number(operands[1]) + Number(operands[2]);
  const option = page.locator('.option-btn').filter({ has: page.locator('.option-value', { hasText: new RegExp(`^${answer}$`) }) });
  assert.equal(await option.count(), 1);
  await option.focus();
  await page.keyboard.press('Enter');
  await waitAttribute(progress, 'aria-valuenow', '1');
  assert.equal(await page.locator('.option-btn[aria-disabled="true"]').count(), 4);
  assert.equal(await page.locator('.option-btn.correct[aria-pressed="true"]').count(), 1);
  await page.getByText('下一题 →', { exact: true }).click();
  assert.match(await page.locator('uni-page-body').innerText(), /正确率：100%/, 'An unanswered second question must not reduce accuracy');
  assert.equal(await progress.getAttribute('aria-valuenow'), '1');
  assert.equal((await page.locator('.progress-label').innerText()).trim(), '10%');
}

async function checkEnglish(page) {
  await go(page, 'pages/english/practice/index');
  await page.getByText('开始练习', { exact: true }).click();
  const optionRects = await page.locator('.opts .option-btn').evaluateAll(elements => elements.map(element => { const rect = element.getBoundingClientRect(); return {top: rect.top, bottom: rect.bottom}; }));
  assert(optionRects[1].top - optionRects[0].bottom >= 8, 'Answer targets must have visible separation');
  let correct = 0;
  for (let index = 0; index < 10; index++) {
    const first = page.locator('.option-btn').first();
    await first.focus();
    await page.keyboard.press('Enter');
    const progress = page.getByRole('progressbar', { name: '答题进度' });
    await waitAttribute(progress, 'aria-valuenow', String(index + 1));
    assert.equal(await page.locator('.option-btn.correct').count(), 1, 'Show exactly one correct answer');
    assert.equal(await page.locator('.option-btn[aria-disabled="true"]').count(), 4, 'All options disabled after answer');
    if ((await first.getAttribute('class')).split(/\s+/).includes('correct')) correct++;
    if (index === 0) {
      const before = await page.locator('uni-page-body').innerText();
      // Dispatch bypasses Playwright's disabled check and verifies the component's own guard.
      for (const option of await page.locator('.option-btn').all()) await option.dispatchEvent('click');
      await first.press('Enter');
      assert.equal(await page.locator('uni-page-body').innerText(), before, 'Repeated answer events must not change the score');
    }
    await page.getByText(index === 9 ? '查看成绩' : '下一题 →', { exact: true }).click();
  }
  await page.locator('.result-card').waitFor({ state: 'visible' });
  const data = await page.evaluate(() => JSON.parse(localStorage.getItem('kidbridge-app-storage')));
  assert.equal(data.progress.englishProgress.totalQuestions, 10);
  assert.equal(data.progress.englishProgress.correctAnswers, correct);
  assert.equal(data.progress.totalQuestions, 10, 'Repeated answer events must not add extra questions');
}

async function checkDialogAndSwitch(page) {
  await go(page, 'pages/settings/index');
  const trigger = page.getByRole('button', { name: '修改昵称', exact: true });
  await trigger.focus();
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog');
  await dialog.waitFor({ state: 'visible' });
  const input = dialog.locator('input');
  const association = await input.evaluate(element => ({
    id: element.id,
    labelledBy: element.getAttribute('aria-labelledby'),
    describedBy: element.getAttribute('aria-describedby'),
    label: document.getElementById(element.getAttribute('aria-labelledby'))?.textContent,
    hint: document.getElementById(element.getAttribute('aria-describedby'))?.textContent,
    focused: document.activeElement === element,
  }));
  assert(association.id && association.labelledBy && association.describedBy);
  assert.equal(association.label.trim(), '小朋友的昵称');
  assert(association.hint.includes('24'));
  assert(association.focused, 'Dialog must focus the real input');
  await input.fill('   ');
  await dialog.locator('[data-dialog-confirm]').click();
  await dialog.locator('.dialog-hint.is-error').waitFor({ state: 'visible' });
  await waitAttribute(input, 'aria-invalid', 'true');
  assert.match(await dialog.locator('.dialog-hint').innerText(), /请输入一个昵称/);
  await input.focus();
  await page.keyboard.press('Escape');
  await dialog.waitFor({ state: 'hidden' });
  assert(await trigger.evaluate(element => document.activeElement === element), 'Escape restores focus to the opener');
  await trigger.click();
  await dialog.waitFor({ state: 'visible' });
  await input.fill('键盘测试');
  await input.press('Enter');
  await dialog.waitFor({ state: 'hidden' });
  assert.equal((await page.locator('.profile-name').innerText()).trim(), '键盘测试', 'Enter started inside the input must save the nickname');
  const sound = page.getByRole('switch', { name: '声音', exact: true });
  const before = await sound.getAttribute('aria-checked');
  await sound.focus();
  await page.keyboard.press('Space');
  await waitAttribute(sound, 'aria-checked', String(before !== 'true'));
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('kidbridge-app-storage')));
  assert.equal(stored.settings.soundEnabled, before !== 'true');
}

async function checkResponsive(page) {
  const layoutFailures = [];
  // Actual interactive controls only; display icons and illustration assets are excluded.
  const touchSelectors = '.start-btn, .next-btn, .option-btn, .app-switch, .dialog-close, .dialog-button, .q-speak-btn, .speak-btn, .sc-speak, .favorite-action, .av-item, .nav-btn, .know-btn';
  for (const size of sizes) {
    await page.setViewportSize(size);
    for (const route of routes) {
      await go(page, route.path);
      const geometry = await page.evaluate(selectors => {
        const body = document.querySelector('uni-page-body');
        const targets = [...body.querySelectorAll(selectors)].filter(element => element.getClientRects().length > 0).map(element => {
          const rect = element.getBoundingClientRect();
          return { className: element.className, width: rect.width, height: rect.height };
        });
        const labelWidths = [...body.querySelectorAll('.type-name')].map(element => element.getBoundingClientRect().width);
        return { scrollWidth: document.documentElement.scrollWidth, width: innerWidth, targets, labelWidths };
      }, touchSelectors);
      const prefix = `${size.width}×${size.height} ${route.path}`;
      if (geometry.scrollWidth > geometry.width + 1) layoutFailures.push(`${prefix}: horizontal overflow ${geometry.scrollWidth} > ${geometry.width}`);
      for (const target of geometry.targets) if (target.width < 43.5 || target.height < 43.5) {
        layoutFailures.push(`${prefix}: touch target ${target.className} ${target.width.toFixed(1)}×${target.height.toFixed(1)}`);
      }
      if (size.width >= 768 && geometry.labelWidths.some(width => width < 75)) {
        layoutFailures.push(`${prefix}: math type label widths ${geometry.labelWidths.map(width => width.toFixed(1)).join(', ')}`);
      }
    }
    console.log(`Checked ${routes.length} routes at ${size.width}×${size.height}`);
  }
  assert.equal(layoutFailures.length, 0, layoutFailures.join('\n'));
}

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, headless: true, args: ['--no-sandbox'] });
  try {
    await check('math progress counts answered questions and keyboard answers', () => withPage(browser, checkMath));
    await check('English feedback, disabled state and duplicate-answer guard', () => withPage(browser, checkEnglish));
    await check('nickname validation, actual input labels, Escape focus and sound Space', () => withPage(browser, checkDialogAndSwitch));
    await check('six screen sizes, all routes, overflow and critical touch targets', () => withPage(browser, checkResponsive));
    assert.equal(runtimeErrors.length, 0, `Browser runtime errors: ${JSON.stringify(runtimeErrors)}`);
  } finally { await browser.close(); }
  if (failures.length) {
    console.error(JSON.stringify(failures, null, 2));
    process.exitCode = 1;
  }
})().catch(error => { console.error(error); process.exitCode = 1; });

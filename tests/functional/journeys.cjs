// H5 behavioral journeys. Run against a freshly built local preview server.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const base = (process.env.TEST_BASE_URL || 'http://127.0.0.1:4173/').replace(/\/?$/, '/');
const screenshotDir = process.env.TEST_SCREENSHOT_DIR;
const storageKey = 'kidbridge-app-storage';

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || undefined,
    headless: true,
    args: ['--no-sandbox'],
  });
  const errors = [];
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  context.on('page', page => {
    page.setDefaultTimeout(10000);
    page.on('pageerror', error => errors.push(`${page.url()}: ${error.message}`));
  });
  const page = await context.newPage();
  async function capture(name) {
    if (!screenshotDir) return;
    fs.mkdirSync(screenshotDir, { recursive: true });
    // Let staggered teaching graphics finish before accepting screenshot evidence.
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(screenshotDir, name + '.png'), fullPage: true });
  }
  async function go(route, selector) {
    await page.goto(base + 'learning.html#/' + route);
    // A fresh document avoids reusing a tab's prior practice stage.
    await page.reload();
    await page.locator(selector).first().waitFor({ state: 'visible' });
  }
  async function saved() {
    return page.evaluate(key => JSON.parse(localStorage.getItem(key)), storageKey);
  }


  try {
    // Resource navigation: independent expected sets from the shipped catalog data.
    await page.goto(base);
    await page.locator('.site-card').first().waitFor();
    const allCount = await page.locator('.site-card').count();
    assert(allCount > 0);
    await page.locator('#search').fill('Scratch');
    const searchNames = await page.locator('.site-card h4').allTextContents();
    assert(searchNames.length > 0 && searchNames.every(name => name.includes('Scratch')));
    await page.locator('#reset').click();
    assert.equal(await page.locator('.site-card').count(), allCount);
    await page.locator('#ageFilter').click();
    await page.locator('#ageOptions [data-option-index="1"]').click();
    const expectedYoung = await page.evaluate(() => SITES.filter(site => site.ageMin !== null && site.ageMin <= 5 && site.ageMax >= 3).map(site => site.name).sort());
    assert.deepEqual((await page.locator('.site-card h4').allTextContents()).sort(), expectedYoung);
    await page.locator('#priceFilter').click();
    await page.locator('#priceOptions [data-option-index="1"]').click();
    const expectedYoungFree = await page.evaluate(() => SITES.filter(site => site.ageMin !== null && site.ageMin <= 5 && site.ageMax >= 3 && site.payment === 'free').map(site => site.name).sort());
    assert(expectedYoungFree.length > 0);
    assert.deepEqual((await page.locator('.site-card h4').allTextContents()).sort(), expectedYoungFree);
    await capture('journey-01-navigation-filters');
    await page.locator('#reset').click();
    const siteName = await page.locator('.site-card h4').first().innerText();
    const favoriteId = await page.locator('[data-fav]').first().getAttribute('data-fav');
    await page.locator(`[data-fav="${favoriteId}"]`).click();
    assert.equal(await page.locator(`[data-fav="${favoriteId}"]`).getAttribute('aria-pressed'), 'true');
    await page.locator('#favesToggle').click();
    assert.deepEqual(await page.locator('.site-card h4').allTextContents(), [siteName]);
    await page.reload();
    assert.equal(await page.locator(`[data-fav="${favoriteId}"]`).getAttribute('aria-pressed'), 'true');
    await page.locator('#favesToggle').click();
    assert.equal(await page.locator('.site-card').count(), 1);
    await page.locator(`[data-fav="${favoriteId}"]`).click();
    assert.equal(await page.locator('.site-card').count(), 0);
    await page.getByText('这里还没有收藏的资源', { exact: true }).waitFor();
    console.log('PASS navigation: search, age/price intersection, favorite/filter/reload/remove');

    // Pinyin empty state, visible star control, persistence and removal.
    await go('pages/pinyin/favorites/index', '.fv-empty');
    await page.getByText('去学习拼音', { exact: true }).click();
    await page.waitForURL(/#\/pages\/pinyin\/index$/);
    await go('pages/pinyin/initials/index', '.favorite-action');
    await page.getByRole('button', { name: '收藏 b', exact: true }).click();
    await page.getByRole('button', { name: '取消收藏 b', exact: true }).waitFor();
    await page.reload();
    assert.equal(await page.getByRole('button', { name: '取消收藏 b', exact: true }).getAttribute('aria-pressed'), 'true');
    await go('pages/pinyin/favorites/index', '.fv-card');
    assert.equal(await page.locator('.fv-card').count(), 1);
    assert.equal(await page.locator('.fv-pinyin').innerText(), 'b');
    await capture('journey-02-pinyin-favorite');
    await page.getByText('取消收藏', { exact: true }).click();
    await page.locator('.fv-empty').waitFor();
    await page.reload();
    await page.locator('.fv-empty').waitFor();
    console.log('PASS pinyin favorites: empty navigation, star, reload, list, removal');

    // Exercise every initial in both modes, including a tab switch from an absent initial.
    await go('pages/pinyin/spelling/index', '.sp-card');
    for (const tabIndex of [0, 1, 0, 1]) {
      await page.locator('.tab-chip').nth(tabIndex).click();
      const initials = await page.locator('.strip-chip').count();
      assert(initials > 0);
      for (let i = 0; i < initials; i++) {
        await page.locator('.strip-chip').nth(i).click();
        assert((await page.locator('.sp-card').count()) > 0, `Empty spelling examples: tab=${tabIndex}, initial=${i}`);
        assert.equal(await page.locator('.empty-state').count(), 0);
      }
    }
    console.log('PASS spelling: every initial and repeated two/three-syllable tab switches');

    // Actual wrong answer produces a review item with the original countable objects.
    await go('pages/math/practice/index', '.type-card');
    while (await page.locator('.type-card.selected').count()) await page.locator('.type-card.selected').first().click();
    await page.locator('.type-card').filter({ has: page.getByText('数一数', { exact: true }) }).click();
    await page.locator('.count-chip').filter({ hasText: /^5 题$/ }).click();
    await page.getByText('开始练习', { exact: true }).click();
    await page.locator('.fruit-item').first().waitFor();
    const correctCount = await page.locator('.fruit-item').count();
    const labels = await page.locator('.option-value').allTextContents();
    const wrongIndex = labels.findIndex(value => Number(value) !== correctCount);
    assert(wrongIndex >= 0);
    await page.locator('.option-btn').nth(wrongIndex).click();
    await page.waitForFunction(key => JSON.parse(localStorage.getItem(key))?.wrongBook.length === 1, storageKey);
    await go('pages/wrongbook/index', '.wb-item');
    assert.equal(await page.locator('.wb-item').count(), 1);
    assert.equal(await page.locator('.wb-item .fruit-item').count(), correctCount);
    assert.equal(Number(await page.locator('.wb-item .ans-v').innerText()), correctCount);
    await capture('journey-03-counting-wrongbook');
    console.log('PASS counting wrongbook: actual wrong answer and visible review graphics');

    // All quiz modes, 5 and 10 questions, visible feedback, one submission and persisted totals.
    for (const [module, route] of [['english', 'pages/english/practice/index'], ['pinyin', 'pages/pinyin/practice/index']]) {
      let expectedModuleTotal = 0;
      for (const [modeIndex, count] of [[0, 5], [1, 10]]) {
        await go(route, '.mode-card');
        await page.locator('.mode-card').nth(modeIndex).click();
        await page.locator('.count-chip').filter({ hasText: new RegExp(`^${count} 题$`) }).click();
        await page.getByText('开始练习', { exact: true }).click();
        for (let i = 0; i < count; i++) {
          await page.locator('.option-btn[aria-disabled="false"]').first().waitFor();
          const options = await page.locator('.option-value').allTextContents();
          assert.equal(options.length, 4);
          assert.equal(new Set(options).size, options.length);
          await page.locator('.option-btn').first().click();
          await page.locator('.option-btn[aria-disabled="true"]').first().waitFor();
          assert.equal(await page.locator('.option-btn.correct').count(), 1);
          assert.equal(await page.locator('.option-btn[aria-pressed="true"]').count(), 1);
          if (i === 0) await capture(`journey-04-${module}-mode-${modeIndex}-feedback`);
          await page.getByText(i === count - 1 ? '查看成绩' : '下一题 →', { exact: true }).click();
        }
        await page.locator(module === 'english' ? '.result-card' : '.result-card-2').waitFor();
        expectedModuleTotal += count;
        const data = await saved();
        assert.equal(data.progress[`${module}Progress`].totalQuestions, expectedModuleTotal);
        assert.equal(data.progress.totalQuestions, 1 + (module === 'pinyin' ? 15 : 0) + expectedModuleTotal);
        await page.reload();
        const reloaded = await saved();
        assert.equal(reloaded.progress[`${module}Progress`].totalQuestions, expectedModuleTotal);
        console.log(`PASS ${module} mode ${modeIndex}: ${count} questions, feedback, result, storage/reload`);
      }
    }
    assert.deepEqual(errors, []);
    console.log('PASS: no page JavaScript errors in all extended H5 journeys');
  } catch (error) {
    fs.mkdirSync(screenshotDir || '/tmp', { recursive: true });
    await page.screenshot({ path: path.join(screenshotDir || '/tmp', 'kidbridge-journey-failure.png'), fullPage: true }).catch(() => {});
    throw error;
  } finally {
    await context.close();
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});

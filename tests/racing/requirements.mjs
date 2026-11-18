// Regression checks for gaps found by comparing the UI with the V1.0 requirements.
// All records are fictional and confined to isolated local browser storage.
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { build } from 'esbuild';
import { createServer } from 'node:http';
import { readFile, mkdtemp, rm, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, extname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';
import { assertImagesLoaded } from '../helpers/images.mjs';

const root = resolve('dist/build/h5');
const artifacts = resolve('artifacts/racing-requirements');
await mkdir(artifacts, { recursive: true });
const temp = await mkdtemp(join(tmpdir(), 'kidbridge-requirements-'));
await build({ entryPoints: ['src/utils/racing/engine.ts'], outfile: join(temp, 'engine.mjs'), bundle: true, platform: 'node', format: 'esm' });
const { initialState, transition, parseState } = await import(pathToFileURL(join(temp, 'engine.mjs')).href);
const server = createServer(async (req, res) => {
  try {
    const pathname = new URL(req.url, 'http://localhost').pathname;
    const file = resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    assert(file.startsWith(root + '/'));
    res.setHeader('Content-Type', ({ '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json' })[extname(file)] || 'application/octet-stream');
    res.end(await readFile(file));
  } catch { res.writeHead(404).end(); }
});
let browser;
try {
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined), args: ['--no-sandbox'] });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, timezoneId: 'Asia/Shanghai', reducedMotion: 'reduce' });
  const page = await context.newPage();
  page.setDefaultTimeout(12000);
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const key = 'kidbridge-racing-storage-v1';
  await page.goto(origin + '/learning.html#/pages/home/index');
  const today = await page.evaluate(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  let sequence = 0;
  const ctx = { now: Date.now(), today, parent: true, id: () => `requirement-${++sequence}` };
  let state = initialState(ctx.now);
  const run = command => state = transition(state, command, ctx);
  for (const [i, title] of ['早上刷牙', '阅读绘本', '整理玩具', '户外运动', '收拾餐具'].entries()) {
    run({ type: 'saveTask', input: { title, description: '完成今天的小挑战', steps: [], icon: ['tooth', 'book', 'toy', 'ball', 'dish'][i], category: 'life', schedule: { kind: 'daily' }, timeSlot: 'anytime', occurrenceKey: String(i), points: 3, checkMode: 'self', enabled: true, sortOrder: i } });
  }
  run({ type: 'ensure', date: today });
  run({ type: 'submit', id: state.dailyTasks[0].id });
  run({ type: 'feedback', ids: state.feedbackEvents.map(e => e.id) });
  for (const id of ['sticker-star', 'wheel-sky']) {
    run({ type: 'saveReward', id, input: { ...state.rewards.find(r => r.id === id), cost: 1 } });
    run({ type: 'buy', id });
  }
  run({ type: 'equip', colorId: 'color-coral', stickerId: 'sticker-star', wheelId: 'wheel-sky' });
  run({ type: 'preferences', soundsEnabled: false, reduceMotion: true });
  const fixture = structuredClone(state);
  async function install(value) {
    parseState(JSON.stringify(value));
    await page.evaluate(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), { key, value });
  }
  let visit = 0;
  async function route(path) {
    await page.goto(`${origin}/learning.html?requirements=${++visit}#${path}`, { waitUntil: 'networkidle' });
    await page.locator('uni-page-body').waitFor();
    await assertImagesLoaded(page);
  }
  async function screenshot(name) {
    await assertImagesLoaded(page);
    await page.screenshot({ path: `${artifacts}/${name}.png`, fullPage: true });
  }

  await install(fixture);
  await route('/pages/racing/index');
  assert.equal(await page.locator('.track-landmark').count(), 5);
  await screenshot('landmarks-mobile');
  await page.setViewportSize({ width: 1440, height: 1024 });
  await screenshot('landmarks-desktop');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: '赛道小站：阅读绘本，去完成', exact: true }).click();
  await page.getByRole('button', { name: '我完成啦！', exact: true }).click();
  await page.getByRole('dialog', { name: '任务完成反馈' }).getByText('下一站可以选：整理玩具', { exact: true }).waitFor();
  assert(!page.url().includes('/pages/racing/task/index'), 'Feedback belongs on the track');
  await screenshot('completion-next-task');
  await page.getByRole('button', { name: '跳过动画', exact: true }).click();
  await page.locator('.race-page-title').filter({ hasText: '今日赛道' }).waitFor();
  await page.getByRole('button', { name: '返回上一页', exact: true }).click();
  await page.getByText('快乐学习', { exact: true }).waitFor();
  assert(!page.url().includes('/pages/racing/index'), 'Returning from the root track must leave the track');
  console.log('PASS task completion suggests a pending task and returns without duplicating the track');

  await route('/pages/racing/rewards/index');
  const beforePreview = await page.evaluate(k => localStorage.getItem(k), key);
  for (const [title, stickerCount, wheelCount] of [['薄荷车漆', 1, 2], ['小花贴纸', 1, 2], ['蓝色轮毂', 1, 2]]) {
    await page.locator('.race-reward').filter({ hasText: title }).getByRole('button', { name: '预览装扮', exact: true }).click();
    assert.equal(await page.locator('.race-panel .car-sticker').count(), stickerCount, title);
    assert.equal(await page.locator('.race-panel .car-wheel').count(), wheelCount, title);
  }
  assert.equal(await page.evaluate(k => localStorage.getItem(k), key), beforePreview, 'Preview must not change ownership, equipment or stars');
  await screenshot('preview-retains-equipment');
  console.log('PASS color, sticker and wheel previews retain other equipment without changing saved data');

  // Earlier feedback was already seen, so the final batch is 12 stars; the day is 15.
  state = structuredClone(fixture);
  for (const task of state.dailyTasks) if (task.status === 'pending') run({ type: 'submit', id: task.id });
  await install(state);
  await route('/pages/racing/index');
  await page.getByText('今天的赛道完成啦！', { exact: true }).waitFor();
  await page.getByText('今天获得 15 颗成长星星', { exact: true }).waitFor();
  await screenshot('finish-day-total');
  const beforeClose = JSON.parse(await page.evaluate(k => localStorage.getItem(k), key));
  await page.getByRole('button', { name: '跳过动画', exact: true }).click();
  await page.reload({ waitUntil: 'networkidle' });
  assert.equal(await page.locator('.completion-panel').count(), 0, 'Finishing feedback must not replay after refresh');
  const afterClose = JSON.parse(await page.evaluate(k => localStorage.getItem(k), key));
  assert.deepEqual(afterClose.pointTransactions, beforeClose.pointTransactions, 'Closing/reloading must not mint stars');
  assert.deepEqual(errors, []);
  console.log('PASS finishing shows the full day earnings and replay/refresh never repeats an award');

  function dayFixture(count, points = 0, reduced = true) {
    let value = initialState(ctx.now);
    for (let i = 0; i < count; i++) value = transition(value, { type: 'saveTask', input: { ...fixture.taskDefinitions[i % 5], title: `挑战${i + 1}`, occurrenceKey: String(i), sortOrder: i, points } }, ctx);
    value = transition(value, { type: 'ensure', date: today }, ctx);
    return transition(value, { type: 'preferences', soundsEnabled: false, reduceMotion: reduced }, ctx);
  }
  for (const count of [0, 1, 2, 12]) {
    await install(dayFixture(count));
    await page.setViewportSize({ width: 320, height: 740 });
    await route('/pages/racing/index');
    assert.equal(await page.locator('.track-landmark').count(), count);
    const sizes = await page.locator('.track-landmark').evaluateAll(els => els.map(el => { const r = el.getBoundingClientRect(); return { width: r.width, height: r.height }; }));
    assert(sizes.every(s => s.width >= 48 && s.height >= 48));
    if (count) await page.locator('.track-landmark').last().scrollIntoViewIfNeeded();
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    if (count === 12) await screenshot('twelve-landmarks-mobile');
  }
  console.log('PASS 0/1/2/12-task tracks keep real task landmarks reachable with large controls');

  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await install(dayFixture(2, 0, false));
  await route('/pages/racing/index');
  await page.getByRole('button', { name: '赛道小站：挑战1，去完成', exact: true }).click();
  await page.getByRole('button', { name: '我完成啦！', exact: true }).click();
  await page.locator('.completion-panel .track-car.moving').waitFor();
  await screenshot('car-driving');
  const samples = await page.evaluate(async () => {
    const svg = new DOMParser().parseFromString(await (await fetch('/static/racing/track.svg')).text(), 'image/svg+xml');
    const path = svg.querySelector('#road-center');
    const length = path.getTotalLength();
    const road = Array.from({ length: 1001 }, (_, i) => path.getPointAtLength(length * i / 1000));
    const samples = [];
    const until = performance.now() + 700;
    while (performance.now() < until) {
      const car = document.querySelector('.completion-panel .track-car');
      const world = car.closest('.track-world').getBoundingClientRect();
      const progress = Number(car.dataset.progress);
      if (progress > 0 && progress < .5) {
        const m = new DOMMatrix(getComputedStyle(car).transform);
        const x = (m.m41 + car.offsetWidth / 2) / world.width * 640;
        const y = (m.m42 + car.offsetHeight * .88) / world.height * 280;
        samples.push({ x, y, distance: Math.min(...road.map(p => Math.hypot(p.x - x, p.y - y))) });
      }
      await new Promise(r => setTimeout(r, 30));
    }
    return samples;
  });
  assert(samples.length >= 3, 'Record intermediate car positions');
  assert(samples.every(p => p.distance < 2.5), JSON.stringify(samples));
  assert(Math.max(...samples.map(p => p.y)) - Math.min(...samples.map(p => p.y)) > 5, 'Car follows the bend instead of a straight chord');
  assert.equal(await page.locator('.fuel-star').count(), 0, 'Zero-star tasks move the car without pretending to award stars');
  await page.getByRole('button', { name: '跳过动画', exact: true }).click();
  console.log('PASS intermediate car positions follow the actual SVG road, including zero-star completion');

  let celebration = dayFixture(1, 3, false);
  celebration = transition(celebration, { type: 'submit', id: celebration.dailyTasks[0].id }, ctx);
  await install(celebration);
  await route('/pages/racing/index');
  await page.locator('.confetti-piece').first().waitFor();
  assert.equal(await page.locator('.fuel-star').count(), 3);
  const iterations = await page.locator('.fuel-star, .confetti-piece').evaluateAll(els => els.map(el => getComputedStyle(el).animationIterationCount));
  assert(iterations.every(count => count === '1'), 'Celebration effects are finite');
  await screenshot('finish-celebration-normal');
  await page.getByRole('button', { name: '跳过动画', exact: true }).click();
  console.log('PASS star flight and finish confetti are present and never loop');

  for (const source of ['system', 'setting']) {
    let value = dayFixture(2, 3, source === 'setting');
    for (const task of value.dailyTasks) value = transition(value, { type: 'submit', id: task.id }, ctx);
    await page.emulateMedia({ reducedMotion: source === 'system' ? 'reduce' : 'no-preference' });
    await install(value);
    await route('/pages/racing/index');
    await page.getByText('今天获得 6 颗成长星星', { exact: true }).waitFor();
    assert.equal(await page.locator('.completion-panel .track-car.moving, .fuel-star, .confetti-piece').count(), 0);
    await page.getByRole('button', { name: '跳过动画', exact: true }).click();
  }
  console.log('PASS both system and parent reduced-motion settings retain results without flight or confetti');

  await install(initialState(ctx.now));
  await route('/pages/parent/index?section=tasks');
  await page.locator('input').nth(0).fill('123456');
  await page.locator('input').nth(1).fill('123456');
  await page.getByRole('button', { name: '设置 PIN', exact: true }).click();
  await page.locator('.race-check').click();
  await page.getByRole('button', { name: '进入家长中心', exact: true }).click();
  await page.locator('.parent-gate').waitFor({ state: 'hidden' });
  await page.locator('.template-button').first().click();
  await page.waitForFunction(k => JSON.parse(localStorage.getItem(k)).dailyTasks.length === 1, key);
  assert(!page.url().includes('task-editor'), 'One click adds a template without a long form');
  const added = JSON.parse(await page.evaluate(k => localStorage.getItem(k), key));
  assert.equal(added.taskDefinitions.length, 1);
  assert.equal(added.dailyTasks[0].checkMode, 'parent');
  assert.equal(added.dailyTasks[0].points, 2);
  assert.equal(added.dailyTasks[0].status, 'pending');
  assert.equal(added.pointTransactions.length, 0);
  await screenshot('quick-template');
  await page.evaluate(k => {
    const original = Storage.prototype.setItem;
    window.restoreRequirementStorage = () => { Storage.prototype.setItem = original; };
    Storage.prototype.setItem = function(name, value) { if (name === k) throw new Error('模拟存储失败'); return original.call(this, name, value); };
  }, key);
  await page.locator('.template-button').nth(1).click();
  await page.getByRole('alert').filter({ hasText: '模拟存储失败' }).waitFor();
  const failed = JSON.parse(await page.evaluate(k => localStorage.getItem(k), key));
  assert.deepEqual(failed, added);
  await page.evaluate(() => window.restoreRequirementStorage());
  await page.locator('.template-button').nth(1).click();
  await page.waitForFunction(k => JSON.parse(localStorage.getItem(k)).taskDefinitions.length === 2, key);
  console.log('PASS one-click templates keep parent review and publish no false success after a storage failure');

  state = structuredClone(fixture);
  run({ type: 'saveReward', id: 'sticker-flower', input: { ...state.rewards.find(r => r.id === 'sticker-flower'), cost: 1 } });
  await install(state);
  await route('/pages/racing/rewards/index');
  await page.locator('.race-reward').filter({ hasText: '小花贴纸' }).getByRole('button', { name: '兑换装扮', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: '确认兑换', exact: true }).click();
  await page.getByText('新装扮解锁啦！', { exact: true }).waitFor();
  const unlocked = JSON.parse(await page.evaluate(k => localStorage.getItem(k), key));
  assert(unlocked.garage.ownedItemIds.includes('sticker-flower'));
  assert.equal(unlocked.pointTransactions.reduce((sum, t) => sum + t.amount, 0), 0);
  await screenshot('reward-unlocked');
  assert.deepEqual(errors, []);
  console.log('PASS cosmetic unlock feedback appears after the durable purchase and offers the garage');
} finally {
  await browser?.close();
  await new Promise(r => server.close(r));
  await rm(temp, { recursive: true, force: true });
}

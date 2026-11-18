// Regressions for repeated navigation, unsaved changes and parent session expiry.
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
const artifacts = resolve('artifacts/racing-lifecycle');
await mkdir(artifacts, { recursive: true });
const temp = await mkdtemp(join(tmpdir(), 'kidbridge-lifecycle-'));
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
  page.on('pageerror', e => { errors.push(e.message); console.error('PAGE ERROR', page.url(), e.stack); });
  const origin = `http://127.0.0.1:${server.address().port}`;
  const key = 'kidbridge-racing-storage-v1';
  await page.goto(origin + '/learning.html#/pages/home/index');
  const today = await page.evaluate(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  let sequence = 0;
  const ctx = { now: Date.now(), today, parent: true, id: () => `lifecycle-${++sequence}` };
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
    await page.goto(`${origin}/learning.html?lifecycle=${++visit}#${path}`, { waitUntil: 'networkidle' });
    await page.locator('uni-page-body').waitFor();
    await assertImagesLoaded(page);
  }
  async function screenshot(name) {
    await assertImagesLoaded(page);
    await page.screenshot({ path: `${artifacts}/${name}.png`, fullPage: true });
  }

  const failures = [];
  async function check(name, fn) {
    try { await fn(); console.log(`PASS ${name}`); }
    catch (error) { await screenshot(`failure-${failures.length}`); failures.push(`${name}: ${error.message}`); console.error(`FAIL ${name}: ${error.message}`); }
  }
  const button = name => page.getByRole('button', { name, exact: true });
  async function unlockParent() {
    await page.getByLabel('六位家长 PIN', { exact: true }).locator('input').fill('123456');
    await button('进入家长中心').click();
    await page.locator('.parent-gate').waitFor({ state: 'hidden' });
  }
  await install(fixture);
  await check('garage deep link returns to the track without relying on navigateBack failure', async () => {
    await route('/pages/racing/garage/index');
    await button('返回上一页').click();
    await page.locator('.race-page-title').filter({ hasText: '今日赛道' }).waitFor();
    assert.equal(await page.getByRole('dialog').count(), 0);
  });

  await check('garage exit preserves unsaved changes on storage failure and supports discard or save', async () => {
    await route('/pages/racing/garage/index');
    const before = await page.evaluate(k => localStorage.getItem(k), key);
    await button('不使用').first().click();
    await button('返回上一页').click();
    await page.getByRole('dialog').getByText('装扮还没有保存', { exact: true }).waitFor();
    await page.evaluate(k => {
      const original = Storage.prototype.setItem;
      window.restoreLifecycleStorage = () => { Storage.prototype.setItem = original; };
      Storage.prototype.setItem = function(name, value) {
        if (name === k) throw new Error('模拟装扮保存失败');
        return original.call(this, name, value);
      };
    }, key);
    await page.getByRole('dialog').getByRole('button', { name: '保存装扮', exact: true }).click();
    await page.getByRole('alert').filter({ hasText: '模拟装扮保存失败' }).waitFor();
    assert(page.url().includes('/pages/racing/garage/index'));
    assert.equal(await page.evaluate(k => localStorage.getItem(k), key), before);
    await page.evaluate(() => window.restoreLifecycleStorage());
    await button('返回上一页').click();
    await page.getByRole('dialog').getByRole('button', { name: '放弃修改', exact: true }).click();
    await page.locator('.race-page-title').filter({ hasText: '今日赛道' }).waitFor();
    assert.deepEqual(JSON.parse(await page.evaluate(k => localStorage.getItem(k), key)).garage, JSON.parse(before).garage);
    await route('/pages/racing/garage/index');
    await button('不使用').first().click();
    await button('返回上一页').click();
    await page.getByRole('dialog').getByRole('button', { name: '保存装扮', exact: true }).click();
    await page.locator('.race-page-title').filter({ hasText: '今日赛道' }).waitFor();
    const saved = JSON.parse(await page.evaluate(k => localStorage.getItem(k), key));
    assert.equal(saved.garage.equipped.stickerId, undefined);
    assert.deepEqual(saved.pointTransactions, JSON.parse(before).pointTransactions);
  });

  // Set up credentials through the actual UI, never inject authentication state.
  await route('/pages/parent/index');
  await page.getByLabel('六位家长 PIN', { exact: true }).locator('input').fill('123456');
  await page.getByLabel('再次输入 PIN', { exact: true }).locator('input').fill('123456');
  await button('设置 PIN').click();
  await page.locator('.race-check').click();
  await button('进入家长中心').click();
  await page.locator('.parent-gate').waitFor({ state: 'hidden' });

  await check('expired parent session requires fresh PIN entry and preserves an editor draft', async () => {
    await route('/pages/parent/task-editor/index');
    await unlockParent();
    await page.getByLabel('任务名称', { exact: true }).locator('input').fill('保留的草稿');
    await page.clock.install();
    await page.clock.fastForward(601000);
    await page.locator('.parent-gate').waitFor();
    assert.equal(await page.getByLabel('六位家长 PIN', { exact: true }).locator('input').inputValue(), '', 'Expired session must not retain the previous PIN');
    await button('进入家长中心').click();
    await page.getByText('PIN 不正确，请再试一次', { exact: true }).waitFor();
    await unlockParent();
    assert.equal(await page.getByLabel('任务名称', { exact: true }).locator('input').inputValue(), '保留的草稿');
  });

  await check('repeated editor saves and parent exit return to the existing track exactly once', async () => {
    await route('/pages/racing/index');
    await button('家长入口').click();
    await unlockParent();
    for (let i = 0; i < 2; i++) {
      await button('任务').click();
      await button('新建任务').click();
      await page.getByLabel('任务名称', { exact: true }).locator('input').fill(`生活挑战${i}`);
      await button('保存任务安排').click();
      await button('新建任务').waitFor();
      await button('奖励').click();
      await button('新建生活奖励').click();
      await page.getByLabel('奖励名称', { exact: true }).locator('input').fill(`周末野餐${i}`);
      await button('保存奖励约定').click();
      await button('新建生活奖励').waitFor();
    }
    const saved = JSON.parse(await page.evaluate(k => localStorage.getItem(k), key));
    assert.equal(saved.taskDefinitions.filter(t => t.title.startsWith('生活挑战')).length, 2);
    assert.equal(saved.rewards.filter(r => r.title.startsWith('周末野餐')).length, 2);
    await button('返回上一页').click();
    await page.locator('.race-page-title').filter({ hasText: '今日赛道' }).waitFor();
    await button('家长入口').click();
    await unlockParent();
    await button('退出家长模式').click();
    await page.locator('.race-page-title').filter({ hasText: '今日赛道' }).waitFor();
    await button('返回上一页').click();
    await page.getByText('快乐学习', { exact: true }).waitFor();
  });
  await check('copying a template pre-fills settings and preserves completed tasks and stars', async () => {
    await route('/pages/parent/index?section=tasks');
    await unlockParent();
    const before = JSON.parse(await page.evaluate(k => localStorage.getItem(k), key));
    const source = before.taskDefinitions.find(t => t.title === '早上刷牙');
    const row = page.locator('.race-row').filter({ hasText: source.title });
    await row.getByRole('button', { name: '复制模板', exact: true }).click();
    await page.getByText('复制任务模板', { exact: true }).waitFor();
    const name = page.getByLabel('任务名称', { exact: true }).locator('input');
    assert.equal(await name.inputValue(), source.title);
    assert.equal(await page.locator('textarea').inputValue(), source.description);
    await name.fill('晚上刷牙');
    await button('保存任务安排').click();
    await button('新建任务').waitFor();
    const saved = JSON.parse(await page.evaluate(k => localStorage.getItem(k), key));
    const copy = saved.taskDefinitions.find(t => t.title === '晚上刷牙');
    assert(copy);
    assert.notEqual(copy.id, source.id);
    for (const field of ['icon', 'description', 'steps', 'points', 'checkMode', 'schedule']) {
      assert.deepEqual(copy[field], source[field], field);
    }
    assert.deepEqual(saved.taskDefinitions.find(t => t.id === source.id), source);
    assert.deepEqual(saved.dailyTasks, before.dailyTasks);
    assert.deepEqual(saved.pointTransactions, before.pointTransactions);
    const copyRow = page.locator('.race-row').filter({ hasText: copy.title });
    await copyRow.getByRole('button', { name: '额外安排到今天', exact: true }).click();
    await page.waitForFunction(({ key, id }) =>
      JSON.parse(localStorage.getItem(key)).dailyTasks.some(t => t.definitionId === id && t.status === 'pending'),
    { key, id: copy.id });
  });
  await check('parent and child pages generate the next day without rewriting past tasks or stars', async () => {
    await route('/pages/parent/index');
    await unlockParent();
    await page.clock.setSystemTime(new Date(`${today}T23:59:50+08:00`));
    await page.clock.runFor(26000);
    const nextDate = await page.evaluate(() => {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    });
    assert.notEqual(nextDate, today);
    const generated = date => page.waitForFunction(({ key, date }) =>
      JSON.parse(localStorage.getItem(key)).generatedDates.includes(date),
    { key, date });
    await generated(nextDate);
    let saved = JSON.parse(await page.evaluate(k => localStorage.getItem(k), key));
    const previousTasks = saved.dailyTasks.filter(t => t.date === today);
    const previousLedger = saved.pointTransactions;
    await unlockParent();
    await button('退出家长模式').click();
    await page.locator('.race-page-title').filter({ hasText: '今日赛道' }).waitFor();
    await page.getByRole('button', { name: '早上刷牙，待完成', exact: true }).waitFor();
    await page.clock.fastForward('24:00:00');
    const lastDate = new Date(Date.parse(`${nextDate}T12:00:00+08:00`) + 86_400_000)
      .toISOString().slice(0, 10);
    await generated(lastDate);
    saved = JSON.parse(await page.evaluate(k => localStorage.getItem(k), key));
    const currentTasks = saved.dailyTasks.filter(t => t.date === lastDate);
    assert.equal(currentTasks.length, saved.taskDefinitions.filter(t => t.enabled).length);
    assert(currentTasks.every(t => t.status === 'pending'));
    assert.deepEqual(saved.dailyTasks.filter(t => t.date === today), previousTasks);
    assert.deepEqual(saved.pointTransactions, previousLedger);
    assert.equal(await page.locator('.track-landmark').count(), currentTasks.length);
  });
  assert.deepEqual(errors, []);
  assert.deepEqual(failures, []);
} finally {
  await browser?.close();
  await new Promise(r => server.close(r));
  await rm(temp, { recursive: true, force: true });
}

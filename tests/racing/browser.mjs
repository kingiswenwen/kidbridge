import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve, extname } from "node:path";
import assert from "node:assert/strict";
import { assertImagesLoaded } from "../helpers/images.mjs";

const root = resolve("dist/build/h5");
const liveUrl = process.env.RACING_TEST_URL;
if (liveUrl && new URL(liveUrl).protocol !== "https:")
  throw new Error("Live racing checks require HTTPS");
if (!liveUrl && !existsSync(`${root}/learning.html`))
  throw new Error("Run npm run build:h5 first");
const artifacts = resolve(
  process.env.RACING_ARTIFACTS || "artifacts/racing-browser",
);
await mkdir(artifacts, { recursive: true });
const server = createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(
      new URL(req.url, "http://localhost").pathname,
    );
    const path = resolve(
      root,
      `.${pathname === "/" ? "/index.html" : pathname}`,
    );
    if (!path.startsWith(root + "/")) {
      res.writeHead(403).end();
      return;
    }
    const data = await readFile(path);
    res.setHeader(
      "Content-Type",
      {
        ".html": "text/html",
        ".js": "application/javascript",
        ".css": "text/css",
        ".svg": "image/svg+xml",
        ".png": "image/png",
        ".json": "application/json",
        ".mp3": "audio/mpeg",
      }[extname(path)] || "application/octet-stream",
    );
    res.end(data);
  } catch {
    res.writeHead(404).end();
  }
});
if (!liveUrl) await new Promise((r) => server.listen(0, "127.0.0.1", r));
// All growth data stays in a fresh browser context's localStorage. The live
// option exercises the deployed UI without touching another user's records.
const base = liveUrl
  ? `${new URL("learning.html", liveUrl).href}#`
  : `http://127.0.0.1:${server.address().port}/learning.html#`;
const executablePath =
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ||
  (existsSync("/usr/bin/chromium") ? "/usr/bin/chromium" : undefined);
const browser = await chromium.launch({
  headless: true,
  executablePath,
  args: ["--no-sandbox"],
});
const context = await browser.newContext({
  timezoneId: "Asia/Shanghai",
  viewport: { width: 390, height: 844 },
  reducedMotion: "reduce",
});
const page = await context.newPage();
page.setDefaultTimeout(liveUrl ? 30000 : 10000);
page.setDefaultNavigationTimeout(liveUrl ? 60000 : 10000);
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const results = [];
let testRecovery = "";
const key = "kidbridge-racing-storage-v1";
const button = (name) =>
  page
    .getByRole("button", { name, exact: true })
    .or(page.getByRole("tab", { name, exact: true }));
async function visible(text) {
  await page
    .getByText(text, { exact: false })
    .first()
    .waitFor({ state: "visible", timeout: 10000 });
}
let visit = 0;
async function route(path, authenticate = true) {
  // Exercise supported deep links with fresh page instances; raw hash assignment reuses uni-app's cached page objects.
  await page.goto(`${base.replace("#", `?visit=${++visit}#`)}${path}`, {
    waitUntil: liveUrl ? "domcontentloaded" : "networkidle",
  });
  await page.waitForFunction(() => document.querySelector('uni-page-body')?.innerText.trim().length > 0);
  await assertImagesLoaded(page);
  if (
    authenticate &&
    path.startsWith("/pages/parent/") &&
    (await page.evaluate(() =>
      Boolean(localStorage.getItem("kidbridge-racing-parent-v1")),
    ))
  ) {
    await page.locator("input").first().fill("123456");
    await button("进入家长中心").click();
    await page.locator(".parent-gate").waitFor({ state: "hidden" });
  }
}
async function snapshot() {
  return page.evaluate((k) => JSON.parse(localStorage.getItem(k)), key);
}
async function record(name, fn) {
  await fn();
  results.push(name);
  console.log(`PASS ${name}`);
}
async function unlock() {
  await visible("请家长来帮忙");
  await page.locator("input").first().fill("123456");
  await button("进入家长中心").click();
  await visible("陪孩子，一起向前");
}
async function addTask(title, mode) {
  await route("/pages/parent/task-editor/index");
  await page.locator("input").nth(0).fill(title);
  await button(title === "整理玩具" ? "玩具" : "阅读").click();
  await page
    .locator("textarea")
    .first()
    .fill(title === "整理玩具" ? "把小汽车和积木送回家" : "和家长一起读个故事");
  await page
    .locator("input")
    .nth(1)
    .fill(title === "整理玩具" ? "把玩具放回盒子" : "选一本喜欢的绘本");
  if (mode === "self") await button("孩子自助确认").click();
  await button("3 星").click();
  await button("保存任务安排").click();
  await visible("陪孩子，一起向前");
}
async function confirmDialog(name) {
  await page
    .getByRole("dialog")
    .last()
    .getByRole("button", { name, exact: true })
    .click();
}
try {
  await page.goto(`${base}/`, { waitUntil: liveUrl ? "domcontentloaded" : "networkidle" });
  await record(
    "existing home exposes race entry without replacing learning modules",
    async () => {
      await visible("快乐学习");
      await visible("数学启蒙");
      await visible("今日赛道");
    },
  );
  await route("/pages/racing/index");
  await visible("今天是自由冒险日");
  await page.screenshot({
    path: `${artifacts}/empty-mobile.png`,
    fullPage: true,
  });
  await record("parent guard and PIN setup with recovery code", async () => {
    await route("/pages/parent/index", false);
    await visible("第一次进入家长中心");
    await page.locator("input").nth(0).fill("123456");
    await page.locator("input").nth(1).fill("123456");
    await button("设置 PIN").click();
    await visible("请保存家长恢复码");
    const recovery = await page.locator(".recovery-code").innerText();
    testRecovery = recovery;
    assert.ok(recovery.length >= 12);
    await page.locator(".race-check").click();
    await button("进入家长中心").click();
    await visible("陪孩子，一起向前");
  });
  await record(
    "parent creates scheduled review and self-confirm tasks through real editor",
    async () => {
      await addTask("整理玩具", "parent");
      await addTask("阅读绘本", "self");
      const s = await snapshot();
      assert.equal(s.dailyTasks.length, 2);
      assert.equal(s.pointTransactions.length, 0);
    },
  );
  await record(
    "child submits once; pending parent review earns no stars or progress",
    async () => {
      await route("/pages/racing/index");
      await visible("整理玩具");
      await page
        .getByRole("button", { name: "整理玩具，待完成", exact: true })
        .click();
      await button("我完成啦！").click();
      await visible("已经提交");
      let s = await snapshot();
      assert.equal(
        s.dailyTasks.filter((t) => t.status === "submitted").length,
        1,
      );
      assert.equal(s.pointTransactions.length, 0);
      assert.equal(await button("我完成啦！").count(), 0);
    },
  );
  await record(
    "self-confirm persists award then shows skippable feedback",
    async () => {
      await route("/pages/racing/index");
      await page
        .getByRole("button", { name: "阅读绘本，待完成", exact: true })
        .click();
      await page.screenshot({
        path: `${artifacts}/task-mobile.png`,
        fullPage: true,
      });
      await button("我完成啦！").click();
      await visible("又完成一站啦");
      await page.screenshot({
        path: `${artifacts}/completion-mobile.png`,
        fullPage: true,
      });
      await button("跳过动画").click();
      const s = await snapshot();
      assert.equal(
        s.pointTransactions.reduce((n, t) => n + t.amount, 0),
        3,
      );
    },
  );
  await record(
    "parent login required again after child mode; approval awards exactly once",
    async () => {
      await route("/pages/parent/index", false);
      await unlock();
      await route("/pages/parent/review/index");
      await button("确认完成").click();
      await visible("已确认完成");
      let s = await snapshot();
      assert.equal(
        s.pointTransactions.reduce((n, t) => n + t.amount, 0),
        6,
      );
      assert.equal(
        s.dailyTasks.filter((t) => t.status === "completed").length,
        2,
      );
      await page.screenshot({
        path: `${artifacts}/parent-review-mobile.png`,
        fullPage: true,
      });
    },
  );
  await record(
    "configure reward price, real-world reward and preserve task history",
    async () => {
      await route("/pages/parent/reward-editor/index?id=sticker-star");
      await page.locator("input").nth(1).fill("2");
      await button("保存奖励约定").click();
      await page.waitForFunction(
        () => !location.hash.includes("reward-editor"),
      );
      await route("/pages/parent/reward-editor/index");
      await page.locator("input").nth(0).fill("周末一起去公园");
      await page.locator("input").nth(1).fill("3");
      await page
        .locator("textarea")
        .first()
        .fill("和家长商量好时间，一起去公园");
      await button("保存奖励约定").click();
      await page.waitForFunction(
        () => !location.hash.includes("reward-editor"),
      );
      assert.equal(
        (await snapshot()).dailyTasks.filter((t) => t.status === "completed")
          .length,
        2,
      );
    },
  );
  assert.equal(
    (await snapshot()).rewards.find((r) => r.id === "sticker-star").cost,
    2,
  );
  assert.equal(
    (await snapshot()).rewards.find((r) => r.title === "周末一起去公园").type,
    "real_world",
  );
  await record(
    "cosmetic purchase charges once and garage saves owned equipment",
    async () => {
      await route("/pages/racing/rewards/index");
      const card = page.locator(".race-reward").filter({ hasText: "星星贴纸" });
      await card.getByRole("button", { name: "兑换装扮", exact: true }).click();
      await confirmDialog("确认兑换");
      await page.waitForTimeout(200);
      let s = await snapshot();
      assert.equal(
        s.pointTransactions.reduce((n, t) => n + t.amount, 0),
        4,
      );
      assert.equal(
        s.garage.ownedItemIds.filter((x) => x === "sticker-star").length,
        1,
      );
      await route("/pages/racing/garage/index");
      await page
        .locator('.cosmetic-choices [role="button"]')
        .filter({ hasText: "星星贴纸" })
        .click();
      await button("保存装扮").click();
      await page.waitForTimeout(150);
      s = await snapshot();
      assert.equal(s.garage.equipped.stickerId, "sticker-star");
      await page.screenshot({
        path: `${artifacts}/garage-mobile.png`,
        fullPage: true,
      });
    },
  );
  await record(
    "real reward request does not deduct, parent approval deducts, cancellation refunds once",
    async () => {
      await route("/pages/racing/rewards/index");
      await button("生活奖励").click();
      await button("申请兑换").click();
      await confirmDialog("提交申请");
      await page.waitForTimeout(150);
      let s = await snapshot();
      assert.equal(
        s.pointTransactions.reduce((n, t) => n + t.amount, 0),
        4,
      );
      await page.screenshot({
        path: `${artifacts}/rewards-mobile.png`,
        fullPage: true,
      });
      await route("/pages/parent/index", false);
      await unlock();
      await route("/pages/parent/review/index");
      await button("批准并扣 3 星").click();
      await visible("已批准，星星扣除一次");
      s = await snapshot();
      assert.equal(
        s.pointTransactions.reduce((n, t) => n + t.amount, 0),
        1,
      );
      await button("取消并退星").click();
      await confirmDialog("取消并退星");
      await visible("已取消，星星已退回");
      s = await snapshot();
      assert.equal(
        s.pointTransactions.reduce((n, t) => n + t.amount, 0),
        4,
      );
      assert.equal(
        s.pointTransactions.filter((t) => t.type === "refund").length,
        1,
      );
    },
  );
  await record(
    "backup export/import survives reload and malformed import preserves data",
    async () => {
      await route("/pages/parent/index?section=settings");
      await visible("成长数据备份");
      await button("导出成长备份").click();
      await visible("备份已生成");
      const exported = await page.locator("textarea").nth(0).inputValue();
      assert.equal(
        JSON.parse(exported).garage.equipped.stickerId,
        "sticker-star",
      );
      assert.equal(exported.includes("pinHash"), false);
      const before = await snapshot();
      await page.locator("textarea").last().fill("{broken");
      await button("校验并恢复备份").click();
      await confirmDialog("确认恢复");
      await page.waitForTimeout(200);
      assert.deepEqual(await snapshot(), before);
      await page.locator("textarea").last().fill(exported);
      await button("校验并恢复备份").click();
      await confirmDialog("确认恢复");
      await visible("备份恢复成功");
      await page.reload({ waitUntil: "networkidle" });
      await unlock();
      const after = await snapshot();
      assert.equal(after.garage.equipped.stickerId, "sticker-star");
      assert.equal(
        after.pointTransactions.reduce((n, t) => n + t.amount, 0),
        4,
      );
      assert.equal(after.dailyTasks.length, 2);
    },
  );
  await record(
    "parent pages and child pages render on mobile and desktop without overflow",
    async () => {
      for (const [path, name] of [
        ["/pages/parent/index", "parent"],
        ["/pages/parent/task-editor/index", "task-editor"],
        ["/pages/parent/reward-editor/index", "reward-editor"],
        ["/pages/parent/records/index", "records"],
      ]) {
        await route(path);
        await page.screenshot({
          path: `${artifacts}/${name}-mobile.png`,
          fullPage: true,
        });
        assert.ok(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth + 1,
          ),
          `overflow ${path}`,
        );
      }
      await route("/pages/racing/index");
      await visible("今天也很棒");
      await page.waitForTimeout(150);
      if (await button("跳过动画").isVisible())
        await button("跳过动画").click();
      await page.screenshot({
        path: `${artifacts}/track-mobile.png`,
        fullPage: true,
      });
      await page.setViewportSize({ width: 1440, height: 1024 });
      await page.screenshot({
        path: `${artifacts}/track-desktop.png`,
        fullPage: true,
      });
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
      );
      await page.setViewportSize({ width: 320, height: 740 });
      for (const path of [
        "/pages/racing/index",
        "/pages/racing/rewards/index",
        "/pages/racing/garage/index",
      ]) {
        await route(path);
        assert.ok(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth + 1,
          ),
          `narrow overflow ${path}`,
        );
      }
    },
  );
  await record(
    "twelve-task track remains scrollable and child-visible after validated restore",
    async () => {
      const before = await snapshot();
      const extended = JSON.parse(JSON.stringify(before));
      const date = extended.dailyTasks[0].date;
      for (let i = 0; i < 10; i++) {
        const definition = {
          ...extended.taskDefinitions[0],
          id: `boundary-${i}`,
          title: `小挑战${i + 1}`,
          sortOrder: i + 2,
        };
        extended.taskDefinitions.push(definition);
        extended.dailyTasks.push({
          ...definition,
          id: `${date}:${definition.id}:${definition.occurrenceKey}`,
          definitionId: definition.id,
          date,
          status: "pending",
          submission: 0,
        });
      }
      await route("/pages/parent/index?section=settings");
      await page.locator("textarea").last().fill(JSON.stringify(extended));
      await button("校验并恢复备份").click();
      await confirmDialog("确认恢复");
      await visible("备份恢复成功");
      await route("/pages/racing/index");
      assert.equal(await page.locator(".task-card").count(), 12);
      await page.locator(".task-card").last().scrollIntoViewIfNeeded();
      assert.ok(await page.locator(".task-card").last().isVisible());
      assert.ok((await page.locator(".sticky-progress").boundingBox()).y < 2);
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
      );
      await page.screenshot({
        path: `${artifacts}/track-twelve-mobile.png`,
        fullPage: true,
      });
      await route("/pages/parent/index?section=settings");
      await page.locator("textarea").last().fill(JSON.stringify(before));
      await button("校验并恢复备份").click();
      await confirmDialog("确认恢复");
      await visible("备份恢复成功");
    },
  );
  await record(
    "parent sound and reduced-motion switches persist and disable track motion",
    async () => {
      await route("/pages/parent/index?section=settings");
      await page.getByRole("switch", { name: "赛车音效", exact: true }).click();
      await page
        .getByRole("switch", { name: "减少动态效果", exact: true })
        .click();
      await page.waitForTimeout(150);
      const s = await snapshot();
      assert.equal(s.parentPreferences.soundsEnabled, false);
      assert.equal(s.parentPreferences.reduceMotion, true);
      await page.emulateMedia({ reducedMotion: "no-preference" });
      await route("/pages/racing/index");
      assert.equal(await page.locator(".track-car.no-motion").count(), 1);
      assert.equal(
        await page
          .locator(".track-car")
          .evaluate((el) => getComputedStyle(el).transitionDuration),
        "0s",
      );
    },
  );
  await record(
    "existing mathematics, pinyin, English and challenge routes still load",
    async () => {
      for (const [path, text] of [
        ["/pages/math/practice/index", "数学"],
        ["/pages/pinyin/index", "拼音"],
        ["/pages/english/flashcard/index", "英语"],
        ["/pages/math/challenge/index", "闯关"],
      ]) {
        await route(path);
        await visible(text);
      }
    },
  );
  await record(
    "corrupted storage is preserved and can be recovered through parent backup tools",
    async () => {
      const valid = JSON.stringify(await snapshot());
      await page.evaluate((k) => localStorage.setItem(k, "{damaged"), key);
      await page.reload({ waitUntil: "networkidle" });
      await route("/pages/racing/index");
      await visible("成长数据无法读取");
      assert.equal(
        await page.evaluate((k) => localStorage.getItem(k), key),
        "{damaged",
      );
      await route("/pages/parent/index?section=settings", false);
      await unlock();
      await page.locator("textarea").last().fill(valid);
      await button("校验并恢复备份").click();
      await confirmDialog("确认恢复");
      await visible("备份恢复成功");
      assert.equal(
        (await snapshot()).pointTransactions.reduce((n, t) => n + t.amount, 0),
        4,
      );
    },
  );
  await record(
    "parent PIN recovery changes credentials without clearing growth records",
    async () => {
      await button("退出家长模式").click();
      await route("/pages/parent/index", false);
      await button("忘记 PIN？使用恢复码").click();
      const credential = await page.evaluate(() =>
        JSON.parse(localStorage.getItem("kidbridge-racing-parent-v1")),
      );
      // The real recovery code was shown only during setup; saved in this isolated test's memory.
      await page.locator("input").nth(0).fill(testRecovery);
      await page.locator("input").nth(1).fill("654321");
      await page.locator("input").nth(2).fill("654321");
      await button("重设并进入").click();
      await visible("陪孩子，一起向前");
      const after = await page.evaluate(() =>
        JSON.parse(localStorage.getItem("kidbridge-racing-parent-v1")),
      );
      assert.notEqual(after.pinHash, credential.pinHash);
      assert.equal((await snapshot()).dailyTasks.length, 2);
    },
  );
  assert.deepEqual(errors, [], "browser runtime errors");
  await writeFile(
    `${artifacts}/results.json`,
    JSON.stringify({ passed: results, errors }, null, 2),
  );
  console.log(
    `Passed ${results.length} browser scenarios. Artifacts: ${artifacts}`,
  );
} catch (e) {
  await page.screenshot({ path: `${artifacts}/failure.png`, fullPage: true });
  await writeFile(
    `${artifacts}/failure.txt`,
    `${e.stack}\nPage errors: ${JSON.stringify(errors)}\n${await page.locator("body").innerText()}`,
  );
  throw e;
} finally {
  await browser.close();
  if (!liveUrl) await new Promise((r) => server.close(r));
}

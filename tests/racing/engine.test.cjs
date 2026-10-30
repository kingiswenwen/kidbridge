const { test } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const {
  initialState,
  transition,
  balance,
  raceProgress,
  parseState,
  commitCommand,
  validDate,
} = require(path.join(process.env.RACING_TEST_DIR, "engine.cjs"));
const { sha256 } = require(path.join(process.env.RACING_TEST_DIR, "pin.cjs"));
function fixture() {
  let count = 0;
  let state = initialState(1000);
  const ctx = {
    now: 2000,
    today: "2026-10-29",
    parent: true,
    id: () => `id-${++count}`,
  };
  function run(command) {
    state = transition(state, command, ctx);
    return state;
  }
  const input = {
    title: "整理玩具",
    description: "把玩具送回家",
    steps: ["收好积木"],
    icon: "toy",
    category: "chores",
    schedule: { kind: "daily" },
    timeSlot: "anytime",
    occurrenceKey: "one",
    points: 2,
    checkMode: "parent",
    enabled: true,
    sortOrder: 0,
  };
  function add(patch = {}) {
    run({ type: "saveTask", input: { ...input, ...patch } });
    return state.taskDefinitions.at(-1).id;
  }
  function today() {
    run({ type: "ensure", date: ctx.today });
    return state.dailyTasks.filter((t) => t.date === ctx.today);
  }
  function earn(n = 1) {
    for (let i = 0; i < n; i++) add({ checkMode: "self", points: 3 });
    for (const t of today())
      if (t.status === "pending") run({ type: "submit", id: t.id });
  }
  function reward(cost = 3) {
    run({
      type: "saveReward",
      input: {
        title: "一起去公园",
        description: "周末和家长一起",
        icon: "family",
        type: "real_world",
        cost,
        enabled: true,
      },
    });
    return state.rewards.at(-1).id;
  }
  return {
    ctx,
    run,
    add,
    today,
    earn,
    reward,
    get state() {
      return state;
    },
  };
}
test("SHA-256 matches standard vectors on both platforms", () => {
  assert.equal(
    sha256("abc"),
    "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
  );
  assert.equal(
    sha256(""),
    "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  );
});
test("recurrence uses local days, generates once, retains history and supports Sunday", () => {
  const f = fixture();
  f.add();
  f.add({ schedule: { kind: "weekly", weekdays: [0] } });
  f.add({ schedule: { kind: "once", date: "2026-10-29" } });
  assert.equal(f.today().length, 2);
  const s = f.state;
  f.today();
  assert.equal(f.state, s);
  f.ctx.today = "2026-11-01";
  assert.equal(f.today().length, 2);
  assert.equal(f.state.dailyTasks.length, 4);
  f.ctx.today = "2026-10-29";
  assert.equal(f.today().length, 2);
  assert.equal(f.state.dailyTasks.length, 4);
});
test("duplicate names and morning/evening occurrences remain independent", () => {
  const f = fixture();
  f.add({ occurrenceKey: "morning" });
  f.add({ occurrenceKey: "evening" });
  assert.equal(new Set(f.today().map((t) => t.id)).size, 2);
});
test("submission never moves a parent-approved track or earns early; repeated submit/approve are idempotent", () => {
  const f = fixture();
  f.add();
  const t = f.today()[0];
  f.ctx.parent = false;
  f.run({ type: "submit", id: t.id });
  f.run({ type: "submit", id: t.id });
  assert.equal(balance(f.state), 0);
  assert.equal(raceProgress(f.state, f.ctx.today).completed, 0);
  assert.equal(f.state.dailyTasks[0].submission, 1);
  assert.throws(() => f.run({ type: "approve", id: t.id }), /验证/);
  f.ctx.parent = true;
  f.run({ type: "approve", id: t.id });
  const s = f.state;
  f.run({ type: "approve", id: t.id });
  assert.equal(f.state, s);
  assert.equal(balance(f.state), 2);
  assert.equal(f.state.feedbackEvents.length, 1);
});
test("rejection preserves audit trail and allows resubmit with one final award", () => {
  const f = fixture();
  f.add();
  const t = f.today()[0];
  f.run({ type: "submit", id: t.id });
  f.run({ type: "reject", id: t.id });
  assert.equal(balance(f.state), 0);
  f.run({ type: "submit", id: t.id });
  f.run({ type: "approve", id: t.id });
  assert.equal(f.state.dailyTasks[0].submission, 2);
  assert.equal(
    f.state.auditEvents.filter((e) => e.type === "rejected").length,
    1,
  );
  assert.equal(balance(f.state), 2);
});
test("zero-star tasks advance; skipped tasks leave denominator; no empty finish", () => {
  const f = fixture();
  f.add({ points: 0, checkMode: "self" });
  f.add();
  const [a, b] = f.today();
  f.run({ type: "submit", id: a.id });
  f.run({ type: "skip", id: b.id });
  assert.deepEqual(raceProgress(f.state, f.ctx.today), {
    total: 1,
    completed: 1,
    finished: true,
    percent: 100,
  });
  assert.equal(balance(f.state), 0);
  assert.equal(raceProgress(initialState(), f.ctx.today).finished, false);
  assert.throws(() => f.run({ type: "skip", id: a.id }), /已完成/);
});
test("all skipped is rest, not a finish", () => {
  const f = fixture();
  f.add();
  f.run({ type: "skip", id: f.today()[0].id });
  assert.equal(raceProgress(f.state, f.ctx.today).finished, false);
});
test("approval of yesterday affects yesterday only; old pending child submission is refused", () => {
  const f = fixture();
  f.add();
  const t = f.today()[0];
  f.run({ type: "submit", id: t.id });
  f.ctx.today = "2026-10-30";
  f.today();
  f.run({ type: "approve", id: t.id });
  assert.equal(balance(f.state), 2);
  assert.equal(raceProgress(f.state, f.ctx.today).completed, 0);
  assert.equal(f.state.feedbackEvents[0].date, "2026-10-29");
  assert.throws(() => f.run({ type: "submit", id: t.id }), /以前/);
});
test("edits do not rewrite daily snapshots unless explicitly applied; completed history is immutable", () => {
  const f = fixture();
  const id = f.add();
  const t = f.today()[0];
  f.run({ type: "saveTask", id, input: { ...t, title: "新的任务" } });
  assert.equal(f.state.dailyTasks[0].title, "整理玩具");
  f.run({
    type: "saveTask",
    id,
    input: {
      ...t,
      title: "新的任务",
      timeSlot: "evening",
      occurrenceKey: "changed",
    },
    applyToday: true,
  });
  assert.equal(f.state.dailyTasks[0].id, t.id);
  assert.equal(f.state.dailyTasks[0].title, "新的任务");
  f.run({ type: "submit", id: t.id });
  f.run({ type: "approve", id: t.id });
  assert.throws(
    () => f.run({ type: "saveTask", id, input: t, applyToday: true }),
    /覆盖历史/,
  );
  assert.equal(balance(f.state), 2);
});
test("task cap enforced for future schedules as well as today, with valid zero and Sunday rules", () => {
  const f = fixture();
  for (let i = 0; i < 12; i++) f.add();
  assert.equal(f.today().length, 12);
  assert.throws(() => f.add(), /12/);
  assert.equal(f.state.taskDefinitions.length, 12);
  assert.equal(validDate("2026-02-30"), false);
  assert.throws(
    () => f.add({ schedule: { kind: "weekly", weekdays: [] } }),
    /星期/,
  );
  assert.throws(() => f.add({ points: -1 }), /0–3/);
});
test("digital item is owned once, cannot equip unowned or charge insufficient funds", () => {
  const f = fixture();
  assert.throws(() => f.run({ type: "buy", id: "color-mint" }), /星星/);
  assert.throws(() => f.run({ type: "equip", colorId: "color-mint" }), /解锁/);
  f.earn(4);
  f.run({ type: "buy", id: "color-mint" });
  const s = f.state;
  f.run({ type: "buy", id: "color-mint" });
  assert.equal(f.state, s);
  assert.equal(balance(f.state), 2);
  f.run({ type: "equip", colorId: "color-mint" });
  assert.equal(f.state.garage.equipped.colorId, "color-mint");
});
test("request does not charge or reserve; duplicate open request does not duplicate; approval rechecks balance", () => {
  const f = fixture();
  f.earn(4);
  const id = f.reward(10);
  f.run({ type: "request", id });
  const r = f.state.redemptions[0];
  f.run({ type: "request", id });
  assert.equal(f.state.redemptions.length, 1);
  assert.equal(balance(f.state), 12);
  f.run({ type: "buy", id: "color-mint" });
  assert.throws(() => f.run({ type: "approveReward", id: r.id }), /星星/);
  assert.equal(f.state.redemptions[0].status, "requested");
  assert.equal(balance(f.state), 2);
});
test("reject has no charge; approve/cancel refunds once; fulfill never charges twice or refunds", () => {
  const f = fixture();
  f.earn(4);
  const id = f.reward();
  f.run({ type: "request", id });
  f.run({ type: "rejectReward", id: f.state.redemptions[0].id });
  assert.equal(balance(f.state), 12);
  f.run({ type: "request", id });
  const r = f.state.redemptions.at(-1);
  f.run({ type: "approveReward", id: r.id });
  f.run({ type: "approveReward", id: r.id });
  assert.equal(balance(f.state), 9);
  f.run({ type: "cancelReward", id: r.id });
  f.run({ type: "cancelReward", id: r.id });
  assert.equal(balance(f.state), 12);
  f.run({ type: "request", id });
  const r2 = f.state.redemptions.at(-1);
  f.run({ type: "approveReward", id: r2.id });
  f.run({ type: "fulfillReward", id: r2.id });
  f.run({ type: "fulfillReward", id: r2.id });
  assert.equal(balance(f.state), 9);
  assert.throws(() => f.run({ type: "cancelReward", id: r2.id }), /尚未兑现/);
});
test("reward edits preserve requested price snapshot; disabled rewards retain history and owned items", () => {
  const f = fixture();
  f.earn(4);
  const id = f.reward(3);
  f.run({ type: "request", id });
  const r = f.state.redemptions[0];
  f.run({
    type: "saveReward",
    id,
    input: {
      ...f.state.rewards.find((r) => r.id === id),
      cost: 10,
      enabled: false,
    },
  });
  f.run({ type: "approveReward", id: r.id });
  assert.equal(balance(f.state), 9);
  assert.throws(() => f.run({ type: "request", id }), /停用/);
  assert.equal(f.state.redemptions[0].costSnapshot, 3);
});
test("feedback acknowledgment cannot invent events or change ledger; celebration remembered once", () => {
  const f = fixture();
  f.earn();
  const ids = f.state.feedbackEvents.map((x) => x.id);
  f.run({
    type: "feedback",
    ids: [...ids, "fake"],
    celebratedDate: f.ctx.today,
  });
  f.run({ type: "feedback", ids, celebratedDate: f.ctx.today });
  assert.equal(balance(f.state), 3);
  assert.equal(f.state.playedFeedbackEventIds.length, 1);
  assert.equal(f.state.celebratedDates.length, 1);
});
test("failed storage write leaves caller state and stored snapshot unchanged, successful retry earns once", () => {
  const f = fixture();
  f.add({ checkMode: "self" });
  const t = f.today()[0];
  let raw = JSON.stringify(f.state);
  let fail = true;
  const storage = {
    getItem: () => raw,
    setItem: (v) => {
      if (fail) throw new Error("quota");
      raw = v;
    },
  };
  const before = raw;
  assert.throws(
    () => commitCommand(storage, f.state, { type: "submit", id: t.id }, f.ctx),
    /quota/,
  );
  assert.equal(raw, before);
  assert.equal(balance(f.state), 0);
  fail = false;
  const next = commitCommand(
    storage,
    f.state,
    { type: "submit", id: t.id },
    f.ctx,
  );
  const again = commitCommand(
    storage,
    next,
    { type: "submit", id: t.id },
    f.ctx,
  );
  assert.equal(balance(again), 2);
});
test("serialized writers reread storage so two purchases cannot overspend from stale snapshots", () => {
  const f = fixture();
  f.earn(4);
  let raw = JSON.stringify(f.state);
  const storage = { getItem: () => raw, setItem: (v) => (raw = v) };
  commitCommand(storage, f.state, { type: "buy", id: "color-mint" }, f.ctx);
  assert.throws(
    () =>
      commitCommand(
        storage,
        f.state,
        { type: "buy", id: "sticker-star" },
        f.ctx,
      ),
    /星星/,
  );
  assert.equal(balance(parseState(raw)), 2);
});
test("backup round trip retains tasks, ledger, equipment, pending exchange and audit", () => {
  const f = fixture();
  f.earn(4);
  f.run({ type: "buy", id: "sticker-star" });
  f.run({ type: "equip", colorId: "color-coral", stickerId: "sticker-star" });
  const id = f.reward(3);
  f.run({ type: "request", id });
  assert.deepEqual(parseState(JSON.stringify(f.state)), f.state);
});
test("corrupt/unknown/duplicate/negative/inconsistent imports are refused", () => {
  const f = fixture();
  f.earn();
  const valid = JSON.stringify(f.state);
  for (const mutate of [
    (s) => (s.schemaVersion = 2),
    (s) => s.pointTransactions.push({ ...s.pointTransactions[0], id: "new" }),
    (s) => (s.pointTransactions[0].amount = -9),
    (s) => (s.garage.equipped.colorId = "color-sky"),
    (s) => (s.dailyTasks[0].points = 2),
    (s) => (s.auditEvents[0].at = "bad"),
    (s) => (s.feedbackEvents[0].date = "2026-02-30"),
  ]) {
    const s = JSON.parse(valid);
    mutate(s);
    assert.throws(() => parseState(JSON.stringify(s)));
  }
  assert.throws(() => parseState("{broken"));
  assert.throws(() => parseState(JSON.stringify({ schemaVersion: 1 })));
});
test("authorization applies to every parent mutation independently of page guards", () => {
  const f = fixture();
  const id = f.add();
  f.ctx.parent = false;
  assert.throws(
    () => f.run({ type: "saveTask", id, input: f.state.taskDefinitions[0] }),
    /验证/,
  );
  assert.throws(
    () =>
      f.run({ type: "preferences", soundsEnabled: false, reduceMotion: true }),
    /验证/,
  );
  assert.throws(() => f.reward(), /验证/);
});
test("earned trophies stay earned when a parent adds a task after finishing", () => {
  const f = fixture();
  f.earn();
  const earned = f.state.achievements.firstRaceAt;
  assert.ok(earned);
  const id = f.add();
  f.run({ type: "addToday", definitionId: id });
  assert.equal(raceProgress(f.state, f.ctx.today).finished, false);
  assert.equal(
    parseState(JSON.stringify(f.state)).achievements.firstRaceAt,
    earned,
  );
});
test("additive v1 migration reconstructs trophies from older validated local snapshots", () => {
  const f = fixture();
  f.earn();
  const raw = JSON.parse(JSON.stringify(f.state));
  delete raw.achievements;
  const migrated = parseState(JSON.stringify(raw));
  assert.ok(migrated.achievements.firstTaskAt);
  assert.ok(migrated.achievements.firstRaceAt);
  assert.equal(balance(migrated), 3);
});
test("editor payload cannot replace a stable definition id or inject task completion", () => {
  const f = fixture();
  const id = f.add();
  const [task] = f.today();
  f.run({
    type: "saveTask",
    id,
    input: { ...task, id: "injected", title: "新的名字", status: "completed" },
    applyToday: true,
  });
  assert.equal(f.state.taskDefinitions[0].id, id);
  assert.equal(f.state.dailyTasks[0].status, "pending");
  assert.equal(balance(f.state), 0);
});

test("cleared storage cannot silently resurrect a stale in-memory ledger", () => {
  const f = fixture();
  f.earn();
  let wrote = false;
  assert.throws(
    () =>
      commitCommand(
        {
          getItem: () => null,
          setItem: () => {
            wrote = true;
          },
        },
        f.state,
        { type: "ensure", date: f.ctx.today },
        f.ctx,
      ),
    /清理/,
  );
  assert.equal(wrote, false);
  assert.equal(balance(f.state), 3);
});

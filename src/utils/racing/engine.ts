import type {
  DailyTask,
  RacingCommand,
  RacingState,
  RewardInput,
  TaskDefinition,
  TaskInput,
} from "../../types/racing";
import { defaultRewards } from "../../data/racing/catalog";

export const STORAGE_KEY = "kidbridge-racing-storage-v1";
export function localDate(now = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}
export function validDate(date: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const [y, m, d] = date.split("-").map(Number);
  const value = new Date(y, m - 1, d);
  return (
    value.getFullYear() === y &&
    value.getMonth() === m - 1 &&
    value.getDate() === d
  );
}
export function initialState(now = Date.now()): RacingState {
  return {
    schemaVersion: 1,
    revision: 0,
    initializedAt: now,
    generatedDates: [],
    taskDefinitions: [],
    dailyTasks: [],
    pointTransactions: [],
    rewards: JSON.parse(JSON.stringify(defaultRewards)),
    redemptions: [],
    auditEvents: [],
    garage: {
      ownedItemIds: ["color-coral"],
      equipped: { colorId: "color-coral" },
    },
    feedbackEvents: [],
    playedFeedbackEventIds: [],
    celebratedDates: [],
    achievements: {},
    parentPreferences: { soundsEnabled: true, reduceMotion: false },
  };
}
export function balance(s: RacingState): number {
  return s.pointTransactions.reduce((n, t) => n + t.amount, 0);
}
export function raceProgress(s: RacingState, date: string) {
  const tasks = s.dailyTasks.filter(
    (t) => t.date === date && t.status !== "skipped",
  );
  const completed = tasks.filter((t) => t.status === "completed").length;
  return {
    total: tasks.length,
    completed,
    finished: tasks.length > 0 && tasks.length === completed,
    percent: tasks.length ? (completed / tasks.length) * 100 : 0,
  };
}
function assert(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}
function unique(items: string[]) {
  return new Set(items).size === items.length;
}
function taskFields(t: TaskInput): TaskInput {
  const {
    title,
    description,
    steps,
    icon,
    category,
    schedule,
    timeSlot,
    occurrenceKey,
    points,
    checkMode,
    enabled,
    sortOrder,
  } = t;
  return JSON.parse(
    JSON.stringify({
      title,
      description,
      steps,
      icon,
      category,
      schedule,
      timeSlot,
      occurrenceKey,
      points,
      checkMode,
      enabled,
      sortOrder,
    }),
  );
}
function isText(value: unknown, max: number) {
  return typeof value === "string" && value.length <= max;
}
export function validateTask(t: TaskInput) {
  assert(
    t && isText(t.title, 12) && t.title.trim(),
    "任务名称请填写 1–12 个字",
  );
  assert(
    isText(t.description, 120) &&
      Array.isArray(t.steps) &&
      t.steps.length <= 3 &&
      t.steps.every((x) => isText(x, 60)),
    "说明最多 120 字，步骤最多 3 项、每项 60 字",
  );
  assert(
    Number.isInteger(t.points) && t.points >= 0 && t.points <= 3,
    "任务星星须为 0–3 的整数",
  );
  assert(["parent", "self"].includes(t.checkMode), "请选择家长审核或自助确认");
  assert(
    ["morning", "afternoon", "evening", "anytime"].includes(t.timeSlot),
    "请选择任务时段",
  );
  assert(
    ["life", "learning", "exercise", "chores", "family"].includes(t.category),
    "请选择任务类别",
  );
  assert(
    isText(t.icon, 30) &&
      t.icon.length > 0 &&
      isText(t.occurrenceKey, 40) &&
      t.occurrenceKey.length > 0 &&
      typeof t.enabled === "boolean" &&
      Number.isInteger(t.sortOrder),
    "任务配置不完整",
  );
  const r = t.schedule;
  assert(r && ["daily", "weekly", "once"].includes(r.kind), "请选择重复周期");
  if (r.kind === "weekly")
    assert(
      Array.isArray(r.weekdays) &&
        r.weekdays.length > 0 &&
        unique(r.weekdays.map(String)) &&
        r.weekdays.every((d) => Number.isInteger(d) && d >= 0 && d <= 6),
      "请至少选择一个星期",
    );
  if (r.kind === "once") assert(validDate(r.date), "请选择有效日期");
}
export function validateReward(r: RewardInput) {
  assert(
    r && isText(r.title, 24) && r.title.trim() && isText(r.description, 160),
    "奖励名称为 1–24 字，约定最多 160 字",
  );
  assert(
    Number.isInteger(r.cost) && r.cost >= 0 && r.cost <= 9999,
    "价格须为 0–9999 星的整数",
  );
  assert(
    ["cosmetic", "real_world"].includes(r.type) &&
      typeof r.enabled === "boolean" &&
      isText(r.icon, 30),
    "奖励配置不完整",
  );
  if (r.type === "cosmetic")
    assert(
      ["color", "sticker", "wheel"].includes(r.cosmeticSlot || "") &&
        {
          color: ["coral", "mint", "sky", "gold"],
          sticker: ["star", "flower"],
          wheel: ["sky"],
        }[r.cosmeticSlot!]?.includes(r.assetId || ""),
      "装扮资源无效",
    );
}
export function matches(t: TaskInput, date: string) {
  if (!t.enabled) return false;
  const r = t.schedule;
  const [y, m, d] = date.split("-").map(Number);
  return (
    r.kind === "daily" ||
    (r.kind === "once"
      ? r.date === date
      : r.weekdays.includes(new Date(y, m - 1, d).getDay()))
  );
}
function instance(t: TaskDefinition, date: string): DailyTask {
  return {
    ...JSON.parse(JSON.stringify(t)),
    id: `${date}:${t.id}:${t.occurrenceKey}`,
    definitionId: t.id,
    date,
    status: "pending",
    submission: 0,
  };
}
export interface EngineContext {
  now: number;
  today: string;
  parent: boolean;
  id: () => string;
}
/** Pure transaction: caller persists this complete snapshot before publishing UI success. */
export function transition(
  current: RacingState,
  command: RacingCommand,
  ctx: EngineContext,
): RacingState {
  const s: RacingState = JSON.parse(JSON.stringify(current));
  const before = JSON.stringify(s);
  const { now, today, parent, id } = ctx;
  assert(validDate(today), "设备日期无效");
  const needParent = [
    "saveTask",
    "addToday",
    "approve",
    "reject",
    "skip",
    "saveReward",
    "approveReward",
    "rejectReward",
    "cancelReward",
    "fulfillReward",
    "preferences",
  ].includes(command.type);
  assert(!needParent || parent, "请先进入家长中心完成验证");
  const audit = (entityId: string, type: string, note: string) =>
    s.auditEvents.push({ id: id(), entityId, type, at: now, note });
  const ledger = (
    sourceId: string,
    amount: number,
    type: "earn" | "redeem" | "refund",
    note: string,
  ) => {
    if (s.pointTransactions.some((t) => t.sourceId === sourceId)) return;
    assert(balance(s) + amount >= 0, "星星不够啦，先完成更多任务吧");
    s.pointTransactions.push({
      id: id(),
      sourceId,
      amount,
      type,
      createdAt: now,
      note,
    });
  };
  const add = (t: TaskDefinition, date: string) => {
    const task = instance(t, date);
    if (s.dailyTasks.some((x) => x.id === task.id)) return;
    assert(
      s.dailyTasks.filter((x) => x.date === date && x.status !== "skipped")
        .length < 12,
      "一天最多安排 12 项任务，请先调整任务",
    );
    s.dailyTasks.push(task);
  };
  const finish = (task: DailyTask) => {
    task.status = "completed";
    task.completedAt = now;
    task.approvedBy = parent && command.type === "approve" ? "parent" : "self";
    ledger(`earn:${task.id}`, task.points, "earn", task.title);
    const eventId = `complete:${task.id}`;
    s.feedbackEvents.push({
      id: eventId,
      date: task.date,
      points: task.points,
      taskTitle: task.title,
    });
    audit(task.id, "completed", `${task.title}，获得 ${task.points} 星`);
  };
  switch (command.type) {
    case "ensure": {
      assert(
        validDate(command.date) && command.date === today,
        "只能生成设备本地今天的任务",
      );
      if (s.generatedDates.includes(today)) break;
      for (const t of s.taskDefinitions
        .filter((t) => matches(t, today))
        .sort((a, b) => a.sortOrder - b.sortOrder))
        add(t, today);
      s.generatedDates.push(today);
      break;
    }
    case "saveTask": {
      validateTask(command.input);
      const input = taskFields(command.input);
      let t = s.taskDefinitions.find((t) => t.id === command.id);
      if (command.id) assert(t, "任务模板不存在");
      if (t) {
        // occurrenceKey identifies a recurrence; changing time slot must not create a second copy today.
        const occurrenceKey = t.occurrenceKey;
        Object.assign(t, input, {
          occurrenceKey,
          title: input.title.trim(),
          updatedAt: now,
        });
      } else {
        t = {
          ...input,
          title: input.title.trim(),
          id: id(),
          createdAt: now,
          updatedAt: now,
        };
        s.taskDefinitions.push(t);
      }
      // Reject future schedules that could overflow a 12-station day, not just today's instance.
      const daily = s.taskDefinitions.filter(
        (x) => x.enabled && x.schedule.kind === "daily",
      ).length;
      for (let weekday = 0; weekday < 7; weekday++)
        assert(
          daily +
            s.taskDefinitions.filter(
              (x) =>
                x.enabled &&
                x.schedule.kind === "weekly" &&
                x.schedule.weekdays.includes(weekday),
            ).length <=
            12,
          "重复日程超过每日 12 项上限",
        );
      const dates = new Set(
        s.taskDefinitions.flatMap((x) =>
          x.enabled && x.schedule.kind === "once" ? [x.schedule.date] : [],
        ),
      );
      for (const date of dates)
        assert(
          s.taskDefinitions.filter((x) => matches(x, date)).length <= 12,
          "单次日期超过每日 12 项上限",
        );
      if (command.applyToday) {
        const old = s.dailyTasks.find(
          (x) => x.date === today && x.definitionId === t!.id,
        );
        if (old) {
          assert(
            old.status === "pending",
            "今天的任务已提交或结束，不能覆盖历史，请先退回或保留原记录",
          );
          const snapshot = instance(t, today);
          Object.assign(old, snapshot, {
            id: old.id,
            submission: old.submission,
          });
          if (!t.enabled) {
            old.status = "skipped";
            old.skippedAt = now;
          }
        } else if (matches(t, today)) add(t, today);
      }
      audit(
        t.id,
        "task_saved",
        `${t.title}${command.applyToday ? "，应用到今天" : "，用于未来日程"}`,
      );
      break;
    }
    case "addToday": {
      const t = s.taskDefinitions.find((t) => t.id === command.definitionId);
      assert(t && t.enabled, "任务不存在或已停用");
      add(t, today);
      audit(t.id, "added_today", t.title);
      break;
    }
    case "submit":
    case "approve":
    case "reject":
    case "skip": {
      const t = s.dailyTasks.find((t) => t.id === command.id);
      assert(t, "找不到这个任务");
      if (command.type === "submit") {
        assert(t.date === today, "这是以前的任务，请回到今日赛道");
        if (t.status !== "pending") break;
        t.submission++;
        t.submittedAt = now;
        if (t.checkMode === "self") finish(t);
        else {
          t.status = "submitted";
          audit(t.id, "submitted", `${t.title}，第 ${t.submission} 次提交`);
        }
      } else if (command.type === "approve") {
        if (t.status === "completed") break;
        assert(t.status === "submitted", "只有已提交任务才能审核");
        finish(t);
      } else if (command.type === "reject") {
        assert(t.status === "submitted", "任务已处理，请刷新");
        t.status = "pending";
        audit(t.id, "rejected", `${t.title}，再试一次`);
      } else {
        if (t.status === "skipped") break;
        assert(t.status !== "completed", "已完成任务不能跳过");
        t.status = "skipped";
        t.skippedAt = now;
        audit(t.id, "skipped", `${t.title}，今天先休息`);
      }
      break;
    }
    case "saveReward": {
      validateReward(command.input);
      const {
        title,
        icon,
        type,
        cost,
        enabled,
        description,
        cosmeticSlot,
        assetId,
      } = command.input;
      const input = {
        title: title.trim(),
        icon,
        type,
        cost,
        enabled,
        description,
        cosmeticSlot,
        assetId,
      };
      const old = s.rewards.find((r) => r.id === command.id);
      if (command.id) assert(old, "奖励不存在");
      if (old) {
        assert(old.type === input.type, "不能更改奖励类型");
        Object.assign(old, input);
      } else {
        assert(
          input.type === "real_world",
          "家长可新建生活奖励，赛车素材由系统提供",
        );
        s.rewards.push({ ...input, id: id() });
      }
      audit(
        command.id || s.rewards[s.rewards.length - 1].id,
        "reward_saved",
        command.input.title,
      );
      break;
    }
    case "buy":
    case "request": {
      const r = s.rewards.find((r) => r.id === command.id);
      assert(r && r.enabled, "奖励已停用或不存在");
      if (command.type === "buy") {
        assert(r.type === "cosmetic", "请选择赛车装扮");
        if (s.garage.ownedItemIds.includes(r.id)) break;
        ledger(`buy:${r.id}`, -r.cost, "redeem", r.title);
        s.garage.ownedItemIds.push(r.id);
        audit(r.id, "cosmetic_bought", r.title);
      } else {
        assert(r.type === "real_world", "请选择生活奖励");
        if (
          s.redemptions.some(
            (x) =>
              x.rewardId === r.id &&
              ["requested", "approved"].includes(x.status),
          )
        )
          break;
        assert(balance(s) >= r.cost, "星星还不够，先完成更多任务吧");
        const request = {
          id: id(),
          rewardId: r.id,
          rewardTitleSnapshot: r.title,
          costSnapshot: r.cost,
          status: "requested" as const,
          requestedAt: now,
        };
        s.redemptions.push(request);
        audit(request.id, "reward_requested", r.title);
      }
      break;
    }
    case "approveReward":
    case "rejectReward":
    case "cancelReward":
    case "fulfillReward": {
      const r = s.redemptions.find((r) => r.id === command.id);
      assert(r, "找不到兑换申请");
      if (command.type === "approveReward") {
        if (r.status === "approved" || r.status === "fulfilled") break;
        assert(r.status === "requested", "申请已经处理");
        ledger(
          `redeem:${r.id}`,
          -r.costSnapshot,
          "redeem",
          r.rewardTitleSnapshot,
        );
        r.status = "approved";
        r.approvedAt = now;
      } else if (command.type === "rejectReward") {
        assert(r.status === "requested", "申请已经处理");
        r.status = "rejected";
      } else if (command.type === "cancelReward") {
        if (r.status === "cancelled") break;
        assert(r.status === "approved", "只能取消已批准但尚未兑现的奖励");
        ledger(
          `refund:${r.id}`,
          r.costSnapshot,
          "refund",
          r.rewardTitleSnapshot,
        );
        r.status = "cancelled";
        r.cancelledAt = now;
      } else {
        if (r.status === "fulfilled") break;
        assert(r.status === "approved", "请先批准兑换");
        r.status = "fulfilled";
        r.fulfilledAt = now;
      }
      audit(r.id, command.type, r.rewardTitleSnapshot);
      break;
    }
    case "equip": {
      for (const [slot, itemId] of Object.entries({
        color: command.colorId,
        sticker: command.stickerId,
        wheel: command.wheelId,
      })) {
        if (!itemId) {
          assert(slot !== "color", "请选择车漆");
          continue;
        }
        assert(
          s.garage.ownedItemIds.includes(itemId) &&
            s.rewards.some((r) => r.id === itemId && r.cosmeticSlot === slot),
          "请先解锁对应装扮",
        );
      }
      s.garage.equipped = {
        colorId: command.colorId,
        stickerId: command.stickerId,
        wheelId: command.wheelId,
      };
      break;
    }
    case "feedback": {
      const known = new Set(s.feedbackEvents.map((e) => e.id));
      s.playedFeedbackEventIds = [
        ...new Set([
          ...s.playedFeedbackEventIds,
          ...command.ids.filter((x) => known.has(x)),
        ]),
      ];
      if (
        command.celebratedDate &&
        raceProgress(s, command.celebratedDate).finished &&
        !s.celebratedDates.includes(command.celebratedDate)
      )
        s.celebratedDates.push(command.celebratedDate);
      break;
    }
    case "preferences": {
      assert(
        typeof command.soundsEnabled === "boolean" &&
          typeof command.reduceMotion === "boolean",
        "设置格式不正确",
      );
      if (command.targetRewardId)
        assert(
          s.rewards.some((r) => r.id === command.targetRewardId && r.enabled),
          "请选择可用奖励",
        );
      s.parentPreferences = {
        soundsEnabled: command.soundsEnabled,
        reduceMotion: command.reduceMotion,
        targetRewardId: command.targetRewardId,
      };
      break;
    }
  }
  const completeCount = s.dailyTasks.filter(
    (t) => t.status === "completed",
  ).length;
  if (completeCount && !s.achievements.firstTaskAt)
    s.achievements.firstTaskAt = now;
  if (completeCount >= 10 && !s.achievements.tenTasksAt)
    s.achievements.tenTasksAt = now;
  if (
    !s.achievements.firstRaceAt &&
    s.generatedDates.some((date) => raceProgress(s, date).finished)
  )
    s.achievements.firstRaceAt = now;
  if (JSON.stringify(s) === before) return current;
  s.revision++;
  return s;
}

/** Imports are untrusted: fully validate shape, references, ledger and ownership before writing. */
export function parseState(raw: string): RacingState {
  assert(raw.length <= 8 * 1024 * 1024, "备份超过 8MB，请检查文件");
  let s: RacingState;
  try {
    s = JSON.parse(raw) as RacingState;
  } catch {
    throw new Error("备份不是有效 JSON，请选择或粘贴完整备份");
  }
  assert(
    s &&
      s.schemaVersion === 1 &&
      Number.isSafeInteger(s.revision) &&
      s.revision >= 0 &&
      Number.isFinite(s.initializedAt),
    "不支持的备份版本或结构",
  );
  for (const key of [
    "generatedDates",
    "taskDefinitions",
    "dailyTasks",
    "pointTransactions",
    "rewards",
    "redemptions",
    "auditEvents",
    "feedbackEvents",
    "playedFeedbackEventIds",
    "celebratedDates",
  ] as const)
    assert(Array.isArray(s[key]), "备份结构不完整");
  assert(
    s.generatedDates.every(validDate) &&
      unique(s.generatedDates) &&
      s.celebratedDates.every(validDate) &&
      unique(s.celebratedDates),
    "日期记录损坏",
  );
  for (const list of [
    s.taskDefinitions,
    s.dailyTasks,
    s.pointTransactions,
    s.rewards,
    s.redemptions,
    s.auditEvents,
    s.feedbackEvents,
  ])
    assert(
      list.every(
        (x) => x && typeof x === "object" && isText(x.id, 200) && x.id,
      ) && unique(list.map((x) => x.id)),
      "记录 ID 缺失或重复",
    );
  s.taskDefinitions.forEach((t) => {
    validateTask(t);
    assert(
      Number.isFinite(t.createdAt) && Number.isFinite(t.updatedAt),
      "模板时间错误",
    );
  });
  s.rewards.forEach(validateReward);
  s.dailyTasks.forEach((t) => {
    validateTask(t);
    assert(
      validDate(t.date) &&
        ["pending", "submitted", "completed", "skipped"].includes(t.status) &&
        Number.isInteger(t.submission) &&
        t.submission >= 0 &&
        s.taskDefinitions.some((d) => d.id === t.definitionId) &&
        t.id === `${t.date}:${t.definitionId}:${t.occurrenceKey}`,
      "每日任务快照损坏",
    );
    if (t.status === "completed")
      assert(
        Number.isFinite(t.completedAt) &&
          ["parent", "self"].includes(t.approvedBy || ""),
        "完成记录无效",
      );
    if (t.status === "submitted")
      assert(
        Number.isFinite(t.submittedAt) && t.submission > 0,
        "提交记录无效",
      );
  });
  assert(unique(s.pointTransactions.map((t) => t.sourceId)), "星星来源重复");
  let running = 0;
  s.pointTransactions.forEach((t) => {
    assert(
      isText(t.sourceId, 240) &&
        t.sourceId &&
        ["earn", "redeem", "refund", "adjust"].includes(t.type) &&
        Number.isSafeInteger(t.amount) &&
        Number.isFinite(t.createdAt) &&
        isText(t.note, 200),
      "星星流水无效",
    );
    running += t.amount;
    assert(running >= 0 && Number.isSafeInteger(running), "星星余额无效");
  });
  s.redemptions.forEach((r) => {
    assert(
      s.rewards.some((x) => x.id === r.rewardId && x.type === "real_world") &&
        isText(r.rewardTitleSnapshot, 24) &&
        Number.isInteger(r.costSnapshot) &&
        r.costSnapshot >= 0 &&
        r.costSnapshot <= 9999 &&
        [
          "requested",
          "approved",
          "fulfilled",
          "rejected",
          "cancelled",
        ].includes(r.status) &&
        Number.isFinite(r.requestedAt),
      "兑换记录无效",
    );
    if (["approved", "fulfilled", "cancelled"].includes(r.status))
      assert(
        Number.isFinite(r.approvedAt) &&
          s.pointTransactions.some(
            (t) =>
              t.sourceId === `redeem:${r.id}` &&
              t.amount === -r.costSnapshot &&
              t.type === "redeem",
          ),
        "兑换缺少扣费记录",
      );
    if (r.status === "cancelled")
      assert(
        Number.isFinite(r.cancelledAt) &&
          s.pointTransactions.some(
            (t) =>
              t.sourceId === `refund:${r.id}` &&
              t.amount === r.costSnapshot &&
              t.type === "refund",
          ),
        "取消缺少退款记录",
      );
    if (r.status === "fulfilled")
      assert(Number.isFinite(r.fulfilledAt), "兑现时间无效");
  });
  for (const t of s.dailyTasks.filter((t) => t.status === "completed"))
    assert(
      s.pointTransactions.some(
        (x) =>
          x.sourceId === `earn:${t.id}` &&
          x.type === "earn" &&
          x.amount === t.points,
      ),
      "完成任务缺少对应星星流水",
    );
  for (const transaction of s.pointTransactions) {
    if (transaction.type === "earn")
      assert(
        s.dailyTasks.some(
          (task) =>
            task.status === "completed" &&
            transaction.sourceId === `earn:${task.id}` &&
            transaction.amount === task.points,
        ),
        "星星收入缺少有效完成任务",
      );
    else if (transaction.type === "redeem") {
      const purchase = s.rewards.find(
        (reward) =>
          transaction.sourceId === `buy:${reward.id}` &&
          reward.type === "cosmetic",
      );
      assert(
        transaction.amount <= 0 &&
          (purchase
            ? s.garage?.ownedItemIds?.includes(purchase.id)
            : s.redemptions.some(
                (redemption) =>
                  transaction.sourceId === `redeem:${redemption.id}` &&
                  ["approved", "fulfilled", "cancelled"].includes(
                    redemption.status,
                  ) &&
                  transaction.amount === -redemption.costSnapshot,
              )),
        "星星消费缺少兑换记录",
      );
    } else if (transaction.type === "refund")
      assert(
        s.redemptions.some(
          (redemption) =>
            redemption.status === "cancelled" &&
            transaction.sourceId === `refund:${redemption.id}` &&
            transaction.amount === redemption.costSnapshot,
        ),
        "退款缺少取消记录",
      );
    else
      assert(
        transaction.note.trim() &&
          s.auditEvents.some(
            (event) =>
              event.entityId === transaction.sourceId &&
              event.type === "point_adjusted",
          ),
        "调整流水缺少原因与管理事件",
      );
  }
  assert(
    s.garage &&
      Array.isArray(s.garage.ownedItemIds) &&
      unique(s.garage.ownedItemIds) &&
      s.garage.equipped,
    "车库数据无效",
  );
  for (const item of s.garage.ownedItemIds)
    assert(
      s.rewards.some((r) => r.id === item && r.type === "cosmetic") &&
        (item === "color-coral" ||
          s.pointTransactions.some(
            (transaction) =>
              transaction.sourceId === `buy:${item}` &&
              transaction.type === "redeem",
          )),
      "装扮未知或缺少兑换流水",
    );
  for (const [slot, item] of Object.entries({
    color: s.garage.equipped.colorId,
    sticker: s.garage.equipped.stickerId,
    wheel: s.garage.equipped.wheelId,
  })) {
    if (!item) {
      assert(slot !== "color", "缺少基础赛车");
      continue;
    }
    assert(
      s.garage.ownedItemIds.includes(item) &&
        s.rewards.some((r) => r.id === item && r.cosmeticSlot === slot),
      "装备尚未拥有或类型不匹配",
    );
  }
  for (const e of s.feedbackEvents)
    assert(
      validDate(e.date) &&
        Number.isInteger(e.points) &&
        e.points >= 0 &&
        e.points <= 3 &&
        isText(e.taskTitle, 12) &&
        s.dailyTasks.some(
          (t) =>
            `complete:${t.id}` === e.id &&
            t.status === "completed" &&
            t.date === e.date,
        ),
      "完成反馈事件无效",
    );
  assert(
    unique(s.playedFeedbackEventIds) &&
      s.playedFeedbackEventIds.every((x) =>
        s.feedbackEvents.some((e) => e.id === x),
      ),
    "反馈记录损坏",
  );
  for (const e of s.auditEvents)
    assert(
      isText(e.entityId, 200) &&
        isText(e.type, 40) &&
        isText(e.note, 240) &&
        Number.isFinite(e.at),
      "历史记录无效",
    );
  assert(
    s.parentPreferences &&
      typeof s.parentPreferences.soundsEnabled === "boolean" &&
      typeof s.parentPreferences.reduceMotion === "boolean",
    "偏好设置损坏",
  );
  for (const date of new Set(s.dailyTasks.map((t) => t.date)))
    assert(raceProgress(s, date).total <= 12, "每日任务超过上限");
  // Additive v1 migration for early local snapshots: earned honours remain earned.
  if (!s.achievements) {
    const completed = s.dailyTasks.filter((t) => t.status === "completed");
    s.achievements = {};
    if (completed.length)
      s.achievements.firstTaskAt = Math.min(
        ...completed.map((t) => t.completedAt!),
      );
    if (completed.length >= 10)
      s.achievements.tenTasksAt = completed
        .map((t) => t.completedAt!)
        .sort((a, b) => a - b)[9];
    if (s.generatedDates.some((date) => raceProgress(s, date).finished))
      s.achievements.firstRaceAt = Math.max(
        s.initializedAt,
        ...completed.map((t) => t.completedAt!),
      );
  }
  assert(
    typeof s.achievements === "object" &&
      !Array.isArray(s.achievements) &&
      Object.values(s.achievements).every(
        (value) => Number.isFinite(value) && value > 0,
      ),
    "奖杯记录无效",
  );
  return s;
}

export interface SnapshotStorage {
  getItem: () => string | null;
  setItem: (value: string) => void;
}
/** Re-read under the platform lock; publish only after durable synchronous write succeeds. */
export function commitCommand(
  storage: SnapshotStorage,
  fallback: RacingState,
  command: RacingCommand,
  ctx: EngineContext,
): RacingState {
  const raw = storage.getItem();
  assert(
    raw || fallback.revision === 0,
    "成长数据已被清理，请先恢复备份，不能自动覆盖为旧状态",
  );
  const current = raw ? parseState(raw) : fallback;
  const next = transition(current, command, ctx);
  if (next !== current || !raw) {
    const serialized = JSON.stringify(next);
    assert(
      serialized.length <= 8 * 1024 * 1024,
      "成长记录接近存储上限，请先导出备份并联系维护者协助迁移",
    );
    storage.setItem(serialized);
  }
  return next;
}

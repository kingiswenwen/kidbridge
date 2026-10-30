import { computed, ref } from "vue";
import { defineStore } from "pinia";
import type { RacingCommand, RacingState } from "@/types/racing";
import {
  balance,
  commitCommand,
  initialState,
  localDate,
  parseState,
  raceProgress,
  STORAGE_KEY,
} from "@/utils/racing/engine";
import { newId, sha256 } from "@/utils/racing/pin";

const AUTH_KEY = "kidbridge-racing-parent-v1";
interface ParentCredential {
  salt: string;
  pinHash: string;
  recoveryHash: string;
  failures: number;
  lockedUntil: number;
}

export const useRacingStore = defineStore("racing", () => {
  const data = ref<RacingState>(initialState());
  const error = ref("");
  const busy = ref(false);
  const storageBlocked = ref(false);
  const today = ref(localDate());
  const sessionUntil = ref(0);
  const clock = ref(Date.now());
  const credential = ref<ParentCredential | null>(null);
  const authError = ref("");
  const storage = {
    getItem: (): string | null => uni.getStorageSync(STORAGE_KEY) || null,
    setItem: (value: string) => uni.setStorageSync(STORAGE_KEY, value),
  };
  const isParent = computed(() => sessionUntil.value > clock.value);
  const stars = computed(() => balance(data.value));
  const progress = computed(() => raceProgress(data.value, today.value));
  const tasks = computed(() =>
    data.value.dailyTasks
      .filter((t) => t.date === today.value)
      .sort((a, b) => a.sortOrder - b.sortOrder),
  );
  const pendingFeedback = computed(() =>
    data.value.feedbackEvents.filter(
      (e) => !data.value.playedFeedbackEventIds.includes(e.id),
    ),
  );
  let queue: Promise<unknown> = Promise.resolve();
  function tick() {
    clock.value = Date.now();
    today.value = localDate();
  }
  function lockParent() {
    sessionUntil.value = 0;
  }
  function requireParent() {
    tick();
    if (!isParent.value) throw new Error("请先完成家长验证");
  }
  function readAuth() {
    try {
      const raw = uni.getStorageSync(AUTH_KEY);
      credential.value = raw ? JSON.parse(raw) : null;
      if (
        credential.value &&
        (!/^[a-f0-9]{64}$/.test(credential.value.pinHash) ||
          !/^[a-f0-9]{64}$/.test(credential.value.recoveryHash) ||
          !credential.value.salt ||
          !Number.isInteger(credential.value.failures) ||
          !Number.isFinite(credential.value.lockedUntil))
      )
        throw new Error("验证记录损坏");
      authError.value = "";
    } catch {
      authError.value =
        "家长验证记录无法读取，请保留本地数据并使用原设备备份；不要清理学习记录。";
      lockParent();
    }
  }
  function refresh() {
    tick();
    readAuth();
    let missing = false;
    try {
      const raw = storage.getItem();
      if (!raw && data.value.revision > 0) {
        missing = true;
        throw new Error("missing");
      }
      if (raw) data.value = parseState(raw);
      storageBlocked.value = false;
      error.value = "";
    } catch (e) {
      storageBlocked.value = true;
      error.value = missing
        ? "成长数据已被清理，请进入家长中心恢复备份。"
        : "成长数据无法读取。没有覆盖现有数据，请进入家长中心恢复备份。";
    }
  }
  async function exclusive<T>(fn: () => T): Promise<T> {
    // All local read-modify-write operations participate, including restore and feedback acknowledgments.
    // #ifdef H5
    if (typeof navigator !== "undefined" && navigator.locks)
      return navigator.locks.request(STORAGE_KEY, fn);
    // Older H5 engines lack transactional locks. Take a short lease and refuse other active writers.
    const leaseKey = `${STORAGE_KEY}:writer`;
    const token = newId();
    const now = Date.now();
    const old = JSON.parse(uni.getStorageSync(leaseKey) || "null");
    if (old && old.until > now)
      throw new Error("另一个页面正在保存，请关闭其他彩虹桥页面后重试");
    uni.setStorageSync(leaseKey, JSON.stringify({ token, until: now + 3000 }));
    try {
      await new Promise((resolve) => setTimeout(resolve, 70));
      const claim = JSON.parse(uni.getStorageSync(leaseKey) || "null");
      if (claim?.token !== token)
        throw new Error("请只保留一个彩虹桥页面后重试");
      return fn();
    } finally {
      const current = JSON.parse(uni.getStorageSync(leaseKey) || "null");
      if (current?.token === token) uni.removeStorageSync(leaseKey);
    }
    // #endif
    // #ifndef H5
    return fn();
    // #endif
  }
  function serial<T>(fn: () => Promise<T>) {
    const next = queue.then(fn, fn);
    queue = next.catch(() => undefined);
    return next;
  }
  async function run(command: RacingCommand): Promise<boolean> {
    return serial(async () => {
      busy.value = true;
      error.value = "";
      try {
        if (storageBlocked.value)
          throw new Error("请先恢复有效备份，原始数据仍保留");
        const next = await exclusive(() => {
          tick();
          return commitCommand(storage, data.value, command, {
            now: Date.now(),
            today: today.value,
            parent: isParent.value,
            id: newId,
          });
        });
        data.value = next;
        return true;
      } catch (e) {
        error.value =
          e instanceof Error ? e.message : "没有保存成功，请检查存储空间后重试";
        if (error.value.includes("成长数据已被清理"))
          storageBlocked.value = true;
        return false;
      } finally {
        busy.value = false;
      }
    });
  }
  async function ensureToday() {
    refresh();
    if (!storageBlocked.value)
      return run({ type: "ensure", date: today.value });
    return false;
  }
  function setupPin(pin: string): string {
    readAuth();
    if (authError.value) throw new Error(authError.value);
    if (credential.value) throw new Error("已设置家长 PIN，请输入原 PIN");
    if (!/^\d{6}$/.test(pin)) throw new Error("请设置 6 位数字 PIN");
    const salt = newId();
    const recovery = newId()
      .replace(/[^a-z0-9]/gi, "")
      .slice(-16)
      .toUpperCase();
    const next = {
      salt,
      pinHash: sha256(`${salt}:${pin}`),
      recoveryHash: sha256(`${salt}:${recovery}`),
      failures: 0,
      lockedUntil: 0,
    };
    uni.setStorageSync(AUTH_KEY, JSON.stringify(next));
    credential.value = next;
    return recovery;
  }
  function unlock(pin: string, recovery = false, newPin?: string) {
    readAuth();
    if (authError.value) throw new Error(authError.value);
    const c = credential.value;
    if (!c) throw new Error("请先设置家长 PIN");
    if (c.lockedUntil > Date.now())
      throw new Error("尝试次数较多，请一分钟后再试");
    const hash = sha256(
      `${c.salt}:${recovery ? pin.trim().toUpperCase() : pin}`,
    );
    if (hash !== (recovery ? c.recoveryHash : c.pinHash)) {
      const next = {
        ...c,
        failures: c.failures + 1,
        lockedUntil: c.failures + 1 >= 5 ? Date.now() + 60000 : 0,
      };
      if (next.lockedUntil) next.failures = 0;
      uni.setStorageSync(AUTH_KEY, JSON.stringify(next));
      credential.value = next;
      throw new Error(recovery ? "恢复码不正确" : "PIN 不正确，请再试一次");
    }
    if (recovery && !/^\d{6}$/.test(newPin || ""))
      throw new Error("请填写新的 6 位数字 PIN");
    const next = {
      ...c,
      failures: 0,
      lockedUntil: 0,
      pinHash: recovery ? sha256(`${c.salt}:${newPin}`) : c.pinHash,
    };
    uni.setStorageSync(AUTH_KEY, JSON.stringify(next));
    credential.value = next;
    clock.value = Date.now();
    sessionUntil.value = clock.value + 10 * 60 * 1000;
  }
  async function exportBackup(raw = false): Promise<string> {
    requireParent();
    return exclusive(() => {
      requireParent();
      const value = storage.getItem();
      if (raw) return value || "";
      if (storageBlocked.value)
        throw new Error("请先恢复有效备份，或导出原始数据供排查");
      return JSON.stringify(
        parseState(value || JSON.stringify(data.value)),
        null,
        2,
      );
    });
  }
  async function restoreBackup(text: string): Promise<boolean> {
    return serial(async () => {
      busy.value = true;
      try {
        requireParent();
        const restored = parseState(text);
        await exclusive(() => {
          requireParent();
          const old = storage.getItem();
          // If backup preservation fails, refuse replacement rather than losing the existing snapshot.
          if (old) uni.setStorageSync(`${STORAGE_KEY}:before-restore`, old);
          const next = {
            ...restored,
            revision: Math.max(data.value.revision, restored.revision) + 1,
          };
          storage.setItem(JSON.stringify(next));
          data.value = next;
        });
        storageBlocked.value = false;
        error.value = "";
        return true;
      } catch (e) {
        error.value =
          e instanceof Error ? e.message : "恢复失败，原有数据没有替换";
        return false;
      } finally {
        busy.value = false;
      }
    });
  }
  refresh();
  return {
    data,
    today,
    stars,
    progress,
    tasks,
    pendingFeedback,
    error,
    busy,
    storageBlocked,
    credential,
    authError,
    isParent,
    tick,
    refresh,
    ensureToday,
    run,
    lockParent,
    setupPin,
    unlock,
    exportBackup,
    restoreBackup,
  };
});

<template>
  <RaceShell title="家长中心" parent
    ><ParentGate>
      <view class="parent-heading"
        ><view
          ><text class="race-heading">陪孩子，一起向前</text
          ><text class="race-muted"
            >每天建议 3–5 项任务，留一点自由冒险的时间。</text
          ></view
        ><button role="button" tabindex="0" class="race-link" @click="exit">
          退出家长模式
        </button></view
      >
      <view class="parent-summary"
        ><view
          ><text class="summary-value"
            >{{ store.progress.completed }}/{{ store.progress.total }}</text
          ><text>今日完成</text></view
        ><view
          ><text class="summary-value">{{ submissions }}</text
          ><text>待审核</text></view
        ><view
          ><text class="summary-value">{{ awaiting }}</text
          ><text>待兑现</text></view
        ></view
      >
      <view class="race-actions"
        ><button
          role="button"
          tabindex="0"
          class="race-primary"
          @click="go('/pages/parent/review/index')"
        >
          审核与兑现
          {{
            submissions + requests + awaiting
              ? `(${submissions + requests + awaiting})`
              : ""
          }}</button
        ><button
          role="button"
          tabindex="0"
          class="race-secondary"
          @click="go('/pages/parent/records/index')"
        >
          成长记录与星星流水
        </button></view
      >
      <view class="race-tabs"
        ><button
          role="button"
          tabindex="0"
          v-for="t in tabs"
          :key="t.id"
          :class="{ active: section === t.id }"
          @click="section = t.id"
        >
          {{ t.title }}
        </button></view
      >
      <template v-if="section === 'today'"
        ><text class="race-subheading">今天的安排</text
        ><text class="race-muted"
          >跳过不扣星、不算失败；已经完成的记录不能覆盖。</text
        ><view v-if="!store.tasks.length" class="race-empty"
          ><RaceIcon name="sun" :size="66" /><text>今天还没有安排任务。</text
          ><button
            role="button"
            tabindex="0"
            class="race-primary"
            @click="section = 'tasks'"
          >
            从模板开始
          </button></view
        ><view v-for="t in store.tasks" :key="t.id" class="race-row"
          ><RaceIcon :name="t.icon" :size="45" /><view class="race-row-main"
            ><text class="race-row-title">{{ t.title }}</text
            ><text class="race-muted"
              >{{ statusLabels[t.status] }} · {{ t.points }} 星</text
            ></view
          ><button
            role="button"
            tabindex="0"
            v-if="['pending', 'submitted'].includes(t.status)"
            class="race-link"
            :disabled="store.busy"
            :aria-disabled="store.busy"
            @click="skip(t.id, t.title)"
          >
            今天跳过
          </button></view
        ></template
      >
      <template v-if="section === 'tasks'">
        <view class="race-actions"
          ><button
            role="button"
            tabindex="0"
            class="race-primary"
            @click="go('/pages/parent/task-editor/index')"
          >
            新建任务
          </button></view
        >
        <text class="race-subheading">常用任务模板</text
        ><text class="race-muted"
          >添加后可以修改周期、分值和审核方式，不会自动完成任务。</text
        >
        <view class="template-strip"
          ><button
            role="button"
            tabindex="0"
            v-for="(t, i) in taskTemplates"
            :key="t.title"
            class="template-button"
            :disabled="
              store.data.taskDefinitions.some((x) => x.title === t.title)
            "
            :aria-disabled="
              store.data.taskDefinitions.some((x) => x.title === t.title)
            "
            @click="go(`/pages/parent/task-editor/index?template=${i}`)"
          >
            <RaceIcon :name="t.icon" :size="42" /><text>{{ t.title }}</text
            ><text class="race-muted">{{
              store.data.taskDefinitions.some((x) => x.title === t.title)
                ? "已添加"
                : "添加模板"
            }}</text>
          </button></view
        >
        <text class="race-subheading">我的任务模板</text
        ><view v-if="!store.data.taskDefinitions.length" class="race-muted"
          >还没有任务模板。</view
        >
        <view
          v-for="t in [...store.data.taskDefinitions].sort(
            (a, b) => a.sortOrder - b.sortOrder,
          )"
          :key="t.id"
          class="race-row"
          ><RaceIcon :name="t.icon" :size="40" /><view class="race-row-main"
            ><text class="race-row-title">{{ t.title }}</text
            ><text class="race-muted"
              >{{ scheduleLabel(t.schedule) }} ·
              {{ t.enabled ? "启用" : "已停用" }} · {{ t.points }} 星</text
            ><button
              role="button"
              tabindex="0"
              class="race-link"
              @click="
                go(
                  `/pages/parent/task-editor/index?id=${encodeURIComponent(t.id)}`,
                )
              "
            >
              编辑任务</button
            ><button
              role="button"
              tabindex="0"
              v-if="
                t.enabled && !store.tasks.some((x) => x.definitionId === t.id)
              "
              class="race-link"
              :disabled="store.busy"
              :aria-disabled="store.busy"
              @click="addToday(t.id)"
            >
              额外安排到今天
            </button></view
          ></view
        >
      </template>
      <template v-if="section === 'rewards'">
        <view class="race-actions"
          ><button
            role="button"
            tabindex="0"
            class="race-primary"
            @click="go('/pages/parent/reward-editor/index')"
          >
            新建生活奖励
          </button></view
        ><text class="race-muted"
          >生活奖励由家长按约定兑现；申请不扣星，批准时重新核对余额。</text
        >
        <view v-for="r in store.data.rewards" :key="r.id" class="race-row"
          ><RaceIcon :name="r.icon" :size="44" /><view class="race-row-main"
            ><text class="race-row-title">{{ r.title }}</text
            ><text class="race-muted"
              >{{ r.type === "cosmetic" ? "赛车装扮" : "生活奖励" }} ·
              {{ r.cost }} 星 · {{ r.enabled ? "启用" : "停用" }}</text
            ><button
              role="button"
              tabindex="0"
              class="race-link"
              @click="
                go(
                  `/pages/parent/reward-editor/index?id=${encodeURIComponent(r.id)}`,
                )
              "
            >
              编辑奖励</button
            ><button
              role="button"
              tabindex="0"
              v-if="r.enabled"
              class="race-link"
              @click="target(r.id)"
            >
              {{
                store.data.parentPreferences.targetRewardId === r.id
                  ? "已设为目标"
                  : "设为目标奖励"
              }}
            </button></view
          ></view
        >
      </template>
      <template v-if="section === 'settings'">
        <text class="race-subheading">声音与动态效果</text>
        <view class="race-row"
          ><view class="race-row-main"
            ><text class="race-row-title">赛车音效</text
            ><text class="race-muted">同时遵循原应用音效总开关</text></view
          ><AppSwitch
            :model-value="store.data.parentPreferences.soundsEnabled"
            label="赛车音效"
            @update:model-value="
              (value) =>
                preferences(value, store.data.parentPreferences.reduceMotion)
            "
        /></view>
        <view class="race-row"
          ><view class="race-row-main"
            ><text class="race-row-title">减少动态效果</text
            ><text class="race-muted">用简短静态反馈代替赛车动画</text></view
          ><AppSwitch
            :model-value="store.data.parentPreferences.reduceMotion"
            label="减少动态效果"
            @update:model-value="
              (value) =>
                preferences(store.data.parentPreferences.soundsEnabled, value)
            "
        /></view>
        <button
          role="button"
          tabindex="0"
          v-if="store.data.parentPreferences.targetRewardId"
          class="race-link"
          @click="target(undefined)"
        >
          取消目标奖励
        </button>
        <text class="race-subheading">成长数据备份</text
        ><text class="race-notice"
          >目前只保存在此设备。换设备、换浏览器或清理站点数据不会自动同步。请定期保存备份；备份不包含家长
          PIN 和恢复码。</text
        >
        <view class="race-actions"
          ><button
            role="button"
            tabindex="0"
            class="race-secondary"
            @click="exportData(false)"
          >
            导出成长备份</button
          ><button
            role="button"
            tabindex="0"
            class="race-secondary"
            @click="exportData(true)"
          >
            导出原始数据
          </button></view
        >
        <view v-if="backupText" class="race-panel"
          ><text class="race-muted"
            >备份已生成，可复制保存；H5 还会下载 JSON 文件。</text
          ><textarea
            class="race-input backup-text"
            :value="backupText"
            maxlength="-1"
            readonly
            aria-label="成长备份内容"
          /><button
            role="button"
            tabindex="0"
            class="race-link"
            @click="copyBackup"
          >
            复制备份内容
          </button></view
        >
        <!-- #ifdef H5 --><button
          role="button"
          tabindex="0"
          class="race-secondary import-button"
          @click="chooseFile"
        >
          选择备份 JSON 文件</button
        ><!-- #endif -->
        <!-- #ifdef MP-WEIXIN --><button
          role="button"
          tabindex="0"
          class="race-secondary import-button"
          @click="chooseMiniFile"
        >
          选择微信中的备份文件</button
        ><!-- #endif -->
        <label class="backup-label"
          >也可以粘贴备份内容<textarea
            v-model="importText"
            aria-label="导入备份内容"
            class="race-input backup-text"
            :maxlength="-1"
            placeholder="粘贴完整 JSON 备份，不会恢复家长验证信息"
          />
        </label>
        <button
          role="button"
          tabindex="0"
          class="race-danger"
          :disabled="store.busy || !importText.trim()"
          :aria-disabled="store.busy || !importText.trim()"
          @click="restore"
        >
          校验并恢复备份</button
        ><text class="race-muted"
          >恢复会替换赛车数据，不影响原数学、拼音、英语记录。替换前会自动保留一份本机旧快照。</text
        >
        <button
          role="button"
          tabindex="0"
          class="race-link"
          @click="previousBackup"
        >
          取回上次恢复前的本机快照
        </button>
        <text v-if="notice" class="race-success" role="status">{{
          notice
        }}</text>
      </template>
      <AppDialog :state="dialog" @resolve="resolveDialog" /> </ParentGate
  ></RaceShell>
</template>
<script setup lang="ts">
import { computed, ref } from "vue";
import { onLoad, onShow } from "@dcloudio/uni-app";
import type { Schedule } from "@/types/racing";
import { useRacingStore } from "@/stores/racing";
import { STORAGE_KEY } from "@/utils/racing/engine";
import { taskTemplates } from "@/data/racing/catalog";
import { useAppDialog } from "@/utils/dialog";
import RaceShell from "@/components/racing/RaceShell.vue";
import ParentGate from "@/components/racing/ParentGate.vue";
import RaceIcon from "@/components/racing/RaceIcon.vue";
import AppSwitch from "@/components/AppSwitch.vue";
import AppDialog from "@/components/AppDialog.vue";
const store = useRacingStore();
const { dialog, showDialog, resolveDialog } = useAppDialog();
const section = ref("today");
const backupText = ref("");
const importText = ref("");
const notice = ref("");
const tabs = [
  { id: "today", title: "今天" },
  { id: "tasks", title: "任务" },
  { id: "rewards", title: "奖励" },
  { id: "settings", title: "设置与备份" },
];
const statusLabels = {
  pending: "待完成",
  submitted: "待审核",
  completed: "已完成",
  skipped: "已跳过",
};
const submissions = computed(
  () => store.data.dailyTasks.filter((t) => t.status === "submitted").length,
);
const awaiting = computed(
  () => store.data.redemptions.filter((r) => r.status === "approved").length,
);
const requests = computed(
  () => store.data.redemptions.filter((r) => r.status === "requested").length,
);
onLoad((q) => {
  if (q?.section && tabs.some((t) => t.id === q.section))
    section.value = q.section;
});
onShow(() => store.ensureToday());
function go(url: string) {
  uni.navigateTo({ url });
}
function exit() {
  store.lockParent();
  uni.redirectTo({ url: "/pages/racing/index" });
}
function scheduleLabel(s: Schedule) {
  return s.kind === "daily"
    ? "每天"
    : s.kind === "once"
      ? s.date
      : `每周 ${s.weekdays.map((x) => ["日", "一", "二", "三", "四", "五", "六"][x]).join("、")}`;
}
function skip(id: string, title: string) {
  showDialog({
    title: "今天先休息？",
    content: `跳过「${title}」不扣星，也不算失败。`,
    confirmText: "今天跳过",
    cancelText: "继续保留",
    success: async (r) => {
      if (r.confirm) await store.run({ type: "skip", id });
    },
  });
}
async function addToday(definitionId: string) {
  if (await store.run({ type: "addToday", definitionId }))
    uni.showToast({ title: "今天已安排", icon: "none" });
}
function preferences(soundsEnabled: boolean, reduceMotion: boolean) {
  store.run({
    type: "preferences",
    soundsEnabled,
    reduceMotion,
    targetRewardId: store.data.parentPreferences.targetRewardId,
  });
}
function target(targetRewardId?: string) {
  store.run({
    type: "preferences",
    ...store.data.parentPreferences,
    targetRewardId,
  });
}
async function exportData(raw: boolean) {
  notice.value = "";
  try {
    backupText.value = await store.exportBackup(raw);
    // #ifdef H5
    const blob = new Blob([backupText.value], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kidbridge-racing-${raw ? "raw-" : ""}${store.today}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    // #endif
    // #ifdef MP-WEIXIN
    const filePath = `${wx.env.USER_DATA_PATH}/kidbridge-racing-${store.today}.json`;
    wx.getFileSystemManager().writeFile({
      filePath,
      data: backupText.value,
      encoding: "utf8",
      success: () =>
        wx.shareFileMessage({
          filePath,
          fileName: `KidBridge-成长备份-${store.today}.json`,
        }),
      fail: () => {
        notice.value = "文件保存未成功，可复制下方内容保存。";
      },
    });
    // #endif
  } catch (e) {
    store.error = e instanceof Error ? e.message : "导出失败，请重试";
  }
}
function copyBackup() {
  uni.setClipboardData({ data: backupText.value });
}
function restore() {
  showDialog({
    title: "恢复这份成长备份？",
    content:
      "会替换当前赛车数据，原学习记录不受影响。系统将先校验，并保留替换前的本机快照。",
    confirmText: "确认恢复",
    cancelText: "先不恢复",
    tone: "danger",
    success: async (r) => {
      if (r.confirm && (await store.restoreBackup(importText.value))) {
        notice.value = "备份恢复成功，成长记录已更新。";
        importText.value = "";
        await store.ensureToday();
      }
    },
  });
}
function previousBackup() {
  try {
    const old = uni.getStorageSync(`${STORAGE_KEY}:before-restore`);
    if (!old) throw new Error("还没有恢复前快照");
    importText.value = old;
    notice.value = "已取回旧快照，请点击校验并恢复。";
  } catch (e) {
    store.error = String(e);
  }
}
// #ifdef H5
function chooseFile() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json,application/json";
  input.onchange = async () => {
    const file = input.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      store.error = "文件超过 8MB";
      return;
    }
    importText.value = await file.text();
  };
  input.click();
}
// #endif
// #ifdef MP-WEIXIN
function chooseMiniFile() {
  wx.chooseMessageFile({
    count: 1,
    type: "file",
    extension: ["json"],
    success: (r) => {
      const file = r.tempFiles[0];
      if (file.size > 8 * 1024 * 1024) {
        store.error = "文件超过 8MB";
        return;
      }
      wx.getFileSystemManager().readFile({
        filePath: file.path,
        encoding: "utf8",
        success: (r) => {
          importText.value = String(r.data);
        },
        fail: () => {
          store.error = "无法读取文件，可粘贴备份内容。";
        },
      });
    },
  });
}
// #endif
</script>
<style scoped>
.parent-heading {
  margin: 8px 0 20px;
}
.parent-summary {
  display: flex;
  justify-content: space-around;
  gap: 12px;
  padding: 20px 12px;
  border-radius: 24px;
  background: #e5f3e9;
}
.parent-summary > view {
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 14px;
  color: #506054;
}
.summary-value {
  font-size: 27px;
  font-weight: 850;
  color: #24344c;
  font-variant-numeric: tabular-nums;
}
.template-strip {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding: 12px 0;
}
.template-button {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  min-width: 104px;
  min-height: 120px;
  padding: 14px 10px !important;
  border: 1px solid #e7d7b9;
  border-radius: 20px;
  background: #fffef9;
  color: #24344c;
  font-size: 16px !important;
}
.backup-text {
  font-size: 13px !important;
  height: 150px !important;
}
.backup-label {
  display: block;
  margin: 20px 0;
  font-weight: 700;
}
.import-button {
  margin: 18px 0 !important;
}
</style>

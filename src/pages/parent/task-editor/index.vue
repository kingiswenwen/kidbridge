<template>
  <RaceShell :title="editingId ? '编辑任务' : '安排新任务'" parent
    ><ParentGate>
      <text class="race-heading">让日常变成小冒险</text
      ><text class="race-muted"
        >一天最多 12 项，推荐 3–5 项。任务不需要按顺序完成。</text
      >
      <view class="race-form">
        <label
          >任务名称<input
            v-model="form.title"
            aria-label="任务名称"
            class="race-input"
            maxlength="12"
            placeholder="例如：整理玩具"
        /></label>
        <label
          >选个孩子认识的图标<view class="race-choice"
            ><button
              role="button"
              tabindex="0"
              v-for="icon in taskIcons"
              :key="icon"
              :class="{ selected: form.icon === icon }"
              :aria-label="iconNames[icon]"
              :aria-pressed="form.icon === icon"
              @click="form.icon = icon"
            >
              <RaceIcon :name="icon" :size="42" /></button></view
        ></label>
        <label
          >类别<picker
            :range="categoryLabels"
            :value="categoryKeys.indexOf(form.category)"
            @change="changeCategory"
            ><view class="race-picker"
              >{{ categories[form.category] }} ▾</view
            ></picker
          ></label
        >
        <label
          >一句话说明<textarea
            v-model="form.description"
            aria-label="任务说明"
            class="race-input"
            maxlength="120"
            placeholder="把小汽车和积木送回家"
          />
        </label>
        <view
          ><text class="race-row-title">可选步骤（最多 3 项）</text
          ><text class="race-muted">只做指引，不需要孩子逐项打勾。</text
          ><input
            v-for="(_, i) in steps"
            :key="i"
            v-model="steps[i]"
            :aria-label="`步骤 ${i + 1}`"
            class="race-input"
            maxlength="60"
            :placeholder="`步骤 ${i + 1}（可不填）`"
        /></view>
        <label
          >什么时候做<picker
            :range="slotLabels"
            :value="slotKeys.indexOf(form.timeSlot)"
            @change="changeSlot"
            ><view class="race-picker"
              >{{ timeSlots[form.timeSlot] }} ▾</view
            ></picker
          ></label
        >
        <view
          ><text class="race-row-title">重复安排</text
          ><view class="race-choice"
            ><button
              role="button"
              tabindex="0"
              v-for="r in scheduleOptions"
              :key="r.id"
              :class="{ selected: scheduleKind === r.id }"
              @click="scheduleKind = r.id"
            >
              {{ r.title }}
            </button></view
          ></view
        >
        <view v-if="scheduleKind === 'weekly'" class="race-choice"
          ><button
            role="button"
            tabindex="0"
            v-for="day in weekdays"
            :key="day.id"
            :class="{ selected: selectedDays.includes(day.id) }"
            :aria-pressed="selectedDays.includes(day.id)"
            @click="toggleDay(day.id)"
          >
            {{ day.title }}
          </button></view
        >
        <label v-if="scheduleKind === 'once'"
          >单次日期<picker
            mode="date"
            :value="onceDate"
            :start="store.today"
            @change="changeDate"
            ><view class="race-picker">{{ onceDate }} ▾</view></picker
          ></label
        >
        <view
          ><text class="race-row-title">完成获得几颗星？</text
          ><view class="race-choice"
            ><button
              role="button"
              tabindex="0"
              v-for="n in [0, 1, 2, 3]"
              :key="n"
              :class="{ selected: form.points === n }"
              @click="form.points = n"
            >
              {{ n }} 星
            </button></view
          ><text class="race-muted"
            >0 星任务也能推动赛车，不扣已有星星。</text
          ></view
        >
        <view
          ><text class="race-row-title">如何确认完成</text
          ><view class="race-choice"
            ><button
              role="button"
              tabindex="0"
              :class="{ selected: form.checkMode === 'parent' }"
              @click="form.checkMode = 'parent'"
            >
              家长审核（推荐）</button
            ><button
              role="button"
              tabindex="0"
              :class="{ selected: form.checkMode === 'self' }"
              @click="form.checkMode = 'self'"
            >
              孩子自助确认
            </button></view
          ><text class="race-muted"
            >自动学习打卡不在首发范围，学习任务仍需手动完成。</text
          ></view
        >
        <label
          >排序（数字小的在前）<input
            v-model="sortText"
            aria-label="任务排序"
            class="race-input"
            type="number"
            maxlength="4"
        /></label>
        <view class="race-row"
          ><text class="race-row-main">启用这个任务模板</text
          ><AppSwitch
            :model-value="form.enabled"
            label="启用任务"
            @update:model-value="(value) => (form.enabled = value)"
        /></view>
        <checkbox-group @change="changeApplyToday"
          ><label class="race-check"
            ><checkbox
              value="today"
              :checked="applyToday"
            />同时应用到今天的未完成任务</label
          ></checkbox-group
        ><text class="race-muted"
          >不勾选只影响未来。已提交、已完成或跳过的历史不会被覆盖。停用模板不删除已有记录。</text
        >
        <text v-if="message" class="race-error" role="alert">{{
          message
        }}</text>
        <button
          role="button"
          tabindex="0"
          class="race-primary"
          :disabled="store.busy || saving"
          :aria-disabled="store.busy || saving"
          @click="save"
        >
          {{ store.busy ? "正在保存…" : "保存任务安排" }}
        </button>
      </view>
    </ParentGate></RaceShell
  >
</template>
<script setup lang="ts">
import { reactive, ref } from "vue";
import { onLoad, onShow, onHide } from "@dcloudio/uni-app";
import type { TaskInput, TaskCategory, TimeSlot } from "@/types/racing";
import {
  taskTemplates,
  taskIcons,
  categories,
  timeSlots,
} from "@/data/racing/catalog";
import { useRacingStore } from "@/stores/racing";
import RaceShell from "@/components/racing/RaceShell.vue";
import ParentGate from "@/components/racing/ParentGate.vue";
import RaceIcon from "@/components/racing/RaceIcon.vue";
import AppSwitch from "@/components/AppSwitch.vue";
const store = useRacingStore();
let pageActive = true;
const editingId = ref("");
const form = reactive<TaskInput>({
  ...JSON.parse(JSON.stringify(taskTemplates[0])),
  title: "",
  description: "",
  steps: [],
  sortOrder: store.data.taskDefinitions.length,
});
const steps = ref(["", "", ""]);
const sortText = ref(String(form.sortOrder));
const scheduleKind = ref<"daily" | "weekly" | "once">("daily");
const selectedDays = ref([1, 2, 3, 4, 5]);
const onceDate = ref(store.today);
const applyToday = ref(true);
const message = ref("");
const saving = ref(false);
const categoryKeys = Object.keys(categories) as TaskCategory[];
const categoryLabels = Object.values(categories);
const slotKeys = Object.keys(timeSlots) as TimeSlot[];
const slotLabels = Object.values(timeSlots);
const scheduleOptions = [
  { id: "daily" as const, title: "每天" },
  { id: "weekly" as const, title: "选定星期" },
  { id: "once" as const, title: "单次日期" },
];
const weekdays = [1, 2, 3, 4, 5, 6, 0].map((id) => ({
  id,
  title: `周${["日", "一", "二", "三", "四", "五", "六"][id]}`,
}));
const iconNames: Record<string, string> = {
  tooth: "刷牙",
  toy: "玩具",
  book: "阅读",
  ball: "运动",
  dish: "餐具",
  sun: "早晨",
  family: "亲子",
  moon: "晚间",
};
onLoad((q) => {
  editingId.value = "";
  Object.assign(form, {
    ...JSON.parse(JSON.stringify(taskTemplates[0])),
    title: "",
    description: "",
    steps: [],
    sortOrder: store.data.taskDefinitions.length,
  });
  steps.value = ["", "", ""];
  sortText.value = String(form.sortOrder);
  scheduleKind.value = "daily";
  selectedDays.value = [1, 2, 3, 4, 5];
  onceDate.value = store.today;
  applyToday.value = true;
  message.value = "";
  let source: TaskInput | undefined;
  if (q?.id) {
    editingId.value = q.id;
    source = store.data.taskDefinitions.find((t) => t.id === q.id);
    applyToday.value = false;
    if (!source) message.value = "任务不存在，请返回检查";
  } else if (q?.template !== undefined)
    source = taskTemplates[Number(q.template)];
  if (source) {
    Object.assign(form, JSON.parse(JSON.stringify(source)));
    steps.value = [...source.steps, "", "", ""].slice(0, 3);
    sortText.value = String(form.sortOrder);
    scheduleKind.value = source.schedule.kind;
    if (source.schedule.kind === "weekly")
      selectedDays.value = [...source.schedule.weekdays];
    if (source.schedule.kind === "once") onceDate.value = source.schedule.date;
  }
});
onShow(() => {
  pageActive = true;
  store.refresh();
});
onHide(() => {
  pageActive = false;
});
function changeCategory(e: { detail: { value: string | number } }) {
  form.category = categoryKeys[Number(e.detail.value)];
}
function changeSlot(e: { detail: { value: string | number } }) {
  form.timeSlot = slotKeys[Number(e.detail.value)];
}
function changeDate(e: { detail: { value: string } }) {
  onceDate.value = e.detail.value;
}
function changeApplyToday(e: { detail: { value: string[] } }) {
  applyToday.value = e.detail.value.includes("today");
}
function toggleDay(day: number) {
  selectedDays.value = selectedDays.value.includes(day)
    ? selectedDays.value.filter((d) => d !== day)
    : [...selectedDays.value, day];
}
async function save() {
  if (saving.value) return;
  saving.value = true;
  try {
    message.value = "";
    if (!/^\d{1,4}$/.test(sortText.value)) {
      message.value = "排序请填写 0–9999 的整数";
      return;
    }
    const schedule =
      scheduleKind.value === "daily"
        ? { kind: "daily" as const }
        : scheduleKind.value === "weekly"
          ? { kind: "weekly" as const, weekdays: [...selectedDays.value] }
          : { kind: "once" as const, date: onceDate.value };
    const input = {
      ...form,
      title: form.title.trim(),
      description: form.description.trim(),
      steps: steps.value.map((x) => x.trim()).filter(Boolean),
      schedule,
      sortOrder: Number(sortText.value),
      occurrenceKey: form.occurrenceKey || form.timeSlot,
    };
    if (
      await store.run({
        type: "saveTask",
        id: editingId.value || undefined,
        input,
        applyToday: applyToday.value,
      })
    ) {
      uni.showToast({ title: "任务安排已保存", icon: "none" });
      if (!pageActive) return;
      uni.redirectTo({ url: "/pages/parent/index?section=tasks" });
    } else message.value = store.error;
  } finally {
    saving.value = false;
  }
}
</script>

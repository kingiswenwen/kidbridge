<template>
  <slot v-if="store.isParent" />
  <view v-else class="parent-gate">
    <RaceIcon name="lock" :size="78" />
    <text class="race-heading">{{
      recoveryCode
        ? "请保存家长恢复码"
        : !store.credential
          ? "第一次进入家长中心"
          : recovering
            ? "用恢复码重设 PIN"
            : "请家长来帮忙"
    }}</text>
    <text class="race-muted"
      >PIN 用于防止孩子误操作，不能代替账号安全认证。</text
    >
    <view v-if="recoveryCode" class="race-form">
      <text class="recovery-code" selectable>{{ recoveryCode }}</text
      ><text>忘记 PIN 时可用它恢复。请单独保存，不要和孩子共享。</text>
      <button
        role="button"
        tabindex="0"
        class="race-secondary"
        @click="copyRecovery"
      >
        复制恢复码
      </button>
      <checkbox-group @change="confirmRecovery"
        ><label class="race-check"
          ><checkbox
            value="saved"
            :checked="savedCode"
          />我已经妥善保存恢复码</label
        ></checkbox-group
      >
      <button
        role="button"
        tabindex="0"
        class="race-primary"
        :disabled="!savedCode"
        :aria-disabled="!savedCode"
        @click="finishSetup"
      >
        进入家长中心
      </button>
    </view>
    <view v-else class="race-form">
      <text v-if="store.authError" class="race-error" role="alert">{{
        store.authError
      }}</text>
      <label v-if="recovering"
        >恢复码<input
          v-model="recovery"
          aria-label="家长恢复码"
          class="race-input"
          maxlength="24"
          placeholder="输入保存的恢复码"
      /></label>
      <label
        >{{
          recovering
            ? "新的 6 位数字 PIN"
            : store.credential
              ? "6 位家长 PIN"
              : "设置 6 位数字 PIN"
        }}<input
          v-model="pin"
          aria-label="六位家长 PIN"
          class="race-input"
          type="number"
          password
          maxlength="6"
          placeholder="6 位数字"
          @confirm="submit"
      /></label>
      <label v-if="!store.credential || recovering"
        >再次输入 PIN<input
          v-model="confirmation"
          aria-label="再次输入 PIN"
          class="race-input"
          type="number"
          password
          maxlength="6"
          placeholder="再输入一次"
      /></label>
      <text v-if="message" class="race-error" role="alert">{{ message }}</text>
      <button
        role="button"
        tabindex="0"
        class="race-primary"
        :disabled="Boolean(store.authError)"
        :aria-disabled="Boolean(store.authError)"
        @click="submit"
      >
        {{
          recovering
            ? "重设并进入"
            : store.credential
              ? "进入家长中心"
              : "设置 PIN"
        }}
      </button>
      <button
        role="button"
        tabindex="0"
        v-if="store.credential"
        class="race-link"
        @click="
          recovering = !recovering;
          message = '';
        "
      >
        {{ recovering ? "返回 PIN 验证" : "忘记 PIN？使用恢复码" }}
      </button>
      <text v-if="recovering" class="race-muted"
        >恢复码也遗失时，请保留本地数据。重设 PIN 不会清除孩子的学习记录。</text
      >
    </view>
  </view>
</template>
<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import { useRacingStore } from "@/stores/racing";
import RaceIcon from "./RaceIcon.vue";
const store = useRacingStore();
const pin = ref("");
const confirmation = ref("");
const recovering = ref(false);
const recovery = ref("");
const recoveryCode = ref("");
const savedCode = ref(false);
const message = ref("");
let timer: ReturnType<typeof setInterval>;
onMounted(() => {
  store.tick();
  timer = setInterval(store.tick, 1000);
});
onUnmounted(() => clearInterval(timer));
function submit() {
  message.value = "";
  try {
    if (
      (!store.credential || recovering.value) &&
      pin.value !== confirmation.value
    )
      throw new Error("两次 PIN 不一致");
    if (!store.credential) {
      recoveryCode.value = store.setupPin(pin.value);
    } else
      store.unlock(
        recovering.value ? recovery.value : pin.value,
        recovering.value,
        pin.value,
      );
  } catch (e) {
    message.value = e instanceof Error ? e.message : "验证失败，请重试";
  }
}
function copyRecovery() {
  uni.setClipboardData({ data: recoveryCode.value });
}
function confirmRecovery(event: { detail: { value: string[] } }) {
  savedCode.value = event.detail.value.includes("saved");
}
function finishSetup() {
  try {
    store.unlock(pin.value);
    recoveryCode.value = "";
  } catch (e) {
    message.value = String(e);
  }
}
</script>

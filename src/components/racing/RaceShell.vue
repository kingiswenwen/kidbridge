<template>
  <view class="racing-page" :class="{ 'parent-page': parent }">
    <view class="race-top"
      ><button
        role="button"
        tabindex="0"
        class="race-back"
        aria-label="返回上一页"
        @click="back"
      >
        ‹ 返回</button
      ><text class="race-page-title">{{ title }}</text
      ><view class="race-balance" aria-label="成长星星余额"
        ><RaceIcon name="star" :size="24" /><text>{{ store.stars }}</text></view
      ></view
    >
    <view v-if="store.error" class="race-error" role="alert"
      ><text>{{ store.error }}</text
      ><button
        role="button"
        tabindex="0"
        class="race-link"
        @click="store.error = ''"
      >
        知道了
      </button></view
    >
    <view v-if="store.storageBlocked" class="race-notice"
      ><text>成长数据已暂停写入，请通过备份恢复。</text
      ><button
        role="button"
        tabindex="0"
        class="race-link"
        @click="go('/pages/parent/index')"
      >
        家长恢复备份
      </button></view
    >
    <slot />
  </view>
</template>
<script setup lang="ts">
import { getCurrentInstance } from "vue";
import RaceIcon from "./RaceIcon.vue";
import { useRacingStore } from "@/stores/racing";
defineProps<{ title: string; parent?: boolean }>();
const store = useRacingStore();
const instance = getCurrentInstance();
const emit = defineEmits<{ "before-back": [] }>();
function go(url: string) {
  uni.navigateTo({ url });
}
function back() {
  if (instance?.vnode.props?.onBeforeBack) {
    emit("before-back");
    return;
  }
  uni.navigateBack({ fail: () => uni.switchTab({ url: "/pages/home/index" }) });
}
</script>

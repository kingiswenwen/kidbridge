<template>
  <view
    class="race-track"
    role="img"
    :aria-label="`今日赛道，完成 ${completed} / ${total} 站，任务顺序不限`"
  >
    <image
      class="track-art"
      src="/static/racing/track.svg"
      mode="scaleToFill"
    />
    <view
      v-for="n in total"
      :key="n"
      class="track-stop"
      :class="{ done: n <= completed, compact: total > 8 }"
      :style="position(n / total)"
      ><text>{{ n <= completed ? "✓" : n }}</text></view
    >
    <view class="finish-flag"><RaceIcon name="flag" :size="34" /></view>
    <view
      class="track-car"
      :class="{ moving: animate && !reduced, 'no-motion': reduced }"
      :style="carPosition(total ? completed / total : 0)"
      ><RaceCar
    /></view>
  </view>
</template>
<script setup lang="ts">
import RaceCar from "./RaceCar.vue";
import RaceIcon from "./RaceIcon.vue";
withDefaults(
  defineProps<{
    total: number;
    completed: number;
    animate?: boolean;
    reduced?: boolean;
  }>(),
  { animate: false, reduced: false },
);
function position(p: number) {
  return {
    left: `${((42 + 556 * p) / 640) * 100}%`,
    top: `${((155 + 52 * Math.sin(p * Math.PI * 2)) / 280) * 100}%`,
  };
}
function carPosition(p: number) {
  return {
    ...position(p),
    left: `${Math.max(15, Math.min(85, ((42 + 556 * p) / 640) * 100))}%`,
  };
}
</script>
<style scoped>
.race-track {
  position: relative;
  width: 100%;
  height: 0;
  padding-bottom: 43.75%;
  border-radius: 28px;
  overflow: hidden;
}
.track-art {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
.track-stop {
  position: absolute;
  z-index: 1;
  transform: translate(-50%, -50%);
  width: 25px;
  height: 25px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3px solid #fffdf5;
  border-radius: 50%;
  background: #eee7da;
  color: #665c51;
  font-size: 12px;
  font-weight: 800;
}
.track-stop.done {
  background: #248f81;
  color: white;
}
.track-stop.compact {
  width: 18px;
  height: 18px;
  border-width: 2px;
  font-size: 10px;
}
.track-car {
  position: absolute;
  z-index: 2;
  width: 29%;
  transform: translate(-50%, -88%);
  transition:
    left 1.2s cubic-bezier(0.2, 0.8, 0.2, 1),
    top 1.2s cubic-bezier(0.2, 0.8, 0.2, 1);
}
.finish-flag {
  position: absolute;
  right: 1%;
  top: 32%;
}
.moving {
  animation: car-cheer 0.55s ease-out 2;
}
.track-car.no-motion {
  transition: none;
  animation: none;
}
@keyframes car-cheer {
  50% {
    transform: translate(-50%, -100%) rotate(-4deg);
  }
}
@media (prefers-reduced-motion: reduce) {
  .track-car {
    transition: none;
  }
  .moving {
    animation: none;
  }
}
</style>

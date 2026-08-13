<template>
  <view class="sen-bg">
    <view class="sen-hero text-center pt-8 pb-4">
      <image class="sh-icon" src="/static/icons/mic.svg" mode="aspectFit" />
      <text class="sh-title">日常句子</text>
      <text class="sh-sub">每天学几句，生活里就能说啦</text>
    </view>

    <view class="px-4 pb-12 space-y-4">
      <view
        v-for="(s, idx) in sentences"
        :key="idx"
        class="sen-card"
      >
        <view class="sc-top flex items-start gap-4">
          <view class="sc-emoji-wrap">
            <image class="sc-emoji-img" :src="s.emoji" mode="aspectFit" />
          </view>
          <view class="sc-body flex-1">
            <text class="sc-en">{{ s.en }}</text>
            <text class="sc-cn">{{ s.cn }}</text>
          </view>
          <view class="sc-speak" @click.stop="speak(s.en)">
            <image class="sc-speak-img" src="/static/icons/speaker.svg" mode="aspectFit" />
          </view>
        </view>
        <view class="sc-divider mt-4"></view>
        <view class="sc-tags mt-4 flex flex-wrap gap-2">
          <text
            v-for="(tag, i) in s.tags"
            :key="i"
            class="sc-tag"
          >{{ tag }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
interface Sen {
  emoji: string;
  en: string;
  cn: string;
  tags: string[];
}
const sentences: Sen[] = [
  { emoji: '/static/icons/paw.svg', en: 'Good morning!', cn: '早上好！', tags: ['问候', '早上'] },
  { emoji: '/static/icons/sparkle.svg', en: 'How are you today?', cn: '你今天好吗？', tags: ['问候', '日常'] },
  { emoji: '/static/icons/star.svg', en: "I'm fine, thank you.", cn: '我很好，谢谢你。', tags: ['问候', '回应'] },
  { emoji: '/static/icons/moon.svg', en: 'Good night, sweet dreams.', cn: '晚安，好梦。', tags: ['问候', '睡前'] },
  { emoji: '/static/icons/arrow.svg', en: 'See you tomorrow!', cn: '明天见！', tags: ['告别'] },
  { emoji: '/static/icons/body.svg', en: 'My name is Xiao Ming.', cn: '我叫小明。', tags: ['自我介绍', '名字'] },
  { emoji: '/static/icons/star.svg', en: "I'm five years old.", cn: '我五岁啦。', tags: ['自我介绍', '年龄'] },
  { emoji: '/static/icons/apple.svg', en: "Let's have dinner.", cn: '我们一起吃晚饭吧。', tags: ['吃饭', '邀请'] },
  { emoji: '/static/icons/apple.svg', en: 'I like apples very much.', cn: '我非常喜欢苹果。', tags: ['喜好', '水果'] },
  { emoji: '/static/icons/drop.svg', en: 'Can I have some water?', cn: '我可以喝点水吗？', tags: ['请求', '喝水'] },
  { emoji: '/static/icons/house2.svg', en: 'I want to go to the bathroom.', cn: '我想去洗手间。', tags: ['请求', '生活'] },
  { emoji: '/static/icons/heart.svg', en: 'I love you, Mom and Dad.', cn: '爸爸妈妈，我爱你们。', tags: ['家人', '表达'] },
  { emoji: '/static/icons/house2.svg', en: 'Let us go to school.', cn: '我们去上学吧。', tags: ['上学', '邀请'] },
  { emoji: '/static/icons/book2.svg', en: 'I like reading books.', cn: '我喜欢看书。', tags: ['学习', '喜好'] },
  { emoji: '/static/icons/palette.svg', en: 'I can draw a cat.', cn: '我会画一只小猫。', tags: ['能力', '画画'] },
  { emoji: '/static/icons/mic.svg', en: 'Let us sing a song together.', cn: '我们一起唱首歌吧。', tags: ['唱歌', '邀请'] },
  { emoji: '/static/icons/bolt.svg', en: 'Can you run fast?', cn: '你能跑得快吗？', tags: ['运动', '提问'] },
  { emoji: '/static/icons/puzzle.svg', en: 'May I play with you?', cn: '我可以和你一起玩吗？', tags: ['游戏', '请求'] },
  { emoji: '/static/icons/check.svg', en: 'Thank you very much!', cn: '非常感谢你！', tags: ['礼貌', '感谢'] },
  { emoji: '/static/icons/sparkle.svg', en: "You're welcome.", cn: '不客气。', tags: ['礼貌', '回应'] },
  { emoji: '/static/icons/cat.svg', en: "I'm sorry. I didn't mean it.", cn: '对不起，我不是故意的。', tags: ['礼貌', '道歉'] },
  { emoji: '/static/icons/bulb.svg', en: 'Never mind. Let us try again.', cn: '没关系，我们再试一次。', tags: ['鼓励', '回应'] },
  { emoji: '/static/icons/heart.svg', en: 'Can you help me?', cn: '你能帮帮我吗？', tags: ['请求', '帮助'] },
  { emoji: '/static/icons/trophy.svg', en: 'You did a great job!', cn: '你做得真棒！', tags: ['夸奖', '鼓励'] },
  { emoji: '/static/icons/clock.svg', en: "It's time to get up.", cn: '该起床啦。', tags: ['生活', '提醒'] },
];

function speak(text: string) {
  // #ifdef H5
  try {
    if ('speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'en-US';
      u.rate = 0.9;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
      return;
    }
  } catch (e) {}
  // #endif
  uni.showToast({ title: text, icon: 'none', duration: 1500 });
}
</script>

<style lang="scss" scoped>
.sen-bg {
  min-height: 100vh;
  background: linear-gradient(180deg, #FCE7F3 0%, #EFF6FF 50%, #ECFDF5 100%);
}
.sen-hero { display: flex; flex-direction: column; align-items: center; gap: 12rpx; }
.sh-icon { width: 100rpx; height: 100rpx; display: block; margin: 0 auto; }
.sh-title { font-size: 52rpx; font-weight: 800; color: #EC4899; }
.sh-sub { font-size: 28rpx; color: #6B7280; }

.sen-card {
  background: #FFFFFF; border-radius: 32rpx; padding: 28rpx;
  box-shadow: 0 8rpx 30rpx rgba(236, 72, 153, 0.08);
}
.sc-top { display: flex; align-items: flex-start; gap: 16rpx; }
.sc-emoji-wrap {
  width: 88rpx; height: 88rpx; border-radius: 24rpx;
  background: linear-gradient(135deg, #FCE7F3 0%, #DBEAFE 100%);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.sc-emoji-img { width: 48rpx; height: 48rpx; }
.sc-body { flex: 1; display: flex; flex-direction: column; gap: 8rpx; min-width: 0; }
.sc-en { font-size: 36rpx; font-weight: 800; color: #1F2937; line-height: 1.35; }
.sc-cn { font-size: 28rpx; color: #6B7280; }
.sc-speak {
  width: 72rpx; height: 72rpx; border-radius: 999rpx;
  background: linear-gradient(135deg, #EC4899 0%, #A855F7 100%);
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 6rpx 20rpx rgba(236, 72, 153, 0.3);
  &:active { transform: scale(0.95); }
}
.sc-speak-img { width: 32rpx; height: 32rpx; }
.sc-divider { height: 2rpx; background: linear-gradient(90deg, transparent, #F3F4F6, transparent); }
.sc-tag {
  padding: 8rpx 20rpx; border-radius: 999rpx;
  background: #FDF2F8; color: #BE185D;
  font-size: 22rpx; font-weight: 600;
}
</style>

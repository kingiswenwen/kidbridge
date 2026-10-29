import { useAppStore } from "@/stores/app";
import { audioSources } from "@/data/audioSources";

let player: UniApp.InnerAudioContext | undefined;
let generation = 0;

export function stopSpeaking() {
  generation++;
  player?.stop();
  player?.destroy();
  player = undefined;
  // #ifdef H5
  if (typeof window !== 'undefined') window.speechSynthesis?.cancel();
  // #endif
}

export function getRecordingSource(text: string, lang: 'zh-CN' | 'en-US') {
  const key = lang === 'en-US'
    ? 'en:' + text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    : 'zh:' + text.trim().split(/\s/)[0];
  return audioSources[key];
}

/** Use bundled recordings for stable pinyin/word pronunciation; synthesize other text. */
export function speak(text: string, lang: 'zh-CN' | 'en-US' = 'zh-CN') {
  if (!useAppStore().soundEnabled) return;
  stopSpeaking();
  const token = generation;
  const synthesize = () => {
    if (token !== generation || !useAppStore().soundEnabled) return;
    // #ifdef H5
    try {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.rate = lang === 'zh-CN' ? 0.85 : 0.9;
        utterance.onerror = () => {
          if (token === generation) uni.showToast({ title: '当前无法朗读，请稍后重试', icon: 'none' });
        };
        window.speechSynthesis.speak(utterance);
        return;
      }
    } catch { /* Use an explicit availability message below. */ }
    // #endif
    uni.showToast({ title: '当前浏览器不支持朗读', icon: 'none', duration: 1500 });
  };
  const src = getRecordingSource(text, lang);
  if (src && typeof uni.createInnerAudioContext === 'function') {
    player = uni.createInnerAudioContext();
    player.src = src;
    player.onError(synthesize);
    player.play();
    return;
  }
  synthesize();
}

// 跨端音频播放器：H5 走 HTMLAudioElement，小程序/APP 走 uni.createInnerAudioContext
type AudioHandle = { stop: () => void; destroy: () => void } | null;

let current: AudioHandle = null;

function stopCurrent() {
  if (current) {
    try {
      current.stop();
      current.destroy();
    } catch (_) {
      /* noop */
    }
    current = null;
  }
}

/**
 * 播放音频，自动跨端
 * @param src 音频路径（static/audio/xxx.wav → 填 "/static/audio/xxx.wav"）
 */
export function playAudio(src: string): Promise<void> {
  stopCurrent();
  return new Promise((resolve, reject) => {
    try {
      // #ifdef H5
      const audio = new Audio(src);
      current = {
        stop: () => audio.pause(),
        destroy: () => {
          audio.pause();
          audio.src = "";
        },
      };
      audio.onended = () => resolve();
      audio.onerror = (e) => reject(e);
      audio.play().catch(reject);
      // #endif

      // #ifndef H5
      const ctx = uni.createInnerAudioContext();
      ctx.src = src;
      current = {
        stop: () => ctx.stop(),
        destroy: () => ctx.destroy(),
      };
      ctx.onEnded(() => {
        ctx.destroy();
        resolve();
      });
      ctx.onError((e) => {
        ctx.destroy();
        reject(e);
      });
      ctx.play();
      // #endif
    } catch (e) {
      reject(e);
    }
  });
}

export function stopAudio() {
  stopCurrent();
}

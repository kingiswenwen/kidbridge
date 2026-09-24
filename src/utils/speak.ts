// 跨端语音朗读工具
// H5 端使用 Web Speech API (speechSynthesis)
// 小程序端 fallback 到 toast 提示（可后续接入 TTS 插件）

/**
 * 朗读一段文本（中文或英文）
 * H5: 使用 Web Speech API
 * 小程序: toast 提示
 */
export function speak(text: string, lang: 'zh-CN' | 'en-US' = 'zh-CN') {
  // #ifdef H5
  try {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const u = new SpeechSynthesisUtterance(text)
      u.lang = lang
      u.rate = lang === 'zh-CN' ? 0.85 : 0.9
      u.pitch = 1.1
      window.speechSynthesis.speak(u)
      return
    }
  } catch (_) {
    /* noop */
  }
  // #endif
  uni.showToast({ title: '🔊 ' + text, icon: 'none', duration: 1000 })
}

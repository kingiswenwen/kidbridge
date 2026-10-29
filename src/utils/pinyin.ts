import type { PinyinCharPair } from '@/data/pinyin/questions';
import { shuffleOptions } from '@/utils/practiceOptions';

export type PinyinPracticeMode = 'char2pinyin' | 'pinyin2char';

const toneMarks: Record<string, string[]> = {
  a: ['a', 'ā', 'á', 'ǎ', 'à'], o: ['o', 'ō', 'ó', 'ǒ', 'ò'],
  e: ['e', 'ē', 'é', 'ě', 'è'], i: ['i', 'ī', 'í', 'ǐ', 'ì'],
  u: ['u', 'ū', 'ú', 'ǔ', 'ù'], ü: ['ü', 'ǖ', 'ǘ', 'ǚ', 'ǜ'],
};

/** 标调规则：有 a 标 a，有 e 标 e，ou 标 o，其余标最后一个元音（iu/ui 标后）。 */
export function withTone(pinyin: string, tone: number): string {
  if (tone < 1 || tone > 4) return pinyin;
  let index = pinyin.indexOf('a');
  if (index < 0) index = pinyin.indexOf('e');
  if (index < 0 && pinyin.includes('ou')) index = pinyin.indexOf('o');
  if (index < 0) {
    for (let i = pinyin.length - 1; i >= 0; i--) {
      if (toneMarks[pinyin[i]]) { index = i; break; }
    }
  }
  if (index < 0) return pinyin;
  return pinyin.slice(0, index) + toneMarks[pinyin[index]][tone] + pinyin.slice(index + 1);
}

export function buildPinyinOptions(
  question: PinyinCharPair,
  mode: PinyinPracticeMode,
  bank: readonly PinyinCharPair[],
): PinyinCharPair[] {
  const soundKey = (item: PinyinCharPair) => `${item.pinyin}:${item.tone}`;
  const answerKey = (item: PinyinCharPair) => mode === 'char2pinyin' ? soundKey(item) : item.char;
  const seen = new Set([answerKey(question)]);
  const alternatives = shuffleOptions(bank).filter((item) => {
    // 同音字同样符合拼音题干，不能作为错误选项；同字/重复显示项也不能重复出现。
    if (item.char === question.char || soundKey(item) === soundKey(question)) return false;
    const key = answerKey(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return shuffleOptions([question, ...alternatives.slice(0, 3)]);
}

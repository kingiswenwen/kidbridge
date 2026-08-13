export * from './words'
import { englishWords, categoryLabels, type EnglishWord, type WordCategory } from './words'

// 英语闪卡页使用的结构
export interface Flashcard {
  word: string
  phonetic: string
  chinese: string
  image: string
  examples: { en: string; cn: string }[]
}

// word -> emoji 映射（覆盖常用词，剩下的 fallback 到分类 emoji）
const emojiMap: Record<string, string> = {
  // animals
  cat: '🐱', dog: '🐶', bird: '🐦', fish: '🐟', pig: '🐷', duck: '🦆',
  rabbit: '🐰', tiger: '🐯', lion: '🦁', elephant: '🐘', monkey: '🐵',
  bear: '🐻', panda: '🐼', cow: '🐮', sheep: '🐑', horse: '🐴',
  chicken: '🐔', frog: '🐸', snake: '🐍', bee: '🐝', butterfly: '🦋',
  // colors
  red: '🔴', blue: '🔵', green: '🟢', yellow: '🟡', pink: '🌸',
  orange: '🟠', black: '⚫', white: '⚪', brown: '🟤', purple: '🟣', gray: '🔘',
  // numbers
  one: '1️⃣', two: '2️⃣', three: '3️⃣', four: '4️⃣', five: '5️⃣',
  six: '6️⃣', seven: '7️⃣', eight: '8️⃣', nine: '9️⃣', ten: '🔟', zero: '0️⃣',
  // family
  mom: '👩', dad: '👨', brother: '👦', sister: '👧',
  grandma: '👵', grandpa: '👴', baby: '👶', uncle: '🧔', aunt: '👩‍🦰',
  // body
  head: '🧠', eye: '👁️', ear: '👂', nose: '👃', mouth: '👄',
  hand: '✋', foot: '🦶', arm: '💪', leg: '🦵',
  // fruits
  apple: '🍎', banana: '🍌', grape: '🍇', pear: '🍐',
  watermelon: '🍉', strawberry: '🍓', mango: '🥭', peach: '🍑', cherry: '🍒',
}

const toFlashcard = (w: EnglishWord): Flashcard => ({
  word: w.word,
  phonetic: w.phonetic,
  chinese: w.meaning,
  image: emojiMap[w.word] || categoryLabels[w.category as WordCategory]?.emoji || '✨',
  examples: (w.sentences || []).slice(0, 1).map((en) => ({ en, cn: '' })),
})

const filterBy = (cat: WordCategory) => englishWords.filter((w) => w.category === cat).map(toFlashcard)

// 对应页面 5 个分类
export const animalFlashcards: Flashcard[] = filterBy('animals')
export const familyFlashcards: Flashcard[] = filterBy('family')
// fruits 单独拿出来，没有的话用 food 凑
export const fruitFlashcards: Flashcard[] = (
  englishWords.filter((w) => w.category === 'fruits').length
    ? englishWords.filter((w) => w.category === 'fruits')
    : englishWords.filter((w) => w.category === 'food' || w.category === 'fruits')
).map(toFlashcard)
export const colorFlashcards: Flashcard[] = filterBy('colors')
export const numberFlashcards: Flashcard[] = filterBy('numbers')

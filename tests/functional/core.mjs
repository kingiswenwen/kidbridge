import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { buildSync } from 'esbuild';
const require = createRequire(new URL('../../package.json', import.meta.url));
function load(entry) {
  const { outputFiles } = buildSync({entryPoints:[entry], bundle:true, write:false, platform:'node', format:'cjs', packages:'external'});
  const module = {exports:{}};
  new Function('require','module','exports',outputFiles[0].text)(require,module,module.exports);
  return module.exports;
}
const generator = load('src/utils/questionGenerator.ts');
const types = ['addition10','subtraction10','mixed10','addition20','subtraction20','mixed20','decompose','adjacent','compare','wordProblem','counting','sequence'];
// 强制触发最小范围，旧逻辑在 total=2 时会无限循环。
const originalRandom = Math.random;
Math.random = () => 0;
assert.equal(generator.generateQuestion('decompose').options.length,3);
Math.random = originalRandom;
for (const type of types) for(let i=0;i<1000;i++) {
  const q=generator.generateQuestion(type);
  assert(q.options.includes(q.answer));
  assert.equal(new Set(q.options).size,q.options.length);
  assert(generator.checkAnswer(q,q.answer));
  if (/^(addition|subtraction|mixed)/.test(type)) {
    const expression = part => part.match(/[+-]?\s*\d+/g).reduce((sum,n)=>sum+Number(n.replace(/\s/g,'')),0);
    const [left,right]=q.content.replace('?',String(q.answer)).split('=');
    assert.equal(expression(left),expression(right),q.content);
  }
  if(type==='decompose') assert.equal(q.answer+q.num2,q.num1);
  if(type==='compare') assert.equal(q.answer,q.num1>q.num2?'>':q.num1<q.num2?'<':'=');
  if(type==='counting') assert.equal(q.answer,q.visual.items.length);
  if(type==='wordProblem') assert.equal(q.answer,q.operator==='+'?q.num1+q.num2:q.num1-q.num2);
  if(typeof q.answer==='number') assert(q.answer>=0 && q.answer<=20);
}
const {createPinia,setActivePinia} = require('pinia');
setActivePinia(createPinia());
const {useAppStore} = load('src/stores/app.ts');
const store = useAppStore();
const today = new Date();
const yesterday = new Date(today.getFullYear(),today.getMonth(),today.getDate()-1);
const date = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
store.progress.lastActiveDate=date(yesterday);store.progress.streak=3;store.progress.todayQuestions=10;
store.ensureDailyReset();assert.equal(store.progress.todayQuestions,0);
store.recordAnswer(true,'math');assert.equal(store.streakDays,4);
store.recordAnswer(false,'math');assert.equal(store.streakDays,4);
store.updateEnglishProgress(5,3);store.updatePinyinProgress(5,4);
assert.equal(store.progress.totalQuestions,12);assert.equal(store.progress.mathProgress.totalQuestions,2);
assert.equal(store.progress.correctAnswers,8);
store.markPinyinLearned('a');store.addPinyinFavorite('a');store.addPinyinFavorite('a');assert.equal(store.pinyinFavorites.length,1);
store.resetAll();assert.equal(store.progress.mathProgress.totalQuestions,0);assert.equal(store.progress.pinyinProgress.learnedPinyin.length,0);
store.recordAnswer(true,'math');store.resetAll();assert.equal(store.progress.mathProgress.totalQuestions,0);
console.log('PASS: 12,000 generated questions; small-range termination; streak, module totals, favorites and repeated reset');
const oldDay = new Date(today.getFullYear(),today.getMonth(),today.getDate()-3);
store.progress.lastActiveDate=date(oldDay);store.progress.streak=8;store.ensureDailyReset();store.recordAnswer(true,'math');assert.equal(store.streakDays,1);
let spoken=0;
globalThis.window={speechSynthesis:{cancel(){},speak(){spoken++;}}};
globalThis.SpeechSynthesisUtterance=class {constructor(text){this.text=text;}};
globalThis.uni = {showToast(){}};
const {speak,getRecordingSource}=load('src/utils/speak.ts');store.toggleSound(false);speak('hello','en-US');assert.equal(spoken,0);store.toggleSound(true);speak('hello','en-US');assert.equal(spoken,1);
console.log('PASS: streak after inactivity; speech respects sound setting');
const {withTone,buildPinyinOptions} = load('src/utils/pinyin.ts');
for (const [pinyin,tone,expected] of [
  ['niu',2,'niú'],['liu',4,'liù'],['jiu',3,'jiǔ'],['shui',3,'shuǐ'],['hui',1,'huī'],
  ['gui',4,'guì'],['ou',3,'ǒu'],['xue',3,'xuě'],['lü',4,'lǜ'],['hao',3,'hǎo'],
  ['bo',0,'bo'],['zh',1,'zh'],
]) assert.equal(withTone(pinyin,tone),expected);
const {pinyinCharPairs} = load('src/data/pinyin/questions.ts');
for(const char of ['蜂','交','菠']) assert.equal(pinyinCharPairs.find(pair=>pair.char===char).tone,1);
const chicken = pinyinCharPairs.find(pair=>pair.char==='鸡');
for(const mode of ['char2pinyin','pinyin2char']) for(let i=0;i<100;i++) {
  const options=buildPinyinOptions(chicken,mode,pinyinCharPairs);
  assert.equal(options.length,4);
  assert.equal(options.filter(x=>x.pinyin===chicken.pinyin&&x.tone===chicken.tone).length,1);
  const keys=options.map(x=>mode==='char2pinyin'?`${x.pinyin}:${x.tone}`:x.char);
  assert.equal(new Set(keys).size,4);
}
const {buildChoiceOptions} = load('src/utils/practiceOptions.ts');
const optionSets = new Set();
for(let i=0;i<100;i++) {
  const options=buildChoiceOptions('red',['red','red','cat','dog','bird','blue','green','blue']);
  assert.equal(options.length,4);assert.equal(new Set(options).size,4);assert(options.includes('red'));
  optionSets.add(options.filter(value=>value!=='red').sort().join(','));
}
assert(optionSets.size>1,'Distractors should vary instead of always using the first three entries');
console.log('PASS: pinyin tone placement, bank corrections, homophone exclusion, unique/randomized distractors');
const {twoSpellExamples,threeSpellExamples,wholeSyllables,addToneToVowel,getTonedPinyin} = load('src/data/pinyin/syllables.ts');
const wholeKeys=new Set(wholeSyllables.map(item=>item.pinyin));
for(const item of [...twoSpellExamples,...threeSpellExamples]) {
  assert(!wholeKeys.has(item.result),`${item.result} is recognized as a whole and must not be split`);
  assert.equal(item.initial+(item.medial||'')+item.final,item.result);
  assert.notEqual(item.result,'lüan');assert.notEqual(item.result,'den');
}
assert(twoSpellExamples.some(item=>item.result==='bie'&&item.final==='ie'&&!item.medial));
assert(twoSpellExamples.some(item=>item.result==='lüe'&&item.final==='üe'&&!item.medial));
assert(!threeSpellExamples.some(item=>item.final==='e'));
assert.equal(addToneToVowel('iu',3),'iǔ');assert.equal(getTonedPinyin('liu',4),'liù');
console.log('PASS: spelling formulas, whole-syllable recognition, ie/üe two-part examples and shared tone rules');

let played = 0;
const availableFiles = [];
globalThis.uni.createInnerAudioContext = () => ({stop(){},destroy(){},onError(){},set src(value){availableFiles.push(value);},play(){played++;}});
speak('b');speak('hello','en-US');assert.equal(played,2);
assert.equal(getRecordingSource('pō','zh-CN'),'/static/audio/pinyin/p-u014d.wav');
assert.equal(getRecordingSource("You're welcome.",'en-US'),'/static/audio/english/you-re-welcome.wav');
for (const file of availableFiles) assert(require('fs').existsSync('src'+file));
console.log('PASS: bundled pinyin/English audio selection and filenames');

// Do not route a teaching sound to an empty or missing recording.
const {audioSources}=load('src/data/audioSources.ts');
for (const [key,file] of Object.entries(audioSources)) {
  const wav=require('fs').readFileSync('src'+file);
  assert.equal(wav.toString('ascii',0,4),'RIFF',key);
  const offset=wav.indexOf(Buffer.from('data'));
  assert(offset>=0 && wav.readUInt32LE(offset+4)>0,`${key}: empty WAV ${file}`);
}
console.log('PASS: every mapped recording contains audio data (including ü)');

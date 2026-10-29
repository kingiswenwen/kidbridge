const {chromium}=require('playwright');
const assert=require('assert/strict'),fs=require('fs');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH || undefined,headless:true,args:['--no-sandbox']});
 const context=await browser.newContext();const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(8000);
 const base=process.env.TEST_BASE_URL || 'http://127.0.0.1:4173/';const routes=JSON.parse(fs.readFileSync('src/pages.json')).pages;
 const go=async route=>{await page.goto(base+'learning.html#/'+route);await page.waitForTimeout(200);};
 for(const width of [390,1280]) {await page.setViewportSize({width,height:900});
 for(const route of routes) {await go(route.path);assert((await page.locator('body').innerText()).trim());}
 const nav=await context.newPage();await nav.setViewportSize({width,height:900});await nav.goto(base);await nav.locator('#search').fill('Scratch');assert((await nav.locator('#sections').innerText()).includes('Scratch'));await nav.locator('#reset').click();assert.equal(await nav.locator('.resource-card').count()||await nav.locator('.site-card').count(),44);await nav.close();console.log('16 routes + navigation search/reset',width,'PASS');}
 async function quiz(route,start,next,count=10){await go(route);await page.getByText(start,{exact:true}).click();for(let i=0;i<count;i++){await page.locator('.option-btn').first().click();await page.getByText(i===count-1?'查看成绩':next,{exact:true}).click();}await page.waitForTimeout(200);}
 await quiz('pages/math/practice/index','开始练习','下一题 →');console.log('math quiz PASS');
 await quiz('pages/english/practice/index','开始练习','下一题 →');console.log('english quiz PASS');
 await quiz('pages/pinyin/practice/index','开始练习','下一题 →');console.log('pinyin quiz PASS');
 const data=await page.evaluate(()=>JSON.parse(localStorage.getItem('kidbridge-app-storage')));assert.equal(data.progress.totalQuestions,30);assert.equal(data.progress.mathProgress.totalQuestions,10);assert.equal(data.progress.englishProgress.totalQuestions,10);assert.equal(data.progress.pinyinProgress.totalQuestions,10);await page.reload();console.log('persisted totals PASS');

 await go('pages/math/challenge/index');await page.locator('.level-card.unlocked').first().click();
 for(let i=0;i<5;i++){await page.locator('.option-btn').first().click();await page.getByText(i===4?'查看成绩':'下一题 →',{exact:true}).click();}
 await page.waitForTimeout(100);let saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('kidbridge-app-storage')));assert.equal(saved.challengeProgress['beginner-1'].attempts,1);assert.equal(saved.progress.mathProgress.totalQuestions,15);console.log('challenge result and attempt persistence PASS');
 await go('pages/english/flashcard/index');await page.getByText('认识',{exact:true}).click();await page.waitForTimeout(500);await page.reload();await page.waitForTimeout(200);saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('kidbridge-app-storage')));assert(saved.progress.englishProgress.learnedWords.length>0);console.log('flashcard learned words persistence PASS');
 await go('pages/settings/index');await page.getByRole('button',{name:'修改昵称'}).click();await page.locator('.dialog-input input').fill('测试宝宝');await page.locator('[data-dialog-confirm]').click();await page.locator('.av-item').nth(1).click();await page.waitForTimeout(100);await page.reload();await page.waitForTimeout(200);assert((await page.locator('.profile-name').innerText()).includes('测试宝宝'));assert((await page.locator('.avatar-img img').getAttribute('src')).includes('cat.svg'));console.log('nickname/avatar persistence PASS');
 await page.getByText('重置学习进度',{exact:true}).click();await page.locator('[data-dialog-cancel]').click();saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('kidbridge-app-storage')));assert.equal(saved.progress.totalQuestions,35);
 await page.getByText('重置学习进度',{exact:true}).click();await page.locator('[data-dialog-confirm]').click();await page.waitForTimeout(150);saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('kidbridge-app-storage')));assert.equal(saved.progress.totalQuestions,0);assert.equal(saved.progress.mathProgress.totalQuestions,0);assert.equal(saved.progress.englishProgress.learnedWords.length,0);assert.equal(saved.wrongBook.length,0);assert.equal(Object.keys(saved.challengeProgress).length,0);console.log('reset cancel/confirm clears nested data PASS');
 console.log('runtime errors',errors);await browser.close();assert.equal(errors.length,0);
})().catch(e=>{console.error(e);process.exit(1)});

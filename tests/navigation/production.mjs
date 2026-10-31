// Read-only verification against the deployed site; uses an isolated browser context.
import {chromium} from 'playwright';
import {existsSync} from 'node:fs';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {assertImagesLoaded} from '../helpers/images.mjs';
const base=new URL(process.env.DEPLOY_URL||'https://kidbridge.wynsunny.cn/');
const expected=process.env.GITHUB_SHA;if(!/^[a-f0-9]{40}$/.test(expected||''))throw new Error('Expected GITHUB_SHA is required');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||(existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),args:['--no-sandbox']});
const context=await browser.newContext({viewport:{width:375,height:900}});const page=await context.newPage();const errors=[];
page.setDefaultTimeout(30000);page.setDefaultNavigationTimeout(60000);page.on('pageerror',e=>errors.push(e.message));
page.on('response',response=>{if(response.status()>=400 && new URL(response.url()).origin===base.origin && ['script','stylesheet','document','image'].includes(response.request().resourceType()))errors.push(`${response.status()} ${response.url()}`);});
// A navigation intentionally cancels outstanding images from the previous page.
// Per-page decoding checks and HTTP errors still catch actual broken images.
page.on('requestfailed',request=>{const reason=request.failure()?.errorText;if(request.resourceType()==='image' && new URL(request.url()).origin===base.origin && reason!=='net::ERR_ABORTED')errors.push(`Image request failed: ${request.url()} ${reason}`);});
const artifacts='artifacts/production-smoke';await mkdir(artifacts,{recursive:true});
const illustrations=[];
try{
 await page.goto(base.href,{waitUntil:'domcontentloaded'});
 assert.equal(await page.locator('meta[name="kidbridge-release"]').getAttribute('content'),expected,'Normal homepage must serve the current release');
 assert(await page.getByRole('link',{name:'成长计划',exact:true}).isVisible());
 await assertImagesLoaded(page);
 await page.screenshot({path:`${artifacts}/home-mobile.png`,fullPage:false});
 const targets=await page.locator('#pickGrid .pick').evaluateAll(links=>links.map(a=>({href:a.href,target:a.target,name:a.innerText})));
 assert.equal(targets.length,6);
 for(const [i,target] of targets.entries()){
  assert.equal(new URL(target.href).origin,base.origin);assert.notEqual(target.target,'_blank');
  await page.goto(base.href,{waitUntil:'domcontentloaded'});await assertImagesLoaded(page);await page.locator('#pickGrid .pick').nth(i).click();
  await page.locator('uni-page-body').waitFor();
  assert.equal(await page.locator('meta[name="kidbridge-release"]').getAttribute('content'),expected,'Learning document must serve the current release');
  const marker=[['.race-page-title','今日赛道'],['.hero-title','数学练习'],['uni-page-head','拼音学习'],['.fh-title','英语闪卡'],['.ch-hero-title','闯关挑战'],['.race-page-title','奖励仓库']][i];
  await page.locator(marker[0]).filter({hasText:marker[1]}).first().waitFor();
  if(i===1){await page.getByText('开始练习',{exact:true}).click();await page.locator('.option-btn').first().click();await page.locator('.feedback').waitFor();}
  const images=await assertImagesLoaded(page);illustrations.push({entry:target.name,images});
  if(i===0||i===5){assert(images.length>=4,'Growth and rewards must render their illustrations');assert(images.every(image=>image.width>0&&image.height>0),'Illustrations must have visible dimensions');}
  await page.screenshot({path:`${artifacts}/entry-${i+1}.png`,fullPage:true});
 }
 const routes=JSON.parse(await readFile(new URL('../../src/pages.json',import.meta.url),'utf8')).pages;
 for(const route of routes){
  const url=new URL('learning.html',base);url.searchParams.set('smokeRoute',route.path);url.hash='/'+route.path;
  await page.goto(url.href,{waitUntil:'domcontentloaded'});await page.locator('uni-page-body').waitFor();
  await page.waitForFunction(()=>document.querySelector('uni-page-body')?.innerText.trim().length>0);
  assert.equal(await page.locator('meta[name="kidbridge-release"]').getAttribute('content'),expected,route.path);
  assert(!/页面不存在|页面未找到|Page not found|Failed to fetch/i.test(await page.locator('uni-page-body').innerText()),route.path);
  await assertImagesLoaded(page);
 }
 assert.equal(context.pages().length,1);assert.deepEqual(errors,[]);
 await writeFile(`${artifacts}/result.json`,JSON.stringify({release:expected,base:base.href,entries:targets.map(t=>t.name),routes:routes.map(r=>r.path),illustrations,errors},null,2));
 console.log(`Verified live homepage, growth entrance and all six quick starts plus ${routes.length} pages at ${expected}`);
}catch(e){
 const diagnostics=[];
 for(const path of ['','index.html','learning.html']){
  try{const response=await context.request.get(new URL(path,base).href,{timeout:15000});const html=await response.text();diagnostics.push({path:path||'/',status:response.status(),release:html.match(/name="kidbridge-release" content="([a-f0-9]{40})"/)?.[1]||null,hasGrowth:html.includes('id="growthEntry"'),cacheControl:response.headers()['cache-control']||null,age:response.headers()['age']||null});}catch(error){diagnostics.push({path,error:String(error)});}
 }
 await writeFile(`${artifacts}/diagnostics.json`,JSON.stringify(diagnostics,null,2));console.error('Live document diagnostics:',JSON.stringify(diagnostics));
 await page.screenshot({path:`${artifacts}/failure.png`,fullPage:true}).catch(()=>{});await writeFile(`${artifacts}/failure.txt`,String(e));throw e;}
finally{await browser.close();}

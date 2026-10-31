import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, extname } from 'node:path';
import assert from 'node:assert/strict';
const root=resolve('dist/build/h5');
const artifacts=resolve('artifacts/navigation-browser');await mkdir(artifacts,{recursive:true});
const server=createServer(async(req,res)=>{
 try{
  const path=new URL(req.url,'http://localhost').pathname;
  if(path==='/embed-test'){res.setHeader('Content-Type','text/html');res.end('<!doctype html><style>body{margin:0}iframe{border:0;width:100%;height:100vh}</style><iframe sandbox="allow-scripts allow-same-origin" src="/"></iframe>');return;}
  const file=resolve(root,'.'+(path==='/'?'/index.html':path));assert(file.startsWith(root+'/'));
  res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.json':'application/json'})[extname(file)]||'application/octet-stream');res.end(await readFile(file));
 }catch{res.writeHead(404).end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||(existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),args:['--no-sandbox']});
const context=await browser.newContext();const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
const choices=[['pages/racing/index','.race-page-title','今日赛道'],['pages/math/practice/index','.hero-title','数学练习'],['pages/pinyin/index','uni-page-head','拼音学习'],['pages/english/flashcard/index','.fh-title','英语闪卡'],['pages/math/challenge/index','.ch-hero-title','闯关挑战'],['pages/racing/rewards/index','.race-page-title','奖励仓库']];
try{
 for(const width of [320,375,1440]){
  await page.setViewportSize({width,height:900});await page.goto(base+'/');await page.locator('.pick').first().waitFor();
  assert.equal(await page.locator('.pick').count(),6);
  assert(await page.locator('.growth-nav').isVisible());
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'No horizontal overflow');
  await page.screenshot({path:`${artifacts}/home-${width}.png`,fullPage:false});
  for(const embedded of [false,true])for(let i=0;i<choices.length;i++){
   await page.goto(base+(embedded?'/embed-test':'/'));
   const scope=embedded?page.frameLocator('iframe'):page;
   const link=scope.locator('.pick').nth(i);await link.waitFor();
   const href=await link.getAttribute('href');assert.equal(href,`./learning.html#/${choices[i][0]}`);
   assert.notEqual(await link.getAttribute('target'),'_blank');
   await link.click();await scope.locator(choices[i][1]).filter({hasText:choices[i][2]}).first().waitFor();
   assert.equal(context.pages().length,1,'Native clicks must not require a popup');
   if(i===1){await scope.getByText('开始练习',{exact:true}).click();await scope.locator('.option-btn').first().click();await scope.locator('.feedback').waitFor();}
  }
  console.log(`PASS ${width}px: all six quick starts open usable pages, including sandbox without popups`);
 }
 await page.goto(base+'/');await page.locator('.growth-nav').click();await page.locator('.race-page-title').filter({hasText:'今日赛道'}).waitFor();
 await page.goto(base+'/');await page.locator('.learning-entry').click();await page.locator('.home-racing-entry').click();await page.locator('.race-page-title').filter({hasText:'今日赛道'}).waitFor();
 assert.equal(errors.length,0,JSON.stringify(errors));
 await writeFile(`${artifacts}/results.json`,JSON.stringify({quickStarts:36,widths:[320,375,1440],popupPages:context.pages().length-1,errors},null,2));
 console.log('PASS: header growth and learning-home growth paths, no page errors');
}finally{await browser.close();await new Promise(r=>server.close(r));}

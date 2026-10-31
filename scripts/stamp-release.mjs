import { readFile, writeFile } from 'node:fs/promises';
const commit=process.env.GITHUB_SHA;
if(commit){
 if(!/^[a-f0-9]{40}$/.test(commit))throw new Error('Invalid release SHA');
 for(const name of ['index.html','learning.html']){
  const path=new URL(`../dist/build/h5/${name}`,import.meta.url);
  const html=(await readFile(path,'utf8')).replace(/<meta name="kidbridge-release" content="[a-f0-9]{40}">/g,'');
  await writeFile(path,html.replace('</head>',`<meta name="kidbridge-release" content="${commit}"></head>`));
 }
}

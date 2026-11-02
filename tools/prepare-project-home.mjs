import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
const root=fileURLToPath(new URL('../',import.meta.url));
const studies=[
 ['Room for an answer','renders/open-phrase-study','tools/render-open-phrase-study.mjs'],
 ['One more return','renders/open-phrase-recurrence','tools/render-open-phrase-recurrence.mjs'],
 ['Three Groves','renders/harmonic-groves','tools/render-harmonic-groves.mjs'],
 ['A passage returns','renders/ensemble-return-study','tools/render-ensemble-return-study.mjs'],
 ['A memory, then an answer','renders/ensemble-continuation-study','tools/render-ensemble-continuation-study.mjs'],
 ['One Grove, three bodies','renders/ensemble-body-study','tools/render-ensemble-body-study.mjs']
];
const args=process.argv.slice(2);
if(args.some(arg=>arg!=='--check'))throw new Error('Usage: node tools/prepare-project-home.mjs [--check]');
async function available(directory){
 try{
  const html=await fs.readFile(path.join(root,directory,'index.html'),'utf8');
  const files=[...html.matchAll(/data-file="([^"]+\.wav)"/g)].map(m=>m[1]);
  if(!files.length)return false;
  await Promise.all(files.map(file=>fs.access(path.join(root,directory,file))));
  await fs.access(path.join(root,directory,'report.json'));
  return true;
 }catch{return false;}
}
let missing=0;
for(const [title,directory,script] of studies){
 if(await available(directory)){console.log('Ready: '+title);continue;}
 missing++;
 if(args.includes('--check')){console.log('Missing: '+title);continue;}
 console.log('Preparing: '+title+' (physical rendering may take a few minutes)');
 await new Promise((resolve,reject)=>{const child=spawn(process.execPath,[script],{cwd:root,stdio:['ignore','ignore','inherit']});child.on('error',reject);child.on('exit',(code,signal)=>code===0?resolve():reject(new Error(title+' preparation failed: '+(signal??code))));});
 if(!await available(directory))throw new Error(title+' renderer did not produce a complete listening page');
 console.log('Ready: '+title);
}
if(args.includes('--check')&&missing){process.exitCode=1;console.log('Run node tools/prepare-project-home.mjs to prepare the missing studies.');}
else console.log('Project home studies available. Start the local server with npm start and open /project.html.');

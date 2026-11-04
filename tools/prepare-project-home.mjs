import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
import {verifyExpressiveComparison} from './finalize-expressive-compare.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const studies=[
 ['How should a generated piece answer?','renders/living-generated-answer-study','tools/render-living-answer-study.mjs',['--generated']],
 ['A phrase with room to breathe','renders/living-answer-study','tools/render-living-answer-study.mjs'],
 ['An answer that leaves room','renders/living-response-study','tools/render-living-response-study.mjs'],
 ['A little air around a phrase','renders/living-space-study','tools/render-living-space-study.mjs'],
 ['A phrase unfolds','renders/living-arrangement','tools/render-living-arrangement.mjs'],
 ['The first encounter artistic proof','renders/flagship-sketch','tools/render-flagship-sketch.mjs'],
 ['A shape across time','renders/tine-displacement','tools/render-tine-displacement-study.mjs',[],true],
 ['The time within a touch','renders/tine-force','tools/render-tine-force-study.mjs'],
 ['One phrase, four bodies','renders/tine-bodies','tools/study-tine-bodies.mjs'],
 ['What continues beyond the glimpse?','renders/joint-decay-study','tools/render-joint-decay-study.mjs',['--audio-dir','renders/joint-decay-study']],
 ['Room for an answer','renders/open-phrase-study','tools/render-open-phrase-study.mjs'],
 ['One more return','renders/open-phrase-recurrence','tools/render-open-phrase-recurrence.mjs'],
 ['Three Groves','renders/harmonic-groves','tools/render-harmonic-groves.mjs'],
 ['A passage returns','renders/ensemble-return-study','tools/render-ensemble-return-study.mjs'],
 ['A memory, then an answer','renders/ensemble-continuation-study','tools/render-ensemble-continuation-study.mjs'],
 ['One Grove, three bodies','renders/ensemble-body-study','tools/render-ensemble-body-study.mjs'],
 ['The same touch, three families','renders/ensemble-family-study','tools/render-ensemble-family-study.mjs']
];
const args=process.argv.slice(2);
if(args.some(arg=>arg!=='--check'))throw new Error('Usage: node tools/prepare-project-home.mjs [--check]');
async function available(directory,visual=false){
 try{
  const html=await fs.readFile(path.join(root,directory,'index.html'),'utf8');
  const files=[...html.matchAll(/data-file="([^"]+\.wav)"/g)].map(m=>m[1]);
  files.push(...[...html.matchAll(/<audio[^>]+src="([^"]+\.wav)"/g)].map(m=>m[1]));
  if(!files.length&&!visual)return false;
  if(visual)files.push(...[...html.matchAll(/<img[^>]+src="([^"]+)"/g)].map(m=>m[1]));
  await Promise.all(files.map(file=>fs.access(path.join(root,directory,file))));
  await fs.access(path.join(root,directory,'report.json'));
  return true;
 }catch{return false;}
}
let missing=0;
for(const [title,directory,script,scriptArgs=[],visual=false] of studies){
 if(await available(directory,visual)){console.log('Ready: '+title);continue;}
 missing++;
 if(args.includes('--check')){console.log('Missing: '+title);continue;}
 console.log('Preparing: '+title+' (physical rendering may take a few minutes)');
 await new Promise((resolve,reject)=>{const child=spawn(process.execPath,[script,...scriptArgs],{cwd:root,stdio:['ignore','ignore','inherit']});child.on('error',reject);child.on('exit',(code,signal)=>code===0?resolve():reject(new Error(title+' preparation failed: '+(signal??code))));});
 if(!await available(directory,visual))throw new Error(title+' renderer did not produce a complete study page');
 missing--;
 console.log('Ready: '+title);
}
// Offline Web Audio needs an explicit browser render; never pretend Node can
// regenerate it or overwrite the pinned inputs behind an existing WAV pair.
try{
 await verifyExpressiveComparison(path.join(root,'renders/expressive-compare'));
 await fs.access(path.join(root,'renders/expressive-compare/index.html'));
 console.log('Ready: What does expression add? (verified saved browser artifacts)');
}catch(error){
 missing++;
 console.log('Missing or invalid: What does expression add? '+error.message);
 console.log('Prepare inputs with node tools/compare-expressive-study.mjs; open /tests/expressive-compare-render.html in the local browser, prepare and keep both WAVs plus browser-verification.json into renders/expressive-compare; then run node tools/finalize-expressive-compare.mjs.');
}
if(missing&&args.includes('--check')){process.exitCode=1;console.log('Run node tools/prepare-project-home.mjs for Node-rendered studies; follow the browser instructions above for the expression comparison.');}
else if(missing&& !args.includes('--check')) console.log('Node-rendered studies prepared. Any missing expression comparison needs the explicit browser steps above.');
else console.log('Project home studies available. Start the local server with npm start and open /project.html.');

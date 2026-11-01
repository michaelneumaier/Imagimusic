import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {performance} from 'node:perf_hooks';
import {composeGrove} from '../src/score/grove.js';
import {retuneGroveCluster} from '../src/score/grove-tuning.js';
import {DEFAULT_VOICE_CONFIG} from '../src/score/grove-voice.js';
import {createGroveRestRecipe} from '../src/score/grove-rest.js';
import {createRestEngine,contactStateKey} from '../src/rest/engine.js';

// Screening only. Browser audio deadlines are not measured by this process.
const out=process.argv[2]??'renders/ensemble-engine-cost',sampleRate=48000,blockFrames=128,warmupBlocks=200,measuredBlocks=1200;
const recipes=[],preparationMs=[];
for(const note of [48,51,55]){
 const started=performance.now();
 recipes.push(createGroveRestRecipe(retuneGroveCluster(composeGrove({seed:3}),note),DEFAULT_VOICE_CONFIG,{sampleRate}));
 preparationMs.push(performance.now()-started);
}
const rows=[];let checksum=0;
for(const count of [1,3])for(const contact of [false,true]){
 const engines=recipes.slice(0,count).map(createRestEngine),samples=engines.map(()=>new Float64Array(2));
 engines.forEach((engine,i)=>{
  engine.strike(1,0,.5);
  if(contact)engine.setContacts(contactStateKey([{zone:recipes[i].zones.length-1,strength:recipes[i].strengths.findIndex(s=>s.name==='firm')},null,null]));
 });
 function renderBlock(){
  for(let frame=0;frame<blockFrames;frame++){
   let left=0,right=0;
   for(let part=0;part<count;part++){
    const engine=engines[part],sample=samples[part];
    engine.read(sample);
    left+=Math.fround(sample[0])*(1/count);right+=Math.fround(sample[1])*(1/count);
    engine.step();
   }
   checksum+=Math.fround(left)+Math.fround(right);
  }
 }
 for(let i=0;i<warmupBlocks;i++)renderBlock();
 const times=[],started=performance.now();
 for(let i=0;i<measuredBlocks;i++){const before=performance.now();renderBlock();times.push(performance.now()-before);}
 const wallMs=performance.now()-started,audioSeconds=measuredBlocks*blockFrames/sampleRate;
 times.sort((a,b)=>a-b);
 rows.push({engines:count,contact,sampleRate,blockFrames,measuredBlocks,audioSeconds,wallMs,wallToAudioRatio:wallMs/(audioSeconds*1000),medianMs:times[Math.floor(times.length/2)],p99Ms:times[Math.floor(times.length*.99)],maxMs:times.at(-1),blockBudgetMs:blockFrames/sampleRate*1000});
}
if(!Number.isFinite(checksum))throw new Error('Non-finite benchmark output');
const report={date:new Date().toISOString(),runtime:process.version,cpu:os.cpus()[0]?.model,voice:DEFAULT_VOICE_CONFIG,preparationMs,warmupBlocks,rows,checksum,
 limits:'Node single-thread engine-loop screening only, one run per condition in fixed order. Includes per-frame stereo pickup reads, per-part Float32 rounding, fixed weighted sum, final Float32 rounding, stepping, checksum and measurement overhead. Excludes browser AudioWorklet scheduling, queues, acknowledgements, snapshots, graphics, and thermal/device variability. Wall time is not CPU time. No realtime/browser readiness or audible-dropout claim. Preparation measured separately.'};
await fs.mkdir(out,{recursive:true});
await fs.writeFile(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));

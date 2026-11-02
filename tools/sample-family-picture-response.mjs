// Reproducible visual samples from the authored family study, not screen/perception evidence.
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {recipeForRecord,restRecordVisual} from '../src/score/grove-rest.js';
const source=process.argv[2]??'renders/ensemble-family-study',out=process.argv[3]??'renders/ensemble-family-response';
const cases=[];
for(const seed of [3,7,11]){
 const text=await fs.readFile(path.join(source,`family-${seed}.json`),'utf8'),ensemble=JSON.parse(text),record=ensemble.parts[0].record;
 assert.equal(record.grove.seed,seed);assert.equal(record.grove.cluster.baseMidi,48);
 assert.deepEqual(record.events,[{frame:0,order:0,body:0,position:1,velocity:.5}]);assert.deepEqual(record.contacts,[]);
 const recipe=recipeForRecord(record),picture=restRecordVisual(record,recipe),duration=picture.frames/record.sampleRate,samples=[];
 for(let i=0;i<=Math.ceil(duration*60);i++){
  const time=Math.min(duration,i/60),frame=Math.min(picture.frames,Math.floor(time*record.sampleRate));
  if(samples.at(-1)?.frame===frame)continue;
  samples.push({frame,...picture.visual(time)});
 }
 const peaks=[0,1,2].map(body=>Math.max(...samples.map(s=>s.envelope[body])));
 cases.push({seed,sourceSha256:crypto.createHash('sha256').update(text).digest('hex'),grove:record.grove,sampleRate:record.sampleRate,duration,peaks,baseline:peaks.map(level=>({maximumSampledWidthChangePercent:100*Math.min(.2,level*.6),maximumSampledHaloOpacity:.15+Math.min(.65,level*2)})),samples});
}
await fs.mkdir(out,{recursive:true});
await fs.writeFile(path.join(out,'samples.json'),JSON.stringify({source:'Authored family-study C-only records; picture sampled at nominal60Hz, including final faded state.',limits:'Low-band display envelopes, not physical strain, mechanical energy, live timing, screen visibility or subjective listening. Sampling can miss extrema. Baseline scene mappings are copied here for inspection.',cases},null,2)+'\n');
console.log(JSON.stringify(cases.map(({seed,peaks,baseline,samples})=>({seed,peaks,baseline,samples:samples.length})),null,2));

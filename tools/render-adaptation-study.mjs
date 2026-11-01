import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {composeGrove,canonicalGrove,GROVE_BOUNDS} from '../src/score/grove.js';
import {createGroveRestRecipe,composeIndividualityPhrase,recipeForRecord,renderRestRecord,bridgeEnergyExchange,adaptGroveByExchange} from '../src/score/grove-rest.js';
import {prepareRestVariant} from '../src/grove/rest-variant.js';
import {stereoWav} from '../src/loom/model.js';
const outDir=process.argv[2]??'renders/adaptation-study',seed=Number(process.argv[3]??3),sampleRate=48000,k=.5;
const initialRecipe=createGroveRestRecipe(composeGrove({seed}),undefined,{sampleRate}),original=composeIndividualityPhrase(initialRecipe).record;
await fs.mkdir(outDir,{recursive:true});let current=original;const history=[],versions=[];
for(let step=0;step<=3;step++){
 const recipe=recipeForRecord(current);
 assert.deepEqual(current.events,original.events);assert.deepEqual(current.contacts,original.contacts);assert.deepEqual(current.ended,original.ended);assert.equal(current.outputGain,original.outputGain,'Controlled study requires equal canonical gain');
 if([0,1,3].includes(step)){
  const pcm=renderRestRecord(current,recipe),stem=`step-${step}`;
  await fs.writeFile(path.join(outDir,stem+'.wav'),Buffer.from(stereoWav(pcm)));
  await fs.writeFile(path.join(outDir,stem+'.json'),JSON.stringify(current,null,2)+'\n');
  versions.push({step,stem,couplings:current.grove.bridges.map(b=>({...b})),outputGain:current.outputGain,samples:pcm.channels[0].length,canonicalGrove:canonicalGrove(current.grove)});
 }
 if(step===3)break;
 const exchange=bridgeEnergyExchange(current,recipe),next=adaptGroveByExchange(current.grove,exchange,{k});
 for(let i=0;i<next.bridges.length;i++)assert.ok(next.bridges[i].coupling>=current.grove.bridges[i].coupling,'Rule must never weaken a connection');
 const result=prepareRestVariant(original,next,{fps:10});
 history.push({fromStep:step,toStep:step+1,source:canonicalGrove(current.grove),target:canonicalGrove(next),exchange,atUpperBound:next.bridges.filter(b=>b.coupling===GROVE_BOUNDS.coupling[1]).map(b=>[b.a,b.b])});current=result.record;
}
const report={seed,sampleRate,k,seconds:(original.ended.frame+original.ended.fadeFrames)/sampleRate,protocol:'The same authored 5-strike/one-contact phrase is played on each successive structure; that current passage supplies bridge activity for the next change. Step 0,1,3 recordings retain every original gesture and canonical output gain. No autonomous change during playback.',rule:'coupling *= 1 + k * activityShare, bounded by GROVE_BOUNDS; implementation precision follows the model API',versions,history,limits:'Offline artistic adaptation experiment, not a perceptual result. Activity includes spring storage cycling. Monotonic strengthening eventually saturates. These three steps do not establish long-run saturation behavior.'};
await fs.writeFile(path.join(outDir,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({outDir,seed,seconds:report.seconds,versions:versions.map(({step,couplings,outputGain})=>({step,couplings,outputGain}))}));

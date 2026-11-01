import fs from 'node:fs/promises';
import path from 'node:path';
import {prepareRestVariant} from '../src/grove/rest-variant.js';
import {recipeForRecord,renderRestRecord} from '../src/score/grove-rest.js';
import {stereoWav} from '../src/loom/model.js';
// Rebuild the fixed audition fixture from a supplied finished Rest capture.
const sourcePath=process.argv[2],outDir=process.argv[3]??'renders/variant-first-pair';
if(!sourcePath)throw new Error('Usage: node tools/render-rest-variant.mjs <Rest-capture.json> [output-directory]');
const original=JSON.parse(await fs.readFile(sourcePath,'utf8')),target=structuredClone(original.grove);
target.bridges[0].coupling*=1.2;
const variant=prepareRestVariant(original,target),pcm=renderRestRecord(original,recipeForRecord(original));
if(original.outputGain!==variant.record.outputGain)throw new Error('This fixed listening fixture requires matching model gains.');
const report={source:sourcePath,gesturePolicy:'Every strike, hand interval and ending retained exactly',change:{bridge:[target.bridges[0].a,target.bridges[0].b],before:original.grove.bridges[0].coupling,after:target.bridges[0].coupling},sourceGain:original.outputGain,targetGain:variant.record.outputGain,gainPolicy:variant.gainPolicy,sampleRate:pcm.sampleRate,samples:pcm.channels[0].length,limitation:'Explicit 20% bridge change fixture; does not use the pending adaptation prototype. No listening or appeal verdict.'};
await fs.mkdir(outDir,{recursive:true});
for(const [name,data] of [['original.wav',Buffer.from(stereoWav(pcm))],['changed.wav',Buffer.from(stereoWav(variant.pcm))],['changed.json',JSON.stringify(variant.record,null,2)+'\n'],['report.json',JSON.stringify(report,null,2)+'\n']])await fs.writeFile(path.join(outDir,name),data);
console.log(JSON.stringify(report));

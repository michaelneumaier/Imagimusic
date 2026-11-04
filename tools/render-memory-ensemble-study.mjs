import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {createContinuousEnsemblePerformance} from '../src/living/continuous-ensemble-study.js';
import {createMemoryEnsemblePerformance} from '../src/living/memory-ensemble-study.js';
import {renderContinuousEnsembleRecord} from '../src/living/continuous-ensemble-record.js';
import {stereoWav} from '../src/loom/model.js';
const directory=resolve(process.argv[2]??'renders/living-memory-ensemble-study'),guests=[{frame:48000,body:2,strength:.025},{frame:52800,body:0,strength:.1},{frame:86400,body:1,strength:.05}],outputs=[];
mkdirSync(directory,{recursive:true});
for(const name of ['joined','remembered']){
 const p=(name==='joined'?createContinuousEnsemblePerformance:createMemoryEnsemblePerformance)(42),mono=new Float32Array(p.plan.frames);let next=0;p.start();
 while(p.state!=='ended'){
  while(guests[next]?.frame===p.frame){const guest=guests[next++];if(!p.tryGuest(guest.body,guest.strength).admitted)throw Error('Scripted guest was refused.');}
  p.process(mono.subarray(p.frame,Math.min(mono.length,p.frame+4096,guests[next]?.frame??Infinity)));
 }
 const record={kind:'imagimusic-continuous-ensemble-record',version:1,mixGain:1/3,records:p.records()},rebuilt=renderContinuousEnsembleRecord(record).channels[0];
 if(!Buffer.from(mono.buffer).equals(Buffer.from(rebuilt.buffer)))throw Error('The ensemble record changed the mixed samples.');
 let peak=0;const channels=[Math.cos(Math.PI/4),Math.sin(Math.PI/4)].map(pan=>Float32Array.from(mono,x=>{const value=x*pan*24;if(!Number.isFinite(value)||Math.abs(value)>1)throw Error('Preview exceeded headroom; no normalization applied.');peak=Math.max(peak,Math.abs(value));return value;}));
 const wav=new Uint8Array(stereoWav({sampleRate:48000,channels}));writeFileSync(resolve(directory,`${name}.wav`),wav);writeFileSync(resolve(directory,`${name}.json`),JSON.stringify(record,null,2)+'\n');
 outputs.push({name,seconds:48,events:record.records.map(r=>r.events.length),previewGain:24,mixGain:1/3,peak,sha256:createHash('sha256').update(wav).digest('hex'),plan:p.plan});
}
writeFileSync(resolve(directory,'comparison.json'),JSON.stringify({kind:'imagimusic-memory-ensemble-comparison',version:1,guests,outputs,scope:'Same scripted guest input, bodies and fixed mix/preview gain. Only space and recollection change. First three accepted guests before6seconds answer at18.5seconds on next numbered voices at65percent strength and at36.5seconds on their original voices at85percent. Relative timing compresses uniformly only if the gesture spans more than3seconds. Original opening/home remain. This is a bounded authored response, not learned preference or emotional interpretation. Raw compound JSONs reopen for sound-only replay on the ensemble page; this comparison report is not an import. No native playback, recognition or aesthetic preference claim.'},null,2)+'\n');
console.log(JSON.stringify({directory,outputs:outputs.map(({plan,...rest})=>rest)},null,2));

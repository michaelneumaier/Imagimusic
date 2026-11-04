import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {createMemoryReturnPerformance} from '../src/living/memory-return-study.js';
import {createContinuousReturnPerformance} from '../src/living/continuous-return-study.js';
import {renderContinuousTineRecord} from '../src/living/continuous-tine-record.js';
import {stereoWav} from '../src/loom/model.js';
const directory=resolve(process.argv[2]??'renders/living-memory-return-study'),guests=[{frame:48000,strength:.025},{frame:52800,strength:.1},{frame:86400,strength:.05}],outputs=[];
mkdirSync(directory,{recursive:true});
for(const name of ['unattended','joined','remembered']){
 const performance=(name==='remembered'?createMemoryReturnPerformance:createContinuousReturnPerformance)(42),mono=new Float32Array(performance.plan.frames),input=name==='unattended'?[]:guests;let next=0;performance.start();
 while(performance.state!=='ended'){
  while(input[next]?.frame===performance.frame){if(!performance.tryGuest(input[next++].strength).admitted)throw Error('The scripted gesture was refused.');}
  const end=Math.min(mono.length,performance.frame+4096,input[next]?.frame??Infinity);performance.process(mono.subarray(performance.frame,end));
 }
 const record=performance.record(),rebuilt=renderContinuousTineRecord(record).channels[0];
 if(!Buffer.from(mono.buffer).equals(Buffer.from(rebuilt.buffer)))throw Error('The captured samples did not reconstruct.');
 let peak=0;const channels=[Math.cos(Math.PI/4),Math.sin(Math.PI/4)].map(pan=>{const channel=Float32Array.from(mono,x=>x*pan);for(let i=0;i<channel.length;i++){channel[i]*=8;if(!Number.isFinite(channel[i])||Math.abs(channel[i])>1)throw Error('Preview headroom exceeded; no normalization applied.');peak=Math.max(peak,Math.abs(channel[i]));}return channel;});
 const wav=new Uint8Array(stereoWav({sampleRate:48000,channels}));writeFileSync(resolve(directory,`${name}.wav`),wav);writeFileSync(resolve(directory,`${name}.json`),JSON.stringify(record,null,2)+'\n');
 outputs.push({name,seconds:48,touches:record.events.length,peak,previewGain:8,sha256:createHash('sha256').update(wav).digest('hex'),plan:performance.plan});
}
writeFileSync(resolve(directory,'comparison.json'),JSON.stringify({kind:'imagimusic-memory-return-comparison',version:1,guests,outputs,scope:'Scripted example, not a visitor recording. Joined and remembered share the same accepted guest input; only the later space/recollection sections change. Fixed physical body, bounded rhythmic memory and softened strength; no learned preference, consciousness, native playback or aesthetic success claim. Raw accepted-event JSONs can reopen in the continuous replay page; this comparison report itself cannot.'},null,2)+'\n');
console.log(JSON.stringify({directory,outputs:outputs.map(({plan,...rest})=>rest)},null,2));

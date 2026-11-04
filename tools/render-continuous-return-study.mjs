import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {createContinuousReturnPerformance} from '../src/living/continuous-return-study.js';
import {renderContinuousTineRecord} from '../src/living/continuous-tine-record.js';
import {stereoWav} from '../src/loom/model.js';
const directory=resolve(process.argv[2]??'renders/living-continuous-return-study');
const outputs=[];mkdirSync(directory,{recursive:true});
for(const name of ['unattended','one-touch']){
 const performance=createContinuousReturnPerformance(42),{plan}=performance,mono=new Float32Array(plan.frames),guestFrame=24*plan.sampleRate;
 performance.start();
 while(performance.state!=='ended'){
  if(name==='one-touch'&&performance.frame===guestFrame){const result=performance.tryGuest(.05);if(!result.admitted)throw Error('The authored comparison touch was refused.');}
  const end=Math.min(plan.frames,performance.frame+4096,performance.frame<guestFrame?guestFrame:Infinity);
  performance.process(mono.subarray(performance.frame,end));
 }
 const record=performance.record(),rebuilt=renderContinuousTineRecord(record).channels[0];
 if(!Buffer.from(mono.buffer).equals(Buffer.from(rebuilt.buffer)))throw Error('Captured performance does not reconstruct exactly.');
 let peak=0;
 const channels=[Math.cos(Math.PI/4),Math.sin(Math.PI/4)].map(pan=>{
  const channel=Float32Array.from(mono,value=>value*pan);
  for(let i=0;i<channel.length;i++){channel[i]*=8;if(!Number.isFinite(channel[i])||Math.abs(channel[i])>1)throw Error('Fixed preview gain exceeds headroom.');peak=Math.max(peak,Math.abs(channel[i]));}
  return channel;
 });
 const wav=new Uint8Array(stereoWav({sampleRate:plan.sampleRate,channels}));
 writeFileSync(resolve(directory,`${name}.wav`),wav);writeFileSync(resolve(directory,`${name}.json`),JSON.stringify(record,null,2)+'\n');
 outputs.push({name,frames:plan.frames,sampleRate:plan.sampleRate,seconds:48,touches:record.events.length,previewGain:8,peak,sha256:createHash('sha256').update(wav).digest('hex'),reconstruction:'Exact mono Float32 bytes before fixed preview conversion.'});
}
const plan=createContinuousReturnPerformance(42).plan;
const report={kind:'imagimusic-continuous-return-comparison',version:1,plan,outputs,scope:'Authored seeded rhythmic grammar on one continuously ringing four-mode tine, with a fixed 25ms output ending. The second example adds one scripted guest touch at24seconds; all score notes stay unchanged. No claim of adaptive composition, melodic ensemble, new timbres, native playback, aesthetic success, radiation, collisions or fabrication realism.'};
writeFileSync(resolve(directory,'comparison.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({directory,outputs},null,2));

import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {createContinuousEnsemblePerformance} from '../src/living/continuous-ensemble-study.js';
import {createContinuousReturnPerformance} from '../src/living/continuous-return-study.js';
import {renderContinuousTineRecord} from '../src/living/continuous-tine-record.js';
import {prepareContinuousEnsembleAudio} from '../src/living/continuous-ensemble-audio.js';
import {stereoWav} from '../src/loom/model.js';
const directory=resolve(process.argv[2]??'renders/living-continuous-ensemble-study'),outputs=[];
mkdirSync(directory,{recursive:true});
for(const name of ['source','ensemble']){
 const p=(name==='source'?createContinuousReturnPerformance:createContinuousEnsemblePerformance)(42),mono=new Float32Array(p.plan.frames);p.start();
 while(p.state!=='ended')p.process(mono.subarray(p.frame,Math.min(mono.length,p.frame+4096)));
 const records=name==='source'?[p.record()]:p.records(),components=records.map(record=>renderContinuousTineRecord(record).channels[0]);
 const gain=1/3,reconstructed=Float32Array.from(mono,(_,i)=>name==='source'?components[0][i]:(components[0][i]+components[1][i]+components[2][i])*gain);
 if(!Buffer.from(mono.buffer).equals(Buffer.from(reconstructed.buffer)))throw Error('Component records failed to reconstruct the performance.');
 if(name==='ensemble'){
  const artifact=prepareContinuousEnsembleAudio(JSON.stringify({kind:'imagimusic-continuous-ensemble-record',version:1,mixGain:gain,records})),view=new DataView(artifact.wav);
  for(let i=0;i<mono.length;i++)if(!Object.is(view.getFloat32(58+4*i,true),mono[i]))throw Error('The saved ensemble WAV changed a mixed sample.');
  writeFileSync(resolve(directory,'ensemble.json'),JSON.stringify(artifact.record,null,2)+'\n');writeFileSync(resolve(directory,'ensemble-raw.wav'),new Uint8Array(artifact.wav));
 }
 // Same gain per body in both examples, not equal perceived loudness.
 if(name==='source')for(let i=0;i<mono.length;i++)mono[i]*=gain;
 let peak=0;const channels=[Math.cos(Math.PI/4),Math.sin(Math.PI/4)].map(pan=>Float32Array.from(mono,value=>{
  const sample=value*pan*24;if(!Number.isFinite(sample)||Math.abs(sample)>1)throw Error('Preview headroom exceeded; no normalization applied.');peak=Math.max(peak,Math.abs(sample));return sample;
 }));
 const wav=new Uint8Array(stereoWav({sampleRate:48000,channels}));writeFileSync(resolve(directory,`${name}.wav`),wav);
 records.forEach((record,i)=>writeFileSync(resolve(directory,`${name}-body-${i}.json`),JSON.stringify(record,null,2)+'\n'));
 outputs.push({name,seconds:48,events:records.map(r=>r.events.length),bodyLengthsMm:records.map(r=>r.design.lengthMm),perBodyMixGain:gain,previewGain:24,peak,sha256:createHash('sha256').update(wav).digest('hex'),plan:p.plan});
}
writeFileSync(resolve(directory,'comparison.json'),JSON.stringify({kind:'imagimusic-continuous-ensemble-comparison',version:1,outputs,scope:'Same seed, note times and strengths; only body assignment changes. Three independent continuously ringing tines, no mechanical energy exchange. Fixed one-third gain per body then common gain24 and centered stereo PCM16 export; no per-example normalization or loudness matching. Each raw body JSON reopens separately in continuous replay at its own raw level; this report is not an ensemble import. Component reconstruction is verified, not native playback, visual causality or aesthetic success.'},null,2)+'\n');
console.log(JSON.stringify({directory,outputs:outputs.map(({plan,...rest})=>rest)},null,2));

import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {createLivingGeneratedPhrase} from '../src/living/generative-phrase.js';
import {createLivingArrangement} from '../src/living/arrangement.js';
import {requestForTineDesign} from '../src/tine/address.js';
import {createTineImpulse} from '../src/tine/impulse.js';
import {createTineLivePass} from '../src/tine/live-pass.js';
import {stereoWav} from '../src/loom/model.js';

// Study-only geometries. These do not extend or masquerade as saved designs.
export const TUNING_STUDIES=Object.freeze({
 existing:Object.freeze([80,95,65]),
 adjacent:Object.freeze([80,90,65]),
 fifths:Object.freeze([80,80*Math.sqrt(1.5),80/Math.sqrt(1.5)]),
});

export function renderLivingTuningStudy(seed,treatment){
 if(!Object.hasOwn(TUNING_STUDIES,treatment))throw Error('Unknown tuning study.');
 const {source}=createLivingGeneratedPhrase(seed),plan=createLivingArrangement(source,2);
 const lengths=TUNING_STUDIES[treatment],bodies=[],stems=[];
 for(const lengthMm of lengths){
  const request=requestForTineDesign(source.design);
  const geometry={...request.geometry,lengthM:lengthMm/1000};
  const options={...request.options,sampleRate:plan.sampleRate};
  const model=createTineImpulse(geometry,options),pass=createTineLivePass(geometry,options);
  const samples=new Float32Array(plan.phraseFrames);pass.start();
  for(const event of source.events){pass.process(samples.subarray(pass.frame,event.frame));pass.strike(event.strength);}
  pass.process(samples.subarray(pass.frame,source.fadeStart));pass.quiet();pass.process(samples.subarray(pass.frame));
  bodies.push({lengthMm,geometry,frequenciesHz:model.modes.map(m=>m.frequencyHz),massKg:model.totalMassKg,events:pass.snapshot().events});
  stems.push(samples);
 }
 const sums=[new Float64Array(plan.frames),new Float64Array(plan.frames)];
 for(const voice of plan.voices){
  const angle=(voice.pan+1)*Math.PI/4,gains=[Math.cos(angle)*voice.gain,Math.sin(angle)*voice.gain];
  for(let ch=0;ch<2;ch++)for(let f=0;f<stems[voice.body].length;f++)sums[ch][voice.startFrame+f]+=stems[voice.body][f]*gains[ch];
 }
 const channels=sums.map(c=>Float32Array.from(c));let peak=0;
 for(const channel of channels)for(const value of channel){if(!Number.isFinite(value))throw Error('Nonfinite study PCM.');peak=Math.max(peak,Math.abs(value));}
 if(peak*8>1)throw Error('Shared preview gain clips.');
 for(const body of bodies)body.firstModeCentsFromRoot=1200*Math.log2(body.frequenciesHz[0]/bodies[0].frequenciesHz[0]);
 return {seed,treatment,source,bodies,voices:plan.voices,sampleRate:plan.sampleRate,frames:plan.frames,seconds:plan.frames/plan.sampleRate,phraseFrames:plan.phraseFrames,returnStart:plan.returnStart,peak,channels};
}

if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const seed=Number(process.argv[2]??42),directory=resolve(process.argv[3]??'renders/living-tuning-study');
 mkdirSync(directory,{recursive:true});
 for(const treatment of Object.keys(TUNING_STUDIES)){
  const {channels,...study}=renderLivingTuningStudy(seed,treatment);
  const previewGain=8,wav=Buffer.from(stereoWav({sampleRate:study.sampleRate,channels:channels.map(c=>Float32Array.from(c,v=>v*previewGain))}));
  const report={kind:'imagimusic-living-tuning-study',version:1,...study,previewGain,sha256:createHash('sha256').update(wav).digest('hex'),limits:'Same arrangement2 event clock, strengths, pan and gains across treatments. Only body lengths change; mass, modal frequencies, decay and output consequently change together. Fixed gain, no loudness matching or pitch shifting. First-mode ratios do not establish perceived pitch, consonance or preference; each body remains inharmonic. Independent four-mode cantilevers, ideal impulses and velocity pickup, no coupling, acoustic radiation or fabrication validation. Precise lengths are study-only geometry, not saved tine designs. No listening verdict or independent review.'};
  const stem=resolve(directory,`tuning-${seed}-${treatment}`);
  writeFileSync(stem+'.wav',wav);writeFileSync(stem+'.json',JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({seed,treatment,seconds:study.seconds,previewPeak:study.peak*previewGain,lengths:study.bodies.map(b=>b.lengthMm),cents:study.bodies.map(b=>b.firstModeCentsFromRoot)}));
 }
}

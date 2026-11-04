import {createEnsembleJourneyStudy} from './ensemble-journey-study.js';
import {renderContinuousEnsembleRecord} from './continuous-ensemble-record.js';
import {stereoWav} from '../loom/model.js';

/** Worker preparation for the bounded journey grammar. Chapters are admitted
 * independently; output has the same fixed preview gain as the offered study. */
export function prepareEnsembleJourneyAudio(input){
 if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!['seed','sampleRate','gesture'].includes(k)))throw Error('Unsupported journey input.');
 const plan=createEnsembleJourneyStudy(input.seed??42,{sampleRate:input.sampleRate??48000,gesture:input.gesture??null}),mono=new Float32Array(plan.seconds*plan.sampleRate),records=[];
 let offset=0;
 for(const chapter of plan.chapters){
  const rendered=renderContinuousEnsembleRecord(chapter.record);
  if(rendered.frames!==48*plan.sampleRate)throw Error('Unexpected chapter duration.');
  mono.set(rendered.channels[0],offset);offset+=rendered.frames;records.push(rendered.record);
 }
 let previewPeak=0;
 const channels=[0,1].map(()=>Float32Array.from(mono,value=>{
  const sample=value*24/Math.sqrt(2);
  if(!Number.isFinite(sample)||Math.abs(sample)>=1)throw Error('This gesture exceeds journey preview headroom.');
  previewPeak=Math.max(previewPeak,Math.abs(sample));return sample;
 }));
 return {kind:'imagimusic-ensemble-journey-audio',version:1,sampleRate:plan.sampleRate,frames:mono.length,seed:plan.seed,motifSource:plan.motifSource,motif:plan.motif,records,previewGain:24,previewPeak,wav:stereoWav({sampleRate:plan.sampleRate,channels})};
}

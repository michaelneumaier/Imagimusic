import {createLivingArrangement,renderLivingArrangement,renderLivingArrangementBody} from './arrangement.js';

/** Experimental score, deliberately outside the saved encounter schema.
 * Separate the last accepted touch of one answer from the first of the next
 * by at least 350ms. Decaying tails may overlap; no mechanical coupling.
 */
export function createLivingSpacedAnswer(value){
 const base=createLivingArrangement(value),rate=base.sampleRate;
 const events=base.source.events,span=events.at(-1).frame-events[0].frame;
 const delayFrames=Math.max(Math.round(.8*rate),span+Math.round(.35*rate));
 const returnStart=base.roundStart+2*delayFrames+base.phraseFrames+Math.round(.8*rate);
 const voices=base.voices.map((voice,i)=>{
  const startFrame=i===4?returnStart:i>0?base.roundStart+(i-1)*delayFrames:0;
  return Object.freeze({...voice,startFrame,endFrame:startFrame+base.phraseFrames});
 });
 return Object.freeze({...base,kind:'imagimusic-living-answer-study',version:1,delayFrames,returnStart,frames:returnStart+base.phraseFrames,voices:Object.freeze(voices)});
}

/** A controlled composition alternative: only the first answer is abbreviated.
 * Keep the first ceil(N/2) distinct onset groups, including simultaneous touches.
 * Retained frames/strengths, ending, later answers and return stay unchanged.
 * A one-onset phrase deliberately produces an identical control.
 */
export function createLivingFragmentAnswer(value){
 const base=createLivingSpacedAnswer(value),events=base.source.events;
 const groups=[...new Set(events.map(e=>e.frame))],last=groups[Math.ceil(groups.length/2)-1];
 const bodies=base.bodies.map((body,i)=>i===1?Object.freeze({...body,events:Object.freeze(body.events.filter(e=>e.frame<=last))}):body);
 return Object.freeze({...base,kind:'imagimusic-living-fragment-study',bodies:Object.freeze(bodies),
  derivation:Object.freeze({rule:'first-half-onset-groups',retainedSourceIndices:Object.freeze(events.flatMap((e,i)=>e.frame<=last?[i]:[])),omittedSourceIndices:Object.freeze(events.flatMap((e,i)=>e.frame>last?[i]:[]))})});
}

/** Fragment, deliberate release, then a rhythm-derived settling interval.
 * If a recording ends sooner, engagement is limited to its fade start.
 * Metadata is study-only and never accepted as a saved encounter version.
 */
export function createLivingReleasedAnswer(value){
 return Object.freeze({...createLivingArrangement(value,3),kind:'imagimusic-living-released-study',version:1});
}
export function renderLivingStudyBody(plan,index){
 return renderLivingArrangementBody(plan,index);
}

export function renderLivingAnswerStudy(value,treatment='spaced'){
 if(treatment==='round')return renderLivingArrangement(value);
 if(!['spaced','fragment','released'].includes(treatment))throw Error('Unknown answer treatment.');
 const plan=treatment==='released'?createLivingReleasedAnswer(value):treatment==='fragment'?createLivingFragmentAnswer(value):createLivingSpacedAnswer(value),stems=plan.bodies.map((b,i)=>renderLivingStudyBody(plan,i).channels[0]);
 const sum=[new Float64Array(plan.frames),new Float64Array(plan.frames)];
 for(const v of plan.voices){
  const angle=(v.pan+1)*Math.PI/4,gains=[Math.cos(angle)*v.gain,Math.sin(angle)*v.gain];
  for(let ch=0;ch<2;ch++)for(let i=0;i<stems[v.body].length;i++)sum[ch][v.startFrame+i]+=stems[v.body][i]*gains[ch];
 }
 const channels=sum.map(c=>Float32Array.from(c));let peak=0;
 for(const ch of channels)for(const sample of ch)peak=Math.max(peak,Math.abs(sample));
 if(!Number.isFinite(peak)||peak>1)throw Error('Answer exceeds source PCM range.');
 return {plan,sampleRate:plan.sampleRate,frames:plan.frames,seconds:plan.frames/plan.sampleRate,channels,peak};
}

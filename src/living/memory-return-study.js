import {createContinuousReturnStudy} from './continuous-return-study.js';
import {createContinuousTinePass} from './continuous-tine-pass.js';

/** Separate research grammar. Up to three accepted guests in the first six
 * seconds return at18.5 and36.5seconds. Preserve relative rhythm, compressing
 * spans longer than3seconds uniformly; soften strengths to65% then85%.
 * No contribution leaves the established unattended score unchanged.
 */
export function createMemoryReturnStudy(seed=42,{sampleRate=48000,contributions=[]}={}){
 const base=createContinuousReturnStudy(seed,{sampleRate});
 if(!Array.isArray(contributions)||contributions.length>3)throw Error('Remember at most three accepted early touches.');
 let previousFrame=0,previousIndex=-1;
 const memory=contributions.map(event=>{
  if(!event||event.origin!=='guest'||!Number.isInteger(event.index)||event.index<=previousIndex||event.index>=4096||!Number.isInteger(event.frame)||event.frame<previousFrame||event.frame>=6*sampleRate||!Number.isFinite(event.strength)||event.strength===0||Math.abs(event.strength)>.1)throw Error('Invalid early contribution.');
  previousFrame=event.frame;previousIndex=event.index;return Object.freeze({frame:event.frame,strength:event.strength,index:event.index,origin:'guest'});
 });
 const span=memory.length?memory.at(-1).frame-memory[0].frame:0,timeScale=span?Math.min(1,3*sampleRate/span):1;
 const sections=base.sections.map((section,index)=>{
  if(!memory.length||![3,6].includes(index))return section;
  const strengthScale=index===3?.65:.85;
  return Object.freeze({name:index===3?'memory-answer':'memory-recollection',startFrame:section.startFrame,events:Object.freeze(memory.map(event=>Object.freeze({frame:section.startFrame+Math.round(.5*sampleRate)+Math.round((event.frame-memory[0].frame)*timeScale),strength:event.strength*strengthScale})))});
 });
 return Object.freeze({...base,kind:'imagimusic-memory-return-study',version:1,contributions:Object.freeze(memory),timeScale,sections:Object.freeze(sections),events:Object.freeze(sections.flatMap(section=>section.events))});
}

export function createMemoryReturnPerformance(seed=42,{sampleRate=48000}={}){
 let plan=createMemoryReturnStudy(seed,{sampleRate}),next=0,sealed=false,guestCount=0;const memory=[],pass=createContinuousTinePass(plan.design,{sampleRate,endFrame:plan.frames}),windowEnd=6*sampleRate;
 // Replacing two+three score notes with two three-touch memories adds at most1.
 const scoreCapacity=plan.events.length+1;
 function seal(){
  if(sealed||pass.state!=='playing'||pass.frame<windowEnd)return;
  const updated=createMemoryReturnStudy(seed,{sampleRate,contributions:memory});
  // Refuse any programming change that would rewrite an already committed note.
  if(JSON.stringify(updated.events.slice(0,next))!==JSON.stringify(plan.events.slice(0,next)))throw Error('Memory would rewrite committed music.');
  plan=updated;sealed=true;
 }
 function replenish(){
  if(pass.state!=='playing')return;seal();let end=next;
  while(end<plan.events.length&&plan.events[end].frame<=pass.frame+8*sampleRate)end++;
  if(end>next){pass.schedule(plan.events.slice(next,end));next=end;}
 }
 function start(){pass.start();replenish();}
 function tryGuest(strength=.1){
  if(!Number.isFinite(strength)||strength===0||Math.abs(strength)>.1)throw Error('Guest strength must be nonzero and within ±0.1.');
  replenish();if(guestCount>=4096-scoreCapacity)return {admitted:false,events:[],reason:'Recording space is reserved for the remaining composition.'};
  const result=pass.tryGuest(strength);if(result.admitted)guestCount++;
  if(result.admitted&&!sealed&&pass.frame<windowEnd&&memory.length<3){const guest=result.events.find(event=>event.origin==='guest');memory.push(Object.freeze({...guest}));}
  return result;
 }
 function process(output){
  if(!(output instanceof Float32Array)||output.length>16384)throw Error('Use a bounded Float32 output block.');
  output.fill(0);let offset=0;const accepted=[];
  while(offset<output.length){
   replenish();const count=Math.min(output.length-offset,pass.state==='playing'&&!sealed?windowEnd-pass.frame:Infinity);
   accepted.push(...pass.process(output.subarray(offset,offset+count)));offset+=count;
  }
  seal();return accepted;
 }
 return Object.freeze({start,process,tryGuest,quiet:pass.quiet,cancel:pass.cancel,record:pass.record,snapshot:pass.snapshot,get plan(){return plan;},get memory(){return {sealed,contributions:memory.slice()};},get state(){return pass.state;},get frame(){return pass.frame;}});
}

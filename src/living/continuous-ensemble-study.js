import {createContinuousReturnStudy} from './continuous-return-study.js';
import {createTineDesign} from '../tine/address.js';
import {createContinuousTinePass} from './continuous-tine-pass.js';

/** One existing motif travels among independent bodies. No mechanical coupling,
 * new score notes or emotional inference. Guests join the same ringing state;
 * this fixed score does not yet adapt its later answers to those guests. */
export function createContinuousEnsembleStudy(seed=42,{sampleRate=48000}={}){
 const source=createContinuousReturnStudy(seed,{sampleRate});
 const bodies=Object.freeze([80,95,65].map(lengthMm=>createTineDesign({lengthMm})));
 const roles=[[0,0,0],[1,1,1],[2,2,2],[0,1],[0,1,2,2,1,0],[2,1],[1,1,1],[0,0,0]];
 const sections=Object.freeze(source.sections.map((section,i)=>Object.freeze({...section,events:Object.freeze(section.events.map((event,j)=>Object.freeze({...event,body:roles[i][j]})))})));
 // Every admitted body's pickup bound is <=.8. The average of three bodies
 // therefore stays <=.8 by the triangle inequality, without normalization.
 return Object.freeze({kind:'imagimusic-continuous-ensemble-study',version:1,seed,sampleRate,frames:source.frames,bodies,mixGain:1/3,sections,events:Object.freeze(sections.flatMap(section=>section.events))});
}

export function createContinuousEnsemblePerformance(seed=42,options={}){
 const plan=createContinuousEnsembleStudy(seed,options),passes=plan.bodies.map(body=>createContinuousTinePass(body,{sampleRate:plan.sampleRate,endFrame:plan.frames}));
 const scores=passes.map((_,body)=>plan.events.filter(event=>event.body===body).map(({frame,strength})=>({frame,strength}))),next=[0,0,0],guests=[0,0,0],scratch=passes.map(()=>new Float32Array(16384));
 const cancel=()=>passes.forEach(pass=>pass.cancel());
 function replenish(){
  if(passes[0].state!=='playing')return;
  for(let body=0;body<passes.length;body++){
   let end=next[body];while(end<scores[body].length&&scores[body][end].frame<=passes[body].frame+8*plan.sampleRate)end++;
   if(end>next[body]){passes[body].schedule(scores[body].slice(next[body],end));next[body]=end;}
  }
 }
 function ordered(groups){return groups.flatMap((events,body)=>events.map(event=>({...event,body}))).sort((a,b)=>a.frame-b.frame||a.body-b.body||a.index-b.index);}
 function start(){
  if(passes[0].state!=='idle')throw Error('This ensemble has already started or been cancelled.');
  try{passes.forEach(pass=>pass.start());replenish();}catch(error){cancel();throw error;}
 }
 function process(output){
  if(!(output instanceof Float32Array)||output.length>16384)throw Error('Use a bounded Float32 output block.');
  try{
   replenish();const groups=passes.map((pass,i)=>pass.process(scratch[i].subarray(0,output.length)));
   for(let frame=0;frame<output.length;frame++)output[frame]=(scratch[0][frame]+scratch[1][frame]+scratch[2][frame])*plan.mixGain;
   return ordered(groups);
  }catch(error){output.fill(0);cancel();throw error;}
 }
 function tryGuest(body,strength=.1){
  if(!Number.isInteger(body)||body<0||body>=passes.length)throw Error('Choose one of the three ensemble bodies.');
  if(!Number.isFinite(strength)||strength===0||Math.abs(strength)>.1)throw Error('Guest strength must be nonzero and within ±0.1.');
  if(passes[0].state!=='playing')return {admitted:false,events:[],reason:'The ensemble is not accepting touches.'};
  try{
   replenish();
   // Flush across all bodies first. A guest on an earlier-numbered body must
   // never hide a score note due on another body at this same sample.
   const due=ordered(passes.map(pass=>pass.flush()));
   if(guests[body]>=4096-scores[body].length)return {admitted:false,events:due,reason:'Recording space is reserved for this body’s remaining composition.'};
   const result=passes[body].tryGuest(strength);if(result.admitted)guests[body]++;
   return {...result,events:[...due,...result.events.map(event=>({...event,body}))]};
  }catch(error){cancel();throw error;}
 }
 function quiet(){try{return ordered(passes.map(pass=>pass.quiet()));}catch(error){cancel();throw error;}}
 return Object.freeze({plan,start,process,tryGuest,quiet,cancel,records:()=>passes.map(pass=>pass.record()),snapshot:()=>passes.map(pass=>pass.snapshot()),get state(){return passes[0].state;},get frame(){return passes[0].frame;}});
}

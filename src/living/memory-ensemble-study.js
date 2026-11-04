import {createContinuousEnsembleStudy} from './continuous-ensemble-study.js';
import {createContinuousTinePass} from './continuous-tine-pass.js';

/** An explicit research grammar, not emotional inference: three early touches
 * return first on the next numbered voice, then on their original voices. */
export function createMemoryEnsembleStudy(seed=42,{sampleRate=48000,contributions=[]}={}){
 const base=createContinuousEnsembleStudy(seed,{sampleRate}),indices=[-1,-1,-1];let previous=0;
 if(!Array.isArray(contributions)||contributions.length>3)throw Error('Remember at most three early ensemble touches.');
 const memory=contributions.map(event=>{
  if(!event||!Number.isInteger(event.body)||event.body<0||event.body>2||event.origin!=='guest'||!Number.isInteger(event.index)||event.index<=indices[event.body]||event.index>=4096||!Number.isInteger(event.frame)||event.frame<previous||event.frame>=6*sampleRate||!Number.isFinite(event.strength)||event.strength===0||Math.abs(event.strength)>.1)throw Error('Invalid early ensemble contribution.');
  previous=event.frame;indices[event.body]=event.index;return Object.freeze({frame:event.frame,strength:event.strength,index:event.index,origin:'guest',body:event.body});
 });
 const span=memory.length?memory.at(-1).frame-memory[0].frame:0,timeScale=span?Math.min(1,3*sampleRate/span):1;
 const sections=Object.freeze(base.sections.map((section,index)=>{
  if(!memory.length||![3,6].includes(index))return section;
  const events=memory.map(event=>Object.freeze({frame:section.startFrame+Math.round(.5*sampleRate)+Math.round((event.frame-memory[0].frame)*timeScale),strength:event.strength*(index===3?.65:.85),body:index===3?(event.body+1)%3:event.body})).sort((a,b)=>a.frame-b.frame||a.body-b.body);
  return Object.freeze({name:index===3?'neighbor-answer':'own-voice-recollection',startFrame:section.startFrame,events:Object.freeze(events)});
 }));
 return Object.freeze({...base,kind:'imagimusic-memory-ensemble-study',version:1,contributions:Object.freeze(memory),timeScale,sections,events:Object.freeze(sections.flatMap(section=>section.events))});
}

export function createMemoryEnsemblePerformance(seed=42,options={}){
 if(Object.hasOwn(options,'contributions'))throw Error('Live memory must come from accepted guest touches.');
 let plan=createMemoryEnsembleStudy(seed,options),sealed=false;const memory=[],passes=plan.bodies.map(body=>createContinuousTinePass(body,{sampleRate:plan.sampleRate,endFrame:plan.frames}));
 const split=score=>passes.map((_,body)=>score.events.filter(event=>event.body===body).map(({frame,strength})=>({frame,strength})));
 let scores=split(plan);const next=[0,0,0],guests=[0,0,0],scratch=passes.map(()=>new Float32Array(16384)),windowEnd=6*plan.sampleRate;
 // Each remembered touch contributes at most one answer note to any one body:
 // its next voice and original voice are distinct. Also reserve the no-input score.
 const capacity=passes.map((_,body)=>Math.max(scores[body].length,plan.sections.filter((_,i)=>![3,6].includes(i)).flatMap(s=>s.events).filter(e=>e.body===body).length+3));
 function seal(){
  if(sealed||passes[0].state!=='playing'||passes[0].frame<windowEnd)return;
  const updated=createMemoryEnsembleStudy(seed,{sampleRate:plan.sampleRate,contributions:memory}),updatedScores=split(updated);
  for(let body=0;body<3;body++)if(JSON.stringify(scores[body].slice(0,next[body]))!==JSON.stringify(updatedScores[body].slice(0,next[body])))throw Error('Memory would rewrite committed ensemble music.');
  plan=updated;scores=updatedScores;sealed=true;
 }
 const cancel=()=>passes.forEach(pass=>pass.cancel());
 function replenish(){
  if(passes[0].state!=='playing')return;seal();
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
   output.fill(0);let offset=0;const events=[];
   while(offset<output.length){
    replenish();const count=Math.min(output.length-offset,passes[0].state==='playing'&&!sealed?windowEnd-passes[0].frame:Infinity);
    const groups=passes.map((pass,i)=>pass.process(scratch[i].subarray(0,count)));
    for(let frame=0;frame<count;frame++)output[offset+frame]=(scratch[0][frame]+scratch[1][frame]+scratch[2][frame])*plan.mixGain;
    events.push(...ordered(groups));offset+=count;
   }
   seal();return events;
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
   if(guests[body]>=4096-capacity[body])return {admitted:false,events:due,reason:'Recording space is reserved for this body’s remaining composition.'};
   const result=passes[body].tryGuest(strength);if(result.admitted){
    guests[body]++;if(!sealed&&passes[0].frame<windowEnd&&memory.length<3)memory.push(Object.freeze({...result.events.find(e=>e.origin==='guest'),body}));
   }
   return {...result,events:[...due,...result.events.map(event=>({...event,body}))]};
  }catch(error){cancel();throw error;}
 }
 function quiet(){try{return ordered(passes.map(pass=>pass.quiet()));}catch(error){cancel();throw error;}}
 return Object.freeze({get plan(){return plan;},get memory(){return {sealed,contributions:memory.slice()};},start,process,tryGuest,quiet,cancel,records:()=>passes.map(pass=>pass.record()),snapshot:()=>passes.map(pass=>pass.snapshot()),get state(){return passes[0].state;},get frame(){return passes[0].frame;}});
}

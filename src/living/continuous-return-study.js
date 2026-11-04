import {createTineDesign} from '../tine/address.js';
import {createContinuousTinePass} from './continuous-tine-pass.js';

/** A deliberately small compositional grammar on one fixed body: gesture,
 * echo, reflection, space, gathering, thinning, recollection, return.
 * Seed selects rhythm/accent; it does not invent arbitrary forms or new timbres.
 */
export function createContinuousReturnStudy(seed=42,{sampleRate=48000}={}){
 if(!Number.isInteger(seed)||seed<0||seed>0xffffffff)throw Error('Use an unsigned32-bit seed.');
 if(!Number.isInteger(sampleRate)||sampleRate<8000||sampleRate>96000)throw Error('Invalid study sample rate.');
 let randomState=seed||0x9e3779b9;
 const random=()=>{randomState^=randomState<<13;randomState^=randomState>>>17;randomState^=randomState<<5;return (randomState>>>0)/4294967296;};
 const pick=values=>values[Math.floor(random()*values.length)];
 const first=pick([.28,.36,.44]),last=first+pick([.42,.62,.82]);
 const accents=pick([[.025,.1,.05],[.05,.025,.1],[.1,.05,.025]]);
 const motif=[0,first,last].map((time,index)=>({time,strength:accents[index]}));
 const specs=[
  ['opening',motif],
  ['echo',motif.map(e=>({...e,strength:e.strength*.65}))],
  ['reflection',motif.map(e=>({time:last-e.time,strength:e.strength})).reverse()],
  ['space',[{time:0,strength:accents[0]*.7},{time:2.7,strength:accents[2]*.7}]],
  ['gathering',[...motif.map(e=>({...e,time:e.time*.7})),...motif.map(e=>({time:2.6+e.time*.7,strength:e.strength*.7}))]],
  ['thinning',motif.slice(1).map(e=>({time:e.time*1.5,strength:e.strength*.5}))],
  ['recollection',motif.map(e=>({...e,time:e.time*1.25}))],
  ['return',motif],
 ];
 const sections=specs.map(([name,phrase],index)=>Object.freeze({name,startFrame:index*6*sampleRate,events:Object.freeze(phrase.map(e=>Object.freeze({frame:index*6*sampleRate+Math.round((.5+e.time)*sampleRate),strength:e.strength})))}));
 return Object.freeze({kind:'imagimusic-continuous-return-study',version:1,seed,design:createTineDesign(),sampleRate,frames:48*sampleRate,sections:Object.freeze(sections),events:Object.freeze(sections.flatMap(s=>s.events))});
}

/** Automatically replenishes the committed window before each audio block or
 * guest. A guest affects the ringing state, not this fixed composition's future.
 */
export function createContinuousReturnPerformance(seed=42,options={}){
 const plan=createContinuousReturnStudy(seed,options),pass=createContinuousTinePass(plan.design,{sampleRate:plan.sampleRate,endFrame:plan.frames});let next=0,guestCount=0;
 function replenish(){
  if(pass.state!=='playing')return;
  let end=next;while(end<plan.events.length&&plan.events[end].frame<=pass.frame+8*plan.sampleRate)end++;
  if(end>next){pass.schedule(plan.events.slice(next,end));next=end;}
 }
 function start(){pass.start();replenish();}
 function process(output){
  if(!(output instanceof Float32Array)||output.length>16384)throw Error('Use a bounded Float32 output block.');
  replenish();return pass.process(output);
 }
 function tryGuest(strength=.1){
  if(!Number.isFinite(strength)||strength===0||Math.abs(strength)>.1)throw Error('Guest strength must be nonzero and within ±0.1.');
  replenish();
  if(guestCount>=4096-plan.events.length)return {admitted:false,events:[],reason:'Recording space is reserved for the remaining composition.'};
  const result=pass.tryGuest(strength);if(result.admitted)guestCount++;return result;
 }
 return Object.freeze({plan,start,process,tryGuest,quiet:pass.quiet,cancel:pass.cancel,record:pass.record,snapshot:pass.snapshot,get state(){return pass.state;},get frame(){return pass.frame;}});
}

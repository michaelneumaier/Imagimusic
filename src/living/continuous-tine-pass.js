import {validateTineDesign,requestForTineDesign} from '../tine/address.js';
import {createContinuousTineScheduler} from './continuous-tine-scheduler.js';

/** Finite research transport over one continuous body. Its composer replenishes
 * the committed window; no score is invented here. Capture starts from rest.
 * Quiet retains due notes then withdraws future ones; cancellation keeps no record.
 */
export function createContinuousTinePass(value,{sampleRate=48000,endFrame=60*sampleRate}={}){
 const design=validateTineDesign(value),{geometry,options}=requestForTineDesign(design);
 const scheduler=createContinuousTineScheduler(geometry,{...options,sampleRate}),fadeFrames=Math.round(.025*sampleRate);
 if(!Number.isInteger(endFrame)||endFrame<fadeFrames||endFrame>60*sampleRate)throw Error('Invalid continuous pass duration.');
 let state='idle',fadeStart=endFrame-fadeFrames;const history=[];
 const remember=events=>{for(const event of events)history.push(Object.freeze({...event}));return events;};
 function start(){if(state!=='idle')throw Error('This continuous pass has already started or been cancelled.');state='playing';}
 function schedule(events){
  if(state!=='playing')throw Error('Only a playing pass accepts score commitments.');
  if(!Array.isArray(events)||history.length+scheduler.queued+events.length>4096||events.some(e=>!e||e.frame>fadeStart))throw Error('Score exceeds the capture capacity or ending.');
  return scheduler.schedule(events);
 }
 // Ensemble owners can acknowledge all due score notes before a guest on any body.
 function flush(){return state==='playing'?remember(scheduler.flush()):[];}
 function tryGuest(strength=.1){
  if(!Number.isFinite(strength)||strength===0||Math.abs(strength)>.1)throw Error('Guest strength must be nonzero and within ±0.1.');
  if(state!=='playing'||scheduler.frame>=fadeStart)return {admitted:false,events:[],reason:'The pass is not accepting touches.'};
  if(history.length+scheduler.queued>=4096)return {admitted:false,events:[],reason:'The capture is full; remaining score notes are reserved.'};
  const result=scheduler.tryGuest(strength);remember(result.events);return result;
 }
 function quiet(){
  if(state!=='playing')return [];
  const events=remember(scheduler.flush());scheduler.cancelPending();fadeStart=scheduler.frame;endFrame=fadeStart+fadeFrames;state='ending';return events;
 }
 function cancel(){if(state==='ended'||state==='cancelled')return; scheduler.cancelPending();history.length=0;state='cancelled';}
 function process(output){
  if(!(output instanceof Float32Array)||output.length>16384)throw Error('Use a Float32 block of at most 16384 samples.');
  output.fill(0);const events=[];let offset=0;
  while(offset<output.length&&(state==='playing'||state==='ending')){
   if(state==='playing'&&scheduler.frame===fadeStart){events.push(...quiet());continue;}
   const start=scheduler.frame,boundary=state==='playing'?fadeStart:endFrame,count=Math.min(output.length-offset,boundary-start);
   const block=output.subarray(offset,offset+count);events.push(...remember(scheduler.process(block)));
   if(state==='ending')for(let i=0;i<count;i++)block[i]*=Math.max(0,(endFrame-1-start-i)/(fadeFrames-1));
   offset+=count;if(scheduler.frame===endFrame)state='ended';
  }
  return events;
 }
 function record(){
  if(state!=='ended')throw Error('Only a completed continuous pass can be kept.');
  return Object.freeze({kind:'imagimusic-continuous-tine-record',version:1,design,sampleRate,events:Object.freeze(history.map(({frame,strength,origin})=>Object.freeze({frame,strength,origin}))),fadeStart});
 }
 return Object.freeze({start,schedule,flush,tryGuest,quiet,cancel,process,record,get state(){return state;},get frame(){return scheduler.frame;},snapshot:()=>({state,fadeStart,endFrame,events:history.slice(),body:scheduler.snapshot()})});
}

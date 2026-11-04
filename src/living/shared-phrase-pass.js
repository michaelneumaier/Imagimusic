import {validateLivingPersonalSource} from './personal-journey-study.js';
import {validateTineLiveRecord} from '../tine/live-record.js';
import {requestForTineDesign} from '../tine/address.js';
import {createTineLivePass} from '../tine/live-pass.js';

/** Experimental finite shared body: scheduled notes and guests excite the same
 * continuing modal state. All source notes and the maximum guest budget are
 * admitted before starting. No reset, normalization or reclaimed decay budget.
 * Existing source ending and four-second touch window remain authoritative.
 */
export function createLivingSharedPhrasePass(value,{guestLimit=Math.min(3,8-(value?.events?.length??0))}={}){
 const source=validateLivingPersonalSource(value);
 if(!Number.isInteger(guestLimit)||guestLimit<0||guestLimit>8-source.events.length)throw Error('Guest touches must fit beside every scheduled touch.');
 // Reserve strongest permitted guests before source playback can begin.
 validateTineLiveRecord({...source,events:[...Array.from({length:guestLimit},()=>({frame:0,strength:.1})),...source.events]});
 const {geometry,options}=requestForTineDesign(source.design),pass=createTineLivePass(geometry,{...options,sampleRate:source.sampleRate});
 const applied=[];let next=0,guests=0,ending=false;
 function applyDue(){
  if(pass.state==='idle'||ending||pass.state==='ended')return;
  while(next<source.events.length&&source.events[next].frame===pass.frame){
   const event=pass.strike(source.events[next++].strength);applied.push(Object.freeze({...event,origin:'score'}));
  }
  if(pass.frame===source.fadeStart){ending=true;pass.quiet();}
 }
 function strike(strength=.1){
  if(!Number.isFinite(strength)||strength<=0||strength>.1)throw Error('Guest strength must be positive and no greater than0.1.');
  if(guests>=guestLimit)throw Error('The reserved guest touches have been used.');
  // Scheduled touches precede a guest on the same accepted sample frame.
  applyDue();
  const event=pass.strike(strength);guests++;applied.push(Object.freeze({...event,origin:'guest'}));return event;
 }
 function quiet(){const result=pass.quiet();ending=true;return result;}
 function process(output){
  if(!(output instanceof Float32Array))throw Error('A Float32 output block is required.');
  output.fill(0);if(pass.state==='idle')return;
  let offset=0;
  while(offset<output.length&&pass.state!=='ended'){
   applyDue();
   const boundary=ending?pass.snapshot().endFrame:Math.min(source.events[next]?.frame??Infinity,source.fadeStart);
   const count=Math.min(output.length-offset,boundary-pass.frame);
   if(count<=0)throw Error('Shared phrase scheduler did not advance.');
   pass.process(output.subarray(offset,offset+count));offset+=count;
  }
 }
 return Object.freeze({source,guestLimit,start:()=>pass.start(),strike,quiet,process,
  snapshot:()=>({...pass.snapshot(),applied:applied.slice(),guestTouches:guests,guestLimit}),
  get frame(){return pass.frame;},get state(){return pass.state;},
 });
}

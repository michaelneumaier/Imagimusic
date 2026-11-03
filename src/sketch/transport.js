import {createResonanceSketch} from './model.js';
export const SKETCH_MIX_BOUND=.8;
export const SKETCH_MAX_ACTIVE=32;
// Same all-mode activations for every interpretation; no source-specific timing.
export const SKETCH_SHARED_GESTURE=Object.freeze([
 Object.freeze({offset:0,strength:.35}),Object.freeze({offset:.9,strength:.2}),Object.freeze({offset:2.1,strength:.35})
]);
export function prepareSketchPlayback(parameters,sampleRate,{seconds=4}={}){
 const sketch=createResonanceSketch(parameters),all=sketch.render({sampleRate,seconds});
 return {parameters:{frequencies:sketch.modes.map(m=>m.frequency),decays:sketch.modes.map(m=>m.decay),coefficients:sketch.modes.flatMap(m=>[m.a,m.b])},
  sampleRate,frames:all.frames,fadeFrames:all.fadeFrames,pickupGain:sketch.pickupGain,
  buffers:[all.channels[0],...sketch.modes.map((_,mode)=>sketch.render({sampleRate,seconds,mode}).channels[0])]};
}
/** Caller owns explicit user activation/resume and context lifecycle.
 * Capacity is conservatively reserved until a voice ends, even while fading.
 */
export function createSketchTransport(context,prepared){
 const sketch=createResonanceSketch(prepared.parameters),rate=prepared.sampleRate,frames=prepared.frames,fadeFrames=prepared.fadeFrames;
 if(rate!==context.sampleRate||!Number.isInteger(rate)||rate<8000||rate>96000||!Number.isInteger(frames)||frames<Math.round(.05*rate)||frames>8*rate||fadeFrames!==Math.round(.025*rate)||prepared.pickupGain!==sketch.pickupGain||!Array.isArray(prepared.buffers)||prepared.buffers.length!==sketch.modes.length+1)throw Error('Sketch preparation does not match the playback context.');
 const bounds=[sketch.singleActivationPeakBound,...sketch.modes.map(m=>m.amplitude*sketch.pickupGain)];
 const buffers=[...prepared.buffers].map((samples,index)=>{
  if(!(samples instanceof Float32Array)||samples.length!==frames||samples.some(x=>!Number.isFinite(x)||Math.abs(x)>bounds[index]+1e-7))throw Error('Invalid bounded sketch PCM.');
  const buffer=context.createBuffer(1,frames,rate);buffer.copyToChannel(samples,0);return buffer;
 });
 const output=context.createGain();output.connect(context.destination);
 const active=new Set();let disposed=false;
 const live=()=>{if(disposed)throw Error('Sketch transport is disposed.');};
 const retire=entry=>{if(!active.delete(entry))return;entry.node.onended=null;entry.node.disconnect();entry.gain.disconnect();};
 const prune=now=>{for(const entry of active)if(now>=entry.end)retire(entry);};
 const allocated=()=>[...active].reduce((sum,e)=>sum+e.bound,0);
 function activate({mode=null,strength=.35,at=null}={}){
  live();if(context.state!=='running')throw Error('Start listening before activating a sketch.');
  if(mode!==null&&(!Number.isInteger(mode)||mode<0||mode>=sketch.modes.length)||!Number.isFinite(strength)||strength<0||strength>1)throw Error('Invalid sketch activation.');
  const now=context.currentTime;prune(now);const time=at===null?now:at;
  if(!Number.isFinite(time)||time<now||time>now+8)throw Error('Activation time must be within the next eight seconds.');
  const index=mode===null?0:mode+1;
  if(!strength||!bounds[index])return {accepted:false,reason:'zero-strength'};
  if(active.size>=SKETCH_MAX_ACTIVE)return {accepted:false,reason:'voice-count'};
  const bound=(bounds[index]+1e-7)*strength;
  if(allocated()+bound>SKETCH_MIX_BOUND)return {accepted:false,reason:'headroom'};
  const node=context.createBufferSource(),gain=context.createGain(),entry={node,gain,mode,strength,bound,start:time,end:time+frames/rate,quietAt:null};
  try{
   node.buffer=buffers[index];gain.gain.value=strength;node.connect(gain);gain.connect(output);
   node.onended=()=>retire(entry);active.add(entry);node.start(time);
   return {accepted:true,time,mode,strength};
  }catch(error){try{node.stop();}catch{}if(active.has(entry))retire(entry);else{node.disconnect();gain.disconnect();}throw error;}
 }
 function playSharedGesture(){
  live();prune(context.currentTime);
  if(active.size)return {accepted:false,reason:'settle-first'};
  const origin=context.currentTime+.05,receipts=[];
  try{
   for(const event of SKETCH_SHARED_GESTURE){const receipt=activate({strength:event.strength,at:origin+event.offset});if(!receipt.accepted)throw Error('Shared gesture could not be admitted.');receipts.push(receipt);}
   return {accepted:true,receipts,end:origin+SKETCH_SHARED_GESTURE.at(-1).offset+frames/rate};
  }catch(error){for(const entry of [...active]){try{entry.node.stop();}catch{}retire(entry);}throw error;}
 }
 function quiet(){
  live();const now=context.currentTime;prune(now);
  for(const entry of [...active]){if(entry.start>now){entry.node.stop(now);retire(entry);continue;}if(entry.quietAt!==null)continue;entry.quietAt=now;entry.end=Math.min(entry.end,now+.03);
   entry.gain.gain.cancelScheduledValues(now);entry.gain.gain.setValueAtTime(entry.strength,now);entry.gain.gain.linearRampToValueAtTime(0,now+.025);entry.node.stop(entry.end);
  }
 }
 function snapshot(){
  live();const now=context.currentTime;prune(now);
  const modes=sketch.modes.map(()=>({displacement:0,velocity:0,envelope:0}));
  for(const entry of active){
   if(now<entry.start)continue;
   const age=Math.max(0,now-entry.start),ending=Math.max(0,Math.min(1,(frames-1-age*rate)/(fadeFrames-1)));
   const quieting=entry.quietAt===null?1:Math.max(0,1-(now-entry.quietAt)/.025);
   const strength=entry.strength*ending*quieting;
   for(let i=0;i<modes.length;i++)if(entry.mode===null||entry.mode===i){const state=sketch.modeState(i,age,strength);modes[i].displacement+=state.displacement;modes[i].velocity+=state.velocity;}
  }
  modes.forEach((state,i)=>{const mode=sketch.modes[i];state.envelope=Math.hypot(state.displacement,(state.velocity+state.displacement/mode.decay)/(2*Math.PI*mode.frequency));});
  return {time:now,active:active.size,allocatedBound:allocated(),modes,pickupGain:sketch.pickupGain};
 }
 function dispose(){if(disposed)return;for(const entry of [...active]){try{entry.node.stop();}catch{}retire(entry);}output.disconnect();disposed=true;}
 return {activate,playSharedGesture,quiet,snapshot,dispose,sketch,duration:frames/rate};
}

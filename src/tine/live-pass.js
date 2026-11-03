import {createTineLiveKernel} from './live-kernel.js';
/** One bounded pass: idle until start, four seconds to touch, then ring out.
 * Early Quiet and the natural eight-second end use the same 25 ms fade.
 * Fade arithmetic: Float32(kernel sample) × gain → Float32 output.
 */
export function createTineLivePass(geometry,options={}){
 const kernel=createTineLiveKernel(geometry,options),rate=kernel.sampleRate;
 const fadeFrames=Math.round(.025*rate),maxFrames=8*rate,naturalFade=maxFrames-fadeFrames;
 let started=false,frame=0,fadeStart=null;
 function state(){return !started?'idle':frame>=(fadeStart??naturalFade)+fadeFrames?'ended':fadeStart!==null||frame>=naturalFade?'ending':frame>4*rate?'ringing':'playing';}
 function start(){if(started)throw Error('This playing pass has already started.');started=true;return {frame:0};}
 function strike(strength=.1){if(state()!=='playing')throw Error('This pass is not accepting touches.');return kernel.strike(strength);}
 function quiet(){if(!started)throw Error('Start a pass before ending it.');if(fadeStart===null)fadeStart=Math.min(frame,naturalFade);return {frame:fadeStart,fadeFrames};}
 function process(output){
  if(!(output instanceof Float32Array))throw Error('A Float32 output block is required.');
  output.fill(0);if(!started)return;
  const end=(fadeStart??naturalFade)+fadeFrames,length=Math.min(output.length,Math.max(0,end-frame)),startFrame=frame;
  if(length)kernel.process(output.subarray(0,length));
  for(let i=0;i<length;i++){
   const age=startFrame+i-(fadeStart??naturalFade);
   if(age>=0)output[i]*=Math.max(0,1-age/(fadeFrames-1));
  }
  frame+=length;
 }
 function snapshot(){return {...kernel.snapshot(),state:state(),started,fadeStart:started?(fadeStart??naturalFade):null,fadeFrames,endFrame:started?(fadeStart??naturalFade)+fadeFrames:null};}
 return Object.freeze({sampleRate:rate,start,strike,quiet,process,snapshot,get state(){return state();},get frame(){return frame;}});
}

import {createGroveInstrument,grovePerformanceFrame,groveOutputBound} from './performance.js';
export function createGroveSession(grove,sampleRate=48000){
 const instrument=createGroveInstrument(grove,sampleRate),events=[];let ended=null;
 const snapshot=()=>({version:1,kind:'imagimusic-grove',grove:structuredClone(instrument.grove),sampleRate,outputGain:instrument.outputGain,events:structuredClone(events),ended:structuredClone(ended)});
 function strike({frame,body,velocity}){
  if(!Number.isInteger(frame)||frame<0||!Number.isInteger(body)||body<0||body>=instrument.system.n||!Number.isFinite(velocity)||velocity<=0||velocity>1)throw new Error('Invalid Grove gesture');
  if(ended)return {accepted:false,reason:'ended'};
  if(events.length>=128||frame>120*sampleRate)return {accepted:false,reason:'capacity'};
  if(events.length&&frame<events.at(-1).frame)throw new Error('Grove gestures must be chronological');
  const event={frame,body,velocity},bound=groveOutputBound(instrument,[...events,event],frame/sampleRate);
  if(bound>.9)return {accepted:false,reason:'headroom',bound};events.push(event);return {accepted:true,event:{...event},bound};
 }
 function finish(frame,fadeFrames=Math.round(.025*sampleRate)){if(!Number.isInteger(frame)||frame<0||!Number.isInteger(fadeFrames)||fadeFrames<1)throw new Error('Invalid end time');ended??={frame,fadeFrames};return snapshot();}
 function visual(time){const frame=grovePerformanceFrame(instrument,events,time);if(ended){const fade=Math.max(0,Math.min(1,1-(time*sampleRate-ended.frame)/ended.fadeFrames));frame.envelope=frame.envelope.map(v=>v*fade);frame.displacement=frame.displacement.map(v=>v*fade);if(!fade)frame.strikes=[];}return frame;}
 return {strike,finish,snapshot,visual,instrument,boundAt:frame=>groveOutputBound(instrument,events,frame/sampleRate)};
}

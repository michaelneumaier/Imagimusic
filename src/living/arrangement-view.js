import {createLivingResponse} from './response.js';
/** Project the immutable rendered plan onto its three bodies. Each complete
 * voice has its own local clock; no visible response before its accepted touch.
 */
export function createLivingArrangementView(plan){
 const responses=plan.bodies.map(record=>{const view=createLivingResponse(record.design,record.sampleRate);record.events.forEach(e=>view.accept(e));return view;});
 return {at(seconds){
  if(!Number.isFinite(seconds)||seconds<0||seconds>plan.frames/plan.sampleRate)throw Error('Arrangement time is outside the recording.');
  const frame=seconds*plan.sampleRate,bodies=plan.bodies.map(()=>({points:null,touched:false}));let touches=0;
  for(const voice of plan.voices){
   const localFrame=frame-voice.startFrame,record=plan.bodies[voice.body];
   const count=record.events.filter(e=>e.frame<=localFrame).length;touches+=count;
   if(frame>=voice.startFrame&&frame<voice.endFrame)bodies[voice.body]={points:responses[voice.body].at(Math.max(0,localFrame)/plan.sampleRate).points,touched:count>0};
  }
  return {bodies,touches,totalTouches:plan.source.events.length*plan.voices.length,part:frame<plan.roundStart?'opening':frame<plan.returnStart?'answer':'return'};
 }};
}

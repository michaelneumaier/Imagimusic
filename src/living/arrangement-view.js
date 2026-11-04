import {createTineDampedRelease} from '../tine/damped-release.js';
import {createLivingResponse} from './response.js';
/** Project the immutable rendered plan onto its three bodies. Each complete
 * voice has its own local clock; no visible response before its accepted touch.
 */
export function createLivingArrangementView(plan){
 const releases=plan.bodies.map((record,i)=>plan.releases?.[i]?createTineDampedRelease(record,plan.releases[i]):null);
 const responses=plan.bodies.map(record=>{const view=createLivingResponse(record.design,record.sampleRate);record.events.forEach(e=>view.accept(e));return view;});
 return {at(seconds){
  if(!Number.isFinite(seconds)||seconds<0||seconds>plan.frames/plan.sampleRate)throw Error('Arrangement time is outside the recording.');
  const frame=seconds*plan.sampleRate,bodies=plan.bodies.map(()=>({points:null,touched:false}));let touches=0;
  for(const voice of plan.voices){
   const localFrame=frame-voice.startFrame,record=plan.bodies[voice.body];
   const count=record.events.filter(e=>e.frame<=localFrame).length;touches+=count;
   if(frame>=voice.startFrame&&frame<voice.endFrame)bodies[voice.body]={points:(releases[voice.body]&&localFrame>=releases[voice.body].startFrame?releases[voice.body]:responses[voice.body]).at(Math.max(0,localFrame)/plan.sampleRate).points,touched:count>0};
  }
  const ease=x=>{const u=Math.max(0,Math.min(1,x));return u*u*(3-2*u);};
  const openingEnd=plan.voices[0].endFrame,answerEnd=plan.voices[3].endFrame;
  const cameraOpen=frame<plan.roundStart?ease((frame-openingEnd)/(plan.roundStart-openingEnd)):frame<answerEnd?1:1-ease((frame-answerEnd)/(plan.returnStart-answerEnd));
  return {cameraOpen,bodies,touches,totalTouches:plan.voices.reduce((sum,voice)=>sum+plan.bodies[voice.body].events.length,0),part:frame<plan.roundStart?'opening':frame<plan.returnStart?'answer':'return'};
 }};
}

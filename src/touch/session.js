import {createLoomPerformance,loomPerformanceFrame,renderLoomPerformance} from '../loom/performance.js';

export const TOUCH_GAIN=.45,TOUCH_HEADROOM=.9,TOUCH_MAX_STRIKES=128,TOUCH_MAX_SECONDS=120;
const clone=value=>structuredClone(value);
/** Fixed pickup and output gains: a later gesture never changes earlier sound. */
export function createTouchSession(settings,sampleRate=48000){
 if(!Number.isInteger(sampleRate)||sampleRate<8000||sampleRate>192000)throw new Error('Unsupported sample rate');
 const units=[0,1].map(body=>createLoomPerformance(settings,[{time:0,body,velocity:1}]));
 for(const unit of units)unit.audioGain=TOUCH_GAIN;
 const canonical=clone(units[0].settings),events=[];let ended=null,passage=null;
 function boundAt(frame,additional=[]){
  const t=frame/sampleRate;
  return TOUCH_GAIN*Math.max(...[0,1].map(body=>[...events,...additional].reduce((sum,event)=>{
   const age=t-event.frame/sampleRate;
   if(age<0)return sum;
   return sum+event.velocity*units[event.body].studies[event.body].modes[body].reduce((s,m)=>s+Math.abs(m.amplitude)*Math.exp(-age/m.decay),0);
  },0)));
 }
 function strike({frame,body,velocity}){
  if(!Number.isInteger(frame)||frame<0||![0,1].includes(body)||!Number.isFinite(velocity)||velocity<=0||velocity>1)throw new Error('Invalid touch gesture');
  if(ended!==null)return {accepted:false,reason:'ended'};
  if(events.length>=TOUCH_MAX_STRIKES||frame>TOUCH_MAX_SECONDS*sampleRate)return {accepted:false,reason:'capacity'};
  if(events.length&&frame<events.at(-1).frame)throw new Error('Touch gestures must be chronological');
  const event={frame,body,velocity},bound=boundAt(frame,[event]);
  if(bound>TOUCH_HEADROOM)return {accepted:false,reason:'headroom',bound};
  events.push(event);passage=createLoomPerformance(canonical,events.map(e=>({time:e.frame/sampleRate,body:e.body,velocity:e.velocity})));return {accepted:true,event:clone(event),bound};
 }
 function finish(frame,fadeFrames=Math.round(.025*sampleRate)){
  if(!Number.isInteger(frame)||frame<0||!Number.isInteger(fadeFrames)||fadeFrames<1)throw new Error('Invalid end time');
  if(ended===null)ended={frame,fadeFrames};
  return snapshot();
 }
 function snapshot(){return {version:1,kind:'imagimusic-touch',settings:clone(canonical),sampleRate,outputGain:TOUCH_GAIN,events:clone(events),ended:clone(ended)};}
 function visual(time){
  if(!events.length)return {time,envelope:[0,0],displacement:[0,0],averaged:false,strikes:[]};
  const frame=loomPerformanceFrame(passage,time);
  if(ended){const fade=Math.max(0,Math.min(1,1-(time*sampleRate-ended.frame)/ended.fadeFrames));frame.envelope=frame.envelope.map(v=>v*fade);frame.displacement=frame.displacement.map(v=>v*fade);if(!fade)frame.strikes=[];}
  return frame;
 }
 return {strike,finish,snapshot,boundAt,visual,units};
}
/** These are the same unit buffers scheduled by the live transport. */
export function renderTouchBank(session){return session.units.map(unit=>renderLoomPerformance(unit,session.snapshot().sampleRate));}
export function renderTouchRecording(recording,bank){
 const {events,sampleRate,ended}=recording;
 if(!events.length)throw new Error('Play a gesture before saving');
 if(bank.some(pcm=>pcm.sampleRate!==sampleRate))throw new Error('Touch buffer sample rates must match');
 const fullLength=Math.max(...events.map(e=>e.frame+bank[e.body].channels[0].length));
 const length=ended?Math.min(fullLength,ended.frame+ended.fadeFrames):fullLength;
 const channels=[new Float32Array(length),new Float32Array(length)];
 // Match the cached Float32 impulses, not a newly normalized score.
 for(let c=0;c<2;c++){
  const sum=new Float64Array(length);
  for(const event of events){const source=bank[event.body].channels[c];for(let i=0;i<source.length&&i+event.frame<length;i++)sum[i+event.frame]+=event.velocity*source[i];}
  for(let i=0;i<length;i++){const fade=ended?Math.max(0,Math.min(1,1-(i-ended.frame)/ended.fadeFrames)):1;channels[c][i]=sum[i]*fade;}
 }
 return {sampleRate,channels};
}
export const holdVelocity=milliseconds=>.25+.75*Math.max(0,Math.min(1,milliseconds/600));

import {rebuildTouchRecord} from './record.js';
import {TOUCH_RETURN_MAX_FRAMES} from './return-preparation.js';
export const TOUCH_HISTORY_MAX_POINTS=20000;
export const TOUCH_HISTORY_BEFORE_SECONDS=1e-9;
/** Presentation data only: the model's visual envelopes, not PCM or energy.
 * 'before' points are probed 1 ns before their plotted event time. A renderer
 * must start a new segment at the following 'at' point, not smooth the jump.
 * No per-passage normalization. Events after the output end remain metadata.
 */
export function prepareTouchHistory(input,{hz=60}={}){
 if(![30,60,120].includes(hz))throw new Error('History sampling must be 30, 60 or 120 Hz.');
 const {record,session}=rebuildTouchRecord(input),rate=record.sampleRate;
 const banks=session.units.map(unit=>Math.ceil(unit.duration*rate));
 const natural=Math.max(...record.events.map(event=>event.frame+banks[event.body]));
 const frames=record.ended?Math.min(natural,record.ended.frame+record.ended.fadeFrames):natural;
 if(frames>TOUCH_RETURN_MAX_FRAMES)throw new Error('This passage exceeds the return page’s 8 million sample-frame budget.');
 const duration=frames/rate,times=new Set([0,duration]);
 for(let i=1;i<Math.ceil(duration*hz);i++)times.add(i/hz);
 const strikes=new Set();
 const add=time=>{if(time>=0&&time<=duration)times.add(time);};
 for(const event of record.events){
  const time=event.frame/rate;add(time);if(time>0&&time<duration)strikes.add(time);
  const unit=session.units[event.body];
  // Preserve the existing unit tail fade's corners as well as the file ending.
  add(time+unit.studies[event.body].duration-unit.studies[event.body].fade);
  add(time+unit.studies[event.body].duration);
 }
 if(record.ended){add(record.ended.frame/rate);add((record.ended.frame+record.ended.fadeFrames)/rate);}
 if(times.size+strikes.size>TOUCH_HISTORY_MAX_POINTS)throw new Error('This passage exceeds the history point budget.');
 const points=[];
 for(const time of [...times].sort((a,b)=>a-b)){
  if(strikes.has(time))points.push({time,side:'before',envelope:session.visual(time-TOUCH_HISTORY_BEFORE_SECONDS).envelope});
  points.push({time,side:'at',envelope:session.visual(time).envelope});
 }
 return {record,duration,frames,hz,pickupScale:session.units[0].pickupScale,beforeProbeSeconds:TOUCH_HISTORY_BEFORE_SECONDS,
  averaged:session.visual(0).averaged,points,
  gestures:record.events.map((event,index)=>({...event,index,time:event.frame/rate,withinOutput:event.frame<frames}))};
}

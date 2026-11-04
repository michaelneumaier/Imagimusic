import {validateTineLiveRecord,renderTineLiveRecord} from '../tine/live-record.js';
import {createTineLiveComparison} from '../tine/live-comparison.js';

/** Arrangement v2 separates answer touch spans by at least 350ms (tails may
 * overlap), with a minimum 800ms entrance interval. V1 remains the default.
 * Authored arrangement v1: original, three staggered bodies, original again.
 * Each voice is a separate complete pass with the source's exact local event
 * frames and ending. No coupling, time stretch, pitch shift or normalization.
 * Panning and ensemble gains are artistic presentation, not acoustic radiation.
 */
export function createLivingArrangement(value,version=1){
 if(![1,2].includes(version))throw Error('Unsupported Living Instrument arrangement.');
 const source=validateTineLiveRecord(value),rate=source.sampleRate;
 if(source.design.lengthMm!==80||source.design.widthMm!==10||source.events.length===0||source.events.some(e=>Math.abs(e.strength)>.1))throw Error('Use a completed opening phrase with touches on the 80 × 10 mm body.');
 const bodies=[source,createTineLiveComparison(source,{lengthMm:95,widthMm:10}).candidate,createTineLiveComparison(source,{lengthMm:65,widthMm:10}).candidate];
 const duration=source.fadeStart+Math.round(.025*rate);
 const times=[...new Set(source.events.map(e=>e.frame))],intervals=times.slice(1).map((f,i)=>f-times[i]).sort((a,b)=>a-b);
 const middle=Math.floor(intervals.length/2),median=intervals.length?(intervals.length%2?intervals[middle]:(intervals[middle-1]+intervals[middle])/2):.65*rate;
 const delayFrames=version===1?Math.round(Math.max(.35*rate,Math.min(1.2*rate,median))):Math.max(Math.round(.8*rate),times.at(-1)-times[0]+Math.round(.35*rate));
 const roundStart=duration+Math.round(.6*rate),returnStart=roundStart+2*delayFrames+duration+Math.round(.8*rate);
 const voices=[
  {body:0,startFrame:0,gain:1,pan:0,part:'opening'},
  {body:1,startFrame:roundStart,gain:.55,pan:-.7,part:'answer'},
  {body:0,startFrame:roundStart+delayFrames,gain:.55,pan:0,part:'answer'},
  {body:2,startFrame:roundStart+2*delayFrames,gain:.55,pan:.7,part:'answer'},
  {body:0,startFrame:returnStart,gain:1,pan:0,part:'return'},
 ].map(v=>Object.freeze({...v,endFrame:v.startFrame+duration}));
 return Object.freeze({kind:'imagimusic-living-arrangement',version,source,bodies:Object.freeze(bodies),sampleRate:rate,phraseFrames:duration,delayFrames,roundStart,returnStart,frames:returnStart+duration,voices:Object.freeze(voices)});
}

export function renderLivingArrangement(value,version=1){
 const plan=createLivingArrangement(value,version),stems=plan.bodies.map(record=>renderTineLiveRecord(record).channels[0]);
 const sum=[new Float64Array(plan.frames),new Float64Array(plan.frames)];
 for(const voice of plan.voices){
  const angle=(voice.pan+1)*Math.PI/4,gains=[Math.cos(angle)*voice.gain,Math.sin(angle)*voice.gain],stem=stems[voice.body];
  for(let ch=0;ch<2;ch++)for(let i=0;i<stem.length;i++)sum[ch][voice.startFrame+i]+=stem[i]*gains[ch];
 }
 const channels=sum.map(samples=>Float32Array.from(samples));let peak=0;
 for(const channel of channels)for(const sample of channel)peak=Math.max(peak,Math.abs(sample));
 if(!Number.isFinite(peak)||peak>1)throw Error('The arrangement exceeds its source PCM range.');
 return {plan,sampleRate:plan.sampleRate,frames:plan.frames,seconds:plan.frames/plan.sampleRate,channels,peak};
}
